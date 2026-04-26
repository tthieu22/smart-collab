'use client';

import React, { useMemo, useState } from 'react';
import { Table, Tag, theme, Button, Space, Popconfirm, message, Checkbox, Popover, Avatar, Tooltip, Pagination } from 'antd';
import { DeleteOutlined, SettingOutlined, UserOutlined } from '@ant-design/icons';
import { projectStore } from '@smart/store/project';
import { Card, Board, CardLabel } from '@smart/types/project';
import dayjs from 'dayjs';
import { useBoardStore } from '@smart/store/setting';
import CardDetailModal from '../cardDetailModal/CardDetailModalById';
import { getProjectSocketManager } from '@smart/store/realtime';

interface Props {
  board: Board;
}

const TableView: React.FC<Props> = ({ board }) => {
  const { token } = theme.useToken();
  const themeMode = useBoardStore((s) => s.theme);
  const { cards, columns, boardColumns, currentProject } = projectStore();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<string[]>([
    'title', 'status', 'priority', 'startDate', 'deadline', 'members', 'labels', 'action'
  ]);

  // Lấy danh sách card thuộc board hiện tại
  const boardCards = useMemo(() => {
    const colIds = boardColumns[board.id] || [];
    const allCards: Card[] = [];
    colIds.forEach((colId) => {
      const col = columns[colId];
      if (col && col.cardIds) {
        col.cardIds.forEach((cardId) => {
          if (cards[cardId]) allCards.push(cards[cardId]);
        });
      }
    });
    return allCards;
  }, [board.id, boardColumns, columns, cards]);

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
        width: 100,
        render: (url: string) => {
          if (!url) return <div className="w-16 h-10 rounded bg-gray-50 dark:bg-neutral-800/50 border border-dashed border-gray-200 dark:border-neutral-700" />;

          const isColor = url.startsWith('rgb') || url.startsWith('#');
          return (
            <div
              className="w-16 h-10 rounded shadow-sm border border-gray-100 dark:border-neutral-700 transition-transform hover:scale-110 cursor-pointer overflow-hidden"
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
        width: 250,
        fixed: 'left' as const, // Cố định bên trái
        render: (text: string, record: Card) => (
          <span
            className="font-medium cursor-pointer hover:text-blue-500 transition-colors"
            onClick={() => setSelectedCardId(record.id)}
          >
            {text}
          </span>
        ),
        sorter: (a: Card, b: Card) => a.title.localeCompare(b.title),
      },
      {
        title: 'Trạng thái',
        dataIndex: 'columnId',
        key: 'status',
        width: 150,
        render: (columnId: string) => {
          const col = columns[columnId];
          return <Tag color="blue">{col?.title || 'Unknown'}</Tag>;
        },
      },
      {
        title: 'Ưu tiên',
        dataIndex: 'priority',
        key: 'priority',
        width: 150,
        render: (priority: number) => {
          const colors = ['#52c41a', '#1890ff', '#fa8c16', '#f5222d'];
          const labels = ['Thấp', 'Trung bình', 'Cao', 'Khẩn cấp'];
          return (
            <Space>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: colors[priority] || '#d9d9d9' }} />
              <span>{labels[priority] || 'Thấp'}</span>
            </Space>
          );
        },
        sorter: (a: Card, b: Card) => (a.priority || 0) - (b.priority || 0),
      },
      {
        title: 'Nhãn',
        dataIndex: 'labels',
        key: 'labels',
        width: 200,
        render: (labels: CardLabel[]) => (
          <div className="flex flex-wrap gap-1">
            {labels?.map(label => (
              <Tag key={label.id} color={label.color} style={{ fontSize: '10px' }}>
                {label.label}
              </Tag>
            ))}
          </div>
        ),
      },
      {
        title: 'Thành viên',
        dataIndex: 'members',
        key: 'members',
        width: 150,
        render: (members: any[]) => (
          <Avatar.Group max={{ count: 3 }} size="small">
            {members?.map(m => (
              <Tooltip title={m.userName || 'Thành viên'} key={m.id || m.userId}>
                <Avatar src={m.userAvatar} icon={<UserOutlined />} />
              </Tooltip>
            ))}
          </Avatar.Group>
        ),
      },
      {
        title: 'Bắt đầu',
        dataIndex: 'startDate',
        key: 'startDate',
        width: 180,
        render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-',
      },
      {
        title: 'Hạn chót',
        dataIndex: 'deadline',
        key: 'deadline',
        width: 180,
        render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-',
      },
      {
        title: 'Mô tả',
        dataIndex: 'description',
        key: 'description',
        width: 300,
        render: (text: string) => text ? <span className="text-gray-500 line-clamp-1 text-xs">{text}</span> : '-',
      },
      {
        title: 'Hành động',
        key: 'action',
        fixed: 'right' as const, // Cố định bên phải
        width: 120,
        render: (_: any, record: Card) => (
          <Space size="middle">
            <Button size="small" type="link" onClick={() => setSelectedCardId(record.id)}>
              Chi tiết
            </Button>
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
              <Button size="small" type="link" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return allDefs.filter(col => visibleColumns.includes(col.key));
  }, [columns, board.projectId, visibleColumns]);

  const columnOptions = [
    { label: 'Tiêu đề', value: 'title' },
    { label: 'Trạng thái', value: 'status' },
    { label: 'Ưu tiên', value: 'priority' },
    { label: 'Nhãn', value: 'labels' },
    { label: 'Thành viên', value: 'members' },
    { label: 'Bắt đầu', value: 'startDate' },
    { label: 'Hạn chót', value: 'deadline' },
    { label: 'Mô tả', value: 'description' },
  ];

  return (
    <div className="flex-1 flex flex-col p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-800 min-h-0">
      {/* Header with Title and Pagination */}
      <div className="mb-4 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-semibold dark:text-white">Danh sách công việc</h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400">Tổng cộng {boardCards.length} công việc</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-gray-50 dark:bg-neutral-800/50 p-2 rounded-lg border border-gray-100 dark:border-neutral-700 w-full lg:w-auto">
          <Pagination
            size="small"
            current={currentPage}
            pageSize={pageSize}
            total={boardCards.length}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => <span className="text-xs text-gray-400">Tổng {total}</span>}
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
            pageSizeOptions={['10', '20', '30', '50']}
            className="custom-pagination"
          />

          <div className="hidden sm:block w-[1px] h-4 bg-gray-200 dark:bg-neutral-700 mx-1" />

          <Popover
            title="Ẩn/Hiện cột"
            trigger="click"
            content={
              <div className="flex flex-col gap-2 max-h-[300px] overflow-auto p-1">
                {columnOptions.map(opt => (
                  <Checkbox
                    key={opt.value}
                    checked={visibleColumns.includes(opt.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setVisibleColumns([...visibleColumns, opt.value]);
                      } else {
                        setVisibleColumns(visibleColumns.filter(c => c !== opt.value));
                      }
                    }}
                  >
                    {opt.label}
                  </Checkbox>
                ))}
              </div>
            }
          >
            <Button size="small" icon={<SettingOutlined />} type="text" className="dark:text-neutral-300">Cột</Button>
          </Popover>
        </div>
      </div>

      {/* Table container */}
      <div className="flex-1 overflow-auto border border-gray-100 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900">
        <Table
          dataSource={paginatedData}
          columns={columnsDef}
          rowKey="id"
          sticky={true}
          scroll={{ x: 1500 }} // Tăng chiều rộng cuộn ngang để kích hoạt fixed column rõ hơn
          pagination={false}
          className="custom-table"
          style={{
            backgroundColor: 'transparent',
          }}
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
