'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, LogOut, User as UserIcon, Mail, CarTaxiFront, CreditCard, Save, AlertTriangle, Receipt } from 'lucide-react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Default Settlement Bank Account states
  const [bank, setBank] = useState('');
  const [account, setAccount] = useState('');
  const [holder, setHolder] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Pending Settlements state
  const [pendingSettlements, setPendingSettlements] = useState<any[]>([]);

  // Fetch pending settlements
  const fetchPendingSettlements = () => {
    fetch('/api/user/settlements/pending')
      .then(res => res.ok ? res.json() : [])
      .then(data => setPendingSettlements(data))
      .catch(err => console.error('Failed to load pending settlements:', err));
  };

  // Fetch default bank details and pending settlements on mount
  useEffect(() => {
    if (session) {
      fetch('/api/user/account')
        .then(res => res.json())
        .then(data => {
          if (data) {
            setBank(data.defaultBank || '');
            setAccount(data.defaultAccount || '');
            setHolder(data.defaultHolder || '');
          }
        })
        .catch(err => console.error('Failed to load user account:', err));

      fetchPendingSettlements();
    }
  }, [session]);

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

  const handleSaveAccount = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/user/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultBank: bank, defaultAccount: account, defaultHolder: holder })
      });
      if (res.ok) {
        setSaveMessage('✅ 계좌 정보가 저장되었습니다.');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('❌ 저장에 실패했습니다.');
      }
    } catch (e) {
      setSaveMessage('❌ 서버 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePaySettlement = async (potId: string) => {
    try {
      const res = await fetch(`/api/pots/${potId}/settlement/pay`, { method: 'POST' });
      if (res.ok) {
        // Refresh the pending list
        fetchPendingSettlements();
      } else {
        alert('납부 상태 갱신에 실패했습니다.');
      }
    } catch (e) {
      alert('서버 오류가 발생했습니다.');
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠ 정말로 회원 탈퇴를 하시겠습니까?\n탈퇴 시 모든 탑승 이력, 대화 내역 및 정산 정보가 영구적으로 삭제되며 복구할 수 없습니다.'
    );
    if (!confirmed) return;

    try {
      const res = await fetch('/api/user', { method: 'DELETE' });
      if (res.ok) {
        alert('회원 탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.');
        await signOut({ callbackUrl: '/login' });
      } else {
        alert('회원 탈퇴 중 오류가 발생했습니다. 다시 시도해 주세요.');
      }
    } catch (e) {
      alert('서버와의 통신에 실패했습니다.');
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-white text-gray-900 font-sans max-w-md mx-auto shadow-2xl overflow-y-auto no-scrollbar">
      <header className="px-4 h-[56px] flex items-center border-b border-gray-100 shrink-0 bg-white sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="ml-2 font-bold text-lg">프로필</h1>
      </header>

      <main className="flex-1 px-6 pt-8 pb-10 flex flex-col">
        {/* 아바타 */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-kakao-blue/10 flex items-center justify-center overflow-hidden mb-3 border-4 border-kakao-blue/20">
            {session.user?.image
              ? <img src={session.user.image} alt="" className="w-full h-full object-cover" />
              : <UserIcon className="w-10 h-10 text-kakao-blue/50" />
            }
          </div>
          <h2 className="text-xl font-black text-gray-900">{session.user?.name}</h2>
          <p className="text-xs text-gray-400 font-medium mt-0.5">{session.user?.email}</p>
        </div>

        {/* 기본 정보 */}
        <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100 mb-6 shrink-0">
          <div className="flex items-center gap-3 px-5 py-3">
            <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">이름</p>
              <p className="text-sm font-bold text-gray-800">{session.user?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3">
            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">이메일</p>
              <p className="text-sm font-bold text-gray-800">{session.user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3">
            <CarTaxiFront className="w-4 h-4 text-kakao-yellow fill-current shrink-0" />
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">소속</p>
              <p className="text-sm font-bold text-gray-800">KENTECH 구성원</p>
            </div>
          </div>
        </div>

        {/* 정산 대기중 섹션 */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4.5 h-4.5 text-orange-500" />
              <h3 className="font-bold text-sm text-gray-800">정산 대기중</h3>
            </div>
            <span className="text-xs bg-orange-50 text-orange-500 font-bold px-2 py-0.5 rounded-full">
              {pendingSettlements.length}건
            </span>
          </div>

          {pendingSettlements.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4 font-medium">
              대기 중인 정산이 없습니다. 깨끗한 정산 상태입니다! 👍
            </p>
          ) : (
            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
              {pendingSettlements.map((set) => (
                <div key={set.potId} className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm relative">
                  <div className="text-[10px] font-bold text-gray-400 mb-1 flex items-center justify-between">
                    <span className="truncate max-w-[150px]">{set.from} ➔ {set.to}</span>
                    <span>{new Date(set.departureTime).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[11px] text-gray-400 font-medium">{set.accountBank} · {set.accountHolder}</span>
                    <span className="text-lg font-black text-orange-500">{set.perPerson.toLocaleString()}원</span>
                  </div>
                  <div className="font-mono text-xs text-gray-800 bg-gray-50 px-2 py-1.5 rounded-lg mb-3 break-all select-all">
                    {set.accountNumber}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`supertoss://send?bank=${encodeURIComponent(set.accountBank)}&account=${encodeURIComponent(set.accountNumber)}&amount=${set.perPerson}`}
                      className="flex-1 text-center text-[11px] bg-blue-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-0.5 active:bg-blue-700"
                    >
                      ⚡ 토스 송금
                    </a>
                    <button
                      onClick={() => handlePaySettlement(set.potId)}
                      className="flex-1 text-[11px] bg-kakao-yellow text-black py-2 rounded-xl font-bold active:bg-yellow-400 cursor-pointer"
                    >
                      납부 완료
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 기본 정산 계좌 관리 */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100 shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4.5 h-4.5 text-kakao-blue" />
            <h3 className="font-bold text-sm text-gray-800">기본 정산 계좌 관리</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 block mb-1">은행명</label>
              <input
                type="text"
                placeholder="예: 카카오뱅크"
                value={bank}
                onChange={e => setBank(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-kakao-blue text-gray-800 font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 block mb-1">계좌번호</label>
              <input
                type="text"
                placeholder="예: 3333-01-1234567"
                value={account}
                onChange={e => setAccount(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-mono focus:outline-none focus:border-kakao-blue text-gray-800 font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 block mb-1">예금주</label>
              <input
                type="text"
                placeholder="예: 홍길동"
                value={holder}
                onChange={e => setHolder(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-kakao-blue text-gray-800 font-bold"
              />
            </div>
            
            {saveMessage && (
              <p className="text-xs font-bold text-center mt-1 transition-all">{saveMessage}</p>
            )}

            <button
              onClick={handleSaveAccount}
              disabled={isSaving}
              className="w-full bg-kakao-blue text-white py-2.5 rounded-xl text-xs font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm shadow-blue-100 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              계좌 정보 저장
            </button>
          </div>
        </div>

        {/* 푸터 조작부 */}
        <div className="mt-auto pt-6 space-y-3 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-gray-100 text-gray-700 font-black text-[15px] active:bg-gray-200 transition-all shadow-sm cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            로그아웃
          </button>
          
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-red-50 text-red-500 font-bold text-[13px] active:bg-red-100 transition-all border border-red-100 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            회원 탈퇴
          </button>
        </div>
      </main>
    </div>
  );
}
