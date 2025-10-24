export interface ProjectMessage {
  correlationId: string;      // ID để tracking message
  projectId?: string;         // ID project liên quan
  projects?: any[];           // Danh sách project (cho event list)
  project?: Record<string, any>; // Chi tiết project (cho event created/updated)
  userId?: string;            // ID user thực hiện action
  role?: string;              // Vai trò user trong project
  member?: Record<string, any>; // Thông tin member
  [key: string]: any;         // Cho các field mở rộng khác
}

export interface LockResult {
  status: 'success' | 'error';
  message?: string;
}