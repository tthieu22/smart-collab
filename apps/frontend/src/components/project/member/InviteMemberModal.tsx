'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Button, Avatar, List, Spin, message } from 'antd';
import { SearchOutlined, UserAddOutlined, MailOutlined } from '@ant-design/icons';
import { autoRequest } from '@smart/services/auto.request';
import { Project } from '@smart/types/project';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export default function InviteMemberModal({ isOpen, onClose, project }: Props) {
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  // Debounced search logic
  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(searchText);
    }, 3000);

    return () => clearTimeout(timer);
  }, [searchText]);

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      setSearchResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      // Gọi API tìm kiếm user (Giả sử có endpoint /users/search)
      const res: any = await autoRequest(`/users/search?q=${value}`);
      if (res?.data) {
        // Lọc bỏ những người đã có trong dự án
        const filtered = res.data.filter((u: any) =>
          !project.members?.some((m: any) => m.userId === u.id)
        );
        setSearchResults(filtered);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error(error);
      // Tạm thời mock data nếu API chưa có để vẫn hiển thị được UI
      setTimeout(() => {
        if (value.includes('@') && !value.includes('demo')) {
          setSearchResults([]);
        } else {
          setSearchResults([
            { id: '1', name: 'Nguyễn Văn A', email: 'nguyenvana@gmail.com', avatar: null },
            { id: '2', name: 'Demo User', email: 'demo@smartcollab.com', avatar: null }
          ]);
        }
        setLoading(false);
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (user: any) => {
    try {
      // Gọi API thêm member vào project
      await autoRequest(`/projects/members`, { method: 'POST', body: JSON.stringify({ projectId: project.id, userId: user.id }) });
      message.success(`Đã thêm ${user.name} vào dự án!`);
      // TODO: Có thể refresh lại danh sách member trong project store
    } catch (error) {
      message.error('Có lỗi xảy ra khi thêm thành viên.');
    }
  };

  const handleSendEmailInvite = async () => {
    try {
      // Gọi API gửi email mời
      await autoRequest(`/projects/invite-email`, {
        method: 'POST',
        body: JSON.stringify({
          email: searchText,
          projectId: project.id,
          projectName: project.name
        })
      });
      message.success(`Đã gửi email mời tham gia dự án đến ${searchText}`);
    } catch (error) {
      message.error('Có lỗi xảy ra khi gửi email.');
    }
  };

  const isEmail = (text: string) => /\S+@\S+\.\S+/.test(text);

  return (
    <Modal
      title="Mời thành viên vào dự án"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      className="dark:text-white"
    >
      <div className="space-y-4 pt-4">
        <Input.Search
          placeholder="Nhập email hoặc tên người dùng..."
          allowClear
          enterButton="Tìm kiếm"
          size="large"
          value={searchText}
          onSearch={(value) => handleSearch(value)}
          onChange={(e) => setSearchText(e.target.value)}
          className="rounded-lg"
        />

        <div className="min-h-[200px]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Spin />
            </div>
          ) : (
            <>
              {/* ===== SEARCH RESULTS ===== */}
              {searched && searchResults.length > 0 && (
                <List
                  itemLayout="horizontal"
                  dataSource={searchResults}
                  renderItem={(item) => (
                    <List.Item
                      actions={[
                        <Button
                          type="primary"
                          icon={<UserAddOutlined />}
                          onClick={() => handleInvite(item)}
                          key="invite"
                        >
                          Thêm
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={<Avatar src={item.avatar}>{item.name?.charAt(0)}</Avatar>}
                        title={item.name}
                        description={item.email}
                      />
                    </List.Item>
                  )}
                />
              )}

              {/* ===== CURRENT MEMBERS ===== */}
              {!searched && project.members && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Thành viên dự án ({project.members.length})
                  </div>
                  <List
                    itemLayout="horizontal"
                    dataSource={project.members}
                    renderItem={(member) => {
                      const name = (member.user?.firstName && member.user.firstName !== 'User')
                        ? member.user.firstName
                        : member.user?.email || 'User';
                      const email = member.user?.email;
                      return (
                        <List.Item>
                          <List.Item.Meta
                            avatar={<Avatar src={member.user?.avatar}>{name.charAt(0)}</Avatar>}
                            title={<span className="font-medium text-gray-900 dark:text-gray-100">{name}</span>}
                            description={
                              <div className="flex items-center gap-2">
                                <span>{email}</span>
                                {member.status === 'PENDING' && (
                                  <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 text-[10px] font-bold uppercase">
                                    Chờ xác nhận
                                  </span>
                                )}
                              </div>
                            }
                          />
                          <div className="text-xs text-gray-400 italic">
                            {member.role === 'OWNER' ? 'Chủ sở hữu' : member.role === 'ADMIN' ? 'Quản trị' : 'Thành viên'}
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                </div>
              )}

              {searched && searchResults.length === 0 && isEmail(searchText) && (
                <div className="text-center py-8 space-y-4">
                  <div className="text-gray-500 dark:text-gray-400">
                    Không tìm thấy người dùng với email <b>{searchText}</b> trong hệ thống.
                  </div>
                  <Button
                    type="primary"
                    icon={<MailOutlined />}
                    onClick={handleSendEmailInvite}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Gửi email mời tham gia dự án
                  </Button>
                </div>
              )}

              {searched && searchResults.length === 0 && !isEmail(searchText) && (
                <div className="text-center py-8 text-gray-500">
                  Không tìm thấy kết quả phù hợp. Vui lòng thử tìm bằng địa chỉ email chính xác.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
