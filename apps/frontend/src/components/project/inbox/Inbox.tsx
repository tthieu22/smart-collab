'use client';
import { Board as BoardType, Column as ColumnType } from '@smart/types/project';
import { projectStore } from '@smart/store/project';
import { useBoardStore } from '@smart/store/setting';
import Column from '../board/Column';
import { Draggable, Droppable } from '@hello-pangea/dnd';

interface InboxProps {
  board: BoardType;
  className?: string;
}

export default function Inbox({ board, className }: InboxProps) {
  const columnsStore = projectStore((s) => s.columns);
  const currentProject = projectStore((s) => s.currentProject);
  const theme = useBoardStore((s) => s.theme);

  if (!currentProject) return <div>Không có dự án</div>;
  if (!board) return <div>Không tìm thấy Inbox</div>;

  const columns: ColumnType[] = (board.columnIds ?? [])
    .map((id) => columnsStore[id])
    .filter((col): col is ColumnType => Boolean(col))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <Droppable droppableId={board.id} type="COLUMN" direction="horizontal">
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          data-board-scroll
          className={`flex gap-4 overflow-x-auto overflow-y-hidden p-4 rounded-2xl transition-all duration-300 backdrop-blur-sm w-full ${
            className ?? ''
          } ${
            theme === 'dark'
              ? 'bg-gradient-to-br from-[#1e1f22] to-[#2b2d31] text-gray-100'
              : 'bg-gradient-to-br from-[#f4f5f7] to-[#e9ebee] text-gray-900'
          }`}
          style={{
            flexWrap: 'nowrap',
            backgroundColor:
              theme === 'dark'
                ? currentProject.color ?? '#1e1f22'
                : currentProject.color ?? '#f4f5f7',
            backgroundImage:
              currentProject.fileUrl || currentProject.background
                ? `url(${currentProject.fileUrl ?? currentProject.background})`
                : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '300px',
            ...(theme === 'dark' && {
              backgroundBlendMode: 'normal',
              filter: 'brightness(0.9)',
            }),
            maxWidth: '100vw',
          }}
        >
          {columns.map((col, index) => (
            <Draggable
              key={col.id}
              draggableId={col.id}
              index={index}
              isDragDisabled={true} // Inbox không drag
            >
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  style={{
                    ...provided.draggableProps.style,
                    userSelect: 'none',
                  }}
                >
                  <div>
                    <Column column={col} />
                  </div>
                </div>
              )}
            </Draggable>
          ))}

          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
