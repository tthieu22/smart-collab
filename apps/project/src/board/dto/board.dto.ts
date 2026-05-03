export interface CreateBoardDto {
  projectId?: string;
  ownerId?: string;
  type: 'board' | 'inbox' | 'calendar';
  title?: string;
  position?: number;
  columnIds?: string[];
}

export interface UpdateBoardDto {
  boardId: string;
  data: Partial<{
    title: string;
    metadata: any;
    position: number;
  }>;
}

export interface DeleteBoardDto {
  boardId: string;
}

export interface GetBoardsDto {
  projectId?: string;
  ownerId?: string;
  type: 'board' | 'inbox' | 'calendar';
}