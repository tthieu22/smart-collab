'use client';

import { useState, useEffect } from 'react';
import { Modal, Input, Button, Avatar, List, Spin, message, Popconfirm, Tag, Tooltip } from 'antd';
import { SearchOutlined, UserAddOutlined, MailOutlined, UserDeleteOutlined, CrownOutlined, SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons';
import { autoRequest } from '@smart/services/auto.request';
import { Project, ProjectMember } from '@smart/types/project';

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
    }, 500);

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
      const res: any = await autoRequest(`/users/search?q=${value}`);
      if (res?.data) {
        const filtered = res.data.filter((u: any) =>
          !project.members?.some((m: any) => m.userId === u.id)
        );
        setSearchResults(filtered);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (user: any) => {
    try {
      await autoRequest(`/projects/members`, { method: 'POST', body: JSON.stringify({ projectId: project.id, userId: user.id }) });
      message.success(`Đã mời ${user.name} vào dự án!`);
      setSearchResults(prev => prev.filter(u => u.id !== user.id));
    } catch (error) {
      message.error('Có lỗi xảy ra khi thêm thành viên.');
    }
  };
  
  const handleRemoveMember = async (userId: string, userName: string) => {
    try {
      await autoRequest(`/projects/remove-member`, { 
        method: 'POST', 
        body: JSON.stringify({ projectId: project.id, userId }) 
      });
      message.success(`Đã xóa ${userName} khỏi dự án.`);
    } catch (error) {
      message.error('Có lỗi xảy ra khi xóa thành viên.');
    }
  };

  const handleSendEmailInvite = async () => {
    try {
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

  const getRoleTag = (role: string) => {
    switch (role) {
      case 'OWNER':
        return <Tag color="gold" icon={<CrownOutlined />} className="m-0 border-none px-2 rounded-full font-semibold">Chủ dự án</Tag>;
      case 'ADMIN':
        return <Tag color="blue" icon={<SafetyCertificateOutlined />} className="m-0 border-none px-2 rounded-full font-semibold">Quản trị</Tag>;
      default:
        return <Tag color="default" icon={<TeamOutlined />} className="m-0 border-none px-2 rounded-full font-semibold">Thành viên</Tag>;
    }
  };

  return (
    <Modal
      title={<span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">Cộng tác viên</span>}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      destroyOnHidden
      width={550}
      centered
      className="invite-member-modal dark-modal"
    >
      <div className="space-y-6 pt-4">
        <div className="relative">
          <Input
            placeholder="Tìm theo email hoặc tên người dùng..."
            allowClear
            size="large"
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="rounded-xl border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white shadow-sm hover:shadow-md transition-shadow h-12"
          />
        </div>

        <div className="min-h-[300px] max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col justify-center items-center h-48 space-y-3">
              <Spin size="large" className="custom-spin" />
              <span className="text-gray-400 animate-pulse">Đang tìm kiếm...</span>
            </div>
          ) : (
            <>
              {/* ===== SEARCH RESULTS ===== */}
              {searched && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-indigo-500 uppercase tracking-widest pl-1">Kết quả tìm kiếm</div>
                  {searchResults.length > 0 ? (
                    <List
                      itemLayout="horizontal"
                      dataSource={searchResults}
                      renderItem={(item) => (
                        <div className="group flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all duration-300 mb-2">
                          <div className="flex items-center space-x-3">
                            <Avatar size={44} src={item.avatar} className="border-2 border-white dark:border-gray-700 shadow-sm">
                              {item.name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <div className="flex flex-col overflow-hidden max-w-[250px]">
                              <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{item.name}</span>
                              <span className="text-xs text-gray-400 truncate">{item.email}</span>
                            </div>
                          </div>
                          <Button
                            type="primary"
                            shape="round"
                            icon={<UserAddOutlined />}
                            onClick={() => handleInvite(item)}
                            className="bg-indigo-600 hover:bg-indigo-700 border-none shadow-indigo-200"
                          >
                            Thêm
                          </Button>
                        </div>
                      )}
                    />
                  ) : isEmail(searchText) ? (
                    <div className="text-center py-10 px-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700">
                      <div className="text-gray-400 mb-4 italic text-sm">
                        Không tìm thấy người dùng với email <b className="text-gray-600 dark:text-gray-300">{searchText}</b>
                      </div>
                      <Button
                        type="primary"
                        size="large"
                        icon={<MailOutlined />}
                        onClick={handleSendEmailInvite}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 border-none rounded-xl h-11 px-6 shadow-lg shadow-blue-200 dark:shadow-none"
                      >
                        Gửi email mời tham gia
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                      Không tìm thấy kết quả phù hợp.
                    </div>
                  )}
                </div>
              )}

              {/* ===== CURRENT MEMBERS ===== */}
              {!searched && project.members && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center pl-1">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Thành viên hiện tại ({project.members.length})
                    </div>
                  </div>
                  <List<ProjectMember>
                    itemLayout="horizontal"
                    dataSource={project.members}
                    renderItem={(member: ProjectMember) => {
                      const name = (member.userName || member.user?.firstName && member.user.firstName !== 'User')
                        ? (member.userName || member.user?.firstName)
                        : member.user?.email || 'User';
                      const email = member.userEmail || member.user?.email;

                      return (
                        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all mb-2">
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <Avatar size={40} src={member.userAvatar || member.user?.avatar} className="shadow-sm">
                              {name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <div className="flex flex-col overflow-hidden max-w-[200px]">
                              <div className="flex items-center space-x-2 truncate">
                                <span className="font-semibold text-gray-700 dark:text-gray-200 truncate">{name}</span>
                                {member.status === 'PENDING' && (
                                  <Tooltip title="Chờ người dùng xác nhận tham gia">
                                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                  </Tooltip>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 truncate">{email}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {getRoleTag(member.role)}
                            
                            {member.role !== 'OWNER' && (
                              <Popconfirm
                                title={`Xóa ${name} khỏi dự án?`}
                                description="Thành viên này sẽ không còn quyền truy cập dự án."
                                onConfirm={() => handleRemoveMember(member.userId!, name as string)}
                                okText="Xóa"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                              >
                                <Button 
                                  type="text" 
                                  danger 
                                  shape="circle"
                                  icon={<UserDeleteOutlined />} 
                                  className="hover:bg-red-50 dark:hover:bg-red-900/10"
                                />
                              </Popconfirm>
                            )}
                          </div>
                        </div>
                      );
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
