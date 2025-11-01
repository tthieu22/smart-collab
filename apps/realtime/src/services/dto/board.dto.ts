// board.dto.ts
export type BoardType = 'board' | 'inbox' | 'calendar';

export interface BoardBase {
  id?: string;
  projectId?: string | null;
  ownerId?: string;
  type: BoardType;
  title?: string;
  position?: number;
  columnIds?: string[];
  metadata?: any;
}

// CREATE
export interface CreateBoardDto {
  projectId?: string;
  ownerId?: string;
  type: BoardType;
  title?: string;
}

// UPDATE
export interface UpdateBoardDto {
  boardId: string;
  projectId?: string;
  updates: Partial<Omit<BoardBase, 'id' | 'ownerId' | 'projectId'>>;
}

// DELETE
export interface DeleteBoardDto {
  boardId: string;
  projectId?: string;
  ownerId?: string;
}

// GET
export interface GetBoardsDto {
  projectId?: string;
  ownerId?: string;
  type: BoardType;
}

// RESPONSE MESSAGE
export interface BoardResultMessage {
  status: 'success' | 'error';
  action: 'create' | 'get' | 'update' | 'delete';
  board?: BoardBase;
  boards?: BoardBase[];
  boardId?: string;
  projectId?: string;
  ownerId?: string;
  message?: string; // error message
}
