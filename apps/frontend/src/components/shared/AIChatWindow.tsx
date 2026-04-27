'use client';

import React from 'react';
import { Drawer, Button, Input, Tooltip } from 'antd';
import {
    Sparkles,
    Send,
    Bot,
    User,
    Loader2,
    ExternalLink,
    Trash2,
    X
} from 'lucide-react';
import { cn } from '@smart/lib/utils';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { autoRequest } from '../../services/auto.request';
import { useUserStore } from '@smart/store/user';
import UserAvatar from '@smart/components/ui/UserAvatar';

interface Message {
    role: 'user' | 'ai';
    content: string;
    sources?: { id: string; title: string }[];
    timestamp: string;
}

export function AIChatWindow({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const router = useRouter();
    const { currentUser } = useUserStore();
    const meId = currentUser?.id || "";

    const [messages, setMessages] = React.useState<Message[]>([
        {
            role: 'ai',
            content: 'Chào bạn! Tôi là Smart AI Assistant. Tôi có thể giúp bạn giải đáp thắc mắc về nội dung trên website hoặc hỗ trợ kỹ thuật. Bạn cần giúp gì không?',
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [input, setInput] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async (customQuery?: string) => {
        const userQuery = (customQuery || input).trim();
        if (!userQuery || loading) return;

        setInput('');
        const timestamp = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev, { role: 'user', content: userQuery, timestamp }]);
        setLoading(true);

        try {
            const data = await autoRequest<any>('/projects/ai-chat', {
                method: 'POST',
                body: JSON.stringify({ question: userQuery })
            });

            if (data.success) {
                setMessages(prev => [...prev, {
                    role: 'ai',
                    content: data.answer,
                    sources: data.sources,
                    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'ai',
                    content: data.message || 'Xin lỗi, tôi gặp sự cố khi xử lý câu hỏi của bạn.',
                    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'ai',
                content: 'Không thể kết nối với máy chủ AI. Vui lòng thử lại sau.',
                timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            }]);
        } finally {
            setLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([{
            role: 'ai',
            content: 'Lịch sử chat đã được xóa. Tôi có thể giúp gì thêm cho bạn?',
            timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }]);
    };

    return (
        <Drawer
            title={
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                        <Sparkles size={18} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider leading-none mb-1">Smart AI Assistant</h3>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-widest">Trực tuyến</span>
                        </div>
                    </div>
                </div>
            }
            placement="right"
            width={450}
            onClose={onClose}
            open={isOpen}
            extra={
                <Tooltip title="Xóa lịch sử chat">
                    <Button
                        type="text"
                        icon={<Trash2 size={16} className="text-gray-400" />}
                        onClick={clearChat}
                        className="hover:text-red-500"
                    />
                </Tooltip>
            }
            closeIcon={<X size={18} className="text-gray-400" />}
            styles={{
                body: { padding: 0, display: 'flex', flexDirection: 'column' },
                header: { borderBottom: '1px solid rgba(0,0,0,0.05)' },
                content: {
                    borderRadius: '24px 0 0 24px',
                    overflow: 'hidden',
                    borderLeft: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '-10px 0 30px rgba(0,0,0,0.02)'
                }
            }}
            className="ai-chat-drawer dark:!text-white"
            rootClassName="dark:!bg-transparent"
            classNames={{
                wrapper: "border-l border-gray-200 dark:border-neutral-800 shadow-2xl ring-1 ring-black/5 dark:ring-white/5"
            }}
        >
            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30 dark:bg-black/20 custom-scrollbar"
            >
                {messages.map((msg, i) => (
                    <motion.div
                        initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={i}
                        className={cn(
                            "flex gap-3",
                            msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 shrink-0",
                            msg.role === 'user' ? "" : "bg-blue-600 rounded-full flex items-center justify-center shadow-sm"
                        )}>
                            {msg.role === 'user' ? (
                                <UserAvatar userId={meId} size="xs" allowChangeMood={false} />
                            ) : (
                                <Bot size={14} className="text-white" />
                            )}
                        </div>
                        <div className={cn(
                            "max-w-[85%] space-y-2",
                            msg.role === 'user' ? "items-end" : "items-start"
                        )}>
                            <div className={cn(
                                "p-4 rounded-3xl text-[13px] leading-relaxed shadow-sm border",
                                msg.role === 'user'
                                    ? "bg-blue-600 text-white rounded-tr-none border-blue-500/20"
                                    : "bg-white dark:bg-neutral-900 text-gray-700 dark:text-neutral-300 rounded-tl-none border-gray-100 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/5"
                            )}>
                                {msg.content}

                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Nguồn tham khảo:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {msg.sources.map((s, si) => (
                                                <div
                                                    key={si}
                                                    onClick={() => {
                                                        router.push(`/news/${s.id}`);
                                                        onClose(); // Hide chat immediately
                                                    }}
                                                    className="bg-gray-50 dark:bg-black/40 px-2 py-1 rounded-lg border border-gray-100 dark:border-white/5 flex items-center gap-1 text-[9px] font-bold text-blue-500 hover:bg-blue-600 hover:text-white transition-all cursor-pointer group/source shadow-sm hover:shadow-md"
                                                >
                                                    <ExternalLink size={10} className="group-hover/source:scale-110 transition-transform" />
                                                    <span className="truncate max-w-[120px]">{s.title}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <p className={cn(
                                "text-[9px] font-bold text-gray-400 dark:text-neutral-600 uppercase tracking-widest px-1",
                                msg.role === 'user' ? "text-right" : "text-left"
                            )}>
                                {msg.timestamp}
                            </p>
                        </div>
                    </motion.div>
                ))}
                {loading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                            <Bot size={14} className="text-white" />
                        </div>
                        <div className="bg-white dark:bg-neutral-900 p-4 rounded-3xl rounded-tl-none shadow-sm border border-gray-100 dark:border-white/5">
                            <Loader2 size={16} className="animate-spin text-blue-600" />
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white dark:bg-[#080808] border-t border-gray-100 dark:border-white/5">
                <div className="mb-4 flex flex-wrap gap-2">
                    {["Tin tức AI mới nhất?", "Tóm tắt website?", "Dịch vụ AI?"].map((q, i) => (
                        <button
                            key={i}
                            onClick={() => handleSend(q)}
                            disabled={loading}
                            className="px-3 py-1.5 rounded-full bg-blue-500/5 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold hover:bg-blue-500 hover:text-white transition-all border border-blue-500/10 cursor-pointer"
                        >
                            {q}
                        </button>
                    ))}
                </div>

                <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="relative"
                >
                    <Input.TextArea
                        autoSize={{ minRows: 1, maxRows: 6 }}
                        placeholder="Bạn muốn hỏi gì về Smart Collab..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={loading}
                        onPressEnter={(e) => {
                            if (!e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        className="w-full !bg-gray-50 dark:!bg-neutral-900 !border-none !ring-1 !ring-gray-200 dark:!ring-neutral-800 !rounded-2xl !pl-4 !pr-14 !py-3 !text-sm focus:!ring-2 focus:!ring-blue-500/50 transition-all outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className={cn(
                            "absolute right-2.5 bottom-2.5 w-9 h-9 rounded-xl flex items-center justify-center transition-all",
                            input.trim() && !loading ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-105" : "bg-gray-200 dark:bg-neutral-800 text-gray-400"
                        )}
                    >
                        <Send size={16} />
                    </button>
                </form>
                <p className="mt-4 text-[10px] text-center text-gray-400 font-bold uppercase tracking-tight opacity-50">
                    Smart AI có thể đưa ra câu trả lời không chính xác.
                </p>
            </div>

            <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.4);
        }
      `}</style>
        </Drawer>
    );
}
