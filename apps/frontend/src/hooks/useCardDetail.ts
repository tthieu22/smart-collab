'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { projectStore } from '@smart/store/project';
import { projectService } from '@smart/services/project.service';
import { uploadService } from '@smart/services/upload.service';
import { message } from 'antd';
import { getProjectSocketManager } from '@smart/store/realtime';
import type {
  Card,
  CardComment,
  ChecklistItem,
  CardLabel,
  Column,
} from '@smart/types/project';
import { useUserStore } from '@smart/store/user';

export const useCardDetail = (
  cardId: string,
  isOpen: boolean,
  onClose: () => void
) => {
  const { cards, updateCard } = projectStore();
  const card = cards[cardId];
  const socket = getProjectSocketManager();
  const { currentUser } = useUserStore();
  const currentUserProfile = currentUser as any;

  // Local state for editable fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');

  // Loading state for fetch/update
  const [loading, setLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // AI generation state (type + progress + displayed text)
  const [aiState, setAIState] = useState({
    type: null as 'title' | 'description' | null,
    progress: 0,
    displayedText: '',
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Thêm state editingTitle
  const [editingTitle, setEditingTitle] = useState(false);

  // Từ aiState.type để derive isGeneratingTitle, isGeneratingDesc
  const isGeneratingTitle = aiState.type === 'title';
  const isGeneratingDesc = aiState.type === 'description';

  // New comment + checklist item inputs
  const [newComment, setNewComment] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const syncColumnsToStore = useCallback((columnList: Column[]) => {
    const store = projectStore.getState();
    columnList.forEach((col) => {
      const nextColumn: Column = {
        ...col,
        cardIds: col.cardIds ?? col.cards?.map((c) => c.id) ?? [],
      };
      store.updateColumn(nextColumn);
      if (nextColumn.boardId) {
        store.addColumn(nextColumn.boardId, nextColumn);
      }
      if (Array.isArray(col.cards) && col.cards.length) {
        store.addCard(col.id, col.cards);
      }
    });
  }, []);

  // Sync local editable states with card when card or isOpen changes
  useEffect(() => {
    if (!card || !isOpen) return;

    if (title !== card.title) setTitle(card.title || '');
    if (description !== card.description)
      setDescription(card.description || '');
    if (originalTitle !== card.title) setOriginalTitle(card.title || '');
    setLoading(false);
  }, [card?.title, card?.description, isOpen]);

  // Fetch card detail when modal opens or cardId changes
  useEffect(() => {
    if (!isOpen || !cardId) return;

    let canceled = false;
    const fetchCard = async () => {
      setLoading(true);
      try {
        const maxAttempts = 6;
        const retryDelayMs = 1000;
        let attempt = 0;

        while (!canceled && attempt < maxAttempts) {
          attempt += 1;
          const fetched: any = await projectService.getCard(cardId);
          const fetchedCard = fetched?.data;

          if (fetchedCard?.id) {
            updateCard(fetchedCard);
            return;
          }

          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          }
        }

        throw new Error('Card chưa sẵn sàng');
      } catch {
        if (!canceled) {
          message.warning('Card đang được xử lý, vui lòng đợi một chút');
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    };

    fetchCard();
    return () => {
      canceled = true;
    };
  }, [cardId, isOpen, updateCard]);

  useEffect(() => {
    if (!isOpen || !card?.projectId) return;

    let canceled = false;
    const fetchColumnsRealtimeFirst = async () => {
      try {
        const rtRes: any = await socket.getColumns(card.projectId);
        if (canceled) return;
        const realtimeColumns = rtRes?.data;
        if (Array.isArray(realtimeColumns)) {
          syncColumnsToStore(realtimeColumns);
          return;
        }
      } catch {
        // fallback to HTTP below
      }

      try {
        const apiRes: any = await projectService.getColumnsByProject(card.projectId);
        if (canceled) return;
        const apiColumns = apiRes?.data;
        if (Array.isArray(apiColumns)) {
          syncColumnsToStore(apiColumns);
        }
      } catch {
        // do not block card detail UX if columns cannot be fetched
      }
    };

    fetchColumnsRealtimeFirst();
    return () => {
      canceled = true;
    };
  }, [isOpen, card?.projectId, socket, syncColumnsToStore]);

  // Cleanup AI typewriter interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Function to update card on server and handle loading
  const updateCardOnServer = useCallback(
    async (payload: {
      cardId: string;
      action: string;
      data: any;
      updatedById?: string;
    }) => {
      if (!card) return;
      setIsUpdating(true);
      try {
        const res = await socket.updateCard(
          card.projectId,
          cardId,
          payload.action,
          payload.data,
          payload.updatedById
        );
        return res;
      } catch {
        message.error('Cập nhật thất bại');
        throw new Error('Update failed');
      } finally {
        setIsUpdating(false);
      }
    },
    [card, cardId, socket]
  );

  // Update basic card fields and sync local state immediately
  const updateBasic = useCallback(
    async (fields: {
      title?: string;
      description?: string;
      status?: string;
      deadline?: string | null;
      priority?: number | null;
    }) => {
      if (!card) return;

      const payload = {
        title: fields.title ?? title,
        description: fields.description ?? description,
        status: fields.status,
        deadline: fields.deadline,
        priority: fields.priority,
      };

      await updateCardOnServer({
        cardId: card.id,
        action: 'update-basic',
        data: payload,
        updatedById: currentUser?.id,
      });

      if (fields.title !== undefined) setTitle(fields.title);
      if (fields.description !== undefined) setDescription(fields.description);
    },
    [card, title, description, currentUser?.id, updateCardOnServer]
  );

  // Typewriter effect for AI generated text
  const startTypewriter = useCallback(
    (text: string, onComplete?: () => void) => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      let i = 0;
      setAIState((prev) => ({ ...prev, progress: 0, displayedText: '' }));

      intervalRef.current = setInterval(() => {
        if (i < text.length) {
          setAIState((prev) => ({
            ...prev,
            displayedText: prev.displayedText + text.charAt(i),
            progress: Math.round(((i + 1) / text.length) * 100),
          }));
          i++;
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          onComplete?.();
          setTimeout(
            () =>
              setAIState((prev) => ({
                ...prev,
                type: null,
                progress: 0,
                displayedText: '',
              })),
            300
          );
        }
      }, 25);
    },
    []
  );

  // Generate AI content and sync to local state
  const generateWithAI = useCallback(
    async (type: 'title' | 'description') => {
      if (!card) return;

      setAIState({ type, progress: 0, displayedText: '' });
      await new Promise((r) => setTimeout(r, 600));

      try {
        const res: any = await projectService.aiGenerateCard(card.id, type);
        const aiContent =
          res?.content ??
          res?.data?.content ??
          res?.result?.content ??
          (type === 'title' ? res?.data?.title : res?.data?.description) ??
          '';

        if (!aiContent) throw new Error('AI không trả về nội dung');

        startTypewriter(String(aiContent), async () => {
          // Refresh from backend so UI stays consistent with persisted data
          try {
            const fetched: any = await projectService.getCard(card.id);
            updateCard(fetched.data);
          } catch {
            // ignore
          }
        });
      } catch (e: any) {
        message.error(e?.message || 'AI generate thất bại');
        setAIState({ type: null, progress: 0, displayedText: '' });
      }
    },
    [card, startTypewriter, updateCard]
  );

  // Comment add (local update)
  const addComment = useCallback(async () => {
    if (!newComment.trim() || !card) return;
    try {
      await updateCardOnServer({
        cardId: card.id,
        action: 'add-comment',
        data: {
          content: newComment.trim(),
          userName:
            `${currentUserProfile?.firstName ?? ''} ${currentUserProfile?.lastName ?? ''}`.trim() ||
            currentUser?.email ||
            'User',
          avatar: currentUserProfile?.avatar ?? null,
        },
        updatedById: currentUser?.id,
      });
      setNewComment('');
    } catch {
      // error already handled
    }
  }, [newComment, card, updateCardOnServer, currentUser?.id, currentUser?.email, currentUserProfile]);

  // Checklist helpers calling updateCardOnServer
  const addChecklistItem = useCallback(
    (title: string, position?: number) => {
      if (!card) return Promise.resolve();
      return updateCardOnServer({
        cardId: card.id,
        action: 'add-checklist-item',
        data: { title, position: position ?? 0 },
      });
    },
    [card, updateCardOnServer]
  );

  const updateChecklistItem = useCallback(
    (itemId: string, title: string, done: boolean) => {
      if (!card) return Promise.resolve();
      return updateCardOnServer({
        cardId: card.id,
        action: 'update-checklist-item',
        data: { itemId, title, done },
      });
    },
    [card, updateCardOnServer]
  );

  const removeChecklistItem = useCallback(
    (itemId: string) => {
      if (!card) return Promise.resolve();
      return updateCardOnServer({
        cardId: card.id,
        action: 'remove-checklist-item',
        data: { itemId },
      });
    },
    [card, updateCardOnServer]
  );

  const toggleChecklist = useCallback(
    (id: string) => {
      if (!card) return;
      const item = card.checklist?.find((i) => i.id === id);
      if (!item) return;
      updateChecklistItem(id, item.title, !item.done).catch(() =>
        message.error('Cập nhật checklist thất bại')
      );
    },
    [card, updateChecklistItem]
  );

  const handleAddChecklistItem = useCallback(() => {
    if (!newChecklistItem.trim() || !card) return;
    addChecklistItem(newChecklistItem.trim(), card.checklist?.length)
      .then(() => setNewChecklistItem(''))
      .catch(() => message.error('Thêm checklist thất bại'));
  }, [newChecklistItem, card, addChecklistItem]);

  // Attachment helpers
  const addAttachment = useCallback(
    async (file: File) => {
      if (!card) return Promise.resolve();
      setIsUploadingAttachment(true);
      try {
        const projectFolder = card.projectId;
        const uploadRes: any = await uploadService.uploadFiles(projectFolder, [file]);
        const uploaded = uploadRes?.data?.[0];
        if (!uploadRes?.success || !uploaded?.url) {
          throw new Error('Upload thất bại');
        }

        return await updateCardOnServer({
          cardId: card.id,
          action: 'add-attachment',
          data: {
            name: uploaded.original_filename || file.name,
            url: uploaded.url,
            size: `${((uploaded.size || file.size) / 1024 / 1024).toFixed(2)} MB`,
            publicId: uploaded.public_id,
            fileType: uploaded.type,
            fileSize: uploaded.size,
            resourceType: uploaded.resource_type,
            originalFilename: uploaded.original_filename || file.name,
          },
          updatedById: currentUser?.id ?? 'current_user',
        });
      } finally {
        setIsUploadingAttachment(false);
      }
    },
    [card, updateCardOnServer, currentUser?.id]
  );

  const removeAttachment = useCallback(
    async (attachmentId: string) => {
      if (!card) return Promise.resolve();
      const attachment = card.attachments?.find((item) => item.id === attachmentId);
      if (attachment?.publicId) {
        const deleteRes: any = await uploadService.deleteFiles([attachment.publicId]);
        if (!deleteRes?.success) {
          throw new Error('Xóa file thất bại');
        }
      }
      return updateCardOnServer({
        cardId: card.id,
        action: 'remove-attachment',
        data: { attachmentId },
      });
    },
    [card, updateCardOnServer]
  );

  // Update cover image
  const updateCover = useCallback(
    (coverData: {
      coverUrl: string;
      coverPublicId?: string;
      coverFilename?: string;
      coverFileSize?: number;
    }) => {
      if (!card) return Promise.resolve();
      return updateCardOnServer({
        cardId: card.id,
        action: 'update-cover',
        data: coverData,
        updatedById: currentUser?.id ?? 'current_user',
      });
    },
    [card, updateCardOnServer, currentUser?.id]
  );

  // Checklist progress calculation
  const progress = useMemo(() => {
    if (!card?.checklist?.length) return 0;
    return Math.round(
      (card.checklist.filter((i) => i.done).length / card.checklist.length) *
        100
    );
  }, [card?.checklist]);

  // Safe labels for UI
  const safeLabels = useMemo(
    () =>
      (card?.labels || []).map((l: CardLabel) => ({
        id: l.id,
        name: l.name || l.label || 'Label',
        color: l.color || '#94A3B8',
      })),
    [card?.labels]
  );

  return {
    card,
    loading,
    isUpdating,
    title,
    setTitle,
    description,
    setDescription,
    originalTitle,
    editingTitle,
    setEditingTitle,
    aiGenerating: aiState.type,
    aiProgress: aiState.progress,
    displayedText: aiState.displayedText,
    isGeneratingTitle,
    isGeneratingDesc,

    generateWithAI,

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
    isUploadingAttachment,

    safeLabels,

    updateBasic,
    addLabel: (label: string) =>
      card
        ? updateCardOnServer({
            cardId: card.id,
            action: 'add-label',
            data: { label },
          })
        : Promise.resolve(),
    removeLabel: (labelId: string) =>
      card
        ? updateCardOnServer({
            cardId: card.id,
            action: 'remove-label',
            data: { labelId },
          })
        : Promise.resolve(),
    updateChecklistItem,
    removeChecklistItem,
    updateCover,

    onClose,
  };
};
