'use client';

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  CarTaxiFront,
  ArrowLeftRight,
  MessageCircle,
  Plus,
  Car,
  Check,
  Send,
  Clock,
  User as UserIcon,
  ChevronRight,
  Receipt,
  CreditCard,
  CheckCircle2,
  Circle,
  ShieldCheck
} from "lucide-react";
import Link from 'next/link';
import { trainService, Train } from "@/services/trainService";

type Direction = 'TO_STATION' | 'FROM_STATION';
type PotStatus = 'NONE' | 'WAITING' | 'CONFIRMED';

export default function Home() {
  const { data: session } = useSession();
  const generateDates = () => {
    const dates = [];
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const date = String(d.getDate()).padStart(2, '0');
      const yyyymmdd = `${year}${month}${date}`;
      const label = i === 0 ? '오늘' : i === 1 ? '내일' : `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
      dates.push({ id: yyyymmdd, label, isToday: i === 0 });
    }
    return dates;
  };

  const weekDates = generateDates();
  const [direction, setDirection] = useState<Direction>('TO_STATION');
  const [selectedDate, setSelectedDate] = useState<string>(weekDates[0].id);
  const [trains, setTrains] = useState<Train[]>([]);
  const [pots, setPots] = useState<any[]>([]);
  const [selectedTrainId, setSelectedTrainId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [activeChatPotId, setActiveChatPotId] = useState<string | null>(null);
  const [meetingOffsetMins, setMeetingOffsetMins] = useState(30);

  // Chat States
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Notification toast
  const [notifications, setNotifications] = useState<{ id: string; text: string }[]>([]);
  const prevPotMembersRef = useRef<Record<string, number>>({});
  const isPotsInitialized = useRef(false);

  const addNotification = (text: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotifications(prev => [...prev, { id, text }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 4000);
  };

  const updatePots = (newPots: any[]) => {
    if (!isPotsInitialized.current) {
      const counts: Record<string, number> = {};
      newPots.forEach(pot => { counts[pot.id] = pot._count.users; });
      prevPotMembersRef.current = counts;
      isPotsInitialized.current = true;
    } else {
      newPots.forEach(pot => {
        const isMyPot = pot.users?.some((u: any) => u.userId === session?.user?.id);
        if (!isMyPot) return;
        const prevCount = prevPotMembersRef.current[pot.id];
        if (prevCount !== undefined && pot._count.users > prevCount) {
          addNotification(`새 파티원이 합류했습니다! (${pot._count.users}/${pot.capacity}명)`);
        }
        prevPotMembersRef.current[pot.id] = pot._count.users;
      });
    }
    setPots(newPots);
  };

  const dateScrollRef = useRef<HTMLDivElement>(null);
  const trainScrollRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const [showSettlement, setShowSettlement] = useState(false);
  const [settlement, setSettlement] = useState<any>(null);
  const [settlementForm, setSettlementForm] = useState({ totalAmount: '', accountBank: '', accountNumber: '', accountHolder: '' });
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const TIME_OFFSETS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90];
  const ITEM_HEIGHT = 48;

  useEffect(() => {
    if (!isSheetOpen) return;
    const idx = TIME_OFFSETS.indexOf(meetingOffsetMins);
    setTimeout(() => {
      pickerRef.current?.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'instant' });
    }, 50);
  }, [isSheetOpen]);

  const handlePickerScroll = () => {
    if (!pickerRef.current) return;
    const idx = Math.round(pickerRef.current.scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, TIME_OFFSETS.length - 1));
    setMeetingOffsetMins(TIME_OFFSETS[clamped]);
  };

  const scrollRight = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: 150, behavior: 'smooth' });
    }
  };

  const scrollLeft = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollBy({ left: -150, behavior: 'smooth' });
    }
  };

  // 1. Fetch initial data
  useEffect(() => {
    async function initData() {
      setLoading(true);
      const fetchedTrains = await trainService.getTrainsByDirection(direction, selectedDate);
      setTrains(fetchedTrains);
      
      try {
        const res = await fetch('/api/pots');
        if (res.ok) updatePots(await res.json());
      } catch (e) {
        console.error("Failed to fetch pots", e);
      }
      
      if (fetchedTrains.length > 0) {
        setSelectedTrainId(`${fetchedTrains[0].type}-${fetchedTrains[0].number}-${fetchedTrains[0].departureTime}`);
      }
      setLoading(false);
    }
    initData();
  }, [direction, selectedDate]);

  // Settlement fetch
  useEffect(() => {
    if (!activeChatPotId || activeChatPotId === 'GLOBAL_OPEN_CHAT') {
      setSettlement(null);
      setShowSettlement(false);
      return;
    }
    fetch(`/api/pots/${activeChatPotId}/settlement`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setSettlement(data));
  }, [activeChatPotId]);

  const handleSubmitSettlement = async () => {
    if (!activeChatPotId) return;
    const res = await fetch(`/api/pots/${activeChatPotId}/settlement`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        totalAmount: parseInt(settlementForm.totalAmount),
        accountBank: settlementForm.accountBank,
        accountNumber: settlementForm.accountNumber,
        accountHolder: settlementForm.accountHolder,
      }),
    });
    if (res.ok) {
      const data = await fetch(`/api/pots/${activeChatPotId}/settlement`).then(r => r.json());
      setSettlement(data);
    }
  };

  const handleTogglePay = async () => {
    if (!activeChatPotId) return;
    await fetch(`/api/pots/${activeChatPotId}/settlement/pay`, { method: 'POST' });
    const data = await fetch(`/api/pots/${activeChatPotId}/settlement`).then(r => r.json());
    setSettlement(data);
  };

  // Chat Polling
  useEffect(() => {
    let interval: any;
    if (activeChatPotId) {
      const fetchMessages = async () => {
        try {
          const res = await fetch(`/api/messages?potId=${activeChatPotId}`);
          if (res.ok) setMessages(await res.json());
        } catch (e) {
          console.error(e);
        }
      };
      fetchMessages(); // initial fetch
      interval = setInterval(fetchMessages, 2000); // Poll every 2 seconds
    } else {
      setMessages([]);
    }
    return () => clearInterval(interval);
  }, [activeChatPotId]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Refetch pots on every mount (e.g., returning from chat after leaving a pot)
  useEffect(() => {
    fetch('/api/pots')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) updatePots(data); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic pot polling to detect new members even when chat is closed
  useEffect(() => {
    if (!session) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/pots');
        if (res.ok) updatePots(await res.json());
      } catch (e) {}
    }, 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // 2. Interaction Handlers
  const handleTrainClick = (train: Train) => {
    const id = `${train.type}-${train.number}-${train.departureTime}`;
    setSelectedTrainId(id);
    setActiveChatPotId(null);
  };

  const handleCreatePot = async () => {
    const train = trains.find(t => `${t.type}-${t.number}-${t.departureTime}` === selectedTrainId);
    if (!train || !session) return;
    
    try {
      const offsetSign = direction === 'FROM_STATION' ? 1 : -1;
      const meetingTime = new Date(new Date(train.departureTime).getTime() + offsetSign * meetingOffsetMins * 60000).toISOString();
      const res = await fetch('/api/pots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainType: train.type,
          trainNumber: train.number,
          departureTime: train.departureTime,
          from: train.from,
          to: train.to,
          meetingTime,
        }),
      });

      if (res.ok) {
        const pot = await res.json();
        setIsBottomSheetOpen(false);
        const potsRes = await fetch('/api/pots');
        if (potsRes.ok) updatePots(await potsRes.json());
        setTimeout(() => setActiveChatPotId(pot.id), 350);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeavePot = async () => {
    if (!activeChatPotId) return;
    const res = await fetch(`/api/pots/${activeChatPotId}/leave`, { method: 'DELETE' });
    if (res.ok) {
      setActiveChatPotId(null);
      setShowLeaveConfirm(false);
      setShowSettlement(false);
      const potsRes = await fetch('/api/pots');
      if (potsRes.ok) updatePots(await potsRes.json());
    }
  };

  const handleJoinPot = async (potId: string) => {
    if (!session) return;
    try {
      const res = await fetch(`/api/pots/${potId}/join`, { method: 'POST' });
      if (res.ok) {
        const potsRes = await fetch('/api/pots');
        if (potsRes.ok) updatePots(await potsRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  }

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeChatPotId || !session) return;
    
    const content = newMessage;
    setNewMessage(""); // optimistic clear
    
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, potId: activeChatPotId })
      });
      if (res.ok) {
        const newMsg = await res.json();
        // optionally append immediately to avoid waiting for poll
        setMessages(prev => {
          if (prev.find(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. UI Helpers
  const formatTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getMyStatus = (): { label: string; variant: string } => {
    if (!session || !pots) return { label: '로그인', variant: 'outline' };
    const myPot = pots.find(p => p.users?.some((u: any) => u.userId === session.user?.id));
    if (!myPot) return { label: '팟 없음', variant: 'outline' };
    return (myPot._count?.users || 0) >= myPot.capacity 
      ? { label: '탑승 확정', variant: 'confirmed' } 
      : { label: '대기 중', variant: 'secondary' };
  };

  const selectedTrain = trains.find(t => `${t.type}-${t.number}-${t.departureTime}` === selectedTrainId);
  const trainPots = pots.filter(p => selectedTrain && p.trainNumber === selectedTrain.number && new Date(p.departureTime).getTime() === new Date(selectedTrain.departureTime).getTime());

  // 선택한 날짜의 모든 팟
  const allDayPots = pots.filter(p => {
    const kst = new Date(new Date(p.departureTime).getTime() + 9 * 60 * 60 * 1000);
    return kst.toISOString().slice(0, 10).replace(/-/g, '') === selectedDate;
  });

  return (
    <div className="h-[100dvh] flex flex-col bg-kakao-bg text-foreground overflow-hidden font-sans select-none relative max-w-md mx-auto shadow-2xl">

      {/* NOTIFICATION TOASTS */}
      <div className="absolute top-4 left-4 right-4 z-[300] flex flex-col gap-2 pointer-events-none">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="bg-[#1c1c1e] text-white px-4 py-3 rounded-2xl shadow-lg flex items-center gap-3 pointer-events-auto"
          >
            <UserIcon className="w-4 h-4 text-kakao-yellow shrink-0" />
            <span className="text-sm font-bold">{notif.text}</span>
          </div>
        ))}
      </div>

      {/* HEADER: Kakao T Blue Style */}
      <header className="bg-kakao-blue text-white pt-12 pb-10 px-4 flex flex-col z-0 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CarTaxiFront className="w-6 h-6 text-kakao-yellow fill-current" />
            <span className="font-black text-xl tracking-tight">KENTAXI</span>
          </div>
          
          {/* User Status */}
          <Link href={session ? "/profile" : "/login"} className="flex items-center gap-3 cursor-pointer">
            <div className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
              getMyStatus().variant === 'confirmed' ? 'bg-green-500 text-white' :
              getMyStatus().variant === 'secondary' ? 'bg-kakao-yellow text-black' :
              'bg-white/20 text-white'
            }`}>
              {getMyStatus().label}
            </div>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden border border-white/30">
              {session?.user?.image ? <img src={session.user.image} alt="" /> : <UserIcon className="w-4 h-4 text-white" />}
            </div>
          </Link>
        </div>

        {/* Big Tabs like Kakao T Home */}
        <div className="flex gap-6 border-b border-white/20 pb-3">
          <button 
            onClick={() => setDirection('TO_STATION')}
            className={`text-lg font-bold transition-all relative ${direction === 'TO_STATION' ? 'text-white' : 'text-white/60'}`}
          >
            학교에서 역으로
            {direction === 'TO_STATION' && (
              <div className="absolute -bottom-[13px] left-0 right-0 h-[3px] bg-white rounded-t-full" />
            )}
          </button>
          <button 
            onClick={() => setDirection('FROM_STATION')}
            className={`text-lg font-bold transition-all relative ${direction === 'FROM_STATION' ? 'text-white' : 'text-white/60'}`}
          >
            역에서 학교로
            {direction === 'FROM_STATION' && (
              <div className="absolute -bottom-[13px] left-0 right-0 h-[3px] bg-white rounded-t-full" />
            )}
          </button>
        </div>
      </header>

      {/* BODY CONTAINER: Overlapping white rounded container */}
      <main className="flex-1 flex flex-col bg-white -mt-4 rounded-t-[24px] z-10 overflow-hidden shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        
        {/* DATE SELECTOR (Horizontal Scroll) */}
        <section className="pt-6 pb-2 px-4 bg-white shrink-0 group relative">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">출발 날짜를 선택하세요</h3>
          </div>
          <div ref={dateScrollRef} className="flex gap-2 overflow-x-auto no-scrollbar pb-2 scroll-smooth">
            {weekDates.map((date) => {
              const isSelected = selectedDate === date.id;
              return (
                <button
                  key={date.id}
                  onClick={() => setSelectedDate(date.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                    isSelected
                      ? 'bg-kakao-blue border-kakao-blue text-white shadow-md'
                      : 'bg-white border-gray-200 text-gray-500 hover:border-kakao-blue/30 hover:text-kakao-blue'
                  }`}
                >
                  {date.label}
                </button>
              );
            })}
          </div>
          
          {/* Left Arrow */}
          <div className="absolute left-0 top-[40px] bottom-0 w-12 bg-gradient-to-r from-white via-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-start pl-1 z-10 pointer-events-none">
            <div 
              onClick={() => scrollLeft(dateScrollRef)}
              className="w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:scale-105 transition-transform pointer-events-auto cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </div>
          </div>
          
          {/* Right Arrow */}
          <div className="absolute right-0 top-[40px] bottom-0 w-12 bg-gradient-to-l from-white via-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-1 z-10 pointer-events-none">
            <div 
              onClick={() => scrollRight(dateScrollRef)}
              className="w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:scale-105 transition-transform pointer-events-auto cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* HORIZONTAL TRAIN TIMELINE */}
        <section className="pt-2 pb-4 px-4 border-b shrink-0 bg-white group relative">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm">출발 시간을 선택하세요</h3>
            <span className="text-[11px] text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-full">실시간</span>
          </div>
          
          <div ref={trainScrollRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth">
            {loading ? (
              [1,2,3,4].map(i => <div key={i} className="w-[100px] h-[72px] bg-gray-100 rounded-2xl animate-pulse shrink-0" />)
            ) : (
              trains.map((train) => {
                const id = `${train.type}-${train.number}-${train.departureTime}`;
                const isSelected = selectedTrainId === id;
                return (
                  <button 
                    key={id}
                    onClick={() => handleTrainClick(train)}
                    className={`shrink-0 w-[100px] p-3 rounded-2xl transition-all border text-left ${
                      isSelected 
                        ? 'bg-kakao-blue border-kakao-blue text-white shadow-md' 
                        : 'bg-white border-gray-200 text-gray-800 hover:border-kakao-blue/30'
                    }`}
                  >
                    <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block mb-1.5 ${
                      isSelected ? 'bg-white/20 text-white' : 
                      train.type === 'SRT' ? 'bg-[#502845] text-white' : 'bg-[#003B8D] text-white'
                    }`}>
                      {train.type} {train.number}
                    </div>
                    <div className={`text-xl font-black tracking-tighter ${isSelected ? 'text-kakao-yellow' : ''}`}>
                      {formatTime(train.departureTime)}
                    </div>
                  </button>
                )
              })
            )}
          </div>
          
          {/* Left Arrow */}
          <div className="absolute left-0 top-[30px] bottom-4 w-12 bg-gradient-to-r from-white via-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-start pl-1 z-10 pointer-events-none">
            <div 
              onClick={() => scrollLeft(trainScrollRef)}
              className="w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:scale-105 transition-transform pointer-events-auto cursor-pointer"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </div>
          </div>
          
          {/* Right Arrow */}
          <div className="absolute right-0 top-[30px] bottom-4 w-12 bg-gradient-to-l from-white via-white/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-1 z-10 pointer-events-none">
            <div 
              onClick={() => scrollRight(trainScrollRef)}
              className="w-8 h-8 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:scale-105 transition-transform pointer-events-auto cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        </section>

        {/* ALL DAY POTS + SELECTED TRAIN POTS (Vertical Scroll) */}
        <section className="flex-1 overflow-y-auto p-4 bg-kakao-bg">

          {/* 선택 날짜 전체 팟 */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">이 날의 모든 팟</h3>
              <span className="text-[11px] font-bold text-kakao-blue">{allDayPots.length}개</span>
            </div>
            {allDayPots.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                <CarTaxiFront className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-400 text-xs font-medium">이 날 생성된 팟이 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allDayPots.map((pot) => {
                  const isFull = pot._count.users >= pot.capacity;
                  const isMyPot = pot.users?.some((u: any) => u.userId === session?.user?.id);
                  const trainType = pot.trainType;
                  return (
                    <div key={pot.id} className={`bg-white rounded-2xl p-4 shadow-sm border relative overflow-hidden ${isMyPot ? 'border-kakao-blue/30' : 'border-gray-100'}`}>
                      {isMyPot && <div className="absolute top-0 left-0 w-1 h-full bg-kakao-blue rounded-l-2xl" />}
                      {isFull && <div className="absolute top-0 right-0 bg-red-50 text-red-500 text-[10px] font-bold px-2 py-0.5 rounded-bl-xl border-b border-l border-red-100">마감</div>}

                      <div className="flex items-center justify-between mb-3 pl-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg text-white ${trainType === 'SRT' ? 'bg-[#502845]' : 'bg-[#003B8D]'}`}>
                            {trainType} {pot.trainNumber}
                          </span>
                          <div className="text-xs text-gray-400">
                            <span className="font-bold text-gray-700">{formatTime(pot.departureTime)}</span> {direction === 'FROM_STATION' ? '도착' : '출발'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 font-medium">
                          {pot.from} → {pot.to}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pl-1">
                        <div>
                          <div className="text-[10px] text-gray-400 font-bold mb-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 모임 시간
                          </div>
                          <div className="text-xl font-black">{formatTime(pot.meetingTime)}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-1.5">
                            {[...Array(pot._count.users)].map((_, i) => (
                              <div key={i} className="w-6 h-6 rounded-full bg-kakao-yellow border-2 border-white flex items-center justify-center">
                                <UserIcon className="w-3 h-3 text-black/40" />
                              </div>
                            ))}
                            {[...Array(pot.capacity - pot._count.users)].map((_, i) => (
                              <div key={i} className="w-6 h-6 rounded-full bg-gray-100 border-2 border-dashed border-gray-300" />
                            ))}
                          </div>
                          <span className="text-xs font-black text-gray-500">{pot._count.users}/{pot.capacity}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => handleJoinPot(pot.id)}
                          disabled={isFull || isMyPot}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            isFull || isMyPot
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-kakao-yellow text-black active:bg-[#e5bb00]'
                          }`}
                        >
                          {isMyPot ? '내 팟' : isFull ? '마감됨' : '참여하기'}
                        </button>
                        <button
                          onClick={() => setActiveChatPotId(pot.id)}
                          className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold active:bg-gray-50 flex items-center gap-1"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> 채팅
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 선택 기차의 팟 */}
          <div className="mt-5 pb-28">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">선택 기차의 팟</h3>
              <span className="text-[11px] font-bold text-kakao-blue">{trainPots.length}개 대기중</span>
            </div>
            {trainPots.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gray-100">
                <CarTaxiFront className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-gray-500 font-bold text-xs">이 기차에 생성된 팟이 없습니다.</p>
                <p className="text-gray-400 text-[11px] mt-1">하단 버튼으로 첫 팟을 만들어보세요!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {trainPots.map((pot) => {
                  const isFull = pot._count.users >= pot.capacity;
                  const isMyPot = pot.users?.some((u: any) => u.userId === session?.user?.id);
                  return (
                    <div key={pot.id} className={`bg-white rounded-2xl p-5 shadow-sm border relative overflow-hidden ${isMyPot ? 'border-kakao-blue/30' : 'border-gray-100'}`}>
                      {isMyPot && <div className="absolute top-0 left-0 w-1 h-full bg-kakao-blue rounded-l-2xl" />}
                      {isFull && <div className="absolute top-0 right-0 bg-red-50 text-red-500 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-b border-l border-red-100">마감</div>}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="text-[11px] font-bold text-gray-500 flex items-center gap-1 mb-1">
                            <Clock className="w-3.5 h-3.5" /> 모임 시간
                          </div>
                          <div className="text-2xl font-black">{formatTime(pot.meetingTime)}</div>
                        </div>
                        <div className="text-right mt-1">
                          <div className="flex items-center gap-1.5 justify-end mb-1">
                            <span className="text-[11px] font-bold text-gray-500">모집인원</span>
                            <span className="text-sm font-black">{pot._count.users}<span className="text-gray-300 mx-0.5">/</span>{pot.capacity}</span>
                          </div>
                          <div className="flex -space-x-1.5 justify-end">
                            {[...Array(pot._count.users)].map((_, i) => (
                              <div key={i} className="w-7 h-7 rounded-full bg-kakao-yellow border-2 border-white flex items-center justify-center">
                                <UserIcon className="w-4 h-4 text-black/40" />
                              </div>
                            ))}
                            {[...Array(pot.capacity - pot._count.users)].map((_, i) => (
                              <div key={i} className="w-7 h-7 rounded-full bg-gray-100 border-2 border-dashed border-gray-300" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => handleJoinPot(pot.id)}
                          disabled={isFull || isMyPot}
                          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                            isFull || isMyPot
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-kakao-yellow text-black active:bg-[#e5bb00]'
                          }`}
                        >
                          {isMyPot ? '내 팟' : isFull ? '마감됨' : '팟 참여하기'}
                        </button>
                        <button
                          onClick={() => setActiveChatPotId(pot.id)}
                          className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold active:bg-gray-50 flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-4 h-4" /> 채팅
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* GLOBAL OPEN CHAT FLOATING BUTTON */}
      <button
        onClick={() => setActiveChatPotId('GLOBAL_OPEN_CHAT')}
        className="absolute bottom-[92px] right-4 z-40 w-14 h-14 bg-[#1E2B4D] text-white rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center active:scale-95 transition-transform"
      >
        <MessageCircle className="w-6 h-6 fill-current text-white" />
        <div className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full border-2 border-white flex items-center justify-center">
          N
        </div>
      </button>

      {/* BOTTOM FLOATING ACTION BAR */}
      <div className="absolute bottom-6 left-4 right-4 z-40">
        <button 
          onClick={() => setIsBottomSheetOpen(true)}
          className="w-full bg-[#1c1c1e] text-kakao-yellow h-14 rounded-2xl text-[15px] font-black flex items-center justify-center gap-2 shadow-[0_8px_16px_rgba(0,0,0,0.2)] active:scale-[0.98] transition-transform"
        >
          <Plus className="w-5 h-5" strokeWidth={3} /> 새로운 팟 만들기
        </button>
      </div>

      {/* LEAVE CONFIRM MODAL */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-3xl p-6 mx-4 max-w-sm w-full shadow-2xl">
            <h2 className="font-black text-lg text-gray-900 mb-2">팟에서 나가기</h2>
            <p className="text-sm text-gray-500 mb-6">이 팟에서 나가시겠습니까? 나가면 다시 참여해야 합니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm">
                취소
              </button>
              <button onClick={handleLeavePot} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm">
                나가기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHAT PANEL FULL SCREEN OVERLAY */}
      <div className={`absolute inset-0 z-50 bg-kakao-bg flex flex-col transition-transform duration-300 ease-in-out transform ${
        activeChatPotId ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <header className="bg-white px-4 py-3 border-b flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => { setActiveChatPotId(null); setShowSettlement(false); }} className="p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-full">
              <ChevronRight className="w-6 h-6 rotate-180" />
            </button>
            <div>
              <h2 className="font-bold text-gray-900 leading-tight">
                {activeChatPotId === 'GLOBAL_OPEN_CHAT' ? '켄택시 자유 오픈채팅' : '팟 채팅방'}
              </h2>
              <p className="text-[11px] text-gray-500 font-medium">
                {activeChatPotId === 'GLOBAL_OPEN_CHAT' ? '모든 구성원과 자유롭게 대화하세요' : '실시간 위치 및 정산 조율'}
              </p>
            </div>
          </div>
          {activeChatPotId !== 'GLOBAL_OPEN_CHAT' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettlement(s => !s)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  showSettlement ? 'bg-kakao-blue text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                정산
                {settlement?.completedAt && <CheckCircle2 className="w-3 h-3 text-green-400" />}
              </button>
              {pots.find(p => p.id === activeChatPotId)?.users?.some((u: any) => u.userId === session?.user?.id) && (
                <button
                  onClick={() => setShowLeaveConfirm(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-50 text-red-500 transition-all active:bg-red-100"
                >
                  나가기
                </button>
              )}
            </div>
          )}
        </header>
        
        {/* 정산 카드 패널 */}
        {showSettlement && (
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
            {!settlement ? (
              /* 방장: 정산 등록 폼 */
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-5 h-5 text-kakao-blue" />
                  <h3 className="font-black text-base">정산 등록</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">총 택시비 (원)</label>
                    <input
                      type="number"
                      placeholder="예: 18000"
                      value={settlementForm.totalAmount}
                      onChange={e => setSettlementForm(f => ({ ...f, totalAmount: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-kakao-blue"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">은행명</label>
                    <input
                      type="text"
                      placeholder="예: 카카오뱅크"
                      value={settlementForm.accountBank}
                      onChange={e => setSettlementForm(f => ({ ...f, accountBank: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-kakao-blue"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">계좌번호</label>
                    <input
                      type="text"
                      placeholder="예: 3333-01-1234567"
                      value={settlementForm.accountNumber}
                      onChange={e => setSettlementForm(f => ({ ...f, accountNumber: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-kakao-blue"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">예금주</label>
                    <input
                      type="text"
                      placeholder="홍길동"
                      value={settlementForm.accountHolder}
                      onChange={e => setSettlementForm(f => ({ ...f, accountHolder: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-kakao-blue"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3">
                    <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                    <p className="text-[11px] text-blue-600 leading-relaxed">
                      계좌번호는 채팅 로그에 저장되지 않으며, 출발 후 7일이 지나면 자동으로 마스킹됩니다.
                    </p>
                  </div>
                  <button
                    onClick={handleSubmitSettlement}
                    disabled={!settlementForm.totalAmount || !settlementForm.accountNumber}
                    className="w-full bg-kakao-blue text-white py-3 rounded-xl font-bold text-sm disabled:opacity-40"
                  >
                    정산 등록하기
                  </button>
                </div>
              </div>
            ) : (
              /* 정산 카드 (모든 멤버 조회) */
              <div className="space-y-4">
                {/* 금액 카드 */}
                <div className="bg-kakao-blue rounded-2xl p-5 text-white">
                  <div className="text-xs font-bold opacity-60 mb-1">총 택시비</div>
                  <div className="text-3xl font-black mb-4">{settlement.totalAmount.toLocaleString()}원</div>
                  <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-sm font-bold opacity-80">1인당 금액</span>
                    <span className="text-2xl font-black text-kakao-yellow">{settlement.perPerson.toLocaleString()}원</span>
                  </div>
                </div>

                {/* 계좌 정보 */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">송금 계좌</span>
                    {settlement.isMasked && (
                      <span className="text-[10px] bg-orange-50 text-orange-500 px-2 py-0.5 rounded-full font-bold">마스킹됨</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mb-1">{settlement.accountBank} · {settlement.accountHolder}</div>
                  <div className="font-mono font-black text-xl text-gray-900">{settlement.accountNumber}</div>
                  {settlement.isMasked && (
                    <p className="text-[10px] text-orange-400 mt-2">출발 7일 이후 계좌번호가 마스킹되었습니다.</p>
                  )}
                </div>

                {/* 납부 현황 */}
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-wider">납부 현황</span>
                    <span className="text-xs font-bold text-kakao-blue">
                      {settlement.payments.length}/{settlement.memberCount}명 완료
                    </span>
                  </div>
                  <div className="space-y-2">
                    {settlement.members.map((member: any) => {
                      const paid = settlement.payments.some((p: any) => p.userId === member.id);
                      const isMe = member.id === session?.user?.id;
                      return (
                        <div key={member.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {paid
                              ? <CheckCircle2 className="w-4 h-4 text-green-500" />
                              : <Circle className="w-4 h-4 text-gray-300" />
                            }
                            <span className={`text-sm font-bold ${isMe ? 'text-kakao-blue' : 'text-gray-700'}`}>
                              {member.name || member.email?.split('@')[0]}{isMe ? ' (나)' : ''}
                            </span>
                          </div>
                          {isMe && !paid && (
                            <div className="flex gap-1.5 items-center">
                              <a
                                href={`supertoss://send?bank=${encodeURIComponent(settlement.accountBank)}&account=${encodeURIComponent(settlement.accountNumber)}&amount=${settlement.perPerson}`}
                                className="text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-0.5 active:bg-blue-700"
                              >
                                ⚡ 토스 송금
                              </a>
                              <button
                                onClick={handleTogglePay}
                                className="text-xs bg-kakao-yellow text-black px-2.5 py-1.5 rounded-lg font-bold active:bg-yellow-400"
                              >
                                납부 완료
                              </button>
                            </div>
                          )}
                          {isMe && paid && (
                            <button
                              onClick={handleTogglePay}
                              className="text-xs bg-gray-100 text-gray-400 px-3 py-1.5 rounded-lg font-bold"
                            >
                              취소
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {settlement.completedAt && (
                  <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <p className="text-xs text-green-600 font-bold">전원 납부 완료 🎉</p>
                  </div>
                )}

                {settlement.isCreator && (
                  <button
                    onClick={() => { setSettlement(null); setSettlementForm({ totalAmount: '', accountBank: '', accountNumber: '', accountHolder: '' }); }}
                    className="w-full text-xs text-gray-400 py-2 hover:text-gray-600"
                  >
                    정산 정보 수정하기
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div ref={chatScrollRef} className={`overflow-y-auto p-4 space-y-4 bg-[#b2c7d9] ${showSettlement ? 'hidden' : 'flex-1'}`}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
              <MessageCircle className="w-12 h-12 text-black/20 mb-2" />
              <p className="text-xs font-bold text-black/40">
                {activeChatPotId === 'GLOBAL_OPEN_CHAT' ? '자유롭게 동승자를 구해보세요!' : '메시지를 보내보세요. 동승자가 참여하면 함께 대화할 수 있어요.'}
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              if (msg.content.startsWith('__JOIN__')) {
                const name = msg.content.slice(8);
                return (
                  <div key={msg.id} className="flex items-center justify-center">
                    <span className="text-xs text-gray-400 bg-black/5 px-3 py-1 rounded-full">
                      👋 {name}님이 팟에 참여했습니다
                    </span>
                  </div>
                );
              }

              const isMe = msg.userId === session?.user?.id;
              const showAvatar = !isMe && (i === 0 || messages[i-1].userId !== msg.userId);

              return (
                <div key={msg.id} className={`flex gap-2 max-w-[80%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}>
                  {!isMe && (
                    <div className="w-8 h-8 rounded-full bg-white/20 shrink-0 overflow-hidden mt-1">
                      {showAvatar && (
                        msg.user?.image ? <img src={msg.user.image} alt="" className="w-full h-full object-cover"/> :
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {showAvatar && <span className="text-xs text-gray-600 font-bold mb-1 ml-1">{msg.user?.name || msg.user?.email?.split('@')[0]}</span>}
                    <div className={`px-3 py-2 rounded-2xl text-[14px] shadow-sm ${isMe ? 'bg-[#1e40af] text-white rounded-tr-sm' : 'bg-white text-black rounded-tl-sm'}`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-1 mx-1">
                      {new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        <form onSubmit={sendMessage} className={`p-2 px-3 bg-white border-t flex gap-2 items-end shrink-0 safe-bottom ${showSettlement ? 'hidden' : ''}`}>
          <div className="flex-1 bg-gray-100 rounded-2xl min-h-[40px] px-3 py-2 flex items-center">
            <input 
              type="text" 
              placeholder={session ? "메시지 입력..." : "로그인 후 이용 가능합니다."} 
              disabled={!session}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full bg-transparent text-sm text-black focus:outline-none" 
            />
          </div>
          <button 
            type="submit"
            disabled={!session || !newMessage.trim()}
            className="w-10 h-10 bg-kakao-yellow text-black rounded-full flex items-center justify-center shrink-0 disabled:bg-gray-200 disabled:text-gray-400"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>

      {/* BOTTOM SHEET OVERLAY */}
      <div className={`absolute inset-0 z-[100] transition-opacity duration-300 ${isSheetOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsBottomSheetOpen(false)} />
        <div className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-6 pb-10 transition-transform duration-400 cubic-bezier-[0.32,0.72,0,1] transform ${isSheetOpen ? 'translate-y-0' : 'translate-y-full'}`}>
          <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
          
          <h3 className="text-[22px] font-black mb-1 text-gray-900">팟 생성하기</h3>
          <p className="text-sm text-gray-500 font-medium mb-6">동승할 팟을 만들고 멤버를 모집해보세요.</p>
          
          <div className="bg-kakao-bg rounded-2xl p-5 space-y-4 mb-6 border border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-bold">선택된 열차</span>
              <span className="font-black text-gray-900 flex items-center gap-1.5">
                <div className={`text-[10px] px-1.5 py-0.5 rounded text-white ${selectedTrain?.type === 'SRT' ? 'bg-[#502845]' : 'bg-[#003B8D]'}`}>
                  {selectedTrain?.type}
                </div>
                {selectedTrain?.number}
              </span>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-bold">{direction === 'FROM_STATION' ? '기차 도착 (나주)' : '기차 출발'}</span>
              <span className="font-black text-gray-900">{selectedTrain && formatTime(selectedTrain.departureTime)}</span>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-bold">탑승(모임) 시간</span>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  {direction === 'FROM_STATION' ? `도착 후 ${meetingOffsetMins}분` : `출발 ${meetingOffsetMins}분 전`}
                </span>
              </div>
              {/* Drum Roll Picker */}
              <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => {
                  const idx = TIME_OFFSETS.indexOf(meetingOffsetMins);
                  if (idx > 0) {
                    pickerRef.current?.scrollBy({ top: -ITEM_HEIGHT, behavior: 'smooth' });
                  }
                }}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
              >
                ▲
              </button>
              <div className="relative h-[240px] overflow-hidden rounded-2xl bg-gray-50 w-full">
                {/* Top fade */}
                <div className="absolute top-0 inset-x-0 h-[96px] bg-gradient-to-b from-gray-50 via-gray-50/80 to-transparent z-10 pointer-events-none" />
                {/* Bottom fade */}
                <div className="absolute bottom-0 inset-x-0 h-[96px] bg-gradient-to-t from-gray-50 via-gray-50/80 to-transparent z-10 pointer-events-none" />
                {/* Center highlight band */}
                <div className="absolute top-1/2 inset-x-4 h-[48px] -translate-y-1/2 bg-[#1c1c1e]/8 border-y border-gray-200 z-0 rounded-lg" />

                <div
                  ref={pickerRef}
                  className="h-full overflow-y-scroll no-scrollbar"
                  style={{ scrollSnapType: 'y mandatory' }}
                  onScroll={handlePickerScroll}
                >
                  {/* top padding */}
                  <div style={{ height: 96 }} />
                  {TIME_OFFSETS.map(mins => {
                    const offsetSign = direction === 'FROM_STATION' ? 1 : -1;
                    const meetingTime = selectedTrain
                      ? formatTime(new Date(new Date(selectedTrain.departureTime).getTime() + offsetSign * mins * 60000).toISOString())
                      : '--:--';
                    const isSelected = meetingOffsetMins === mins;
                    return (
                      <div
                        key={mins}
                        style={{ scrollSnapAlign: 'center', height: 48 }}
                        className="flex items-center justify-center gap-4"
                      >
                        <span className={`font-black transition-all duration-150 ${isSelected ? 'text-3xl text-[#1c1c1e]' : 'text-lg text-gray-300'}`}>
                          {meetingTime}
                        </span>
                        <span className={`font-bold transition-all duration-150 ${isSelected ? 'text-sm text-gray-500' : 'text-xs text-gray-200'}`}>
                          {direction === 'FROM_STATION' ? `+${mins}분` : `-${mins}분`}
                        </span>
                      </div>
                    );
                  })}
                  {/* bottom padding */}
                  <div style={{ height: 96 }} />
                </div>
              </div>
              <button
                onClick={() => {
                  const idx = TIME_OFFSETS.indexOf(meetingOffsetMins);
                  if (idx < TIME_OFFSETS.length - 1) {
                    pickerRef.current?.scrollBy({ top: ITEM_HEIGHT, behavior: 'smooth' });
                  }
                }}
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 active:scale-95 transition-all"
              >
                ▼
              </button>
              </div>
            </div>
          </div>

          <button 
            onClick={handleCreatePot}
            className="w-full bg-[#1c1c1e] text-kakao-yellow h-[56px] rounded-2xl font-black text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-lg shadow-gray-200"
          >
            <Check className="w-5 h-5" strokeWidth={3} /> 팟 생성 확정
          </button>
        </div>
      </div>
    </div>
  );
}
