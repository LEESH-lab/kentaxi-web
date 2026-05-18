'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trainService, Train } from '@/services/trainService';

function CreatePotContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const direction = (searchParams?.get('direction') as 'TO_STATION' | 'FROM_STATION') || 'TO_STATION';

  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrain, setSelectedTrain] = useState<Train | null>(null);

  useEffect(() => {
    async function loadTrains() {
      const data = await trainService.getTrainsByDirection(direction);
      setTrains(data);
      setLoading(false);
    }
    loadTrains();
  }, [direction]);

  const formatDateTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return {
      date: d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }),
      time: d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  };

  // Group trains by date
  const groupedTrains = trains.reduce((acc, train) => {
    const dateStr = new Date(train.departureTime).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
    if (!acc[dateStr]) acc[dateStr] = [];
    acc[dateStr].push(train);
    return acc;
  }, {} as Record<string, Train[]>);

  const handleCreate = async () => {
    if (!selectedTrain) return;

    const res = await fetch('/api/pots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainType: selectedTrain.type,
        trainNumber: selectedTrain.number,
        departureTime: selectedTrain.departureTime,
        from: selectedTrain.from,
        to: selectedTrain.to,
      }),
    });

    if (res.ok) {
      const pot = await res.json();
      router.push(`/chat/${pot.id}`);
    } else {
      alert('파티 생성에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      <header className="px-6 py-4 border-b bg-white flex items-center gap-4 sticky top-0 z-10 backdrop-blur-md bg-white/80">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 transition-all">
        </button>
        <h1 className="font-black text-xl tracking-tight">파티 생성</h1>
      </header>

      <main className="max-w-xl mx-auto p-6">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-black text-blue-600 uppercase tracking-widest">Step 1</h2>
            <div className="h-px flex-1 bg-blue-100"></div>
          </div>
          <h3 className="text-2xl font-black mb-1">기차 시간표 선택</h3>
          <p className="text-gray-400 text-sm font-medium">
            {direction === 'TO_STATION' ? '학교 나주역' : '나주역 학교'} 방향 기차를 선택하세요. (최대 7일)
          </p>
        </div>
          
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-gray-400 font-bold italic">시간표 로딩 중...</p>
          </div>
        ) : (
          <div className="space-y-8 mb-10">
            {Object.entries(groupedTrains).map(([date, trainsAtDate]) => (
              <div key={date}>
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 px-2">{date}</h4>
                <div className="space-y-3">
                  {trainsAtDate.map((train) => (
                    <button 
                      key={`${train.type}-${train.number}-${train.departureTime}`}
                      onClick={() => setSelectedTrain(train)}
                      className={`w-full text-left border-2 rounded-[2rem] p-6 transition-all duration-300 relative overflow-hidden will-change-transform active:scale-[0.97] outline-none ${
                        selectedTrain?.departureTime === train.departureTime && selectedTrain?.number === train.number
                          ? 'border-[#3B82F6] bg-[#EFF6FF] shadow-[0_20px_40px_-15px_rgba(59,130,246,0.2)] -translate-y-1' 
                          : 'border-transparent bg-white hover:border-[#E5E7EB] shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1'
                      }`}
                    >
                      <div className="flex justify-between items-center relative z-10">
                        <div>
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-[0.75rem] uppercase tracking-wider shadow-sm transition-colors ${train.type === 'SRT' ? 'bg-[#7C3AED] text-white' : 'bg-[#2563EB] text-white'}`}>
                            {train.type} {train.number}
                          </span>
                          <div className={`text-[2rem] font-black mt-3 leading-none tracking-tight transition-colors ${selectedTrain?.departureTime === train.departureTime && selectedTrain?.number === train.number ? 'text-[#1A1C1E]' : 'text-[#1A1C1E]'}`}>{formatDateTime(train.departureTime).time}</div>
                          <div className="text-[10px] font-bold text-[#94A3B8] mt-1.5 uppercase tracking-widest">Departure Time</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-sm font-black mb-1 transition-colors ${selectedTrain?.departureTime === train.departureTime && selectedTrain?.number === train.number ? 'text-[#3B82F6]' : 'text-[#64748B]'}`}>{train.from} {train.to}</div>
                        </div>
                      </div>
                      
                      {/* Active Indicator Background Overlay */}
                      <div className={`absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 transition-opacity duration-300 ${selectedTrain?.departureTime === train.departureTime && selectedTrain?.number === train.number ? 'opacity-100' : 'opacity-0'}`}></div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedTrain && (
          <div className="bg-gray-900 text-white rounded-[2rem] p-8 mb-10 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <h3 className="font-black text-xs uppercase tracking-widest text-blue-400">자동 매칭 정보</h3>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Meeting At</p>
                <div className="text-4xl font-black text-white leading-none tracking-tighter">
                  {
                    (() => {
                      const d = new Date(selectedTrain.departureTime);
                      d.setMinutes(d.getMinutes() - 30);
                      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                    })()
                  }
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Direction</p>
                <p className="text-sm font-black text-white">{direction === 'TO_STATION' ? '학교 정문 나주역' : '나주역 광장 학교'}</p>
              </div>
            </div>
            <div className="h-px bg-white/10 my-6"></div>
            <p className="text-xs text-gray-400 leading-relaxed font-medium italic">
              * {formatDateTime(selectedTrain.departureTime).date} 기준입니다.<br />
              * 기차 출발 30분 전 모임을 원칙으로 합니다.<br />
              * 동승자가 모이면 채팅방에서 상세 위치를 정하세요.
            </p>
          </div>
        )}

        <button 
          onClick={handleCreate}
          disabled={!selectedTrain}
          className={`w-full py-6 rounded-[2rem] font-black text-lg shadow-2xl transition-all duration-300 ${
            selectedTrain 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:-translate-y-1 active:scale-95' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          }`}
        >
          파티 시작하기
        </button>
      </main>
    </div>
  );
}

export default function CreatePotPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    }>
      <CreatePotContent />
    </Suspense>
  );
}
