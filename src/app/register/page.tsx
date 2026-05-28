'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck, Lock } from 'lucide-react';
import Link from 'next/link';

type Step = 1 | 2 | 3;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isValidEmail = email.endsWith('@kentech.ac.kr');

  /* ── Step 1: 인증코드 발송 ── */
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
        setStep(2);
      }
    } catch {
      setError('이메일 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  /* ── Step 2: 인증코드 확인 ── */
  const verifyCode = async () => {
    if (code.length !== 6) return;
    setVerifying(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
      } else {
        setStep(3);
      }
    } catch {
      setError('인증 확인 중 오류가 발생했습니다.');
    } finally {
      setVerifying(false);
    }
  };

  /* ── Step 3: 가입 완료 ── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
        <p className="text-sm text-gray-500 font-medium">
          성공적으로 켄택시에 가입하셨습니다.<br />잠시 후 로그인 화면으로 이동합니다.
        </p>
      </div>
    );
  }

  /* ── 단계 표시 바 ── */
  const StepBar = () => (
    <div className="flex items-center gap-2 mb-8">
      {([1, 2, 3] as Step[]).map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
            step > s ? 'bg-green-500 text-white' :
            step === s ? 'bg-kakao-blue text-white' :
            'bg-gray-100 text-gray-400'
          }`}>
            {step > s ? '✓' : s}
          </div>
          {s < 3 && <div className={`h-0.5 w-8 rounded-full transition-all ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
        </div>
      ))}
      <span className="ml-2 text-xs font-bold text-gray-400">
        {step === 1 ? '이메일 인증' : step === 2 ? '코드 확인' : '비밀번호 설정'}
      </span>
    </div>
  );

  return (
    <div className="h-[100dvh] flex flex-col bg-white text-gray-900 font-sans max-w-md mx-auto shadow-2xl">
      <header className="px-4 h-[56px] flex items-center border-b border-gray-100">
        <button
          onClick={() => step > 1 ? setStep((step - 1) as Step) : router.back()}
          className="p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="ml-2 font-bold text-lg">회원가입</h1>
      </header>

      <main className="flex-1 px-6 pt-8 pb-6 overflow-y-auto">
        <StepBar />

        {/* ── Step 1: 이메일 입력 ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black mb-1">학교 이메일 인증</h2>
              <p className="text-sm text-gray-500 font-medium">KENTECH 메일로 인증코드를 보내드립니다.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">학교 이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@kentech.ac.kr"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-kakao-blue/50 focus:border-kakao-blue transition-all"
                onKeyDown={(e) => e.key === 'Enter' && sendCode()}
              />
              {email && !isValidEmail && (
                <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">@kentech.ac.kr 형식이어야 합니다.</p>
              )}
            </div>
            {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
            <button
              onClick={sendCode}
              disabled={!isValidEmail || sending}
              className="w-full bg-kakao-blue text-white h-14 rounded-xl font-black text-[15px] shadow-md shadow-kakao-blue/30 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:bg-gray-300 disabled:shadow-none"
            >
              {sending ? '발송 중...' : '인증코드 발송'}
            </button>
          </div>
        )}

        {/* ── Step 2: 인증코드 입력 ── */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-black mb-1">인증코드 입력</h2>
              <p className="text-sm text-gray-500 font-medium">
                <span className="text-kakao-blue font-bold">{email}</span>로 발송된<br />6자리 코드를 입력해주세요.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
              <Mail className="w-4 h-4 text-blue-400 shrink-0" />
              <p className="text-xs text-blue-600 font-bold">스팸 폴더도 확인해보세요. (10분 이내 입력)</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">인증코드 6자리</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                autoFocus
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 text-2xl font-black text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-kakao-blue/50 focus:border-kakao-blue transition-all"
                onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
            <button
              onClick={verifyCode}
              disabled={code.length !== 6 || verifying}
              className="w-full bg-kakao-blue text-white h-14 rounded-xl font-black text-[15px] shadow-md shadow-kakao-blue/30 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:bg-gray-300 disabled:shadow-none"
            >
              {verifying ? '확인 중...' : '인증 확인'}
            </button>
            <button
              onClick={() => { setStep(1); setCode(''); setError(''); }}
              className="w-full text-xs text-gray-400 font-bold py-2"
            >
              이메일 다시 입력하기
            </button>
          </div>
        )}

        {/* ── Step 3: 비밀번호 설정 ── */}
        {step === 3 && (
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <h2 className="text-2xl font-black mb-1">비밀번호 설정</h2>
              <p className="text-sm text-gray-500 font-medium">사용할 비밀번호를 입력해주세요.</p>
            </div>
            <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
              <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
              <p className="text-xs text-green-700 font-bold">{email} 인증 완료</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상 입력"
                autoFocus
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
              {confirmPassword && password !== confirmPassword && (
                <p className="text-red-500 text-[10px] font-bold mt-1.5 ml-1">비밀번호가 일치하지 않습니다.</p>
              )}
            </div>
            {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}
            <button
              type="submit"
              disabled={loading || password.length < 6 || password !== confirmPassword}
              className="w-full bg-kakao-blue text-white h-14 rounded-xl font-black text-[15px] shadow-md shadow-kakao-blue/30 active:scale-[0.98] transition-transform disabled:opacity-50 disabled:bg-gray-300 disabled:shadow-none"
            >
              {loading ? '가입 처리 중...' : '가입 완료'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
