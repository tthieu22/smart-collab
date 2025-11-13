// src/components/cardDetailModal/hooks/useCardDetail.ts
'use client';

import { useState, useEffect, useRef } from 'react';
import { projectStore } from '@smart/store/project';
import { projectService } from '@smart/services/project.service';
import { message } from 'antd';
import { typeWriter } from '@smart/components/project/cardDetailModal/utils/typewriter';
import type { Card, CardComment, ChecklistItem, Attachment } from '@smart/types/project';

// DEMO DATA (giữ nguyên)
const DEMO_COMMENTS: CardComment[] = [/* ... giữ nguyên */];
const DEMO_CHECKLIST: ChecklistItem[] = [/* ... giữ nguyên */];
const DEMO_ATTACHMENTS: Attachment[] = [/* ... giữ nguyên */];

export const useCardDetail = (cardId: string, isOpen: boolean, onClose: () => void) => {
  const { cards, updateCard } = projectStore(); // ← updateCard ở đây
  const card = cards[cardId] || {};

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(card.title || '');
  const [description, setDescription] = useState(card.description || '');
  const [editingTitle, setEditingTitle] = useState(false);

  const [aiGenerating, setAIGenerating] = useState<'title' | 'description' | null>(null);
  const [aiProgress, setAIProgress] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [comments, setComments] = useState<CardComment[]>(DEMO_COMMENTS);
  const [newComment, setNewComment] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEMO_CHECKLIST);
  const [attachments, setAttachments] = useState<Attachment[]>(DEMO_ATTACHMENTS);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  // === FETCH CARD ===
  useEffect(() => {
    if (!isOpen || !cardId) return;

    const fetchCard = async () => {
      if (card.title) {
        setTitle(card.title);
        setDescription(card.description || '');
      }

      setLoading(true);
      try {
        const fetched = await projectService.getCard(cardId);
        // setTitle(fetched.title || '');
          // setDescription(fetched.description || '');
          console.log(fetched,'sdfhjdsfdsf')
      } catch {
        message.error('Không thể tải card');
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [cardId, isOpen, card]);

  // === TYPEWRITER ===
  const startTypewriter = (text: string) => {
    let i = 0;
    setDisplayedText('');
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
        setAIProgress(Math.min(100, (i / text.length) * 100));
      } else {
        clearInterval(intervalRef.current!);
        setTimeout(() => {
          setAIGenerating(null);
          setAIProgress(0);
        }, 10);
      }
    }, 30);
  };

  // === AI GENERATE ===
  const generateWithAI = async (type: 'title' | 'description') => {
    setAIGenerating(type);
    setAIProgress(0);
    await new Promise(r => setTimeout(r, 800));

    const aiContent = type === 'title'
      ? `AI: Tối ưu "${title}" thành tiêu đề chuyên nghiệp`
      : `<p><strong>AI đã tạo mô tả chi tiết:</strong></p><ul><li>Mục tiêu: Hoàn thành nhanh</li><li>Công cụ: React + Zustand</li><li>Ưu tiên: UX mượt</li></ul><p>Hiệu ứng Google AI border đang chạy!</p>`;

    startTypewriter(aiContent);

    setTimeout(() => {
      if (type === 'title') {
        setTitle(aiContent);
        updateCard({ ...card, title: aiContent }); // ← Dùng được
      } else {
        setDescription(aiContent);
        updateCard({ ...card, description: aiContent });
      }
    }, aiContent.length * 30 + 600);
  };

  // === COMMENT ===
  const addComment = () => {
    if (!newComment.trim()) return;
    const comment: CardComment = {
      id: `c${Date.now()}`,
      userId: 'currentUser',
      userName: 'Bạn',
      avatar: '',
      content: newComment,
      createdAt: new Date().toISOString(),
    };
    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  // === CHECKLIST ===
  const toggleChecklist = (id: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, done: !item.done } : item
    ));
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const item: ChecklistItem = { id: `cl${Date.now()}`, title: newChecklistItem, done: false };
    setChecklist(prev => [...prev, item]);
    setNewChecklistItem('');
  };

  const progress = checklist.length > 0
    ? Math.round((checklist.filter(i => i.done).length / checklist.length) * 100)
    : 0;

  // === CLEANUP ===
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // === RETURN ALL + updateCard + safe labels ===
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
    comments,
    newComment,
    setNewComment,
    addComment,
    checklist,
    toggleChecklist,
    newChecklistItem,
    setNewChecklistItem,
    addChecklistItem,
    progress,
    attachments,
    generateWithAI,
    updateCard, // ← ĐÃ RETURN
    isGeneratingTitle: aiGenerating === 'title',
    isGeneratingDesc: aiGenerating === 'description',
    // Safe labels: đảm bảo name là string
    safeLabels: (card.labels || []).map((l: any) => ({
      id: l.id,
      name: l.name || 'Unknown',
      color: l.color || '#999',
    })),
  };
};