'use client';

import React, { useState, useMemo } from 'react';
import { Space, Tag, Avatar, Button, Typography, Modal, Input, theme, List } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';
import { useBoardStore } from '@smart/store/setting';
import { projectStore } from '@smart/store/project';

const { Text } = Typography;

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Props {
  labels: Label[];
  onAddLabel?: (label: Label) => void;
  onAddMember?: (memberId: string) => void;
  onInviteMember?: (email: string) => void;
}

const LabelsAndMembers: React.FC<Props> = ({ labels, onAddLabel, onAddMember, onInviteMember }) => {
  const { token } = theme.useToken();

  // Lấy colors từ zustand store
  const colors = useBoardStore(state => state.colors);

  // Lấy members (object) từ projectStore, chuyển thành array
  const membersObj = projectStore(state => state.members);
  const members = useMemo(() => Object.values(membersObj || {}), [membersObj]);

  // Modal Label states
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(colors[0]);

  // Modal Member states
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  // Lọc members theo search (tên + email)
  const filteredMembers = useMemo(() => {
    const keyword = memberSearch.trim().toLowerCase();
    if (!keyword) return members;

    return members.filter(m => {
      const fullName = `${m.user?.firstName ?? ''} ${m.user?.lastName ?? ''}`.toLowerCase();
      const email = m.user?.email?.toLowerCase() ?? '';
      return fullName.includes(keyword) || email.includes(keyword);
    });
  }, [memberSearch, members]);

  // Thêm member (gọi callback truyền member.id)
  const handleAddMember = (memberId: string) => {
    onAddMember?.(memberId);
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
    setSelectedColor(colors[0]);
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
    <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
      <div>
        <Text strong style={{ color: token.colorText }}>Labels:</Text>{' '}
        <Space>
          {labels.map(l => (
            <Tag key={l.id} color={l.color}>
              {l.name}
            </Tag>
          ))}
          <Button size="small" icon={<PlusOutlined />} onClick={showLabelModal}>
            Add
          </Button>
        </Space>
      </div>

      <div>
        <Text strong style={{ color: token.colorText }}>Members:</Text>{' '}
        <Space>
          {members.slice(0, 3).map(m => (
            <Avatar
              key={m.id}
              size="small"
              src={m.user?.avatar ?? undefined}
              icon={!m.user?.avatar && <UserOutlined />}
              alt={`${m.user?.firstName ?? ''} ${m.user?.lastName ?? ''}`}
            />
          ))}
          <Button size="small" icon={<PlusOutlined />} onClick={showMemberModal}>
            Add
          </Button>
        </Space>
      </div>

      {/* Modal thêm Label */}
      <Modal
        title="Add Label"
        open={isLabelModalOpen}
        onOk={handleLabelModalOk}
        onCancel={handleLabelModalCancel}
        okText="Add"
        cancelText="Cancel"
      >
        <Input
          placeholder="Label name"
          value={newLabelName}
          onChange={e => setNewLabelName(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {colors.map(color => (
            <div
              key={color}
              onClick={() => setSelectedColor(color)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 4,
                backgroundColor: color,
                cursor: 'pointer',
                border: selectedColor === color ? `3px solid ${token.colorPrimary}` : '1px solid #ccc',
              }}
            />
          ))}

          <input
            type="color"
            value={selectedColor}
            onChange={e => setSelectedColor(e.target.value)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 4,
              border: `1px solid #ccc`,
              cursor: 'pointer',
              padding: 0,
              marginLeft: 8,
              backgroundColor: 'transparent',
            }}
            title="Choose custom color"
          />
        </div>
      </Modal>

      {/* Modal thêm Member */}
      <Modal
        title="Add Member"
        open={isMemberModalOpen}
        onCancel={handleMemberModalCancel}
        footer={null}
      >
        <Input
          placeholder="Search members by name or email"
          value={memberSearch}
          onChange={e => setMemberSearch(e.target.value)}
          style={{ marginBottom: 16 }}
          allowClear
        />

        {filteredMembers.length > 0 ? (
          <List
            size="small"
            bordered
            dataSource={filteredMembers}
            renderItem={member => (
              <List.Item
                key={member.id}
                style={{ cursor: 'pointer' }}
                onClick={() => handleAddMember(member.id)}
              >
                <Avatar
                  size="small"
                  src={member.user?.avatar ?? undefined}
                  icon={!member.user?.avatar && <UserOutlined />}
                  style={{ marginRight: 8 }}
                />
                <span>{`${member.user?.firstName ?? ''} ${member.user?.lastName ?? ''}`} ({member.user?.email})</span>
              </List.Item>
            )}
            style={{ maxHeight: 300, overflowY: 'auto' }}
          />
        ) : (
          <div>
            <Text>No member found.</Text> <br></br>
            <Button
              type="primary"
              style={{ marginTop: 12 }}
              onClick={handleInvite}
              disabled={!memberSearch.trim()}
            >
              Invite "{memberSearch.trim()}" by email
            </Button>
          </div>
        )}
      </Modal>
    </Space>
  );
};

export default LabelsAndMembers;
