'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function ChatPage() {
  const params = useParams();
  const roomId = params?.id as string;
  const router = useRouter();
  const { data: session } = useSession();
  
  const [pot, setPot] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchPot() {
      const res = await fetch(`/api/pots/${roomId}`);
      if (res.ok) {
        const data = await res.json();
        setPot(data);
      }
    }
    if (roomId) fetchPot();
  }, [roomId]);

  useEffect(() => {
    if (!session?.user) return;

    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    if (roomId) {
      newSocket.emit('join_room', roomId);
    }

    newSocket.on('receive_message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, session]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() && socket && roomId && session?.user) {
      const data = {
        roomId,
        message: input,
        senderName: session.user.name || '알 수 없음',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      };
      socket.emit('send_message', data);
      setInput('');
    }
  };

  const leavePot = async () => {
    const res = await fetch(`/api/pots/${roomId}/leave`, { method: 'DELETE' });
    if (res.ok) {
      router.push('/');
    }
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  if (!pot) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans text-gray-900">
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 mx-4 max-w-sm w-full shadow-2xl">
            <h2 className="font-black text-lg text-gray-900 mb-2">팟에서 나가기</h2>
            <p className="text-sm text-gray-500 mb-6">이 팟에서 나가시겠습니까? 나가면 다시 참여해야 합니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLeaveConfirm(false)} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-all">
                취소
              </button>
              <button onClick={leavePot} className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all">
                나가기
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="px-6 py-4 border-b bg-white flex items-center gap-4 sticky top-0 z-10 shadow-sm">
        <button onClick={() => router.push('/')} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-gray-900 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="flex-1">
          <h1 className="font-black text-lg leading-tight tracking-tight">
            {pot.trainType} {pot.trainNumber} 팟
          </h1>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">
            Meeting at {formatTime(pot.meetingTime)} • {pot._count.users}/{pot.capacity} Users
          </p>
        </div>
        <button onClick={() => setShowLeaveConfirm(true)} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-red-50 text-red-400 hover:text-red-600 transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>
      </header>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6"
      >
        <div className="text-center space-y-2 py-4">
          <div className="inline-block px-4 py-1.5 bg-gray-200/50 rounded-full">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Party Created • {new Date(pot.createdAt).toLocaleDateString()}
            </p>
          </div>
          <p className="text-xs text-gray-400 font-medium">
            동승자들과 대화를 나눠보세요!
          </p>
        </div>

        {messages.map((msg, index) => {
          const isMe = msg.senderName === session?.user?.name;
          return (
            <div 
              key={index} 
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className="flex items-center gap-2 mb-1.5 px-1">
                {!isMe && <div className="w-4 h-4 rounded-md bg-blue-100 flex items-center justify-center text-[8px] font-black text-blue-600">U</div>}
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{msg.senderName}</span>
                {isMe && <div className="w-4 h-4 rounded-md bg-gray-900 flex items-center justify-center text-[8px] font-black text-white">ME</div>}
              </div>
              <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`px-5 py-3 rounded-3xl text-sm font-bold max-w-[260px] shadow-sm ${
                  isMe
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-100'
                    : 'bg-white text-black rounded-tl-none border border-gray-100'
                }`}>
                  {msg.message}
                </div>
                <span className="text-[8px] font-black text-gray-300 mb-1">{msg.timestamp}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-6 bg-white border-t border-gray-100 pb-10">
        <div className="max-w-xl mx-auto flex gap-3 items-center">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="메시지를 입력하세요..."
              className="w-full bg-gray-100 rounded-[2rem] px-6 py-4 text-sm font-bold text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-300"
            />
          </div>
          <button 
            onClick={sendMessage}
            disabled={!input.trim()}
            className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-xl transition-all active:scale-90 ${
              input.trim() 
                ? 'bg-blue-600 text-white shadow-blue-200' 
                : 'bg-gray-100 text-gray-300 shadow-none cursor-not-allowed'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 rotate-45 -translate-y-0.5">
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
