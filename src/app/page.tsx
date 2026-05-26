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
  ChevronRight
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

  const dateScrollRef = useRef<HTMLDivElement>(null);
  const trainScrollRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

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
        if (res.ok) setPots(await res.json());
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
      const meetingTime = new Date(new Date(train.departureTime).getTime() - meetingOffsetMins * 60000).toISOString();
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
        if (potsRes.ok) setPots(await potsRes.json());
        setTimeout(() => setActiveChatPotId(pot.id), 350);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinPot = async (potId: string) => {
    if (!session) return;
    try {
      const res = await fetch(`/api/pots/${potId}/join`, { method: 'POST' });
      if (res.ok) {
        const potsRes = await fetch('/api/pots');
        if (potsRes.ok) setPots(await potsRes.json());
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

  return (
    <div className="h-[100dvh] flex flex-col bg-kakao-bg text-foreground overflow-hidden font-sans select-none relative max-w-md mx-auto shadow-2xl">
      
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

        {/* POT LIST (Vertical Scroll) */}
        <section className="flex-1 overflow-y-auto p-4 bg-kakao-bg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm">현재 생성된 팟</h3>
            <span className="text-[11px] font-bold text-kakao-blue">{trainPots.length}개의 팟 대기중</span>
          </div>
          
          <div className="space-y-4 pb-20">
            {trainPots.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100 mt-4">
                <CarTaxiFront className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-bold text-sm">현재 이 기차에 생성된 팟이 없습니다.</p>
                <p className="text-gray-400 text-xs mt-1">하단의 팟 만들기 버튼을 눌러 첫 팟을 만들어보세요!</p>
              </div>
            ) : (
              trainPots.map((pot) => {
                const isFull = pot._count.users >= pot.capacity;
                const statusColor = pot._count.users === 3 ? 'bg-orange-400' : isFull ? 'bg-red-500' : 'bg-green-500';
                return (
                  <div key={pot.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
                    {isFull && <div className="absolute top-0 right-0 bg-red-50 text-red-500 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-b border-l border-red-100">마감</div>}
                    
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-[11px] font-bold text-gray-500 flex items-center gap-1 mb-1">
                          <Clock className="w-3.5 h-3.5" /> 학교 출발 시간
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

                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                      <button 
                        onClick={() => handleJoinPot(pot.id)}
                        disabled={isFull || pot.users?.some((u: any) => u.userId === session?.user?.id)}
                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                          isFull || pot.users?.some((u: any) => u.userId === session?.user?.id)
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'bg-kakao-yellow text-black active:bg-[#e5bb00]'
                        }`}
                      >
                        {pot.users?.some((u: any) => u.userId === session?.user?.id) ? '참여 완료' : isFull ? '마감됨' : '팟 참여하기'}
                      </button>
                      <button 
                        onClick={() => setActiveChatPotId(pot.id)}
                        className="px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold active:bg-gray-50 transition-all flex items-center gap-1.5"
                      >
                        <MessageCircle className="w-4 h-4" /> 채팅
                      </button>
                    </div>
                  </div>
                )
              })
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

      {/* CHAT PANEL FULL SCREEN OVERLAY */}
      <div className={`absolute inset-0 z-50 bg-kakao-bg flex flex-col transition-transform duration-300 ease-in-out transform ${
        activeChatPotId ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <header className="bg-white px-4 py-3 border-b flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveChatPotId(null)} className="p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-full">
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
        </header>
        
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#b2c7d9]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
              <MessageCircle className="w-12 h-12 text-black/20 mb-2" />
              <p className="text-xs font-bold text-black/40">
                {activeChatPotId === 'GLOBAL_OPEN_CHAT' ? '자유롭게 동승자를 구해보세요!' : '동승자와 대화를 시작해보세요'}
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
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
                    <div className={`px-3 py-2 rounded-2xl text-[14px] shadow-sm ${isMe ? 'bg-kakao-yellow text-black rounded-tr-sm' : 'bg-white text-black rounded-tl-sm'}`}>
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
        
        <form onSubmit={sendMessage} className="p-2 px-3 bg-white border-t flex gap-2 items-end shrink-0 safe-bottom">
          <div className="flex-1 bg-gray-100 rounded-2xl min-h-[40px] px-3 py-2 flex items-center">
            <input 
              type="text" 
              placeholder={session ? "메시지 입력..." : "로그인 후 이용 가능합니다."} 
              disabled={!session}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none" 
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
              <span className="text-gray-500 font-bold">기차 출발</span>
              <span className="font-black text-gray-900">{selectedTrain && formatTime(selectedTrain.departureTime)}</span>
            </div>
            <div className="h-px bg-gray-200" />
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-bold">탑승(모임) 시간</span>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">출발 {meetingOffsetMins}분 전</span>
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
                    const meetingTime = selectedTrain
                      ? formatTime(new Date(new Date(selectedTrain.departureTime).getTime() - mins * 60000).toISOString())
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
                          -{mins}분
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
