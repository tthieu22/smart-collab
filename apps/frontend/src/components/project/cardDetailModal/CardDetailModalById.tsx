'use client';

import React from 'react';
import { Modal, Divider, Skeleton, theme, Typography, Button, Popconfirm } from 'antd';
import { CloseOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons';
import { useCardDetail } from '@smart/hooks/useCardDetail';
import TitleSection from './components/TitleSection';
import DescriptionSection from './components/DescriptionSection';
import LabelsAndMembers from './components/LabelsAndMembers';
import ChecklistSection from './components/ChecklistSection';
import AttachmentsSection from './components/AttachmentsSection';
import ActivitySection from './components/ActivitySection';
import DatesSection from './components/DatesSection';
import PrioritySection from './components/PrioritySection';
import CoverSection from './components/CoverSection';

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
    addAttachment,
    removeAttachment,
    isUploadingAttachment,
    generateWithAI,
    updateBasic,
    safeLabels,
    aiGenerating,
    addLabel,
    removeLabel,
    deleteCard,
    addMember,
    removeMember,
    updateCover,
  } = useCardDetail(cardId, isOpen, onClose);

  const { token } = theme.useToken();

  const handleAddLabel = async (label: { id: string; name: string; color: string }) => {
    try {
      await addLabel(label.name, label.color);
    } catch (error) {
      // Có thể xử lý lỗi ở đây
    }
  };

  const handleRemoveLabel = async (labelId: string) => {
    try {
      await removeLabel(labelId);
    } catch (error) {
      // Xử lý lỗi
    }
  };

  // Hàm xử lý thêm member
  const handleAddMember = async (memberData: { userId: string; userName: string; userAvatar?: string }) => {
    if (!card) return;
    try {
      await addMember(memberData.userId, memberData.userName, memberData.userAvatar);
    } catch (error) {
      console.error('Add member failed:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!card) return;
    try {
      await removeMember(userId);
    } catch (error) {
      console.error('Remove member failed:', error);
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

  if (!card && !title) {
    return (
      <Modal
        open={isOpen}
        onCancel={onClose}
        footer={null}
        zIndex={1300}
        width={980}
        centered
        maskClosable
      >
        <div style={{ padding: 24 }}>
          <Skeleton active paragraph={{ rows: 6 }} />
          <Text type="secondary">Đang đồng bộ dữ liệu card từ realtime...</Text>
        </div>
      </Modal>
    );
  }

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
      <CoverSection coverUrl={card?.coverUrl} onUpdate={updateCover} />

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
              cardMembers={card?.members || []}
              onAddLabel={handleAddLabel}
              onRemoveLabel={handleRemoveLabel}
              onAddMember={handleAddMember}
              onRemoveMember={handleRemoveMember}
            />
            <Divider style={{ margin: '16px 0', borderColor: token.colorBorder }} />

            <DatesSection
              startDate={card?.startDate}
              deadline={card?.deadline}
              onChange={(dates) => updateBasic(dates)}
            />

            <Divider style={{ margin: '16px 0', borderColor: token.colorBorder }} />

            <PrioritySection
              priority={card?.priority}
              onChange={(priority) => updateBasic({ priority })}
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

            <AttachmentsSection
              attachments={attachments}
              onAddAttachment={addAttachment}
              onRemoveAttachment={removeAttachment}
              loading={isUploadingAttachment}
            />

            <Divider style={{ margin: '20px 0', borderColor: token.colorBorder }} />

            <div className="flex flex-col gap-2">
              <Text strong className="text-xs uppercase text-gray-500 mb-2">Thao tác</Text>
              <div className="flex gap-2">
                <Button
                  icon={<CheckOutlined />}
                  onClick={() => updateBasic({ status: card?.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED' })}
                  className="flex-1"
                >
                  {card?.status === 'ARCHIVED' ? 'Hoàn tác hoàn thành' : 'Đánh dấu hoàn thành'}
                </Button>
                <Popconfirm
                  title="Xóa thẻ"
                  description="Bạn có chắc chắn muốn xóa thẻ này không?"
                  onConfirm={deleteCard}
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DeleteOutlined />} className="flex-1">
                    Xóa thẻ
                  </Button>
                </Popconfirm>
              </div>
            </div>
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
