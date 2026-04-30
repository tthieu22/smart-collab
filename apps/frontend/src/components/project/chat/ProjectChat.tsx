'use client';

import { useEffect, useRef, useState } from 'react';
import {
  SendOutlined,
  UserOutlined,
  PaperClipOutlined,
  SmileOutlined,
  CloseOutlined,
  FileOutlined,
  RollbackOutlined
} from '@ant-design/icons';
import { Avatar, Button, Spin, Mentions, Popover, Tooltip, Upload, message, Image } from 'antd';
import { useUserStore } from '@smart/store/user';
import { getProjectSocketManager } from '@smart/store/realtime';
import { autoRequest } from '@smart/services/auto.request';

const { Option } = Mentions;

interface Message {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  content: string;
  type: string;
  parentId?: string;
  replyTo?: Message;
  attachments?: any[];
  metadata?: any;
  createdAt: string;
}

interface ProjectMember {
  userId: string;
  userName: string;
  userAvatar?: string;
}

export default function ProjectChat({ projectId }: { projectId: string }) {
  const { currentUser } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);
  const LIMIT = 20;

  const emojis = ['😊', '😂', '👍', '❤️', '🔥', '🚀', '⭐', '😮', '😢', '💯'];

  const fetchMessages = async (isInitial = false) => {
    if (loading || (loadingMore && !isInitial)) return;
    
    if (isInitial) setLoading(true);
    else setLoadingMore(true);

    try {
      const currentSkip = isInitial ? 0 : messages.length;
      const res = await autoRequest<{ success: boolean; data: Message[] }>(
        `/projects/${projectId}/chat?skip=${currentSkip}&limit=${LIMIT}`, 
        { method: 'GET' }
      );
      
      if (res.success) {
        // Sort ASC (oldest to newest)
        const newMsgs = [...res.data].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        if (isInitial) {
          setMessages(newMsgs);
          setHasMore(newMsgs.length >= LIMIT);
        } else {
          // Prepend older messages
          const scrollContainer = scrollRef.current;
          const oldScrollHeight = scrollContainer?.scrollHeight || 0;
          
          setMessages(prev => [...newMsgs, ...prev]);
          setHasMore(res.data.length >= LIMIT);

          // Preserve scroll position after DOM update
          setTimeout(() => {
            if (scrollContainer) {
              const newScrollHeight = scrollContainer.scrollHeight;
              scrollContainer.scrollTop = newScrollHeight - oldScrollHeight;
            }
          }, 0);
        }
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      await fetchMessages(true);
      
      // Fetch project members for mentions
      try {
        const memberRes = await autoRequest<{ success: boolean; data: { members: any[] } }>(`/projects/get`, {
          method: 'POST',
          body: JSON.stringify({ id: projectId })
        });
        if (memberRes.success && memberRes.data.members) {
          setMembers(memberRes.data.members.map((m: any) => ({
            userId: m.userId,
            userName: m.userName || 'Unknown',
            userAvatar: m.userAvatar
          })));
        }
      } catch (e) {
        console.error('Failed to fetch members', e);
      }
    };

    initData();

    const socketManager = getProjectSocketManager();
    const unsub = socketManager.subscribe('realtime.project.chat', (data: any) => {
      if (data.projectId === projectId) {
        setMessages((prev) => [...prev, data.message]);
      }
    });

    return () => unsub();
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current && isInitialLoad.current && messages.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isInitialLoad.current = false;
    }
  }, [messages]);

  const handleScroll = () => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0 && hasMore && !loadingMore) {
      fetchMessages(false);
    }
  };

  const onFileUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    setUploading(true);
    const formData = new FormData();
    formData.append('files', file);
    formData.append('action', 'upload');
    formData.append('projectFolder', projectId);

    try {
      const res = await autoRequest<{ success: boolean; data: any[] }>('/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (res.success) {
        setAttachments(prev => [...prev, ...res.data]);
        onSuccess(res.data);
      } else {
        message.error('Upload failed: ' + (res as any).data);
        onError(res.data);
      }
    } catch (err) {
      console.error(err);
      message.error('Upload error');
      onError(err);
    } finally {
      setUploading(false);
    }
  };

  const onSend = async () => {
    if ((!input.trim() && attachments.length === 0) || !currentUser) return;

    const content = input;
    const currentAttachments = [...attachments];
    const currentReplyTo = replyingTo;

    setInput('');
    setAttachments([]);
    setReplyingTo(null);

    try {
      await autoRequest(`/projects/${projectId}/chat`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          userName: `${currentUser.firstName} ${currentUser.lastName || ''}`.trim(),
          userAvatar: currentUser.avatar,
          type: currentAttachments.length > 0 ? 'FILE' : 'TEXT',
          parentId: currentReplyTo?.id,
          attachments: currentAttachments,
          metadata: {
            taggedUserIds: members.filter(m => content.includes(`@${m.userName}`)).map(m => m.userId)
          }
        }),
      });
    } catch (err) {
      console.error('Failed to send message', err);
      message.error('Gửi tin nhắn thất bại');
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const mentionOptions = members.map(member => ({
    key: member.userId,
    value: member.userName,
    label: (
      <div className="flex items-center gap-2">
        <Avatar src={member.userAvatar} size="small" />
        <span>{member.userName}</span>
      </div>
    ),
  }));

  return (
    <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-l dark:border-neutral-800">
      <div className="p-4 border-b dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/50">
        <div className="flex items-center gap-2">
          <span className="font-bold dark:text-white">Project Chat</span>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        </div>
      </div>

      <div 
        ref={scrollRef} 
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar"
      >
        {loadingMore && (
          <div className="flex justify-center p-2">
            <Spin size="small" />
          </div>
        )}
        {loading ? (
          <div className="flex justify-center p-4">
            <Spin size="small" />
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === currentUser?.id;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} group`}>
                <Avatar src={msg.avatar} icon={<UserOutlined />} size="default" className="flex-shrink-0" />
                <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-[11px] font-semibold opacity-60 dark:text-neutral-400">{msg.userName}</span>
                    <span className="text-[9px] opacity-40 dark:text-neutral-500">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {msg.replyTo && (
                    <div className="mb-1 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-[10px] opacity-70 border-l-2 border-blue-500 max-w-full truncate">
                      <div className="font-bold">{msg.replyTo.userName}</div>
                      <div className="truncate">{msg.replyTo.content}</div>
                    </div>
                  )}

                  <div className="relative group/content flex flex-col gap-2">
                    {msg.content && (
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm break-words whitespace-pre-wrap ${isMe
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-tl-none'
                          }`}
                      >
                        {msg.content}
                      </div>
                    )}

                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.attachments.map((file, idx) => (
                          <div key={idx} className="max-w-[200px]">
                            {file.resource_type === 'image' ? (
                              <Image
                                src={file.url}
                                alt={file.original_filename}
                                className="rounded-lg border dark:border-neutral-700"
                                width={120}
                              />
                            ) : (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border dark:border-neutral-700 text-xs hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                              >
                                <FileOutlined className="text-blue-500" />
                                <span className="truncate max-w-[120px] dark:text-neutral-300">{file.original_filename}</span>
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {!isMe && (
                      <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/content:opacity-100 transition-opacity">
                        <Tooltip title="Trả lời">
                          <Button
                            type="text"
                            size="small"
                            icon={<RollbackOutlined className="rotate-180" />}
                            onClick={() => setReplyingTo(msg)}
                            className="dark:text-neutral-400"
                          />
                        </Tooltip>
                      </div>
                    )}
                    {isMe && (
                      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/content:opacity-100 transition-opacity">
                        <Tooltip title="Trả lời">
                          <Button
                            type="text"
                            size="small"
                            icon={<RollbackOutlined />}
                            onClick={() => setReplyingTo(msg)}
                            className="dark:text-neutral-400"
                          />
                        </Tooltip>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
        {replyingTo && (
          <div className="mb-2 p-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <RollbackOutlined className="rotate-180 text-blue-500" />
              <div className="truncate">
                <span className="font-bold">Đang trả lời {replyingTo.userName}: </span>
                <span className="opacity-70">{replyingTo.content}</span>
              </div>
            </div>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => setReplyingTo(null)}
            />
          </div>
        )}

        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 p-1.5 rounded-md bg-white dark:bg-neutral-800 border dark:border-neutral-700 text-[10px]">
                <FileOutlined className="text-blue-500" />
                <span className="max-w-[100px] truncate dark:text-neutral-300">{file.original_filename}</span>
                <CloseOutlined className="cursor-pointer hover:text-red-500" onClick={() => removeAttachment(idx)} />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2 bg-white dark:bg-neutral-800 rounded-xl border dark:border-neutral-700 p-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <Mentions
            autoSize={{ minRows: 1, maxRows: 6 }}
            placeholder="Nhập tin nhắn... (@ để nhắc tên)"
            value={input}
            onChange={setInput}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            className="border-none focus:ring-0 bg-transparent dark:text-white"
            prefix={['@']}
            options={mentionOptions}
          />

          <div className="flex items-center justify-between mt-1 pt-1 border-t dark:border-neutral-700">
            <div className="flex items-center gap-1">
              <Upload
                customRequest={onFileUpload}
                showUploadList={false}
                multiple
              >
                <Button
                  type="text"
                  icon={<PaperClipOutlined />}
                  className="text-neutral-500 hover:text-blue-500"
                  loading={uploading}
                />
              </Upload>

              <Popover
                content={
                  <div className="grid grid-cols-5 gap-2">
                    {emojis.map(e => (
                      <span
                        key={e}
                        className="cursor-pointer text-xl hover:scale-125 transition-transform"
                        onClick={() => setInput(prev => prev + e)}
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                }
                trigger="click"
                placement="topLeft"
              >
                <Button type="text" icon={<SmileOutlined />} className="text-neutral-500 hover:text-blue-500" />
              </Popover>
            </div>

            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={onSend}
              disabled={!input.trim() && attachments.length === 0}
              loading={uploading}
              className="bg-blue-600 hover:bg-blue-500 border-none rounded-lg h-8 px-4 flex items-center justify-center shadow-md shadow-blue-500/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
