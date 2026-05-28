'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isValidEmail = email.endsWith('@kentech.ac.kr');

  const sendCode = async () => {
    if (!isValidEmail) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setCodeSent(true);
        setCode('');
      }
    } catch {
      setError('이메일 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!codeSent || code.length !== 6) {
      setError('인증코드 6자리를 입력해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || '회원가입에 실패했습니다.');
      } else {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2000);
      }
    } catch {
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-white text-gray-900 max-w-md mx-auto shadow-2xl px-6 text-center">
        <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
        <h2 className="text-2xl font-black mb-2">가입 완료!</h2>
        <p className="text-sm text-gray-500 font-medium">성공적으로 켄택시에 가입하셨습니다.<br />잠시 후 로그인 화면으로 이동합니다.</p>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-white text-gray-900 font-sans max-w-md mx-auto shadow-2xl relative">
      <header className="px-4 h-[56px] flex items-center border-b border-gray-100">
        <Link href="/login" className="p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="ml-2 font-bold text-lg">회원가입</h1>
      </header>

      <main className="flex-1 px-6 pt-8 pb-6 overflow-y-auto">
        <h2 className="text-2xl font-black mb-2">KENTECH 구성원 인증</h2>
        <p className="text-sm text-gray-500 mb-8 font-medium">학교 메일로 인증코드를 받은 후 가입할 수 있습니다.</p>

        <form onSubmit={handleRegister} className="space-y-5">
          {/* 이메일 + 인증코드 발송 */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">학교 이메일</label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setCodeSent(false); }}
                placeholder="example@kentech.ac.kr"
                disabled={sending}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-kakao-blue/50 focus:border-kakao-blue transition-all disabled:opacity-60"
                required
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={!isValidEmail || sending}
                className="shrink-0 px-4 py-3.5 bg-kakao-blue text-white rounded-xl text-xs font-black disabled:opacity-40 disabled:bg-gray-300 transition-all active:scale-95"
              >
                {sending ? '발송 중...' : codeSent ? '재발송' : '인증코드 발송'}
              </button>
            </div>
            {email && !isValidEmail && (
              <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">반드시 @kentech.ac.kr 형식이어야 합니다.</p>
            )}
          </div>

          {/* 인증코드 발송 후 표시 */}
          {codeSent && (
            <>
              <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                <Mail className="w-4 h-4 text-green-500 shrink-0" />
                <p className="text-xs text-green-700 font-bold">
                  <span className="text-green-600">{email}</span>로 인증코드가 발송되었습니다. (10분 이내 입력)
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">인증코드 6자리</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-center font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-kakao-blue/50 focus:border-kakao-blue transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6자 이상 입력"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-kakao-blue/50 focus:border-kakao-blue transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호 다시 입력"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-kakao-blue/50 focus:border-kakao-blue transition-all"
                  required
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>
          )}

          {codeSent && (
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-kakao-blue text-white h-14 rounded-xl font-black text-[15px] mt-2 shadow-md shadow-kakao-blue/30 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:bg-gray-300 disabled:shadow-none"
            >
              {loading ? '가입 처리 중...' : '가입하기'}
            </button>
          )}
        </form>
      </main>
    </div>
  );
}
