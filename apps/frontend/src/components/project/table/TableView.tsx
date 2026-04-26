'use client';

import React, { useMemo, useState } from 'react';
import { Table, Tag, theme, Button, Space, Popconfirm, message, Checkbox, Popover, Avatar, Tooltip, Pagination, Input } from 'antd';
import { DeleteOutlined, SettingOutlined, UserOutlined, EnvironmentOutlined, CommentOutlined, PaperClipOutlined, ExpandOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { projectStore } from '@smart/store/project';
import { Card, Board, CardLabel } from '@smart/types/project';
import dayjs from 'dayjs';
import { useBoardStore } from '@smart/store/setting';
import CardDetailModal from '../cardDetailModal/CardDetailModalById';
import { getProjectSocketManager } from '@smart/store/realtime';
import ProjectViewHeader from '../ProjectViewHeader';

interface Props {
  board: Board;
}

const TableView: React.FC<Props> = ({ board }) => {
  const { token } = theme.useToken();
  const themeMode = useBoardStore((s) => s.theme);
  const { cards, columns, boardColumns, currentProject } = projectStore();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState('');

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'title', 'status', 'priority', 'deadline', 'members', 'location', 'stats', 'action'
  ]);

  // Lấy danh sách card thuộc board hiện tại
  const { Search } = Input;

  // Lấy danh sách card thuộc board hiện tại và lọc theo tìm kiếm
  const boardCards = useMemo(() => {
    const colIds = boardColumns[board.id] || [];
    const allCards: Card[] = [];
    colIds.forEach((colId) => {
      const col = columns[colId];
      if (col && col.cardIds) {
        col.cardIds.forEach((cardId) => {
          const card = cards[cardId];
          if (card) {
            const matchesSearch = !searchText ||
              card.title.toLowerCase().includes(searchText.toLowerCase()) ||
              (card.description && card.description.toLowerCase().includes(searchText.toLowerCase()));
            if (matchesSearch) allCards.push(card);
          }
        });
      }
    });
    return allCards;
  }, [board.id, boardColumns, columns, cards, searchText]);

  // Dữ liệu đã phân trang
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return boardCards.slice(start, start + pageSize);
  }, [boardCards, currentPage, pageSize]);

  const columnsDef = useMemo(() => {
    const allDefs = [
      {
        title: 'Bìa',
        dataIndex: 'coverUrl',
        key: 'cover',
        width: 80,
        render: (url: string) => {
          if (!url) return <div className="w-12 h-8 rounded bg-gray-50 dark:bg-neutral-800/50 border border-dashed border-gray-200 dark:border-neutral-700" />;

          const isColor = url.startsWith('rgb') || url.startsWith('#');
          return (
            <div
              className="w-12 h-8 rounded shadow-sm border border-gray-100 dark:border-neutral-700 transition-transform hover:scale-110 cursor-pointer overflow-hidden"
              style={{
                backgroundColor: isColor ? url : 'transparent',
                backgroundImage: isColor ? 'none' : `url("${url}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            />
          );
        },
      },
      {
        title: 'Tiêu đề',
        dataIndex: 'title',
        key: 'title',
        width: 300,
        fixed: 'left' as const,
        render: (text: string, record: Card) => (
          <div className="flex flex-col">
            <span
              className="font-bold cursor-pointer hover:text-blue-500 transition-colors text-sm"
              onClick={() => setSelectedCardId(record.id)}
            >
              {text}
            </span>
            {record.description && (
              <span className="text-[10px] text-gray-400 line-clamp-1">{record.description}</span>
            )}
          </div>
        ),
        sorter: (a: Card, b: Card) => a.title.localeCompare(b.title),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'columnId',
        key: 'status',
        width: 140,
        render: (columnId: string) => {
          const col = columns[columnId];
          return (
            <Tag color="cyan" bordered={false} className="rounded-full px-3 text-[10px] font-medium">
              {col?.title?.toUpperCase() || 'UNKNOWN'}
            </Tag>
          );
        },
        filters: (boardColumns[board.id] || []).map(id => ({ text: columns[id]?.title, value: id })),
        onFilter: (value: any, record: Card) => record.columnId === value,
      },
      {
        title: 'Ưu tiên',
        dataIndex: 'priority',
        key: 'priority',
        width: 130,
        render: (priority: number) => {
          const priorities = [
            { label: 'Thấp', color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
            { label: 'Trung bình', color: '#1890ff', bg: '#e6f7ff', border: '#91d5ff' },
            { label: 'Cao', color: '#faad14', bg: '#fffbe6', border: '#ffe58f' },
            { label: 'Khẩn cấp', color: '#ff4d4f', bg: '#fff1f0', border: '#ffa39e' },
          ];
          const p = priorities[priority] || priorities[0];
          return (
            <Tag color={p.color} className="m-0 border-none rounded-full px-2 text-[10px] font-bold">
              {p.label}
            </Tag>
          );
        },
        sorter: (a: Card, b: Card) => (a.priority || 0) - (b.priority || 0),
      },
      {
        title: 'Vị trí',
        key: 'location',
        width: 200,
        render: (_: any, record: Card) => {
          if (!record.latitude || !record.longitude) return <span className="text-gray-300 text-xs">-</span>;
          return (
            <Space className="text-xs text-blue-500 cursor-pointer hover:underline">
              <EnvironmentOutlined />
              <span className="line-clamp-1 max-w-[150px]">
                {record.locationName || `${Number(record.latitude).toFixed(3)}, ${Number(record.longitude).toFixed(3)}`}
              </span>
            </Space>
          );
        },
      },
      {
        title: 'Tiến độ',
        key: 'progress',
        width: 120,
        render: (_: any, record: Card) => {
          const items = record.checklist || [];
          if (items.length === 0) return <span className="text-gray-300 text-xs">-</span>;

          const total = items.length;
          const completed = items.filter(item => item.done).length;
          const percentage = Math.round((completed / total) * 100);

          return (
            <div className="w-full flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-[10px] font-medium text-gray-500">{percentage}%</span>
            </div>
          );
        }
      },
      {
        title: 'Thống kê',
        key: 'stats',
        width: 100,
        render: (_: any, record: Card) => (
          <Space size={8} className="text-gray-400 text-xs">
            <Tooltip title="Bình luận">
              <Space size={2}>
                <CommentOutlined />
                <span>{record.comments?.length || 0}</span>
              </Space>
            </Tooltip>
            <Tooltip title="Đính kèm">
              <Space size={2}>
                <PaperClipOutlined />
                <span>{record.attachments?.length || 0}</span>
              </Space>
            </Tooltip>
          </Space>
        ),
      },
      {
        title: 'Nhãn',
        dataIndex: 'labels',
        key: 'labels',
        width: 180,
        render: (labels: CardLabel[]) => (
          <div className="flex flex-wrap gap-1">
            {labels?.map(label => (
              <Tag key={label.id} color={label.color} bordered={false} className="m-0 rounded text-[9px] px-1.5 py-0 font-medium">
                {label.label?.toUpperCase()}
              </Tag>
            ))}
          </div>
        ),
      },
      {
        title: 'Thành viên',
        dataIndex: 'members',
        key: 'members',
        width: 140,
        render: (members: any[]) => (
          <Avatar.Group max={{ count: 3 }} size="small">
            {members?.map(m => (
              <Tooltip title={m.userName || 'Thành viên'} key={m.id || m.userId}>
                <Avatar src={m.userAvatar} icon={<UserOutlined />} className="border border-white dark:border-neutral-800" />
              </Tooltip>
            ))}
          </Avatar.Group>
        ),
      },
      {
        title: 'Thời hạn',
        key: 'dates',
        width: 180,
        render: (_: any, record: Card) => (
          <div className="flex flex-col text-[11px]">
            {record.startDate && (
              <div className="flex items-center gap-1 text-gray-400">
                <span className="w-8 italic opacity-60">Bắt đầu:</span>
                <span>{dayjs(record.startDate).format('DD MMM')}</span>
              </div>
            )}
            {record.deadline && (
              <div className={`flex items-center gap-1 ${dayjs().isAfter(dayjs(record.deadline)) ? 'text-red-500 font-bold' : 'text-blue-500'}`}>
                <span className="w-8 italic opacity-60">Hạn:</span>
                <span>{dayjs(record.deadline).format('DD MMM')}</span>
              </div>
            )}
            {!record.startDate && !record.deadline && <span className="text-gray-300">-</span>}
          </div>
        )
      },
      {
        title: 'Ngày tạo',
        dataIndex: 'createdAt',
        key: 'createdAt',
        width: 140,
        render: (date: string) => date ? (
          <div className="flex flex-col text-[10px]">
            <span className="text-gray-500 font-medium">{dayjs(date).format('DD/MM/YYYY')}</span>
            <span className="text-gray-400 opacity-60">{dayjs(date).format('HH:mm')}</span>
          </div>
        ) : '-',
        sorter: (a: Card, b: Card) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      },
      {
        title: 'Hành động',
        key: 'action',
        fixed: 'right' as const,
        width: 100,
        render: (_: any, record: Card) => (
          <Space size="small">
            <Tooltip title="Chi tiết">
              <Button size="small" type="text" icon={<ExpandOutlined className="text-blue-500" />} onClick={() => setSelectedCardId(record.id)} />
            </Tooltip>
            <Popconfirm
              title="Xóa thẻ"
              description="Bạn có chắc chắn muốn xóa thẻ này?"
              onConfirm={async () => {
                try {
                  const socket = getProjectSocketManager();
                  await socket.deleteCard(board.projectId || '', record.id);
                  message.success('Đã xóa thẻ');
                } catch (error) {
                  message.error('Xóa thẻ thất bại');
                }
              }}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return allDefs.filter(col => visibleColumns.includes(col.key));
  }, [columns, board.projectId, visibleColumns, boardColumns, board.id]);

  const columnOptions = [
    { label: 'Bìa', value: 'cover' },
    { label: 'Tiêu đề', value: 'title' },
    { label: 'Trạng thái', value: 'status' },
    { label: 'Ưu tiên', value: 'priority' },
    { label: 'Vị trí', value: 'location' },
    { label: 'Tiến độ', value: 'progress' },
    { label: 'Thống kê', value: 'stats' },
    { label: 'Nhãn', value: 'labels' },
    { label: 'Thành viên', value: 'members' },
    { label: 'Thời gian', value: 'dates' },
    { label: 'Ngày tạo', value: 'createdAt' },
  ];
  return (
    <div className="flex-1 flex flex-col p-4 bg-[#f8f9fa] dark:bg-neutral-950 rounded-xl min-h-0 overflow-hidden">
      {/* Premium Header */}
      <ProjectViewHeader
        icon={<UnorderedListOutlined style={{ fontSize: 24 }} />}
        title="Quản lý Công việc"
        tagText="Quản lý công việc"
        tagColor="cyan"
        count={boardCards.length}
        filterText={searchText || 'Tất cả'}
        extra={
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <Search
              placeholder="Tìm kiếm nhanh..."
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full lg:w-64 premium-search"
            />

            <div className="flex items-center gap-2">
              <Pagination
                size="small"
                current={currentPage}
                pageSize={pageSize}
                total={boardCards.length}
                showSizeChanger
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                pageSizeOptions={['10', '20', '30', '50', '100']}
                className="custom-pagination"
              />

              <Popover
                title="Cấu hình hiển thị"
                trigger="click"
                placement="bottomRight"
                content={
                  <div className="flex flex-col gap-3 min-w-[200px] p-2">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cột hiển thị</div>
                    <div className="grid grid-cols-1 gap-2">
                      {columnOptions.map(opt => (
                        <Checkbox
                          key={opt.value}
                          checked={visibleColumns.includes(opt.value)}
                          onChange={(e) => {
                            if (e.target.checked) setVisibleColumns([...visibleColumns, opt.value]);
                            else setVisibleColumns(visibleColumns.filter(c => c !== opt.value));
                          }}
                          className="text-xs font-medium"
                        >
                          {opt.label}
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                }
              >
                <Button icon={<SettingOutlined />} className="border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">Cột</Button>
              </Popover>
            </div>
          </div>
        }
      />

      {/* Table container with modern scrolling */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-gray-100 dark:border-neutral-800 flex flex-col">
        <Table
          dataSource={paginatedData}
          columns={columnsDef}
          rowKey="id"
          sticky={true}
          scroll={{ x: 'max-content', y: 'calc(100vh - 350px)' }}
          pagination={false}
          className="premium-table"
        />
      </div>

      {selectedCardId && (
        <CardDetailModal
          cardId={selectedCardId}
          isOpen={!!selectedCardId}
          onClose={() => setSelectedCardId(null)}
        />
      )}

      <style jsx global>{`
        .custom-table .ant-table {
          background: transparent !important;
        }
        
        /* Đảm bảo các ô fixed có background để không bị lộ nội dung khi cuộn */
        .custom-table .ant-table-cell-fix-left,
        .custom-table .ant-table-cell-fix-right {
          background: ${themeMode === 'dark' ? '#171717' : '#fff'} !important;
          z-index: 20 !important;
        }
        
        .custom-table .ant-table-thead > tr > th {
          background: ${themeMode === 'dark' ? '#262626' : '#fafafa'} !important;
          color: ${themeMode === 'dark' ? '#fff' : '#000'} !important;
          border-bottom: 1px solid ${themeMode === 'dark' ? '#404040' : '#f0f0f0'} !important;
          z-index: 30 !important; /* Header phải cao hơn fixed cell */
        }

        .custom-table .ant-table-thead > tr > th.ant-table-cell-fix-left,
        .custom-table .ant-table-thead > tr > th.ant-table-cell-fix-right {
          z-index: 40 !important; /* Header fixed cell phải cao nhất */
          background: ${themeMode === 'dark' ? '#262626' : '#fafafa'} !important;
        }

        .custom-table .ant-table-tbody > tr > td {
          color: ${themeMode === 'dark' ? '#d4d4d4' : '#000'} !important;
          border-bottom: 1px solid ${themeMode === 'dark' ? '#262626' : '#f0f0f0'} !important;
        }
        
        .custom-table .ant-table-tbody > tr:hover > td {
          background: ${themeMode === 'dark' ? '#262626' : '#fafafa'} !important;
        }
        
        /* Pagination styles */
        .custom-pagination .ant-pagination-item, 
        .custom-pagination .ant-pagination-prev, 
        .custom-pagination .ant-pagination-next,
        .custom-pagination .ant-pagination-options-quick-jumper input {
          background: transparent !important;
          border-color: ${themeMode === 'dark' ? '#404040' : '#d9d9d9'} !important;
          color: ${themeMode === 'dark' ? '#d4d4d4' : 'rgba(0, 0, 0, 0.88)'} !important;
        }
        
        .custom-pagination .ant-pagination-item-active {
          border-color: ${token.colorPrimary} !important;
        }
        
        .custom-pagination .ant-pagination-item-active a {
          color: ${token.colorPrimary} !important;
        }

        .custom-pagination .ant-pagination-item a {
          color: ${themeMode === 'dark' ? '#d4d4d4' : 'rgba(0, 0, 0, 0.88)'} !important;
        }

        /* Sticky header holder */
        .custom-table .ant-table-sticky-holder {
           top: 0px !important;
           z-index: 50 !important;
        }
      `}</style>
    </div>
  );
};

export default TableView;
