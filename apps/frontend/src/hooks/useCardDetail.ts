'use client';

import { useState, useEffect, useRef } from 'react';
import { projectStore } from '@smart/store/project';
import { projectService } from '@smart/services/project.service';
import { message } from 'antd';
import type { Card, CardComment, ChecklistItem, Attachment, CardLabel } from '@smart/types/project';

export const useCardDetail = (cardId: string, isOpen: boolean, onClose: () => void) => {
  const { cards, updateCard } = projectStore();
  const card = cards[cardId];

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);

  const [aiGenerating, setAIGenerating] = useState<'title' | 'description' | null>(null);
  const [aiProgress, setAIProgress] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [newComment, setNewComment] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  console.log(card)
  // Sync dữ liệu khi card hoặc modal mở
  useEffect(() => {
    if (!card || !isOpen) return;
    setTitle(card.title || '');
    setOriginalTitle(card.title || ''); 
    setDescription(card.description || '');
    setLoading(false);
  }, [card, isOpen]);

  useEffect(() => {
  if (!isOpen || !cardId) return;

  const fetchCard = async () => {
      setLoading(true);
      try {
      const fetched: any = await projectService.getCard(cardId);

      // Cập nhật toàn bộ dữ liệu card đầy đủ, ghi đè card rút gọn trong store
      updateCard(fetched);

      console.log('Fetched card (full):', fetched);
      } catch (error) {
      console.error(error);
      message.error('Không thể tải card');
      } finally {
      setLoading(false);
      }
  };

  fetchCard();
  }, [cardId, isOpen, updateCard]);

  // Hàm gọi backend update card, trả về card updated
  const updateCardOnServer = async (payload: {
    cardId: string;
    action: string;
    data: any;
    updatedById?: string;
  }) => {
    setLoading(true);
    try {
      console.log(payload, 'payload');
      // const updated: Card = await projectService.updateCard(payload);
      // updateCard(updated);
      // return updated;
    } catch (error) {
      message.error('Cập nhật thất bại');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Các hàm update từng phần gọi backend

  // 1. Update basic fields
  const updateBasic = async (fields: {
    title?: string;
    description?: string;
    status?: string;
    deadline?: string | null;
    priority?: number | null;
  }) => {
    if (!card) return;
    return updateCardOnServer({
      cardId: card.id,
      action: 'update-basic',
      data: {
        title: fields.title ?? card.title,
        description: fields.description ?? card.description,
        status: fields.status ?? card.status,
        deadline: fields.deadline ?? card.deadline,
        priority: fields.priority ?? card.priority,
      },
      updatedById: 'current_user',
    });
  };

  // 2. Add label
  const addLabel = async (label: string) => { 
      console.log('Adding label:', label);
    if (!card) return;
    return updateCardOnServer({
      cardId: card.id,
      action: 'add-label',
      data: { label },
    });
  };

  // 3. Remove label
  const removeLabel = async (labelId: string) => {
    if (!card) return;
    return updateCardOnServer({
      cardId: card.id,
      action: 'remove-label',
      data: { labelId },
    });
  };

  // 4. Add checklist item
  const addChecklistItem = async (title: string, position?: number) => {
    if (!card) return;
    return updateCardOnServer({
      cardId: card.id,
      action: 'add-checklist-item',
      data: { title, position: position ?? 0 },
    });
  };

  // 5. Update checklist item
  const updateChecklistItem = async (itemId: string, title: string, done: boolean) => {
    if (!card) return;
    return updateCardOnServer({
      cardId: card.id,
      action: 'update-checklist-item',
      data: { itemId, title, done },
    });
  };

  // 6. Remove checklist item
  const removeChecklistItem = async (itemId: string) => {
    if (!card) return;
    return updateCardOnServer({
      cardId: card.id,
      action: 'remove-checklist-item',
      data: { itemId },
    });
  };

  // 7. Add attachment (giả lập upload)
  const addAttachment = async (file: File) => {
    if (!card) return;

    // Ở đây bạn nên upload file lên server trước để lấy URL thật
    const attachmentData = {
      name: file.name,
      url: URL.createObjectURL(file),
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    };

    return updateCardOnServer({
      cardId: card.id,
      action: 'add-attachment',
      data: attachmentData,
      updatedById: 'current_user',
    });
  };

  // 8. Remove attachment
  const removeAttachment = async (attachmentId: string) => {
    if (!card) return;
    return updateCardOnServer({
      cardId: card.id,
      action: 'remove-attachment',
      data: { attachmentId },
    });
  };

  // 9. Update cover
  const updateCover = async (coverData: {
    coverUrl: string;
    coverPublicId?: string;
    coverFilename?: string;
    coverFileSize?: number;
  }) => {
    if (!card) return;
    return updateCardOnServer({
      cardId: card.id,
      action: 'update-cover',
      data: coverData,
      updatedById: 'current_user',
    });
  };

  // === TYPEWRITER EFFECT ===
  const startTypewriter = (text: string, onComplete?: () => void) => {
    let i = 0;
    setDisplayedText('');
    setAIProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
        setAIProgress(Math.round((i / text.length) * 100));
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        onComplete?.();
        setTimeout(() => {
          setAIGenerating(null);
          setAIProgress(0);
        }, 300);
      }
    }, 25);
  };

  // AI generate content, sau đó update backend
  const generateWithAI = async (type: 'title' | 'description') => {
    if (!card) return;

    setAIGenerating(type);
    setAIProgress(0);
    await new Promise(r => setTimeout(r, 600));
    const aiContent = type === 'title'
      ? `AI: Tối ưu "${originalTitle}" → "${originalTitle.trim()} (v${Date.now().toString().slice(-3)})"`
      : `<p><strong>AI đã tạo mô tả:</strong></p>
         <ul>
           <li>Mục tiêu: ${title}</li>
           <li>Ưu tiên: ${card.priority ?? 'Trung bình'}</li>
           <li>Deadline: ${card.deadline ? new Date(card.deadline).toLocaleDateString('vi') : 'Chưa có'}</li>
         </ul>
         <p>Hiệu ứng Google AI đang chạy...</p>`;

    startTypewriter(aiContent, () => {
      const payload = type === 'title'
        ? { ...card, title: aiContent }
        : { ...card, description: aiContent };

      updateCard(payload);
      if (type === 'title') {
        setTitle(aiContent);
      }

    });
  };

  // === COMMENT (chưa có backend, chỉ giả lập local) ===
  const addComment = () => {
    if (!newComment.trim() || !card) return;

    const comment: CardComment = {
      id: `c_${Date.now()}`,
      cardId: card.id,
      userId: 'current_user',
      userName: 'Bạn',
      avatar: null,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
    };

    updateCard({
      ...card,
      comments: [comment, ...(card.comments || [])],
    });

    setNewComment('');
  };

  // Toggle checklist item done trạng thái gọi backend
  const toggleChecklist = (id: string) => {
    if (!card) return;
    const item = card.checklist?.find(i => i.id === id);
    if (!item) return;

    updateChecklistItem(id, item.title, !item.done).catch(() => message.error('Cập nhật checklist thất bại'));
  };

  // Thêm checklist item gọi backend
  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim() || !card) return;
    addChecklistItem(newChecklistItem.trim(), card.checklist?.length)
      .then(() => setNewChecklistItem(''))
      .catch(() => message.error('Thêm checklist thất bại'));
  };

  // Tính progress checklist
  const progress = card?.checklist && card.checklist.length > 0
    ? Math.round((card.checklist.filter(i => i.done).length / card.checklist.length) * 100)
    : 0;

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Safe labels map
  const safeLabels = (card?.labels || []).map((l: CardLabel) => ({
    id: l.id,
    name: l.name || l.label || 'Label',
    color: l.color || '#94A3B8',
  }));

  return {
    card,
    loading,
    title,
    setTitle,
    description,
    setDescription,
    editingTitle,
    setEditingTitle,

    aiGenerating,
    aiProgress,
    displayedText,
    generateWithAI,
    isGeneratingTitle: aiGenerating === 'title',
    isGeneratingDesc: aiGenerating === 'description',

    comments: card?.comments || [],
    newComment,
    setNewComment,
    addComment,

    checklist: card?.checklist || [],
    toggleChecklist,
    newChecklistItem,
    setNewChecklistItem,
    addChecklistItem: handleAddChecklistItem,
    progress,

    attachments: card?.attachments || [],
    addAttachment,
    removeAttachment,

    safeLabels,

    updateBasic,
    addLabel,
    removeLabel,
    updateChecklistItem,
    removeChecklistItem,
    updateCover,

    onClose,
  };
};
