// column.dto.ts

export interface CreateColumnDto {
  boardId: string;
  projectId?: string;
  title: string;
  position?: number;
  metadata?: Record<string, any>;
}

export interface UpdateColumnDto {
  columnId: string;
  title?: string;
  position?: number;
  metadata?: Record<string, any>;
}

export interface DeleteColumnDto {
  columnId: string;
}

export interface GetColumnDto {
  columnId?: string;
  boardId?: string;
  projectId?: string;
}

export interface ColumnResultMessage {
  status: 'success' | 'error';
  action: 'create' | 'update' | 'delete' | 'get';
  projectId?: string;
  message?: string;
  column?: ColumnDto;
  columns?: ColumnDto[];
}

export interface ColumnDto {
  id: string;
  projectId: string;
  boardId?: string;
  title: string;
  position: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  cardIds?: string[];
  viewIds?: string[];
}
