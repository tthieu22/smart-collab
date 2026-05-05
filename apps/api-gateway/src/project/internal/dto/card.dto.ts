export interface CardMessage {
  correlationId?: string; // dùng để trace message trong RabbitMQ
  cardViewId?: string;    // id của CardView cần move/delete
  cardId?: string;        // id của Card gốc (dùng khi copy)
  projectId?: string;     // id project
  version?: number;       // version hiện tại của cardView (dùng check conflict)
  position?: number;      // vị trí mới
  fromColumnId?: string;  // column cũ
  toColumnId?: string | null; // column mới (null nếu ngoài Board)
  fromComponentId?: string; // component cũ (Inbox/Calendar/Board/Switch)
  toComponentId?: string;   // component mới
  isPinned?: boolean;       // tùy chọn pin card
  customTitle?: string;     // tiêu đề tùy chỉnh
  metadata?: Record<string, any>; // dữ liệu thêm (JSON)
}
