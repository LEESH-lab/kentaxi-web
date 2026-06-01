'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  LogOut, 
  User as UserIcon, 
  Mail, 
  CarTaxiFront, 
  CreditCard, 
  Save, 
  AlertTriangle, 
  Receipt, 
  Camera, 
  Lock, 
  X, 
  Check 
} from 'lucide-react';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  // User Profile state (stores fresh database name & image)
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; image: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

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

  // Fetch default bank details, user profile, and pending settlements on mount
  useEffect(() => {
    if (session) {
      // 1. Fetch default bank details
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

      // 2. Fetch fresh user profile (synced official name & image)
      fetch('/api/user')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setUserProfile(data);
          }
        })
        .catch(err => console.error('Failed to load user profile:', err));

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
        fetchPendingSettlements();
      } else {
        alert('납부 상태 갱신에 실패했습니다.');
      }
    } catch (e) {
      alert('서버 오류가 발생했습니다.');
    }
  };

  // Profile picture update handler
  const handleUpdateAvatar = async (imageUrl: string) => {
    setIsUploading(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl })
      });
      if (res.ok) {
        const updated = await res.json();
        setUserProfile(updated);
        // Trigger NextAuth session refresh
        await update();
        setShowAvatarModal(false);
      } else {
        alert('프로필 이미지 변경에 실패했습니다.');
      }
    } catch (e) {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  // Custom profile image file upload handler (converts to Base64)
  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('이미지 크기는 최대 2MB까지 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        await handleUpdateAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
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

  const currentName = userProfile?.name || session.user?.name;
  const currentImage = userProfile?.image || session.user?.image;
  const currentEmail = userProfile?.email || session.user?.email;

  return (
    <div className="h-[100dvh] flex flex-col bg-white text-gray-900 font-sans max-w-md mx-auto shadow-2xl overflow-y-auto no-scrollbar relative">
      <header className="px-4 h-[56px] flex items-center border-b border-gray-100 shrink-0 bg-white sticky top-0 z-10">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="ml-2 font-bold text-lg">프로필</h1>
      </header>

      <main className="flex-1 px-6 pt-8 pb-10 flex flex-col">
        {/* 아바타 영역 (클릭 시 사진 변경 모달 오픈) */}
        <div className="flex flex-col items-center mb-8">
          <div 
            className="relative group cursor-pointer" 
            onClick={() => setShowAvatarModal(true)}
            title="프로필 사진 변경"
          >
            <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center overflow-hidden border-4 border-kakao-blue/15 hover:scale-105 active:scale-95 transition-all shadow-inner">
              {currentImage ? (
                <img src={currentImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-10 h-10 text-[#1e40af]/30" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white border border-gray-100 shadow-md w-8 h-8 rounded-full flex items-center justify-center text-gray-700 active:scale-95 transition-transform">
              <Camera className="w-4.5 h-4.5 text-gray-500" />
            </div>
          </div>
          
          {/* 이름 & 학교 연동 고정 마크 */}
          <div className="flex items-center gap-1.5 mt-4">
            <h2 className="text-xl font-black text-gray-900 leading-none">{currentName}</h2>
            <div 
              className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-50 text-[#1e40af]" 
              title="KENTECH 공식 연동 및 수정 차단됨"
            >
              <Lock className="w-3 h-3" />
            </div>
          </div>
          <p className="text-xs text-gray-400 font-medium mt-1.5">{currentEmail}</p>
        </div>

        {/* 기본 정보 */}
        <div className="bg-gray-50 rounded-2xl divide-y divide-gray-100 mb-2 shrink-0">
          <div className="flex items-center gap-3 px-5 py-3.5">
            <UserIcon className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="flex-1 flex justify-between items-center">
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">이름</p>
                <p className="text-sm font-bold text-gray-800">{currentName}</p>
              </div>
              <span className="text-[10px] bg-blue-50 text-[#1e40af] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 select-none">
                <Lock className="w-2.5 h-2.5" /> 켄텍 고정
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">이메일</p>
              <p className="text-sm font-bold text-gray-800">{currentEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <CarTaxiFront className="w-4 h-4 text-kakao-yellow fill-current shrink-0" />
            <div>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">소속</p>
              <p className="text-sm font-bold text-gray-800">KENTECH 구성원</p>
            </div>
          </div>
        </div>

        {/* 이름 정보 고정 안내 문구 */}
        <p className="text-[10px] text-gray-400 text-center mb-6 font-medium leading-relaxed">
          🔒 이름은 신뢰도 높은 카풀 문화를 위해 KENTECH 학생 메일 인증 정보에 따라 고정되며 임의로 수정할 수 없습니다.
        </p>

        {/* 정산 대기중 섹션 */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4.5 h-4.5 text-orange-500" />
              <h3 className="font-bold text-sm text-gray-800 font-sans">정산 대기중</h3>
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
                    <span className="truncate max-w-[150px] font-sans">{set.from} ➔ {set.to}</span>
                    <span className="font-sans">{new Date(set.departureTime).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}</span>
                  </div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="text-[11px] text-gray-400 font-medium font-sans">{set.accountBank} · {set.accountHolder}</span>
                    <span className="text-lg font-bold text-orange-500 font-sans">{set.perPerson.toLocaleString()}원</span>
                  </div>
                  <div className="font-sans text-xs text-gray-800 bg-gray-50 px-2 py-1.5 rounded-lg mb-3 break-all select-all">
                    {set.accountNumber}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`supertoss://send?bank=${encodeURIComponent(set.accountBank)}&accountNo=${encodeURIComponent(set.accountNumber)}&amount=${set.perPerson}`}
                      className="flex-1 text-center text-[11px] bg-blue-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-0.5 active:bg-blue-700 font-sans"
                    >
                      ⚡ 토스 송금
                    </a>
                    <button
                      onClick={() => handlePaySettlement(set.potId)}
                      className="flex-1 text-[11px] bg-kakao-yellow text-black py-2 rounded-xl font-bold active:bg-yellow-400 cursor-pointer font-sans"
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
            <CreditCard className="w-4.5 h-4.5 text-[#1e40af]" />
            <h3 className="font-bold text-sm text-gray-800 font-sans">기본 정산 계좌 관리</h3>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold text-gray-400 block mb-1">은행명</label>
              <input
                type="text"
                placeholder="예: 카카오뱅크"
                value={bank}
                onChange={e => setBank(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#1e40af] text-gray-800 font-bold font-sans"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 block mb-1">계좌번호</label>
              <input
                type="text"
                placeholder="예: 3333-01-1234567"
                value={account}
                onChange={e => setAccount(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#1e40af] text-gray-800 font-bold font-sans"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 block mb-1">예금주</label>
              <input
                type="text"
                placeholder="예: 홍길동"
                value={holder}
                onChange={e => setHolder(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#1e40af] text-gray-800 font-bold font-sans"
              />
            </div>
            
            {saveMessage && (
              <p className="text-xs font-bold text-center mt-1 transition-all font-sans">{saveMessage}</p>
            )}

            <button
              onClick={handleSaveAccount}
              disabled={isSaving}
              className="w-full bg-[#1e40af] text-white py-2.5 rounded-xl text-xs font-bold active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 disabled:opacity-50 shadow-sm shadow-blue-100 cursor-pointer font-sans"
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
            className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-gray-100 text-gray-700 font-black text-[15px] active:bg-gray-200 transition-all shadow-sm cursor-pointer font-sans"
          >
            <LogOut className="w-5 h-5" />
            로그아웃
          </button>
          
          <button
            onClick={handleDeleteAccount}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-2xl bg-red-50 text-red-500 font-bold text-[13px] active:bg-red-100 transition-all border border-red-100 cursor-pointer font-sans"
          >
            <AlertTriangle className="w-4 h-4" />
            회원 탈퇴
          </button>
        </div>
      </main>

      {/* PROFIL AVATAR CHANGE MODAL */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] transition-opacity duration-300">
          <div className="bg-white rounded-3xl p-6 mx-4 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <button 
              onClick={() => setShowAvatarModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 active:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-gray-900 mb-1 font-sans">프로필 사진 변경</h3>
            <p className="text-xs text-gray-400 font-medium mb-6 font-sans">나만의 개성있는 프로필 사진을 선택하거나 직접 등록해보세요.</p>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: "🚖 택시러버", url: "https://api.dicebear.com/7.x/bottts/svg?seed=taxi" },
                { label: "😎 쿨라이더", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=jisoo" },
                { label: "⚡ 번개송금", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=lightning" },
                { label: "🚗 켄택시", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=rider" },
                { label: "🦁 켄텍사자", url: "https://api.dicebear.com/7.x/bottts/svg?seed=kentech" },
                { label: "🌟 슈퍼스타", url: "https://api.dicebear.com/7.x/fun-emoji/svg?seed=star" },
              ].map((preset, idx) => {
                const isSelected = currentImage === preset.url;
                return (
                  <button
                    key={idx}
                    onClick={() => handleUpdateAvatar(preset.url)}
                    disabled={isUploading}
                    className={`p-2 rounded-2xl border flex flex-col items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                      isSelected 
                        ? 'border-[#1e40af] bg-blue-50/50' 
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center relative">
                      <img src={preset.url} alt="" className="w-full h-full object-cover" />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[#1e40af]/30 flex items-center justify-center">
                          <Check className="w-5 h-5 text-white" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 font-sans">{preset.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-150"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold font-sans">또는</span>
              <div className="flex-grow border-t border-gray-150"></div>
            </div>

            {/* Custom file upload */}
            <div className="mt-4">
              <label 
                className={`w-full flex items-center justify-center gap-2 h-12 rounded-2xl border border-dashed border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-transform cursor-pointer ${
                  isUploading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleCustomImageUpload}
                  disabled={isUploading}
                  className="hidden" 
                />
                <Camera className="w-4.5 h-4.5 text-gray-500" />
                <span className="text-xs font-bold text-gray-700 font-sans">
                  {isUploading ? '업로드 중...' : '내 앨범에서 사진 선택'}
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
