'use client';

import { useEffect, useState } from 'react';
import { Avatar, Tooltip, Badge } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { getProjectSocketManager } from '@smart/store/realtime';

interface OnlineUser {
  userId: string;
  userName: string;
  userAvatar?: string;
}

export default function ProjectPresence({ projectId }: { projectId: string }) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const socketManager = getProjectSocketManager();
    
    // Subscribe to presence updates
    const unsub = socketManager.subscribeCorrelation('realtime.project.presence', (data: any) => {
      if (data.projectId === projectId) {
        setOnlineUsers(data.users || []);
      }
    });

    // Request initial presence
    // In a real app, the server would broadcast when someone joins
    
    return () => unsub();
  }, [projectId]);

  if (onlineUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-full border border-white/10">
      <div className="text-[10px] uppercase font-bold opacity-50 mr-2">Online Now</div>
      <Avatar.Group max={{ count: 4 }} size="small">
        {onlineUsers.map((user) => (
          <Tooltip key={user.userId} title={user.userName}>
            <Badge dot color="green" offset={[-2, 22]}>
              <Avatar src={user.userAvatar} icon={<UserOutlined />} />
            </Badge>
          </Tooltip>
        ))}
      </Avatar.Group>
    </div>
  );
}
