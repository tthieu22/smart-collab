// column.dto.ts
export interface ColumnMessage {
  correlationId?: string; // trace message
  columnId: string;       // column cần update
  projectId: string;      // project chứa column
  fromPosition?: number;  // vị trí cũ
  toPosition: number;     // vị trí mới
  version?: number;       // version hiện tại để check conflict
}
