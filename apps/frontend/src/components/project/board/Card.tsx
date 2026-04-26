'use client';

import React, { useCallback, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card as CardType } from '@smart/types/project';
import { useDragContext } from '../dnd/DragContext';
import CardDetailModal from '../cardDetailModal/CardDetailModalById';
import { CheckOutlined, MoreOutlined, DeleteOutlined, EditOutlined, UserOutlined } from '@ant-design/icons';
import { getProjectSocketManager } from '@smart/store/realtime';
import { message, Tooltip, Dropdown, Popconfirm, Avatar } from 'antd';

interface Props {
  card: CardType;
  columnId: string;
  boardId: string;
  boardType: string;
  index: number;
  isOverlay?: boolean;
}

export const Card = React.memo(function Card({
  card,
  columnId,
  boardId,
  boardType,
  index,
  isOverlay,
}: Props) {
  const { activeId } = useDragContext();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: 'CARD', card, columnId, boardId, boardType, index },
    disabled: isOverlay,
  });

  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const style = useMemo(() => {
    const transformStr = CSS.Transform.toString(transform) || '';
    return {
      transform: isOverlay
        ? `${transformStr} rotate(5deg)`.trim()
        : transformStr,
      transition: transition || undefined,
    };
  }, [transform, transition, isOverlay]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (activeId || isOverlay) return;
      e.stopPropagation();
      setIsModalOpen(true);
    },
    [activeId, isOverlay]
  );

  const handleArchive = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      try {
        const socket = getProjectSocketManager();
        await socket.updateCard(boardId, card.id, 'update-basic', { status: 'ARCHIVED' });
        message.success('Đã hoàn thành công việc');
      } catch (error) {
        message.error('Thao tác thất bại');
      }
    },
    [boardId, card.id]
  );

  const handleDelete = useCallback(
    async () => {
      try {
        const socket = getProjectSocketManager();
        await socket.deleteCard(boardId, card.id);
        message.success('Đã xóa thẻ');
      } catch (error) {
        message.error('Xóa thẻ thất bại');
      }
    },
    [boardId, card.id]
  );

  const priorityInfo = useMemo(() => {
    if (card.priority === undefined || card.priority === null) return null;
    const priorities = [
      { label: 'Thấp', color: '#52c41a' },
      { label: 'Trung bình', color: '#1890ff' },
      { label: 'Cao', color: '#fa8c16' },
      { label: 'Khẩn cấp', color: '#f5222d' },
    ];
    return priorities[card.priority] || null;
  }, [card.priority]);

  // Khi đang kéo (không phải overlay) → ẩn hoàn toàn và co chiều cao về 0
  const isBeingDragged = isDragging && !isOverlay;

  return (
    <>
      <CardDetailModal
        cardId={card.id}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <div
        ref={setNodeRef}
        id={card.id}
        data-card-id={card.id}
        data-column-id={columnId}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className={`
          group/card
          ${isBeingDragged
            ? 'opacity-0 scale-95 invisible' // Chúng ta sẽ dùng placeholder riêng bên dưới cho card đang kéo trong Column.tsx hoặc Card.tsx
            : 'my-1 p-3 h-auto duration-200'
          }
          transition-all duration-300 select-none
          bg-white dark:bg-neutral-800 rounded-lg border
          ${isOverlay
            ? 'border-blue-500 shadow-2xl ring-4 ring-blue-400/30 scale-105 cursor-grabbing'
            : 'border-gray-200 dark:border-neutral-700 shadow-sm hover:shadow-lg cursor-pointer'
          }
          ${!activeId && !isOverlay
            ? 'hover:border-blue-400/50 hover:ring-2 hover:ring-blue-400/20'
            : 'cursor-grab active:cursor-grabbing'
          }
        `}
      >
        {/* Card Cover */}
        {card.coverUrl && (
          <div
            className="h-20 w-full bg-cover bg-center rounded-t-lg -mt-3 -mx-3 mb-3"
            style={{
              backgroundColor: (card.coverUrl.startsWith('rgb') || card.coverUrl.startsWith('#')) ? card.coverUrl : 'transparent',
              backgroundImage: (card.coverUrl.startsWith('rgb') || card.coverUrl.startsWith('#')) ? 'none' : `url(${card.coverUrl})`
            }}
          />
        )}

        {/* Nội dung card - giữ nguyên để lấy chiều cao tự nhiên nhưng ẩn đi khi đang kéo */}
        <div className={`relative transition-opacity duration-200 ${isBeingDragged ? 'opacity-0 invisible' : 'opacity-100'}`}>
          {!isBeingDragged && (
            <>
              {/* Radio-style Complete Button (Left) - Slide in animation */}
              {!isOverlay && (
                <div
                  onClick={handleArchive}
                  className="absolute -left-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 border-gray-300 dark:border-neutral-600 opacity-0 translate-x-4 group-hover/card:translate-x-8 group-hover/card:opacity-100 hover:border-green-500 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-500/20 transition-all duration-300 flex items-center justify-center cursor-pointer z-20 bg-white dark:bg-neutral-800 shadow-sm"
                >
                  <CheckOutlined className="text-[10px] text-green-500 dark:text-green-400" />
                </div>
              )}

              {/* More Actions Menu (Right) - Fade and slide in animation */}
              {!isOverlay && (
                <div className="absolute -right-2 -top-1 opacity-0 translate-x-2 group-hover/card:translate-x-0 group-hover/card:opacity-100 z-20 transition-all duration-300">
                  <Dropdown
                    trigger={['click']}
                    placement="bottomRight"
                    popupRender={() => (
                      <div className="bg-white dark:bg-neutral-800 shadow-2xl border border-gray-100 dark:border-neutral-700 rounded-lg overflow-hidden min-w-[140px] animate-in fade-in zoom-in-95 duration-200">
                        <div
                          className="px-3 py-2.5 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer text-sm dark:text-neutral-200 transition-colors"
                          onClick={(e) => { e.stopPropagation(); setIsModalOpen(true); }}
                        >
                          <EditOutlined className="text-xs text-blue-500" />
                          <span>Chỉnh sửa</span>
                        </div>
                        <Popconfirm
                          title="Xóa thẻ"
                          description="Bạn có chắc chắn muốn xóa?"
                          onConfirm={handleDelete}
                          okText="Xóa"
                          cancelText="Hủy"
                          okButtonProps={{ danger: true }}
                        >
                          <div
                            className="px-3 py-2.5 flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer text-sm text-red-500 dark:text-red-400 transition-colors border-t border-gray-50 dark:border-neutral-700"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DeleteOutlined className="text-xs" />
                            <span>Xóa thẻ</span>
                          </div>
                        </Popconfirm>
                      </div>
                    )}
                  >
                    <div
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-md transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreOutlined className="text-gray-400 dark:text-neutral-500" />
                    </div>
                  </Dropdown>
                </div>
              )}

              {/* Content Wrapper with padding transition */}
              <div className="transition-all duration-300 group-hover/card:pl-8 pl-0 pr-4">
                {priorityInfo && (
                  <div className="flex items-center gap-1.5 mb-2">
                    <div
                      className="w-2 h-2 rounded-full shadow-sm"
                      style={{ backgroundColor: priorityInfo.color }}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {priorityInfo.label}
                    </span>
                  </div>
                )}
                <h4 className="font-medium text-gray-900 dark:text-gray-100 leading-snug mb-2">
                  {card.title}
                </h4>

                {/* Labels display */}
                {card.labels && card.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {card.labels.map((l) => (
                      <Tooltip key={l.id} title={l.label}>
                        <div
                          className="h-1.5 min-w-[32px] rounded-full shadow-sm"
                          style={{ backgroundColor: l.color || '#94A3B8' }}
                        />
                      </Tooltip>
                    ))}
                  </div>
                )}

                {card.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {card.description}
                  </p>
                )}

                {/* Members display */}
                {card.members && card.members.length > 0 && (
                  <div className="flex justify-end mt-3">
                    <Avatar.Group
                      maxCount={3}
                      size="small"
                      maxStyle={{ color: '#f56a00', backgroundColor: '#fde3cf', fontSize: '10px' }}
                    >
                      {card.members.map((m) => (
                        <Tooltip key={m.userId} title={m.userName}>
                          <Avatar
                            src={m.userAvatar}
                            icon={<UserOutlined />}
                            className="border-2 border-white dark:border-neutral-800"
                          />
                        </Tooltip>
                      ))}
                    </Avatar.Group>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Placeholder UI - Hiển thị đè lên vùng của card */}
        {isBeingDragged && (
          <div
            className="w-full h-full min-h-[100px] rounded-xl border-2 border-dashed border-blue-400/80 bg-blue-500/15 dark:bg-blue-400/10 animate-pulse pointer-events-none backdrop-blur-sm ring-1 ring-blue-400/50 flex flex-col justify-center items-center py-4"
          >
            <div className="h-4 bg-blue-400/20 dark:bg-blue-300/20 rounded w-3/4 mb-2" />
            <div className="h-3 bg-blue-300/10 dark:bg-blue-200/10 rounded w-1/2" />
          </div>
        )}
      </div>
    </>
  );
});

Card.displayName = 'Card';