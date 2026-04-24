'use client';

import { useState, useEffect } from 'react';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import { useHomeFeedBootstrap } from '@smart/hooks/useHomeFeed';
import { useFeedStore } from '@smart/store/feed';
import FeedPostCard from '@smart/components/home/feed/FeedPostCard';
import UserAvatar from '@smart/components/ui/UserAvatar';
import { Card } from '@smart/components/ui/card';
import { Button } from '@smart/components/ui/button';
import { Image, Tabs, Modal, Form, Input, DatePicker, message } from 'antd';
import { 
  Sparkles, 
  LayoutGrid, 
  Info, 
  Users, 
  MapPin, 
  Calendar, 
  Link as LinkIcon,
  Settings,
  UserPlus,
  MessageSquare,
  Globe,
  Cake,
  Edit,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import dayjs from 'dayjs';

export default function UserProfilePage({ userId }: { userId?: string }) {
  useHomeFeedBootstrap();
  const [activeTab, setActiveTab] = useState('1');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({ followersCount: 0, followingCount: 0, isFollowing: false });
  const [userMedia, setUserMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const currentUserId = useFeedStore((s) => s.currentUserId);
  const users = useFeedStore((s) => s.users);
  const posts = useFeedStore((s) => s.posts);
  const postIds = useFeedStore((s) => s.postIds);
  const fetchUserProfileData = useFeedStore((s) => s.fetchUserProfileData);
  const fetchUserMedia = useFeedStore((s) => s.fetchUserMedia);
  const fetchUser = useFeedStore((s) => s.fetchUser);
  const updateProfile = useFeedStore((s) => s.updateProfile);
  const followUser = useFeedStore((s) => s.followUser);
  const unfollowUser = useFeedStore((s) => s.unfollowUser);

  const targetUserId = userId || currentUserId || '';
  const profileUser = targetUserId ? users[targetUserId] : null;
  const userPosts = postIds.filter((pid) => posts[pid]?.authorId === targetUserId);
  const isMe = Boolean(currentUserId && targetUserId && currentUserId === targetUserId);

  useEffect(() => {
    if (targetUserId) {
      if (!profileUser) {
        fetchUser(targetUserId);
      }
      fetchUserProfileData(targetUserId).then(setProfileData);
      fetchUserMedia(targetUserId).then(setUserMedia);
    }
  }, [targetUserId, fetchUserProfileData, fetchUserMedia, fetchUser, profileUser]);

  const handleFollow = async () => {
    if (!targetUserId) return;
    if (profileData.isFollowing) {
      await unfollowUser(targetUserId);
      setProfileData(prev => ({ ...prev, isFollowing: false, followersCount: Math.max(0, prev.followersCount - 1) }));
    } else {
      await followUser(targetUserId);
      setProfileData(prev => ({ ...prev, isFollowing: true, followersCount: prev.followersCount + 1 }));
    }
  };

  const onUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      const data = {
        firstName: values.firstName,
        lastName: values.lastName,
        bio: values.bio,
        location: values.location,
        website: values.website,
        birthday: values.birthday ? values.birthday.toISOString() : null,
      };
      await updateProfile(data);
      message.success('Cập nhật trang cá nhân thành công');
      setIsEditModalOpen(false);
    } catch (err) {
      message.error('Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    {
      key: '1',
      label: (
        <div className="flex items-center gap-2">
          <LayoutGrid size={16} />
          <span>Bài viết</span>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <div className="flex items-center gap-2">
          <Info size={16} />
          <span>Giới thiệu</span>
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <div className="flex items-center gap-2">
          <Users size={16} />
          <span>Bạn bè</span>
        </div>
      ),
    },
  ];

  if (!profileUser) {
    return (
      <SiteLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-500">Đang tải thông tin người dùng...</p>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-5xl pb-10 px-4 md:px-0">
        {/* Header Section */}
        <Card
          padding="none"
          className="overflow-hidden border-none shadow-sm dark:bg-neutral-950 rounded-2xl"
        >
          {/* Cover Photo */}
          <div className="relative group cursor-pointer h-56 md:h-80 overflow-hidden">
            <Image
              src={profileUser.coverImage || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop"}
              alt="Cover"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              preview={{
                mask: <div className="flex items-center justify-center gap-2 text-white text-sm font-medium backdrop-blur-sm bg-black/20 w-full h-full"><Sparkles size={20}/> Xem ảnh bìa</div>
              }}
            />
          </div>

          {/* Profile Info Area */}
          <div className="px-6 pb-6 relative">
            <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 md:-mt-20">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <UserAvatar 
                  userId={targetUserId} 
                  size="2xl" 
                  allowChangeMood={isMe} 
                  previewable={true}
                  className="ring-4 ring-white dark:ring-neutral-950 shadow-lg !h-32 !w-32 md:!h-40 md:!w-40"
                />
              </div>

              {/* Name & Basic Info */}
              <div className="flex-1 min-w-0 mb-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-bold truncate">
                    {profileUser.name}
                  </h1>
                  {profileUser.verified && (
                    <span className="bg-blue-500 text-white rounded-full p-1" title="Đã xác thực">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                    </span>
                  )}
                  {profileUser.mood && (
                    <div className="px-3 py-1 bg-gray-100 dark:bg-neutral-800 rounded-full text-xs font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5 border border-gray-200/50 dark:border-neutral-700/50">
                      <span>Đang cảm thấy</span>
                      <span className="text-sm">
                        {profileUser.mood === 'happy' && '😊'}
                        {profileUser.mood === 'grateful' && '😇'}
                        {profileUser.mood === 'loved' && '🥰'}
                        {profileUser.mood === 'excited' && '🤩'}
                        {profileUser.mood === 'thinking' && '🤔'}
                        {profileUser.mood === 'tired' && '😴'}
                        {profileUser.mood === 'cool' && '😎'}
                        {profileUser.mood === 'determined' && '😤'}
                        {profileUser.mood === 'hungry' && '🍕'}
                        {profileUser.mood === 'gaming' && '🎮'}
                        {profileUser.mood === 'working' && '💻'}
                        {profileUser.mood === 'traveling' && '✈️'}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-gray-500 font-medium text-lg mt-1">@{profileUser.username}</p>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    <span>Tham gia {profileUser.createdAt ? dayjs(profileUser.createdAt).format('MMMM, YYYY') : '...'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => setActiveTab('3')}>
                    <span className="font-semibold text-gray-900 dark:text-white">{profileData.followersCount}</span>
                    <span>Người theo dõi</span>
                  </div>
                  <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => setActiveTab('3')}>
                    <span className="font-semibold text-gray-900 dark:text-white">{profileData.followingCount}</span>
                    <span>Đang theo dõi</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mb-2">
                {isMe ? (
                  <>
                    <Button 
                      variant="primary" 
                      className="rounded-xl px-6 h-10 font-medium flex items-center gap-2"
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      <Edit size={18} />
                      <span>Chỉnh sửa trang cá nhân</span>
                    </Button>
                    <Button variant="secondary" className="h-10 w-10 p-0 rounded-xl">
                      <Settings size={18} />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant={profileData.isFollowing ? "secondary" : "primary"} 
                      className="rounded-xl px-6 h-10 font-medium flex items-center gap-2"
                      onClick={handleFollow}
                    >
                      {profileData.isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
                      <span>{profileData.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}</span>
                    </Button>
                    <Button variant="secondary" className="rounded-xl px-4 h-10 font-medium flex items-center gap-2">
                      <MessageSquare size={18} />
                      <span>Nhắn tin</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 border-t border-gray-100 dark:border-neutral-900 bg-gray-50/50 dark:bg-neutral-900/20">
            <Tabs 
              activeKey={activeTab} 
              onChange={setActiveTab} 
              items={tabs}
              className="profile-tabs"
            />
          </div>
        </Card>

        {/* Content Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
          {/* Sidebar */}
          <div className="md:col-span-4 space-y-6">
            <Card className="rounded-2xl border-none shadow-sm dark:bg-neutral-950 p-5">
              <h3 className="font-bold text-lg mb-4 text-gray-900 dark:text-white">Giới thiệu</h3>
              {profileUser.bio ? (
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 whitespace-pre-wrap">
                  {profileUser.bio}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic mb-4">Chưa có lời giới thiệu nào.</p>
              )}
              
              <div className="space-y-4">
                {profileUser.location && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin size={16} className="text-gray-400" />
                    <span>Sống tại <span className="font-medium text-gray-900 dark:text-gray-100">{profileUser.location}</span></span>
                  </div>
                )}
                {profileUser.website && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <Globe size={16} className="text-gray-400" />
                    <a href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">
                      {profileUser.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
                {profileUser.birthday && (
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <Cake size={16} className="text-gray-400" />
                    <span>Sinh ngày {dayjs(profileUser.birthday).format('DD [tháng] MM, YYYY')}</span>
                  </div>
                )}
              </div>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm dark:bg-neutral-950 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Ảnh</h3>
                {userMedia.length > 0 && (
                  <button 
                    onClick={() => setIsGalleryModalOpen(true)}
                    className="text-sm text-blue-500 hover:underline font-medium bg-transparent border-none p-0 cursor-pointer"
                  >
                    Xem tất cả
                  </button>
                )}
              </div>
              {userMedia.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 overflow-hidden rounded-xl">
                  <Image.PreviewGroup>
                    {userMedia.slice(0, 9).map((m, i) => (
                      <div key={m.id || i} className="aspect-square bg-gray-100 dark:bg-neutral-900 overflow-hidden relative group">
                        <Image 
                          src={m.url} 
                          alt={m.alt || "Gallery"} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 cursor-pointer"
                        />
                      </div>
                    ))}
                  </Image.PreviewGroup>
                </div>
              ) : (
                <div className="py-8 text-center bg-gray-50 dark:bg-neutral-900/50 rounded-xl border border-dashed border-gray-200 dark:border-neutral-800">
                  <p className="text-sm text-gray-400">Chưa có ảnh nào được đăng.</p>
                </div>
              )}
            </Card>
          </div>

          {/* Main Feed */}
          <div className="md:col-span-8 space-y-4">
            {activeTab === '1' && (
              <>
                <Card padding="small" className="rounded-2xl border-none shadow-sm dark:bg-neutral-950 flex items-center justify-between px-4 py-3">
                  <div className="text-base font-bold text-gray-900 dark:text-white">Bài viết</div>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-neutral-900 p-1 rounded-lg">
                    <Button variant="ghost" size="small" className="text-xs bg-white dark:bg-neutral-800 shadow-sm h-7">Mới nhất</Button>
                    <Button variant="ghost" size="small" className="text-xs h-7 text-gray-500">Phổ biến</Button>
                  </div>
                </Card>

                <div className="space-y-4">
                  {userPosts.length ? (
                    userPosts.map((pid) => <FeedPostCard key={pid} postId={pid} />)
                  ) : (
                    <Card className="rounded-2xl border-none shadow-sm dark:bg-neutral-950 p-10 text-center">
                      <div className="text-gray-400 mb-4 flex justify-center">
                        <div className="bg-gray-100 dark:bg-neutral-900 p-6 rounded-full">
                          <LayoutGrid size={40} strokeWidth={1} />
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">Chưa có bài viết nào</h4>
                      <p className="text-sm text-gray-500 dark:text-neutral-400 max-w-xs mx-auto">
                        Người dùng này chưa đăng bất kỳ nội dung nào trên dòng thời gian.
                      </p>
                    </Card>
                  )}
                </div>
              </>
            )}

            {activeTab === '2' && (
              <Card className="rounded-2xl border-none shadow-sm dark:bg-neutral-950 p-6">
                <h3 className="font-bold text-lg mb-6 text-gray-900 dark:text-white">Thông tin chi tiết</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-gray-50 dark:bg-neutral-900/50 rounded-2xl border border-gray-100 dark:border-neutral-800/50">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-3 text-blue-500">
                      <Info size={20} />
                    </div>
                    <h4 className="font-bold mb-1 text-gray-900 dark:text-white">Họ và tên</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{profileUser.name}</p>
                  </div>
                  <div className="p-5 bg-gray-50 dark:bg-neutral-900/50 rounded-2xl border border-gray-100 dark:border-neutral-800/50">
                    <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-3 text-purple-500">
                      <Calendar size={20} />
                    </div>
                    <h4 className="font-bold mb-1 text-gray-900 dark:text-white">Ngày tham gia</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{dayjs(profileUser.createdAt).format('DD [tháng] MM, YYYY')}</p>
                  </div>
                  {profileUser.bio && (
                    <div className="p-5 bg-gray-50 dark:bg-neutral-900/50 rounded-2xl border border-gray-100 dark:border-neutral-800/50 sm:col-span-2">
                       <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center mb-3 text-emerald-500">
                        <Sparkles size={20} />
                      </div>
                      <h4 className="font-bold mb-1 text-gray-900 dark:text-white">Tiểu sử</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{profileUser.bio}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {activeTab === '3' && (
               <Card className="rounded-2xl border-none shadow-sm dark:bg-neutral-950 p-10 text-center">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={32} className="text-gray-300" />
                  </div>
                  <h4 className="font-bold text-lg text-gray-900 dark:text-white">Bạn bè & Người theo dõi</h4>
                  <p className="text-gray-500 dark:text-neutral-400 max-w-xs mx-auto mt-2">
                    {profileData.followersCount} người theo dõi • {profileData.followingCount} đang theo dõi
                  </p>
                  <Button variant="secondary" className="mt-6 rounded-xl">Xem danh sách đầy đủ</Button>
               </Card>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        title={<span className="font-bold text-xl">Chỉnh sửa trang cá nhân</span>}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
        width={600}
        centered
        className="profile-edit-modal"
      >
        <Form
          layout="vertical"
          initialValues={{
            firstName: profileUser.name.split(' ').slice(0, -1).join(' '),
            lastName: profileUser.name.split(' ').slice(-1).join(' '),
            bio: profileUser.bio,
            location: profileUser.location,
            website: profileUser.website,
            birthday: profileUser.birthday ? dayjs(profileUser.birthday) : null,
          }}
          onFinish={onUpdateProfile}
          className="mt-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="firstName" label="Họ và tên đệm">
              <Input className="rounded-xl h-11" placeholder="Nhập họ..." />
            </Form.Item>
            <Form.Item name="lastName" label="Tên">
              <Input className="rounded-xl h-11" placeholder="Nhập tên..." />
            </Form.Item>
          </div>

          <Form.Item name="bio" label="Tiểu sử">
            <Input.TextArea className="rounded-xl" rows={4} placeholder="Giới thiệu một chút về bản thân bạn..." />
          </Form.Item>

          <Form.Item name="location" label="Địa điểm">
            <Input className="rounded-xl h-11" prefix={<MapPin size={16} className="text-gray-400 mr-2" />} placeholder="Ví dụ: Hà Nội, Việt Nam" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="website" label="Trang web">
              <Input className="rounded-xl h-11" prefix={<Globe size={16} className="text-gray-400 mr-2" />} placeholder="your-website.com" />
            </Form.Item>
            <Form.Item name="birthday" label="Ngày sinh">
              <DatePicker className="w-full rounded-xl h-11" placeholder="Chọn ngày sinh" format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} className="rounded-xl px-6">
              Hủy bỏ
            </Button>
            <Button variant="primary" type="submit" loading={loading} className="rounded-xl px-10">
              Lưu thay đổi
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Gallery Modal */}
      <Modal
        title={<span className="font-bold text-xl">Tất cả ảnh của {profileUser.name}</span>}
        open={isGalleryModalOpen}
        onCancel={() => setIsGalleryModalOpen(false)}
        footer={null}
        width={800}
        centered
        className="profile-gallery-modal"
      >
        <div className="max-h-[70vh] overflow-y-auto mt-6 pr-2 custom-scrollbar">
          {userMedia.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <Image.PreviewGroup>
                {userMedia.map((m, i) => (
                  <div key={m.id || i} className="aspect-square bg-gray-100 dark:bg-neutral-900 overflow-hidden relative group rounded-xl">
                    <Image 
                      src={m.url} 
                      alt={m.alt || "Gallery"} 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 cursor-pointer"
                    />
                  </div>
                ))}
              </Image.PreviewGroup>
            </div>
          ) : (
            <div className="py-20 text-center">
              <p className="text-gray-500">Người dùng này chưa có ảnh nào.</p>
            </div>
          )}
        </div>
      </Modal>

      <style jsx global>{`
        .profile-tabs .ant-tabs-nav {
          margin-bottom: 0 !important;
        }
        .profile-tabs .ant-tabs-nav::before {
          display: none !important;
        }
        .profile-tabs .ant-tabs-tab {
          padding: 16px 0 !important;
          margin-right: 32px !important;
        }
        .profile-tabs .ant-tabs-tab-btn {
          font-weight: 500 !important;
          font-size: 14px !important;
        }
        /* Force circular avatars for Ant Design Image component */
        .avatar-image {
          border-radius: 50% !important;
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        .avatar-image-wrapper {
          border-radius: 50% !important;
          display: block !important;
        }
        .profile-edit-modal .ant-modal-content {
          border-radius: 24px !important;
          padding: 24px !important;
        }
        .profile-edit-modal .ant-modal-header {
          margin-bottom: 0 !important;
          border-bottom: none !important;
        }
        .profile-gallery-modal .ant-modal-content {
          border-radius: 24px !important;
          padding: 24px !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
        }
      `}</style>
    </SiteLayout>
  );
}

