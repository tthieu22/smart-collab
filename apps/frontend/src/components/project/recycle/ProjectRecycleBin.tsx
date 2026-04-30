'use client';

import { useEffect, useState } from 'react';
import { DeleteOutlined, RollbackOutlined, FileTextOutlined, FolderOutlined, AppstoreOutlined } from '@ant-design/icons';
import { List, Button, Tag, Spin, message, Empty } from 'antd';
import { autoRequest } from '@smart/services/auto.request';

interface DeletedItem {
  id: string;
  title?: string;
  name?: string;
  type: 'project' | 'board' | 'column' | 'card';
  deletedAt: string;
}

export default function ProjectRecycleBin({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeleted = async () => {
    try {
      const res = await autoRequest<{ success: boolean; data: DeletedItem[] }>(`/projects/${projectId}/recycle-bin`, { method: 'GET' });
      if (res.success) {
        setItems(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch recycle bin', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeleted();
  }, [projectId]);

  const onRestore = async (item: DeletedItem) => {
    try {
      const res = await autoRequest<{ success: boolean }>(`/projects/${projectId}/restore`, {
        method: 'POST',
        body: JSON.stringify({ type: item.type, id: item.id }),
      });
      if (res.success) {
        message.success(`Đã khôi phục ${item.type} thành công`);
        setItems((prev) => prev.filter((i) => i.id !== item.id));
      }
    } catch (err) {
      message.error('Khôi phục thất bại');
    }
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'project': return <FolderOutlined className="text-blue-500" />;
      case 'board': return <AppstoreOutlined className="text-purple-500" />;
      case 'card': return <FileTextOutlined className="text-orange-500" />;
      default: return <DeleteOutlined />;
    }
  };

  return (
    <div className="p-6 h-full bg-white dark:bg-neutral-900 flex flex-col">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <DeleteOutlined className="text-neutral-500" />
          Recycle Bin
        </h2>
        <p className="text-sm opacity-50">Các mục đã xóa trong 30 ngày qua sẽ xuất hiện ở đây.</p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex justify-center p-8"><Spin /></div>
        ) : items.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={items}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    key="restore" 
                    icon={<RollbackOutlined />} 
                    type="text" 
                    onClick={() => onRestore(item)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Restore
                  </Button>
                ]}
                className="hover:bg-neutral-50 dark:hover:bg-neutral-800 px-3 rounded-lg transition-colors border-none mb-1"
              >
                <List.Item.Meta
                  avatar={<div className="text-2xl mt-1">{getItemIcon(item.type)}</div>}
                  title={<span className="font-semibold">{item.title || item.name}</span>}
                  description={
                    <div className="flex items-center gap-2">
                      <Tag color="default">{item.type.toUpperCase()}</Tag>
                      <span className="text-[10px] opacity-40">
                        Xóa lúc: {new Date(item.deletedAt).toLocaleString()}
                      </span>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="Thùng rác trống" image={Empty.PRESENTED_IMAGE_SIMPLE} className="mt-12" />
        )}
      </div>
    </div>
  );
}
