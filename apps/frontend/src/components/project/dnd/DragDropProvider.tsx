'use client';

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DndContext,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  DragOverlay,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
} from '@dnd-kit/core';
import { projectStore } from '@smart/store/project';
import { getProjectSocketManager } from '@smart/store/realtime';
import Column from '@smart/components/project/board/Column';
import { Card } from '@smart/components/project/board/Card';
import { DndMonitor } from './DndMonitor';
import { DragContext } from './DragContext';
import { useUserStore } from '@smart/store/user';

interface Props {
  children: React.ReactNode;
  boardTypes?: Record<string, 'board' | 'inbox' | 'calendar'>;
}

export default function DragDropProvider({ children, boardTypes = {} }: Props) {
  const { currentProject } = projectStore();
  const socket = getProjectSocketManager();

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [activeItem, setActiveItem] = useState<any>(null);
  const [overData, setOverData] = useState<any>(null);
  const [overIndex, setOverIndex] = useState<number>(-1);
  const pointerPosRef = useRef({ x: 0, y: 0 });

  const columnScrollContainers = useRef(new Map<string, HTMLElement>());
  const boardScrollContainers = useRef(new Map<string, HTMLElement>());

  const currentUserId = useUserStore.getState().currentUser?.id;
  const registerScrollContainer = useCallback(
    (columnId: string, node: HTMLElement | null) => {
      if (!columnId) return;
      const containers = columnScrollContainers.current;
      if (!node) {
        containers.delete(columnId);
      } else {
        containers.set(columnId, node);
      }
    },
    []
  );

  const registerBoardScrollContainer = useCallback(
    (boardId: string, node: HTMLElement | null) => {
      if (!boardId) return;
      const containers = boardScrollContainers.current;
      if (!node) {
        containers.delete(boardId);
      } else {
        containers.set(boardId, node);
      }
    },
    []
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }, // Giảm xuống 5 để nhạy hơn
    }),
    useSensor(KeyboardSensor)
  );

  const getColumnCardIds = (columnId: string): string[] => {
    return projectStore.getState().columnCards[columnId] ?? [];
  };

  const getIndexFromPointer = (pointerY: number, items: string[], columnId: string): number => {
    if (items.length === 0) return 0;

    // Tìm index của item đang kéo trong danh sách này (nếu có)
    const activeItemIdx = items.indexOf(String(activeId));

    for (let i = 0; i < items.length; i++) {
      const cardId = items[i];
      // Bỏ qua chính card đang kéo vì nó đang bị ẩn (h-0)
      if (cardId === String(activeId)) continue;

      const el = document.getElementById(cardId);
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;

      if (pointerY < midpoint) {
        // Nếu pointer ở trên midpoint của card i:
        // - Nếu card i nằm sau card đang kéo (i > activeItemIdx), thì vị trí chèn là i-1 (vì card dang kéo sẽ bị nhấc ra)
        // - Nếu card i nằm trước card đang kéo (i < activeItemIdx), thì vị trí chèn là i
        // - Nếu không có card đang kéo trong list này (kéo từ cột khác sang), thì vị trí chèn là i
        return (activeItemIdx !== -1 && i > activeItemIdx) ? i - 1 : i;
      }
    }

    // Nếu không nằm trước bất kỳ card nào, trả về vị trí cuối
    // Nếu card đang kéo ở trong list này, vị trí cuối thực tế là items.length - 1
    return activeItemIdx !== -1 ? items.length - 1 : items.length;
  };

  const getColumnIndexFromPointer = (pointerX: number, columnIds: string[]): number => {
    if (columnIds.length === 0) return 0;

    for (let i = 0; i < columnIds.length; i++) {
      const colId = columnIds[i];
      const el = document.getElementById(colId);
      if (!el) continue;

      const rect = el.getBoundingClientRect();
      // Nếu pointer ở bên trái điểm giữa của cột, thì index là i (trước cột này)
      if (pointerX < rect.left + rect.width / 2) {
        return i;
      }
    }

    return columnIds.length;
  };

  const findDropIndex = (over: any, items: string[], columnId?: string): number => {
    if (!over) return items.length;

    // Nếu over là một Card cụ thể
    if (over.data?.current?.type === 'CARD') {
      const idx = items.indexOf(String(over.id));
      return idx === -1 ? items.length : idx;
    }

    // Nếu over là Column hoặc Board, sử dụng pointer để tính index chính xác hơn
    if (columnId && (over.data?.current?.type === 'COLUMN' || over.data?.current?.type === 'BOARD')) {
      return getIndexFromPointer(pointerPosRef.current.y, items, columnId);
    }

    // Fallback cũ
    if (items.includes(String(over.id))) {
      return items.indexOf(String(over.id));
    }

    return items.length;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveItem(active.data.current);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    setOverId(over.id);
    const data = over.data?.current ?? null;
    setOverData(data);

    if (activeItem?.type === 'CARD') {
      const activeIdStr = String(active.id);
      const overIdStr = String(over.id);

      const srcColumnId = activeItem.columnId;
      const overColumnId = data?.type === 'CARD' ? data.columnId : (data?.type === 'COLUMN' ? overIdStr : null);

      if (overColumnId && srcColumnId !== overColumnId) {
        // Chuyển card sang cột khác trong store local (hiệu ứng preview)
        const destItems = getColumnCardIds(overColumnId);
        const destIndex = findDropIndex(over, destItems, overColumnId);

        projectStore.getState().moveCard(srcColumnId, overColumnId, activeIdStr, destIndex);

        // Cập nhật lại columnId cho activeItem để các lần dragOver sau đúng logic
        activeItem.columnId = overColumnId;
      } else if (overColumnId && srcColumnId === overColumnId) {
        // Sắp xếp lại trong cùng 1 cột (hiệu ứng preview)
        const destItems = getColumnCardIds(overColumnId);
        const destIndex = findDropIndex(over, destItems, overColumnId);

        projectStore.getState().moveCard(srcColumnId, overColumnId, activeIdStr, destIndex);
      }
    }

    // Cập nhật overIndex cho các logic hiển thị khác
    if (data?.type === 'COLUMN') {
      const columnId = data.columnId || String(over.id);
      const items = getColumnCardIds(columnId);
      const idx = getIndexFromPointer(pointerPosRef.current.y, items, columnId);
      setOverIndex(idx);
    } else if (data?.type === 'CARD') {
      const items = getColumnCardIds(data.columnId);
      const idx = items.indexOf(String(over.id));
      setOverIndex(idx);
    } else {
      setOverIndex(-1);
    }
  };

  const handleDragMove = (event: any) => {
    const { active, over } = event;
    if (active.rect.current.translated) {
      pointerPosRef.current = {
        x: active.rect.current.translated.left + active.rect.current.translated.width / 2,
        y: active.rect.current.translated.top + active.rect.current.translated.height / 2,
      };
    }

    // Cập nhật overIndex liên tục khi di chuyển để mượt mà hơn
    const data = over?.data?.current;
    if (data?.type === 'COLUMN' || data?.type === 'BOARD') {
      const columnId = data.columnId || (data.type === 'COLUMN' ? String(over?.id) : null);
      if (columnId) {
        const items = getColumnCardIds(columnId);
        const idx = getIndexFromPointer(pointerPosRef.current.y, items, columnId);
        setOverIndex(idx);
      }
    } else if (data?.type === 'CARD') {
      const columnId = data.columnId;
      const items = getColumnCardIds(columnId);
      const idx = items.indexOf(String(over?.id));
      if (idx !== -1) setOverIndex(idx);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const toIsoDateTime = (value: string | number | Date | undefined) => {
      if (value == null) return undefined;
      const date = value instanceof Date ? value : new Date(value);
      if (Number.isNaN(date.getTime())) return undefined;
      return date.toISOString();
    };

    const { active, over } = event;

    // Nếu over là calendar thì KHÔNG cập nhật lại overData (để giữ start/end đúng)
    if (over?.data?.current?.type !== 'CALENDAR') {
      setOverData(over?.data?.current ?? null);
    }

    if (!over || !currentProject?.id || !activeItem) {
      setActiveId(null);
      setOverId(null);
      setActiveItem(null);
      setOverData(null);
      return;
    }

    // Lấy overData từ state, vì nó có thể chứa start/end nếu là calendar
    const currentOverData = overData;

    const ctrlPressed =
      (event.activatorEvent as MouseEvent)?.ctrlKey ||
      (event.activatorEvent as MouseEvent)?.metaKey;

    const projectId = currentProject.id;

    if (activeItem.type === 'COLUMN') {
      const srcBoardId = activeItem.boardId;
      const destBoardId = currentOverData?.boardId ?? srcBoardId;
      const columnId = String(active.id);

      if (
        boardTypes[srcBoardId] === 'board' &&
        boardTypes[destBoardId] === 'board' &&
        srcBoardId === destBoardId
      ) {
        const state = projectStore.getState();
        const columnIds = state.boardColumns[destBoardId] || [];
        const activeIndex = columnIds.indexOf(columnId);

        if (activeIndex === -1) {
          setActiveId(null);
          setOverId(null);
          setActiveItem(null);
          setOverData(null);
          return;
        }

        let destIndex = activeIndex;

        if (currentOverData?.type === 'COLUMN') {
          // Sử dụng index của cột đích trực tiếp từ dnd-kit
          const overIndex = columnIds.indexOf(String(over.id));
          if (overIndex !== -1) {
            destIndex = overIndex;
          }
        } else {
          // Nếu thả vào vùng trống (BOARD) hoặc over bị null, dùng pointer để tính vị trí chính xác nhất
          const pointerIndex = getColumnIndexFromPointer(pointerPosRef.current.x, columnIds);
          destIndex = pointerIndex;
        }

        if (destIndex !== activeIndex) {
          // Điều chỉnh index nếu đang di chuyển trong cùng 1 board (vì card hiện tại sẽ bị xóa khỏi vị trí cũ)
          // Tuy nhiên hàm moveColumn trong store thường đã handle việc này
          projectStore
            .getState()
            .moveColumn(srcBoardId, destBoardId, columnId, destIndex);

          socket.moveColumn(projectId, srcBoardId, destBoardId, columnId, destIndex);
        }
      }

      setActiveId(null);
      setOverId(null);
      setActiveItem(null);
      setOverData(null);
      return;
    }

    function isPersonalBoard(
      type: string | undefined
    ): type is 'inbox' | 'calendar' {
      return type === 'inbox' || type === 'calendar';
    }

    if (activeItem.type === 'CARD') {
      const srcBoardId = activeItem.boardId;
      const destBoardId = currentOverData?.boardId ?? srcBoardId;
      const srcColumnId = activeItem.columnId;

      if (currentOverData?.type === 'CALENDAR') {
        const payload = {
          cardId: String(active.id),
          srcBoardId,
          destBoardId: currentOverData.boardId,
          start: currentOverData.start,
          end: currentOverData.end,
          userId: currentUserId,
        };
        console.log(payload);
      }

      const srcBoardType = boardTypes[srcBoardId] as
        | 'board'
        | 'inbox'
        | 'calendar'
        | undefined;
      const destBoardType = boardTypes[destBoardId] as
        | 'board'
        | 'inbox'
        | 'calendar'
        | undefined;

      if (destBoardType === 'calendar') {
        const start = currentOverData?.start;
        const end = currentOverData?.end;
        const calendarColumnId = currentOverData?.columnId;

        const payload = {
          cardId: String(active.id),
          srcBoardId,
          destBoardId,
          srcColumnId,
          destColumnId: calendarColumnId,
          destIndex: 0,
          start,
          end,
          userId: currentUserId,
        };

        const isCopy = ctrlPressed;
        if (isCopy) {
          socket.copyCard(
            { projectId: undefined, userId: currentUserId },
            payload
          );
        } else {
          socket.moveCard(
            { projectId: undefined, userId: currentUserId },
            payload
          );
        }

        if (start) {
          socket.updateCard(
            undefined,
            String(active.id),
            'update-basic',
            { deadline: toIsoDateTime(start) },
            currentUserId
          );
        }
      } else if (isPersonalBoard(srcBoardType) && !isPersonalBoard(destBoardType)) {
        const destColumnId =
          currentOverData?.columnId ??
          (currentOverData?.type === 'COLUMN' ? String(over.id) : null);
        if (!destColumnId) {
          setActiveId(null);
          setOverId(null);
          setActiveItem(null);
          setOverData(null);
          return;
        }

        const destItems = getColumnCardIds(destColumnId);
        const destIndex = findDropIndex(over, destItems, destColumnId);

        const payload = {
          cardId: String(active.id),
          srcBoardId,
          destBoardId,
          srcColumnId,
          destColumnId,
          destIndex,
          userId: currentUserId,
        };

        const isCopy = ctrlPressed;
        if (isCopy) {
          socket.copyCard(
            { projectId: undefined, userId: currentUserId },
            payload
          );
        } else {
          socket.moveCard(
            { projectId: undefined, userId: currentUserId },
            payload
          );
        }
      } else {
        const destColumnId =
          currentOverData?.columnId ??
          (currentOverData?.type === 'COLUMN' ? String(over.id) : srcColumnId);

        const destItems = getColumnCardIds(destColumnId);
        const destIndex = findDropIndex(over, destItems, destColumnId);

        const payload = {
          cardId: String(active.id),
          srcBoardId,
          destBoardId,
          srcColumnId,
          destColumnId,
          destIndex,
          userId: currentUserId,
        };

        const srcIsPersonal = isPersonalBoard(srcBoardType);
        const destIsPersonal = isPersonalBoard(destBoardType);
        const scopeProjectId =
          srcIsPersonal || destIsPersonal ? undefined : projectId;
        const isCopy = ctrlPressed;

        if (isCopy) {
          socket.copyCard({ projectId: scopeProjectId, userId: currentUserId }, payload);
        } else {
          socket.moveCard({ projectId: scopeProjectId, userId: currentUserId }, payload);
        }
      }
    }

    setActiveId(null);
    setOverId(null);
    setActiveItem(null);
    setOverData(null);
  };


  const { cards, columns } = projectStore.getState();

  const overlay = useMemo(() => {
    if (!activeId || !activeItem) return null;

    if (activeItem.type === 'CARD' && cards[activeId]) {
      return (
        <div className="w-[280px] pointer-events-none">
          <Card
            card={cards[activeId]}
            columnId={activeItem.columnId}
            boardId={activeItem.boardId}
            boardType={activeItem.boardType}
            index={activeItem.index}
            isOverlay
          />
        </div>
      );
    }

    if (activeItem.type === 'COLUMN' && columns[activeId]) {
      return (
        <div className="w-[280px] h-[80vh] pointer-events-none">
          <Column
            column={columns[activeId]}
            boardId={activeItem.boardId}
            boardType={activeItem.boardType}
            index={activeItem.index}
            isOverlay
          />
        </div>
      );
    }

    return null;
  }, [activeId, activeItem, cards, columns]);

  const contextValue = useMemo(
    () => ({
      activeId,
      overId,
      activeItem,
      registerScrollContainer,
      registerBoardScrollContainer,
      overData,
      setOverData,
      overIndex,
      setOverIndex,
    }),
    [
      activeId,
      activeItem,
      overId,
      overData,
      registerScrollContainer,
      registerBoardScrollContainer,
      setOverData,
      overIndex,
    ]
  );

  const customCollisionDetection = useCallback((args: any) => {
    const { active } = args;
    const isDraggingColumn = active?.data?.current?.type === 'COLUMN';

    // 1. Tìm các va chạm bằng pointer
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      // Nếu đang kéo COLUMN, chỉ quan tâm đến va chạm với COLUMN hoặc BOARD khác
      if (isDraggingColumn) {
        const columnCollision = pointerCollisions.find(c => c.data?.type === 'COLUMN');
        if (columnCollision) return [columnCollision];

        const boardCollision = pointerCollisions.find(c => c.data?.type === 'BOARD');
        if (boardCollision) return [boardCollision];

        return pointerCollisions.filter(c => c.data?.type !== 'CARD');
      }

      // Nếu đang kéo CARD, ưu tiên tìm card đích dưới chuột
      const cardCollision = pointerCollisions.find(c => c.data?.type === 'CARD');
      if (cardCollision) return [cardCollision];

      // Nếu không chạm card nhưng chạm column, ưu tiên column
      const columnCollision = pointerCollisions.find(c => c.data?.type === 'COLUMN');
      if (columnCollision) return [columnCollision];

      return pointerCollisions;
    }

    // 2. Fallback về closestCenter
    return closestCenter(args);
  }, []);

  return (
    <DragContext.Provider value={contextValue}>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        autoScroll={{
          enabled: false,
          // threshold: { x: 0.15, y: 0.15 },
          // acceleration: 20,
          // interval: 20,
        }}
      >
        {/* ✅ Hook useDndMonitor giờ nằm đúng vị trí */}
        <DndMonitor
          columnScrollContainers={columnScrollContainers}
          boardScrollContainers={boardScrollContainers}
          activeItem={activeItem}
          overData={overData}
        />

        {children}

        <DragOverlay
          adjustScale={false}
          dropAnimation={{
            duration: 350,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}
          className="pointer-events-none z-[9999]"
        >
          {overlay}
        </DragOverlay>
      </DndContext>
    </DragContext.Provider>
  );
}
