'use client';

import React from 'react';
import { Drawer, Button, Input } from 'antd';
import { RobotOutlined, ClearOutlined, SendOutlined } from '@ant-design/icons';
import { motion as framerMotion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import dayjs from 'dayjs';

interface ChatMessage {
    role: 'user' | 'ai';
    content: string;
    timestamp: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    chatHistory: ChatMessage[];
    chatLoading: boolean;
    userQuery: string;
    setUserQuery: (val: string) => void;
    onSend: (query?: string) => void;
    onClear: () => void;
    theme: 'light' | 'dark';
}

const AiChatDrawer: React.FC<Props> = ({
    isOpen, onClose, chatHistory, chatLoading, userQuery, setUserQuery, onSend, onClear, theme
}) => {
    return (
        <Drawer
            title={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                        <RobotOutlined size={20} />
                    </div>
                    <div>
                        <div className="text-sm font-[900] dark:text-white leading-none mb-1">Trợ lý AI</div>
                        <div className="text-[10px] opacity-40 font-bold uppercase tracking-widest flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Công cụ phân tích thông minh
                        </div>
                    </div>
                </div>
            }
            placement="right"
            width={450}
            onClose={onClose}
            open={isOpen}
            extra={<Button icon={<ClearOutlined />} type="text" onClick={onClear} />}
            styles={{
                body: { padding: '0', display: 'flex', flexDirection: 'column', background: theme === 'dark' ? '#0a0a0b' : '#f8f9fa' },
                header: { borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)' }
            }}
        >
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
                {chatHistory.map((msg, idx) => (
                    <framerMotion.div
                        initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : ''}`}>
                            <div className={`p-4 rounded-3xl ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-zinc-900 shadow-md rounded-tl-none border dark:border-white/5'
                                }`}>
                                <div className={`prose prose-sm ${msg.role === 'user' ? 'prose-invert' : 'dark:prose-invert'} max-w-none`}>
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                            <div className={`mt-1 text-[9px] opacity-40 font-bold ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                {msg.timestamp}
                            </div>
                        </div>
                    </framerMotion.div>
                ))}
                {chatLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl rounded-tl-none shadow-md border dark:border-white/5">
                            <div className="flex gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-6 bg-white dark:bg-zinc-950 border-t dark:border-white/5">
                <div className="mb-4 flex flex-wrap gap-2">
                    {["Tiến độ tổng quát?", "Ai đang quá tải?", "Công việc gấp?"].map((q, i) => (
                        <button
                            key={i}
                            onClick={() => onSend(q)}
                            disabled={chatLoading}
                            className="px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-bold hover:bg-indigo-500 hover:text-white transition-all border-none cursor-pointer"
                        >
                            {q}
                        </button>
                    ))}
                </div>
                <div className="flex gap-3">
                    <Input.TextArea
                        autoSize={{ minRows: 1, maxRows: 4 }}
                        value={userQuery}
                        onChange={e => setUserQuery(e.target.value)}
                        placeholder="Hỏi AI về thống kê chi tiết..."
                        onPressEnter={(e) => {
                            if (!e.shiftKey) {
                                e.preventDefault();
                                onSend();
                            }
                        }}
                        className="rounded-2xl border-none shadow-inner bg-gray-100 dark:bg-zinc-900"
                    />
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        loading={chatLoading}
                        onClick={() => onSend()}
                        className="h-full rounded-2xl aspect-square flex items-center justify-center bg-blue-600 hover:scale-105"
                    />
                </div>
            </div>
        </Drawer>
    );
};

export default AiChatDrawer;
