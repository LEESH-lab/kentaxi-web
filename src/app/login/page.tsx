'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { CarTaxiFront, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-white text-gray-900 font-sans max-w-md mx-auto shadow-2xl relative">
      <header className="px-4 h-[56px] flex items-center border-b border-gray-100">
        <Link href="/" className="p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </Link>
      </header>

      <main className="flex-1 px-6 pt-10 pb-6 flex flex-col">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-12 h-12 bg-kakao-blue rounded-xl flex items-center justify-center shadow-lg">
            <CarTaxiFront className="w-7 h-7 text-kakao-yellow fill-current" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-kakao-blue">KENTAXI</h1>
        </div>

        <h2 className="text-xl font-bold mb-2">학교 계정으로 로그인</h2>
        <p className="text-sm text-gray-500 mb-8 font-medium">KENTECH 구성원 전용 택시 쉐어링 서비스</p>

        <form onSubmit={handleLogin} className="space-y-4 flex-1">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@kentech.ac.kr"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-kakao-blue/50 focus:border-kakao-blue transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-kakao-blue/50 focus:border-kakao-blue transition-all"
              required
            />
          </div>

          {error && <p className="text-red-500 text-xs font-bold mt-2 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-kakao-yellow text-black h-14 rounded-xl font-black text-[15px] mt-6 shadow-md shadow-kakao-yellow/30 active:scale-[0.98] transition-transform disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-bold text-gray-500">
          아직 계정이 없으신가요?{' '}
          <Link href="/register" className="text-kakao-blue underline underline-offset-4">
            회원가입
          </Link>
        </div>
      </main>
    </div>
  );
}
