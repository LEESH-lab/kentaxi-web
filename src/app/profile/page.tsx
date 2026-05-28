'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, User as UserIcon, Mail, CarTaxiFront } from 'lucide-react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-white max-w-md mx-auto">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-kakao-blue border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    router.replace('/login');
    return null;
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-white text-gray-900 font-sans max-w-md mx-auto shadow-2xl">
      <header className="px-4 h-[56px] flex items-center border-b border-gray-100">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="ml-2 font-bold text-lg">프로필</h1>
      </header>

      <main className="flex-1 px-6 pt-10 pb-6 flex flex-col">
        {/* 아바타 */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-24 h-24 rounded-3xl bg-kakao-blue/10 flex items-center justify-center overflow-hidden mb-4 border-4 border-kakao-blue/20">
            {session.user?.image
              ? <img src={session.user.image} alt="" className="w-full h-full object-cover" />
              : <UserIcon className="w-12 h-12 text-kakao-blue/50" />
            }
          </div>
          <h2 className="text-2xl font-black text-gray-900">{session.user?.name}</h2>
          <p className="text-sm text-gray-400 font-medium mt-1">{session.user?.email}</p>
        </div>

        {/* 정보 카드 */}
        <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100 mb-6">
          <div className="flex items-center gap-3 px-5 py-4">
            <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">이름</p>
              <p className="text-sm font-bold text-gray-800">{session.user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">이메일</p>
              <p className="text-sm font-bold text-gray-800">{session.user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <CarTaxiFront className="w-4 h-4 text-kakao-yellow fill-current shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">소속</p>
              <p className="text-sm font-bold text-gray-800">KENTECH 구성원</p>
            </div>
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-red-50 text-red-500 font-black text-[15px] active:bg-red-100 transition-all"
          >
            <LogOut className="w-5 h-5" />
            로그아웃
          </button>
        </div>
      </main>
    </div>
  );
}
