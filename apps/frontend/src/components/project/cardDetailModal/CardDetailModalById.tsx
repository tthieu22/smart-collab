'use client';

import React from 'react';
import { Modal, Divider, Skeleton, theme, Typography, Button, Popconfirm, Tooltip } from 'antd';
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
import LocationSection from './components/LocationSection';

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
      width={1650}
      zIndex={1300}
      centered
      destroyOnHidden
      maskClosable
      closable={false}
      transitionName="ant-zoom"
      maskTransitionName="ant-fade"
      styles={{
        content: {
          padding: 0,
          background: token.colorBgContainer,
          borderRadius: '28px',
          overflow: 'hidden',
          boxShadow: '0 25px 80px -20px rgba(0, 0, 0, 0.45)',
        },
        body: {
          maxHeight: '94vh',
          padding: 0,
          overflowY: 'hidden',
          background: token.colorBgContainer,
        },
        mask: {
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        },
      }}
    >
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${token.colorFillSecondary};
          border-radius: 10px;
        }
        .module-container {
          background: ${(token as any).mode === 'dark' ? '#0a0a0a' : token.colorBgElevated};
          border: 1px solid ${(token as any).mode === 'dark' ? '#222' : token.colorBorderSecondary};
          border-radius: 24px;
          padding: 24px;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .module-container:hover {
          border-color: ${token.colorPrimary}66;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.2);
        }
        .action-icon-btn {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s ease;
          color: ${token.colorTextSecondary};
          background: ${(token as any).mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
        }
        .action-icon-btn:hover {
          background: ${token.colorPrimary}15;
          color: ${token.colorPrimary};
          transform: scale(1.05);
        }
        .action-icon-btn.danger:hover {
          background: ${token.colorError}15;
          color: ${token.colorError};
        }
        .action-icon-btn.success.active {
           color: ${token.colorSuccess};
           background: ${token.colorSuccess}10;
        }
        .action-icon-btn.success:hover {
          background: ${token.colorSuccess}15;
          color: ${token.colorSuccess};
        }
      `}</style>

      <div style={{ display: 'flex', height: '88vh', overflow: 'hidden' }}
        onKeyDown={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        {/* CỘT CHÍNH (CHỨA 4 TIỂU CỘT) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div style={{ width: '100%', flexShrink: 0 }}>
            <CoverSection coverUrl={card?.coverUrl} onUpdate={updateCover} />
          </div>

          <div style={{ padding: '24px 32px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ marginBottom: 20, flexShrink: 0 }}>
              <TitleSection
                title={title}
                setTitle={setTitle}
                editingTitle={editingTitle}
                setEditingTitle={setEditingTitle}
                onBlur={(updatedTitle) => {
                  if (!aiGenerating) {
                    updateBasic({ title: updatedTitle });
                  }
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 20, flex: 1, overflow: 'hidden' }}>
              {/* CỘT 1: MÔ TẢ */}
              <div style={{ flex: 1.25, height: '100%' }}>
                <div className="module-container custom-scrollbar" style={{ padding: 0, border: 'none', background: 'transparent' }}>
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
                </div>
              </div>

              {/* CỘT 2: METADATA */}
              <div style={{ flex: 0.95, height: '100%' }}>
                <div className="module-container custom-scrollbar">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <LabelsAndMembers
                      labels={safeLabels}
                      cardMembers={card?.members || []}
                      onAddLabel={handleAddLabel}
                      onRemoveLabel={handleRemoveLabel}
                      onAddMember={handleAddMember}
                      onRemoveMember={handleRemoveMember}
                    />
                    <Divider style={{ margin: '8px 0' }} />
                    <DatesSection
                      startDate={card?.startDate}
                      deadline={card?.deadline}
                      onChange={(dates) => updateBasic(dates)}
                    />
                    <Divider style={{ margin: '8px 0' }} />
                    <PrioritySection
                      priority={card?.priority}
                      onChange={(priority) => updateBasic({ priority })}
                    />
                    <Divider style={{ margin: '8px 0' }} />
                    <LocationSection
                      locationName={card?.locationName}
                      latitude={card?.latitude}
                      longitude={card?.longitude}
                      onChange={(data) => updateBasic(data)}
                    />
                  </div>
                </div>
              </div>

              {/* CỘT 3: CHECKLIST + ATTACHMENTS */}
              <div style={{ flex: 1.1, height: '100%' }}>
                <div className="module-container custom-scrollbar">
                  <ChecklistSection
                    checklist={checklist}
                    newChecklistItem={newChecklistItem}
                    setNewChecklistItem={setNewChecklistItem}
                    addChecklistItem={addChecklistItem}
                    toggleChecklist={toggleChecklist}
                    progress={progress}
                  />
                  <Divider style={{ margin: '20px 0' }} />
                  <AttachmentsSection
                    attachments={attachments}
                    onAddAttachment={addAttachment}
                    onRemoveAttachment={removeAttachment}
                    loading={isUploadingAttachment}
                  />
                </div>
              </div>

              {/* CỘT 4: BÌNH LUẬN (ĐỒNG NHẤT VỀ THIẾT KẾ) */}
              <div style={{ flex: 1.2, height: '100%' }}>
                <div className="module-container custom-scrollbar">
                  <ActivitySection
                    comments={comments}
                    newComment={newComment}
                    setNewComment={setNewComment}
                    addComment={addComment}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (THANH DỌC ICON - NARROWER - 56px) */}
        <div
          style={{
            width: 56,
            background: (token as any).mode === 'dark' ? '#000' : token.colorFillAlter,
            borderLeft: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '20px 0'
          }}
        >
          {/* NÚT X ĐÓNG TRÊN CÙNG */}
          <Tooltip title="Đóng (Esc)" placement="left">
            <div className="action-icon-btn" onClick={onClose} style={{ background: (token as any).mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
              <CloseOutlined style={{ fontSize: 18 }} />
            </div>
          </Tooltip>

          {/* CÁC NÚT THAO TÁC DƯỚI CÙNG */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Popconfirm
              title="Xóa thẻ"
              placement="left"
              onConfirm={deleteCard}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true, size: 'small' }}
            >
              <Tooltip title="Xóa thẻ" placement="left">
                <div className="action-icon-btn danger">
                  <DeleteOutlined style={{ fontSize: 18 }} />
                </div>
              </Tooltip>
            </Popconfirm>

            <Tooltip title={card?.status === 'ARCHIVED' ? 'Hoàn tác' : 'Hoàn thành'} placement="left">
              <div
                className={`action-icon-btn success ${card?.status === 'ARCHIVED' ? 'active' : ''}`}
                onClick={() => updateBasic({ status: card?.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED' })}
              >
                <CheckOutlined style={{ fontSize: 18 }} />
              </div>
            </Tooltip>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CardDetailModal;
