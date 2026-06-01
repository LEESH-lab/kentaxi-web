import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "yourname@kentech.ac.kr" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;
        
        if (!email || !password) {
          throw new Error("이메일과 비밀번호를 입력해주세요.");
        }

        // Restriction Logic: Must be @kentech.ac.kr
        if (!email.endsWith("@kentech.ac.kr")) {
          throw new Error("KENTECH 학교 이메일만 허용됩니다.");
        }

        // Find user
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          throw new Error("가입되지 않은 이메일이거나 비밀번호가 틀렸습니다.");
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          throw new Error("가입되지 않은 이메일이거나 비밀번호가 틀렸습니다.");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { name: true, image: true, email: true }
          });
          
          if (dbUser) {
            const { formatKentechName } = await import("@/lib/kentech");
            const officialName = formatKentechName(dbUser.email);
            
            // Sync official KENTECH name to the database if it doesn't match
            if (dbUser.name !== officialName) {
              await prisma.user.update({
                where: { id: token.id as string },
                data: { name: officialName }
              });
            }
            
            session.user.name = officialName;
            session.user.image = dbUser.image;
            session.user.email = dbUser.email || "";
          }
        } catch (e) {
          console.error("Failed to fetch fresh session user data:", e);
        }
      }
      return session;
    },
  },
})
