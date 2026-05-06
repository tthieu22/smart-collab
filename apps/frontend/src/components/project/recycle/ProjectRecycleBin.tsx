'use client';

import { useEffect, useState } from 'react';
import {
  DeleteOutlined,
  RollbackOutlined,
  FileTextOutlined,
  FolderOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  ClearOutlined,
  ArrowRightOutlined,
  SwitcherOutlined
} from '@ant-design/icons';
import { Button, Tag, Spin, message, Empty, Input, Tooltip, Typography } from 'antd';
import { autoRequest } from '@smart/services/auto.request';
import { useBoardStore } from '@smart/store/setting';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Text } = Typography;

interface DeletedItem {
  id: string;
  title?: string;
  name?: string;
  type: 'project' | 'board' | 'column' | 'card';
  deletedAt: string;
  // Metadata from backend
  column?: { title: string };
  board?: { title: string };
  project?: { name: string };
}

export default function ProjectRecycleBin({ projectId }: { projectId: string }) {
  const theme = useBoardStore((s) => s.theme);
  const [items, setItems] = useState<DeletedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

    // Realtime listener
    const { getProjectSocketManager } = require('@smart/store/realtime');
    const socketManager = getProjectSocketManager();

    const unsubAdded = socketManager.subscribe('realtime.recycle.added', (item: DeletedItem) => {
      setItems((prev) => {
        if (prev.some(i => i.id === item.id)) return prev;
        return [item, ...prev];
      });
    });

    const unsubRemoved = socketManager.subscribe('realtime.recycle.removed', (data: { id: string }) => {
      setItems((prev) => prev.filter(i => i.id !== data.id));
    });

    return () => {
      unsubAdded();
      unsubRemoved();
    };
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
      case 'column': return <SwitcherOutlined className="text-emerald-500" />;
      case 'card': return <FileTextOutlined className="text-orange-500" />;
      default: return <DeleteOutlined />;
    }
  };

  const getDaysRemaining = (deletedAt: string) => {
    const expiryDate = dayjs(deletedAt).add(30, 'day');
    const days = expiryDate.diff(dayjs(), 'day');
    return days > 0 ? days : 0;
  };

  const filteredItems = items.filter(item =>
    (item.title || item.name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={`h-full flex flex-col font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0b1220]' : 'bg-white'}`}>
      {/* HEADER SECTION - Standardized with Board/Inbox */}
      <div className={`
        flex-none px-4 h-12 flex items-center justify-between z-10 relative border-b
        ${theme === 'dark' ? 'bg-[#1e1f22] border-white/5' : 'bg-white border-gray-100'}
      `}>
        <div className="flex items-center gap-3">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center
            ${theme === 'dark' ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}
          `}>
            <DeleteOutlined className="text-base" />
          </div>
          <h1 className={`text-sm font-bold tracking-tight m-0 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Hố Đen
          </h1>
          <div className={`h-4 w-[1px] ${theme === 'dark' ? 'bg-white/20' : 'bg-gray-300'} mx-1`} />
          <Tooltip title="Các mục trong hố đen sẽ bị nghiền nát vĩnh viễn sau 30 ngày">
            <InfoCircleOutlined className="text-neutral-400 cursor-help" />
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <Input
            prefix={<SearchOutlined className="opacity-40 text-[10px]" />}
            placeholder="Tìm kiếm..."
            size="small"
            className="bg-neutral-100 dark:bg-white/5 border-none rounded h-7 text-[11px] w-32"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Tooltip title="Xóa tất cả">
            <Button
              icon={<ClearOutlined />}
              type="text"
              size="small"
              className="text-neutral-400 hover:text-red-500 flex items-center justify-center"
            />
          </Tooltip>
        </div>
      </div>

      {/* CONTENT SECTION */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <Spin />
            <span className="text-[11px] opacity-40 uppercase font-black">Scanning database...</span>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {filteredItems.map((item) => {
              const daysLeft = getDaysRemaining(item.deletedAt);
              return (
                <div
                  key={item.id}
                  className="group flex flex-col p-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100 dark:bg-white/5 dark:hover:bg-white/10 transition-all duration-300 border border-transparent hover:border-blue-500/20 shadow-sm hover:shadow-md relative overflow-hidden"
                >
                  {/* Progress bar hint for deletion */}
                  <div className="absolute bottom-0 left-0 h-1 bg-red-500/20" style={{ width: `${(daysLeft / 30) * 100}%` }} />

                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-white dark:bg-neutral-800 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform duration-500">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h4 className="text-sm font-black text-neutral-800 dark:text-neutral-100 m-0 truncate">
                          {item.title || item.name}
                        </h4>
                        <Tag className="rounded-full px-1.5 py-0 border-none bg-neutral-200 dark:bg-white/10 text-[8px] font-black text-neutral-600 dark:text-neutral-400 m-0">
                          {item.type.toUpperCase()}
                        </Tag>
                      </div>

                      {/* SMART METADATA: Breadcrumbs/Location */}
                      <div className="flex flex-col gap-0.5 text-[9px] text-neutral-400 font-medium leading-tight">
                        {item.type === 'card' && item.column && (
                          <span className="flex items-center gap-1 opacity-80">
                            <AppstoreOutlined className="text-[7px]" />
                            {item.board?.title || 'Board'}
                            <ArrowRightOutlined className="text-[7px] opacity-40" />
                            {item.column.title}
                          </span>
                        )}
                        {item.type === 'column' && item.board && (
                          <span className="flex items-center gap-1 opacity-80">
                            <AppstoreOutlined className="text-[7px]" />
                            {item.board.title}
                          </span>
                        )}
                        <span className="flex items-center gap-1 opacity-60">
                          <ClockCircleOutlined className="text-[7px]" />
                          Xóa {dayjs(item.deletedAt).fromNow()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-200/50 dark:border-white/5">
                    <Text className={`text-[9px] font-bold ${daysLeft < 5 ? 'text-red-500 animate-pulse' : 'text-neutral-400 opacity-60'}`}>
                      Còn {daysLeft} ngày
                    </Text>
                    <div className="flex items-center gap-1">
                      <Tooltip title="Xem chi tiết">
                        <Button icon={<InfoCircleOutlined />} type="text" size="small" className="text-neutral-400 hover:text-blue-500 text-[10px]" />
                      </Tooltip>
                      <Button
                        icon={<RollbackOutlined />}
                        type="primary"
                        size="small"
                        onClick={() => onRestore(item)}
                        className="bg-blue-600 hover:bg-blue-700 border-none shadow-md shadow-blue-500/10 rounded-lg h-7 px-3 font-bold text-[10px]"
                      >
                        Restore
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center bg-neutral-50 dark:bg-white/5 rounded-[40px] border-2 border-dashed border-neutral-200 dark:border-white/5">
            <Empty
              description={
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-bold text-neutral-400">Hố đen đang tĩnh lặng (Trống)</span>
                  <span className="text-[10px] opacity-40 uppercase tracking-widest font-black">Tốt lắm! Bạn đang quản lý công việc rất gọn gàng</span>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        )}
      </div>
    </div>
  );
}
