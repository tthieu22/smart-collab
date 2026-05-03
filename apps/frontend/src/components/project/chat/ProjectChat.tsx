'use client';

import { useEffect, useRef, useState } from 'react';
import {
  SendOutlined,
  UserOutlined,
  PaperClipOutlined,
  SmileOutlined,
  CloseOutlined,
  FileOutlined,
  RollbackOutlined,
  VideoCameraOutlined,
  MessageOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { Avatar, Button, Spin, Mentions, Popover, Tooltip, Upload, Image, Modal, Select, Input } from 'antd';
import { message } from '@smart/providers/AntdStaticProvider';
import { useUserStore } from '@smart/store/user';
import { getProjectSocketManager } from '@smart/store/realtime';
import { uploadService } from '@smart/services/upload.service';
import { autoRequest } from '@smart/services/auto.request';
import { projectStore } from '@smart/store/project';

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
  const { currentProject } = projectStore();
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
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [meetingTitle, setMeetingTitle] = useState('');
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

    const unsubInvite = socketManager.subscribe('realtime.meeting.invite', (data: any) => {
      if (data.projectId === projectId) {
        message.info({
          content: (
            <div className="flex flex-col gap-1">
              <span className="font-bold">Mời họp: {data.title}</span>
              <Button type="primary" size="small" href={data.meetLink} target="_blank">
                Tham gia ngay
              </Button>
            </div>
          ),
          duration: 10,
        });
      }
    });

    return () => {
      unsub();
      unsubInvite();
    };
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
    const folder = currentProject?.folderPath || projectId;

    setUploading(true);

    try {
      console.log('[ProjectChat] Starting upload to folder:', folder);
      const res = await uploadService.uploadFiles(folder, [file]);

      if (res.success) {
        setAttachments((prev) => [...prev, ...res.data]);
        onSuccess(res.data);
        message.success('Tải lên thành công');
      } else {
        throw new Error(res.data || 'Upload failed');
      }
    } catch (err: any) {
      console.error('[ProjectChat] Upload error:', err);
      message.error(err.message || 'Lỗi tải lên tệp');
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

  const handleCreateMeeting = async () => {
    if (selectedParticipants.length === 0) {
      message.warning('Vui lòng chọn ít nhất một người tham gia');
      return;
    }

    try {
      const socketManager = getProjectSocketManager();
      await socketManager.createMeeting(projectId, selectedParticipants, meetingTitle || 'Cuộc họp nhóm');
      setIsMeetingModalOpen(false);
      setSelectedParticipants([]);
      setMeetingTitle('');
      message.success('Đã tạo cuộc họp và gửi lời mời');
    } catch (err) {
      console.error(err);
      message.error('Tạo cuộc họp thất bại');
    }
  };

  return (
    <div className={`h-full flex flex-col font-sans transition-colors duration-300 bg-white dark:bg-[#0b1220] border-l dark:border-white/5`}>
      {/* HEADER SECTION - Standardized with Board/Recycle Bin */}
      <div className={`
        flex-none px-4 h-12 flex items-center justify-between z-10 relative border-b
        dark:bg-[#1e1f22] dark:border-white/5 bg-white border-gray-100
      `}>
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            dark:bg-blue-500/10 dark:text-blue-400 bg-blue-50 text-blue-600
          `}>
            <MessageOutlined className="text-base" />
          </div>
          <h1 className={`text-sm font-bold tracking-tight m-0 dark:text-gray-100 text-gray-800`}>
            Project Chat
          </h1>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <div className={`h-4 w-[1px] dark:bg-white/20 bg-gray-300 mx-1`} />
          <Tooltip title="Trò chuyện trực tiếp với các thành viên trong dự án">
            <InfoCircleOutlined className="text-neutral-400 cursor-help" />
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip title="Tạo cuộc họp mới">
            <Button
              type="text"
              size="small"
              icon={<VideoCameraOutlined className="text-lg" />}
              onClick={() => setIsMeetingModalOpen(true)}
              className="text-neutral-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 flex items-center justify-center transition-all h-8 w-8 rounded-lg"
            />
          </Tooltip>
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

                    {msg.type === 'SYSTEM' && msg.metadata?.action === 'JOIN_MEETING' && (
                      <div className="mt-1 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-medium text-xs">
                          <VideoCameraOutlined />
                          <span>Cuộc họp đang diễn ra</span>
                        </div>
                        <Button
                          type="primary"
                          size="small"
                          icon={<VideoCameraOutlined />}
                          href={msg.metadata.meetLink}
                          target="_blank"
                          className="bg-green-600 hover:bg-green-700 border-none w-full"
                        >
                          Tham gia cuộc họp
                        </Button>
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

      <Modal
        title="Tạo cuộc họp mới"
        open={isMeetingModalOpen}
        onOk={handleCreateMeeting}
        onCancel={() => setIsMeetingModalOpen(false)}
        okText="Tạo cuộc họp"
        cancelText="Hủy"
        className="rounded-2xl overflow-hidden"
      >
        <div className="flex flex-col gap-4 py-4">
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase mb-2">Tên cuộc họp</div>
            <Mentions
              placeholder="Nhập tên cuộc họp (ví dụ: Daily Standup)"
              value={meetingTitle}
              onChange={setMeetingTitle}
              className="w-full"
            />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-500 uppercase mb-2">Chọn người tham gia</div>
            <Select
              mode="multiple"
              className="w-full"
              placeholder="Chọn thành viên"
              value={selectedParticipants}
              onChange={setSelectedParticipants}
              options={members.map(m => ({
                label: (
                  <div className="flex items-center gap-2">
                    <Avatar src={m.userAvatar} size="small" />
                    <span>{m.userName}</span>
                  </div>
                ),
                value: m.userId
              }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
