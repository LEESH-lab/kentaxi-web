'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ChevronRight, RefreshCw, ShieldCheck, Users as UsersIcon, CheckCircle2, Circle } from 'lucide-react';

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: string | null;
  image: string | null;
  defaultBank: string | null;
  defaultAccount: string | null;
  createdAt: string;
  _count: { pots: number; payments: number; messages: number };
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users');
      if (res.status === 401) { setError('로그인이 필요합니다.'); setUsers([]); return; }
      if (res.status === 403) { setError('관리자만 접근할 수 있습니다.'); setUsers([]); return; }
      if (!res.ok) { setError('회원 목록을 불러오지 못했습니다.'); setUsers([]); return; }
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setError('회원 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('ko-KR', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

  const verifiedCount = users.filter(u => u.emailVerified).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 font-sans text-gray-900">
      <header className="bg-[#1c1c1e] text-white px-4 pt-10 pb-6 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 text-white/70 hover:text-white">
              <ChevronRight className="w-6 h-6 rotate-180" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-kakao-yellow" />
                <h1 className="font-black text-lg tracking-tight">관리자 · 회원 관리</h1>
              </div>
              <p className="text-[11px] text-white/50 mt-0.5">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={load}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-xs font-bold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> 새로고침
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {error ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 mt-6">
            <ShieldCheck className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-700">{error}</p>
            <Link href="/" className="inline-block mt-4 text-sm font-bold text-kakao-blue">홈으로 돌아가기</Link>
          </div>
        ) : (
          <>
            {/* 요약 통계 */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-black mb-1">
                  <UsersIcon className="w-3.5 h-3.5" /> 총 가입 회원
                </div>
                <div className="text-3xl font-black text-gray-900">{loading ? '–' : users.length}<span className="text-base text-gray-400 font-bold ml-1">명</span></div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-1.5 text-gray-400 text-[11px] font-black mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 이메일 인증 완료
                </div>
                <div className="text-3xl font-black text-gray-900">{loading ? '–' : verifiedCount}<span className="text-base text-gray-400 font-bold ml-1">명</span></div>
              </div>
            </div>

            {/* 회원 목록 */}
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-kakao-blue border-t-transparent" />
              </div>
            ) : users.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                <p className="text-gray-400 font-bold">아직 가입한 회원이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {users.map((u, i) => (
                  <div key={u.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                        {u.image ? <img src={u.image} alt="" className="w-full h-full object-cover" /> : <UsersIcon className="w-5 h-5 text-gray-300" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-gray-900">{u.name || '(이름없음)'}</span>
                          {u.emailVerified
                            ? <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3" />인증</span>
                            : <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full"><Circle className="w-3 h-3" />미인증</span>}
                          <span className="text-[10px] text-gray-300 font-bold">#{i + 1}</span>
                        </div>
                        <div className="text-xs text-gray-500 font-medium truncate mt-0.5">{u.email}</div>
                        <div className="flex items-center gap-3 mt-2 text-[11px] font-bold text-gray-500">
                          <span>가입 {fmtDate(u.createdAt)}</span>
                          <span className="text-gray-300">·</span>
                          <span>팟 {u._count.pots}</span>
                          <span>송금 {u._count.payments}</span>
                          <span>메시지 {u._count.messages}</span>
                        </div>
                        {u.defaultBank && (
                          <div className="text-[11px] text-gray-400 font-medium mt-1">기본계좌: {u.defaultBank} {u.defaultAccount || ''}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
