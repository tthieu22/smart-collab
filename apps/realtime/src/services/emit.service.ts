import { Server } from 'socket.io';

export class EmitService {
  constructor(private readonly server: Server, private readonly userIdToClients: Map<string, Set<string>>) {}

  emitToProject(projectId: string, event: string, data: any, excludeClientId?: string) {
    excludeClientId
      ? this.server.to(projectId).except(excludeClientId).emit(event, data)
      : this.server.to(projectId).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.userIdToClients.get(userId)?.forEach(id => this.server.to(id).emit(event, data));
  }
}
