'use client';

import { Avatar, Tooltip, Popover, Badge, List } from 'antd';
import { UserOutlined, CheckCircleFilled } from '@ant-design/icons';
import { projectStore } from '@smart/store/project';
import { useUserStore } from '@smart/store/user';

export default function ProjectPresence({ projectId }: { projectId: string }) {
  const { onlineUsers, members } = projectStore();
  const { currentUser } = useUserStore();

  // Map user IDs to member data from store
  const activeMembers = onlineUsers
    .map(id => {
      const member = Object.values(members).find(m => m.userId === id) as any;
      if (member) return {
        id,
        name: member.userName || member.user?.firstName || 'Unknown',
        avatar: member.userAvatar || member.user?.avatar,
        email: member.userEmail || member.user?.email
      };
      
      if (id === currentUser?.id) return {
        id,
        name: `${currentUser.firstName} ${currentUser.lastName || ''}`.trim(),
        avatar: currentUser.avatar,
        email: currentUser.email
      };

      return null;
    })
    .filter(Boolean) as { id: string; name: string; avatar?: string; email?: string }[];

  if (activeMembers.length === 0) return null;

  // Content for the Popover list
  const onlineListContent = (
    <div className="w-64">
      <div className="px-3 py-2 border-b dark:border-neutral-700 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
          Người dùng đang online ({activeMembers.length})
        </span>
      </div>
      <List
        dataSource={activeMembers}
        renderItem={(user) => (
          <div className="flex items-center gap-3 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-white/5 rounded-lg transition-colors cursor-default group">
            <Badge dot color="green" offset={[-2, 28]}>
              <Avatar src={user.avatar} icon={<UserOutlined />} size="small" />
            </Badge>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium dark:text-neutral-200 truncate">
                {user.name} {user.id === currentUser?.id && '(Bạn)'}
              </span>
              <span className="text-[10px] text-neutral-400 truncate">{user.email}</span>
            </div>
            <CheckCircleFilled className="ml-auto text-green-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      />
    </div>
  );

  return (
    <div className="flex items-center gap-3 px-2">
      <Popover 
        content={onlineListContent} 
        trigger="click" 
        placement="bottomRight"
        overlayClassName="presence-popover"
      >
        <div className="cursor-pointer">
          <Avatar.Group 
            max={{
              count: 3,
              style: { 
                color: '#f56a00', 
                backgroundColor: '#fde3cf',
                cursor: 'pointer',
                fontSize: '12px',
                border: '2px solid white'
              },
            }}
            size="small"
          >
            {activeMembers.map((user) => (
              <Tooltip key={user.id} title={user.name} placement="bottom">
                <div className="relative group transition-transform hover:-translate-y-1">
                  <Avatar 
                    src={user.avatar} 
                    icon={<UserOutlined />} 
                    className="border-2 border-white dark:border-[#1e1f22] shadow-sm"
                  />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-[#1e1f22] rounded-full z-10 shadow-sm" />
                </div>
              </Tooltip>
            ))}
          </Avatar.Group>
        </div>
      </Popover>
      
      {activeMembers.length > 0 && (
        <div className="hidden md:block text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
          {activeMembers.length} đang hoạt động
        </div>
      )}
    </div>
  );
}
