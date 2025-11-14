'use client';

import { useState, useEffect, useRef } from 'react';
import { projectStore } from '@smart/store/project';
import { projectService } from '@smart/services/project.service';
import { message } from 'antd';
import type { Card, CardComment, ChecklistItem, Attachment, CardLabel } from '@smart/types/project';

export const useCardDetail = (cardId: string, isOpen: boolean, onClose: () => void) => {
  const { cards, updateCard } = projectStore();
  const card = cards[cardId];

  // === STATE ===
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

  // === SYNC CARD DATA (real-time) ===
  useEffect(() => {
    if (!card || !isOpen) return;

    setTitle(card.title || '');
    setDescription(card.description || '');
    setLoading(false);
  }, [card, isOpen]);

  // === FETCH CARD (nếu chưa có trong store hoặc khi mở) ===
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

  // === AI GENERATE ===
  const generateWithAI = async (type: 'title' | 'description') => {
    if (!card) return;

    setAIGenerating(type);
    setAIProgress(0);
    await new Promise(r => setTimeout(r, 600));

    const aiContent = type === 'title'
      ? `AI: Tối ưu "${title}" → "${title.trim()} (v${Date.now().toString().slice(-3)})"`
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
    });
  };

  // === COMMENT ===
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

  // === CHECKLIST ===
  const toggleChecklist = (id: string) => {
    if (!card) return;

    const updated = (card.checklist || []).map(item =>
      item.id === id ? { ...item, done: !item.done } : item
    );

    updateCard({
      ...card,
      checklist: updated,
    });
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim() || !card) return;

    const item: ChecklistItem = {
      id: `cl_${Date.now()}`,
      cardId: card.id,
      title: newChecklistItem.trim(),
      done: false,
      position: (card.checklist?.length || 0),
    };

    updateCard({
      ...card,
      checklist: [...(card.checklist || []), item],
    });

    setNewChecklistItem('');
  };

  const progress = card?.checklist && card.checklist.length > 0
    ? Math.round((card.checklist.filter(i => i.done).length / card.checklist.length) * 100)
    : 0;

  // === ATTACHMENT (giả lập upload) ===
  const addAttachment = (file: File) => {
    if (!card) return;

    const attachment: Attachment = {
      id: `a_${Date.now()}`,
      cardId: card.id,
      name: file.name,
      url: URL.createObjectURL(file),
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      uploadedAt: new Date().toISOString(),
      uploadedById: 'current_user',
      uploadedByName: 'Bạn',
      uploadedByAvatar: null,
    };

    updateCard({
      ...card,
      attachments: [...(card.attachments || []), attachment],
    });
  };

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // === SAFE LABELS ===
  const safeLabels = (card?.labels || []).map((l: CardLabel) => ({
    id: l.id,
    name: l.name || l.label || 'Label',
    color: l.color || '#94A3B8',
  }));

  // === RETURN ===
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
    addChecklistItem,
    progress,

    attachments: card?.attachments || [],
    addAttachment,

    safeLabels,

    updateCard,
    onClose,
  };
};
