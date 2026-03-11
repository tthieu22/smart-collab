interface CreateBoardDto {
  projectId?: string;
  ownerId?: string;
  type: 'board' | 'inbox' | 'calendar';
  title?: string;
}

interface UpdateBoardDto {
  boardId: string;
  data: Partial<{ title: string; metadata: any; position: number }>;
}

interface DeleteBoardDto {
  boardId: string;
}

interface GetBoardsDto {
  projectId?: string;
  ownerId?: string;
  type: 'board' | 'inbox' | 'calendar';
}


// Định nghĩa DTO nếu chưa có (bạn có thể import từ file dto riêng)
interface CreateBoardDto {
  projectId?: string;
  ownerId?: string;
  type: 'board' | 'inbox' | 'calendar';
  title?: string;
  position?: number;
  columnIds?: string[];
}

interface UpdateBoardDto {
  boardId: string;
  data: Partial<{
    title: string;
    metadata: any;
    position: number;
  }>;
}