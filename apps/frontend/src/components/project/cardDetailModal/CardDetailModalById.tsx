'use client';

import React from 'react';
import { Modal, Divider, Skeleton, Typography, theme } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useCardDetail } from '@smart/hooks/useCardDetail';
import TitleSection from './components/TitleSection';
import DescriptionSection from './components/DescriptionSection';
import LabelsAndMembers from './components/LabelsAndMembers';
import ChecklistSection from './components/ChecklistSection';
import AttachmentsSection from './components/AttachmentsSection';
import ActivitySection from './components/ActivitySection';

const { Text } = Typography;

interface Props {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
}

const CardDetailModal: React.FC<Props> = ({ cardId, isOpen, onClose }) => {
  const {
    card,
    loading,
    title,
    setTitle,
    description,
    setDescription,
    editingTitle,
    setEditingTitle,
    isGeneratingTitle,
    isGeneratingDesc,
    aiProgress,
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
    updateBasic,
    safeLabels,
    aiGenerating,
    addLabel,
    // Nếu có addMember trong hook, destructure thêm ở đây
  } = useCardDetail(cardId, isOpen, onClose);

  const { token } = theme.useToken();

  // Hàm xử lý gọi addLabel từ hook
  const handleAddLabel = async (label: { id: string; name: string; color: string }) => {
    try {
      await addLabel(label.name);
    } catch (error) {
      // Có thể xử lý lỗi ở đây
    }
  };

  // Hàm xử lý thêm member, bạn cần bổ sung logic tương tự addLabel
  const handleAddMember = async (memberId: string) => {
    if (!card) return;
    try {
      // TODO: Gọi hàm addMember tương ứng hoặc API
      // Ví dụ: await addMember(memberId);
      // Nếu chưa có hàm addMember, bạn cần bổ sung ở hook useCardDetail

      // Nếu chưa có backend thì có thể update local như ví dụ sau:
      // updateCard({ ...card, members: [...(card.members || []), newMemberObject] });

      // Hiện tại chưa có chức năng cụ thể nên để trống hoặc log
      console.log('Add member:', memberId);
    } catch (error) {
      // Xử lý lỗi nếu cần
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <Modal open footer={null} closable={false} zIndex={1300} width={980} centered>
        <div style={{ padding: 24 }}>
          <Skeleton active />
        </div>
      </Modal>
    );
  }

  if (!card && !title) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={980}
      zIndex={1300}
      centered
      destroyOnHidden
      maskClosable
      closeIcon={<CloseOutlined style={{ fontSize: 18, color: token.colorTextSecondary }} />}
      transitionName="ant-zoom"
      maskTransitionName="ant-fade"
      styles={{
        body: {
          maxHeight: '88vh',
          padding: 0,
          overflowY: 'auto',
          background: token.colorBgLayout,
          scrollbarWidth: 'none',
        },
        mask: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
      }}
    >
      <div style={{ padding: 24 }}>
        <TitleSection
          title={title}
          setTitle={setTitle}
          editingTitle={editingTitle}
          setEditingTitle={setEditingTitle}
          isGenerating={isGeneratingTitle}
          aiProgress={aiProgress}
          onAIGenerate={() => generateWithAI('title')}
          onBlur={(updatedTitle) => {
            if (!aiGenerating) {
              updateBasic({ title: updatedTitle });
            }
          }}
        />

        <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
          <div style={{ flex: 2 }}>
            <LabelsAndMembers
              labels={safeLabels}
              onAddLabel={handleAddLabel}
              onAddMember={handleAddMember}
            />
            <Divider style={{ margin: '16px 0', borderColor: token.colorBorder }} />

            <DescriptionSection
              description={description}
              setDescription={setDescription}
              isGenerating={isGeneratingDesc}
              aiProgress={aiProgress}
              onAIGenerate={() => generateWithAI('description')}
              onBlur={(updatedDescription) => {
                if (!aiGenerating) {
                  updateBasic({ description: updatedDescription });
                }
              }}
            />

            <Divider style={{ margin: '20px 0', borderColor: token.colorBorder }} />

            <ChecklistSection
              checklist={checklist}
              newChecklistItem={newChecklistItem}
              setNewChecklistItem={setNewChecklistItem}
              addChecklistItem={addChecklistItem}
              toggleChecklist={toggleChecklist}
              progress={progress}
            />

            <AttachmentsSection attachments={attachments} />
          </div>

          <ActivitySection
            comments={comments}
            newComment={newComment}
            setNewComment={setNewComment}
            addComment={addComment}
          />
        </div>
      </div>
    </Modal>
  );
};

export default CardDetailModal;
