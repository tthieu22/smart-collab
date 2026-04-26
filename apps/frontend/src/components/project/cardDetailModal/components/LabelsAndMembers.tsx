'use client';

import React, { useState, useMemo } from 'react';
import { Space, Tag, Avatar, Button, Typography, Modal, Input, theme, List, Tooltip } from 'antd';
import { PlusOutlined, UserOutlined, CloseOutlined } from '@ant-design/icons';
import { useBoardStore } from '@smart/store/setting';
import { projectStore } from '@smart/store/project';

const { Text } = Typography;

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Member {
  userId: string;
  userName?: string | null;
  userAvatar?: string | null;
}

interface Props {
  labels: Label[];
  cardMembers: Member[];
  onAddLabel?: (label: Label) => void;
  onRemoveLabel?: (labelId: string) => void;
  onAddMember?: (member: any) => void;
  onRemoveMember?: (userId: string) => void;
  onInviteMember?: (email: string) => void;
}

function rgbToHex(rgb: string): string {
  const result = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgb);
  if (!result) return '#000000'; // fallback nếu không đúng định dạng
  const r = parseInt(result[1], 10);
  const g = parseInt(result[2], 10);
  const b = parseInt(result[3], 10);
  return (
    '#' +
    [r, g, b]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

const LabelsAndMembers: React.FC<Props> = ({
  labels,
  cardMembers,
  onAddLabel,
  onRemoveLabel,
  onAddMember,
  onRemoveMember,
  onInviteMember
}) => {
  const { token } = theme.useToken();

  // Lấy colors từ zustand store, convert rgb sang hex nếu cần
  const colorsRaw = useBoardStore(state => state.colors);
  const colors = useMemo(
    () =>
      colorsRaw.map(color => (color.startsWith('rgb') ? rgbToHex(color) : color)),
    [colorsRaw]
  );

  // Lấy members (object) từ projectStore, chuyển thành array (đây là danh sách member CỦA PROJECT để chọn)
  const projectMembersObj = projectStore(state => state.members);
  const projectMembers = useMemo(() => Object.values(projectMembersObj || {}), [projectMembersObj]);

  // Modal Label states
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(colors[0] ?? '#000000');
  const [newLabelName, setNewLabelName] = useState('');

  // Modal Member states
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  // Lọc project members theo search (tên + email) và loại bỏ những người ĐÃ CÓ trong card
  const filteredProjectMembers = useMemo(() => {
    const keyword = memberSearch.trim().toLowerCase();
    const existingUserIds = cardMembers.map(m => m.userId);

    let list = projectMembers.filter(m => !existingUserIds.includes(m.userId));

    if (!keyword) return list;

    return list.filter(m => {
      const fullName = `${m.user?.firstName ?? ''} ${m.user?.lastName ?? ''}`.toLowerCase();
      const email = m.user?.email?.toLowerCase() ?? '';
      return fullName.includes(keyword) || email.includes(keyword);
    });
  }, [memberSearch, projectMembers, cardMembers]);

  // Thêm member
  const handleSelectMember = (pm: any) => {
    onAddMember?.({
      userId: pm.userId,
      userName: `${pm.user?.firstName ?? ''} ${pm.user?.lastName ?? ''}`.trim() || pm.user?.email,
      userAvatar: pm.user?.avatar
    });
    setIsMemberModalOpen(false);
    setMemberSearch('');
  };

  // Invite qua email
  const handleInvite = () => {
    if (!memberSearch.trim()) return;
    onInviteMember?.(memberSearch.trim());
    setIsMemberModalOpen(false);
    setMemberSearch('');
  };

  // Mở modal label
  const showLabelModal = () => {
    setNewLabelName('');
    setSelectedColor(colors[0] ?? '#000000');
    setIsLabelModalOpen(true);
  };

  // Xử lý thêm label
  const handleLabelModalOk = () => {
    if (!newLabelName.trim()) return;

    const newLabel: Label = {
      id: `label_${Date.now()}`,
      name: newLabelName.trim(),
      color: selectedColor,
    };

    onAddLabel?.(newLabel);
    setIsLabelModalOpen(false);
  };
  const handleLabelModalCancel = () => setIsLabelModalOpen(false);

  // Xử lý modal member
  const showMemberModal = () => setIsMemberModalOpen(true);
  const handleMemberModalCancel = () => {
    setIsMemberModalOpen(false);
    setMemberSearch('');
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <div>
        <Text strong style={{ color: token.colorText, display: 'block', marginBottom: 8 }}>Labels:</Text>
        <div className="flex flex-wrap gap-2 items-center">
          {labels.map(l => (
            <Tag
              key={l.id}
              color={l.color}
              closable
              onClose={() => onRemoveLabel?.(l.id)}
              className="px-3 py-0.5 rounded-full border-none flex items-center gap-1"
            >
              {l.name}
            </Tag>
          ))}
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={showLabelModal}
            className="rounded-full border-dashed"
          >
            Thêm nhãn
          </Button>
        </div>
      </div>

      <div>
        <Text strong style={{ color: token.colorText, display: 'block', marginBottom: 8 }}>Members:</Text>
        <div className="flex flex-wrap gap-2 items-center">
          {cardMembers.map(m => (
            <Tooltip title={m.userName} key={m.userId}>
              <div className="relative group">
                <Avatar
                  size="default"
                  src={m.userAvatar ?? undefined}
                  icon={!m.userAvatar && <UserOutlined />}
                  className="border-2 border-white dark:border-neutral-800 shadow-sm"
                />
                <div
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10"
                  onClick={() => onRemoveMember?.(m.userId)}
                >
                  <CloseOutlined style={{ fontSize: 8 }} />
                </div>
              </div>
            </Tooltip>
          ))}
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={showMemberModal}
            shape="circle"
            className="flex items-center justify-center border-dashed"
          />
        </div>
      </div>

      {/* Modal thêm Label */}
      <Modal
        title="Tạo nhãn mới"
        open={isLabelModalOpen}
        onOk={handleLabelModalOk}
        onCancel={handleLabelModalCancel}
        okText="Tạo nhãn"
        cancelText="Hủy"
        centered
      >
        <div className="py-4">
          <Text type="secondary" className="mb-2 block">Tên nhãn</Text>
          <Input
            placeholder="Ví dụ: Quan trọng, Khẩn cấp..."
            value={newLabelName}
            onChange={e => setNewLabelName(e.target.value)}
            style={{ marginBottom: 16 }}
            autoFocus
          />

          <Text type="secondary" className="mb-2 block">Chọn màu sắc</Text>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {colors.map(color => (
              <div
                key={color}
                onClick={() => setSelectedColor(color)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  backgroundColor: color,
                  cursor: 'pointer',
                  border: selectedColor === color ? `2px solid ${token.colorPrimary}` : '2px solid transparent',
                  boxShadow: selectedColor === color ? '0 0 0 2px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
              />
            ))}

            <Tooltip title="Màu tùy chỉnh">
              <input
                type="color"
                value={selectedColor}
                onChange={e => setSelectedColor(e.target.value)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: `1px solid #ccc`,
                  cursor: 'pointer',
                  padding: 0,
                  backgroundColor: 'transparent',
                }}
              />
            </Tooltip>
          </div>
        </div>
      </Modal>

      {/* Modal thêm Member */}
      <Modal
        title="Thêm thành viên vào thẻ"
        open={isMemberModalOpen}
        onCancel={handleMemberModalCancel}
        footer={null}
        centered
      >
        <Input
          placeholder="Tìm kiếm theo tên hoặc email..."
          value={memberSearch}
          onChange={e => setMemberSearch(e.target.value)}
          style={{ marginBottom: 16 }}
          allowClear
          prefix={<UserOutlined className="text-gray-400" />}
        />

        {filteredProjectMembers.length > 0 ? (
          <List
            size="small"
            bordered
            className="rounded-lg overflow-hidden border-gray-100 dark:border-neutral-700"
            dataSource={filteredProjectMembers}
            renderItem={pm => (
              <List.Item
                key={pm.id}
                className="hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors"
                onClick={() => handleSelectMember(pm)}
              >
                <div className="flex items-center gap-3 w-full">
                  <Avatar
                    size="small"
                    src={pm.user?.avatar ?? undefined}
                    icon={!pm.user?.avatar && <UserOutlined />}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{`${pm.user?.firstName ?? ''} ${pm.user?.lastName ?? ''}`}</span>
                    <span className="text-xs text-gray-400">{pm.user?.email}</span>
                  </div>
                </div>
              </List.Item>
            )}
            style={{ maxHeight: 300, overflowY: 'auto' }}
          />
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-neutral-800/50 rounded-lg border border-dashed border-gray-200 dark:border-neutral-700">
            <Text type="secondary">Không tìm thấy thành viên mới nào.</Text> <br />
            {memberSearch.trim() && (
              <Button
                type="primary"
                ghost
                size="small"
                style={{ marginTop: 12 }}
                onClick={handleInvite}
              >
                Mời "{memberSearch.trim()}" qua email
              </Button>
            )}
          </div>
        )}
      </Modal>
    </Space>
  );
};

export default LabelsAndMembers;
