'use client';

import { useEffect, useRef, useState } from 'react';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Input, Button, List, Spin } from 'antd';
import { useUserStore } from '@smart/store/user';
import { getProjectSocketManager } from '@smart/store/realtime';
import { autoRequest } from '@smart/services/auto.request';

interface Message {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  content: string;
  createdAt: string;
}

export default function ProjectChat({ projectId }: { projectId: string }) {
  const { currentUser } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await autoRequest<{ success: boolean; data: Message[] }>(`/projects/${projectId}/chat`, { method: 'GET' });
        if (res.success) {
          setMessages(res.data.reverse());
        }
      } catch (err) {
        console.error('Failed to fetch messages', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    const socketManager = getProjectSocketManager();
    const unsub = socketManager.subscribe('realtime.project.chat', (data: any) => {
      if (data.projectId === projectId) {
        setMessages((prev) => [...prev, data.message]);
      }
    });

    return () => unsub();
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const onSend = async () => {
    if (!input.trim() || !currentUser) return;
    const content = input;
    setInput('');

    try {
      await autoRequest(`/projects/${projectId}/chat`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          userName: `${currentUser.firstName} ${currentUser.lastName || ''}`.trim(),
          userAvatar: currentUser.avatar,
        }),
      });
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/5">
      <div className="p-4 border-b border-white/20 dark:border-white/5 font-bold flex items-center gap-2">
        <span>Project Chat</span>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-4">
            <Spin size="small" />
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === currentUser?.id;
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                <Avatar src={msg.avatar} icon={<UserOutlined />} size="small" />
                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : ''}`}>
                  <div className="text-[10px] opacity-50 mb-1 px-1">{msg.userName}</div>
                  <div
                    className={`px-3 py-2 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white/20 dark:bg-white/10 text-black dark:text-white rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-white/20 dark:border-white/5 flex gap-2">
        <Input
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={onSend}
          className="bg-white/5 border-white/20 dark:border-white/10 dark:text-white"
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={onSend}
          disabled={!input.trim()}
          className="bg-blue-600 border-none"
        />
      </div>
    </div>
  );
}
