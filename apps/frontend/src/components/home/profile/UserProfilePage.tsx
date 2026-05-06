'use client';

import { useState, useEffect } from 'react';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import { useHomeFeedBootstrap } from '@smart/hooks/useHomeFeed';
import { useFeedStore } from '@smart/store/feed';
import { App } from 'antd';
import { Sparkles } from 'lucide-react';

// Modulized components
import ProfileHeader from './modules/ProfileHeader';
import ProfileSidebar from './modules/ProfileSidebar';
import ProfileTabs from './modules/ProfileTabs';
import ProfileModals from './modules/ProfileModals';

export default function UserProfilePage({ userId }: { userId?: string }) {
  const { message } = App.useApp();
  useHomeFeedBootstrap();
  const [activeTab, setActiveTab] = useState('1');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    followersCount: 0,
    followingCount: 0,
    isFollowing: false,
    followers: [] as any[],
    following: [] as any[],
    friends: [] as any[]
  });
  const [userMedia, setUserMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currentUserId = useFeedStore((s) => s.currentUserId);
  const users = useFeedStore((s) => s.users);
  const postIds = useFeedStore((s) => s.postIds);
  const posts = useFeedStore((s) => s.posts);
  const fetchUserMedia = useFeedStore((s) => s.fetchUserMedia);
  const fetchUser = useFeedStore((s) => s.fetchUser);
  const updateProfile = useFeedStore((s) => s.updateProfile);

  const targetUserId = userId || currentUserId || '';
  const profileUser = targetUserId ? users[targetUserId] : null;
  const userPosts = postIds.filter((pid) => posts[pid]?.authorId === targetUserId);
  const isMe = Boolean(currentUserId && targetUserId && currentUserId === targetUserId);

  const fetchRelationData = async () => {
    if (!targetUserId) return;
    try {
      const res = await (await import('@smart/services/user.service')).userService.getProfileRelation(targetUserId);
      if (res?.success && res.data) {
        setProfileData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch relation data', err);
    }
  };

  useEffect(() => {
    if (targetUserId) {
      fetchUser(targetUserId);
      fetchRelationData();
      fetchUserMedia(targetUserId).then(setUserMedia);
    }
  }, [targetUserId]);

  useEffect(() => {
    const handleUploadAvatar = (e: any) => {
      const { file } = e.detail;
      if (file) {
        onUpdateProfile({ 
          firstName: profileUser?.firstName, 
          lastName: profileUser?.lastName, 
          avatarFile: file 
        });
      }
    };

    window.addEventListener('upload-avatar', handleUploadAvatar);
    return () => window.removeEventListener('upload-avatar', handleUploadAvatar);
  }, [profileUser]);

  const handleFollow = async () => {
    if (!targetUserId) return;
    try {
      setLoading(true);
      const res = await (await import('@smart/services/user.service')).userService.toggleFollow(targetUserId);
      if (res?.success) {
        message.success(res.data.followed ? 'Đã theo dõi' : 'Đã bỏ theo dõi');
        fetchRelationData();
      }
    } catch (err) {
      message.error('Thực hiện thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleListToggleFollow = async (id: string) => {
    try {
      setActionLoading(id);
      const res = await (await import('@smart/services/user.service')).userService.toggleFollow(id);
      if (res?.success) {
        message.success(res.data.followed ? 'Đã theo dõi' : 'Đã bỏ theo dõi');
        fetchRelationData();
      }
    } catch (err) {
      message.error('Thực hiện thất bại');
    } finally {
      setActionLoading(null);
    }
  };

  const onUpdateProfile = async (values: any) => {
    setLoading(true);
    try {
      let avatarUrl = profileUser?.avatar || '';

      // Check if there is a pending avatar file to upload
      if (values.avatarFile) {
        const formData = new FormData();
        formData.append('action', 'upload');
        formData.append('projectFolder', 'avatars');
        formData.append('files', values.avatarFile);

        const { autoRequest } = await import('@smart/services/auto.request');
        const uploadRes = await autoRequest<{ success: boolean; data: any[] }>('/upload', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.success && uploadRes.data.length > 0) {
          avatarUrl = uploadRes.data[0].url;
        }
      }

      const data = {
        firstName: values.firstName ?? profileUser?.firstName,
        lastName: values.lastName ?? profileUser?.lastName,
        bio: values.bio ?? profileUser?.bio,
        location: values.location ?? profileUser?.location,
        website: values.website ?? profileUser?.website,
        birthday: values.birthday ? values.birthday.toISOString() : (profileUser?.birthday || null),
        avatar: avatarUrl
      };
      await updateProfile(data);
      message.success('Cập nhật trang cá nhân thành công');
      setIsEditModalOpen(false);
      fetchUser(targetUserId);
    } catch (err) {
      message.error('Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!profileUser) {
    return (
      <SiteLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={16} className="text-blue-400 animate-pulse" />
              </div>
            </div>
            <p className="text-gray-400 font-medium tracking-widest uppercase text-[10px]">Đang tải vũ trụ cá nhân...</p>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-5xl pb-20 px-4 md:px-0">
        <ProfileHeader
          profileUser={profileUser}
          targetUserId={targetUserId}
          isMe={isMe}
          profileData={profileData}
          currentUserId={currentUserId || ''}
          handleFollow={handleFollow}
          setIsEditModalOpen={setIsEditModalOpen}
          loading={loading}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          <aside className="lg:col-span-4">
            <ProfileSidebar
              profileUser={profileUser}
              isMe={isMe}
              userMedia={userMedia}
              setIsEditModalOpen={setIsEditModalOpen}
              setIsGalleryModalOpen={setIsGalleryModalOpen}
            />
          </aside>

          <main className="lg:col-span-8">
            <ProfileTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              userPosts={userPosts}
              profileUser={profileUser}
              profileData={profileData}
              currentUserId={currentUserId || ''}
              actionLoading={actionLoading}
              handleListToggleFollow={handleListToggleFollow}
              isMe={isMe}
            />
          </main>
        </div>
      </div>

      <ProfileModals
        isEditModalOpen={isEditModalOpen}
        setIsEditModalOpen={setIsEditModalOpen}
        isGalleryModalOpen={isGalleryModalOpen}
        setIsGalleryModalOpen={setIsGalleryModalOpen}
        profileUser={profileUser}
        userMedia={userMedia}
        loading={loading}
        onUpdateProfile={onUpdateProfile}
      />
    </SiteLayout>
  );
}
