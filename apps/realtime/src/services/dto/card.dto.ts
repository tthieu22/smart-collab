// card.dto.ts

export interface CreateCardDto {
  columnId: string;
  projectId: string;
  title: string;
  description?: string;
  status?: string;
  deadline?: string;
  priority?: number;
  position?: number;
  createdById?: string;
}

export interface UpdateCardDto {
  cardId: string;
  title?: string;
  description?: string;
  status?: string;
  deadline?: string;
  priority?: number;
  position?: number;
  updatedById?: string;
}

export interface DeleteCardDto {
  cardId: string;
}

export interface MoveCardDto {
  cardId: string;
  destColumnId: string;
  destIndex: number;
}

export interface GetCardDto {
  cardId?: string;
  columnId?: string;
  projectId?: string;
}

export interface CardResultMessage {
  status: 'success' | 'error';
  action: 'create' | 'update' | 'delete' | 'move' | 'get';
  projectId?: string;
  message?: string;
  card?: CardDto;
  cards?: CardDto[];
}

export interface CardDto {
  id: string;
  projectId: string;
  columnId?: string;
  title: string;
  description?: string;
  status: string;
  deadline?: string;
  priority?: number;
  position: number;
  createdById?: string;
  updatedById?: string;
  createdAt: string;
  updatedAt: string;
  labelIds?: string[];
  viewIds?: string[];
}
