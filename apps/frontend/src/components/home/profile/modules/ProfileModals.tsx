'use client';

import { Modal, Form, Input, DatePicker, Button as AntButton, Empty, Image } from 'antd';
import { MapPin, Globe, Cake, Camera } from 'lucide-react';
import { Button } from '@smart/components/ui/button';
import dayjs from 'dayjs';

interface ProfileModalsProps {
    isEditModalOpen: boolean;
    setIsEditModalOpen: (open: boolean) => void;
    isGalleryModalOpen: boolean;
    setIsGalleryModalOpen: (open: boolean) => void;
    profileUser: any;
    userMedia: any[];
    loading: boolean;
    onUpdateProfile: (values: any) => void;
}

export default function ProfileModals({
    isEditModalOpen,
    setIsEditModalOpen,
    isGalleryModalOpen,
    setIsGalleryModalOpen,
    profileUser,
    userMedia,
    loading,
    onUpdateProfile
}: ProfileModalsProps) {
    return (
        <>
            {/* Edit Profile Modal */}
            <Modal
                title={<span className="font-bold text-lg tracking-tight">Cập nhật hồ sơ</span>}
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                footer={null}
                width={600}
                centered
                className="profile-standard-modal"
            >
                <div className="flex flex-col items-center mb-6">
                    <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload-input')?.click()}>
                        <div className="h-28 w-28 rounded-full overflow-hidden ring-4 ring-gray-100 dark:ring-neutral-800 shadow-xl bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 relative">
                            {profileUser.avatarUrl || profileUser.avatar ? (
                                <img src={profileUser.avatarUrl || profileUser.avatar} alt="Avatar" className="w-full h-full object-cover avatar-preview-img" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-2xl uppercase">
                                    {profileUser.name?.charAt(0)}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                <div className="flex flex-col items-center gap-1 text-white opacity-60 group-hover:opacity-100 transition-opacity">
                                    <Camera size={24} />
                                    <span className="text-[8px] font-black uppercase tracking-tight">Cập nhật</span>
                                </div>
                            </div>
                        </div>
                        <input
                            id="avatar-upload-input"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        const previewUrl = event.target?.result as string;
                                        (window as any)._pendingAvatarFile = file;
                                        const img = document.querySelector('.avatar-preview-img') as HTMLImageElement;
                                        if (img) img.src = previewUrl;
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </div>
                    <p className="mt-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Ảnh đại diện công khai</p>
                </div>

                <Form
                    layout="vertical"
                    initialValues={{
                        firstName: (profileUser.name || '').split(' ').slice(0, -1).join(' '),
                        lastName: (profileUser.name || '').split(' ').slice(-1).join(' '),
                        bio: profileUser.bio,
                        location: profileUser.location,
                        website: profileUser.website,
                        birthday: profileUser.birthday ? dayjs(profileUser.birthday) : null,
                    }}
                    onFinish={(values) => {
                        const avatarFile = (window as any)._pendingAvatarFile;
                        onUpdateProfile({ ...values, avatarFile });
                        delete (window as any)._pendingAvatarFile;
                    }}
                    className="space-y-4"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="firstName" label={<span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Họ & Đệm</span>}>
                            <Input className="rounded-xl h-12 bg-gray-50 dark:bg-neutral-900 border-none px-4 font-bold text-sm" />
                        </Form.Item>
                        <Form.Item name="lastName" label={<span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Tên</span>}>
                            <Input className="rounded-xl h-12 bg-gray-50 dark:bg-neutral-900 border-none px-4 font-bold text-sm" />
                        </Form.Item>
                    </div>

                    <Form.Item name="bio" label={<span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Giới thiệu ngắn</span>}>
                        <Input.TextArea className="rounded-2xl bg-gray-50 dark:bg-neutral-900 border-none p-4 font-medium text-sm" rows={4} />
                    </Form.Item>

                    <Form.Item name="location" label={<span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Đến từ</span>}>
                        <Input className="rounded-xl h-12 bg-gray-50 dark:bg-neutral-900 border-none px-4 font-bold text-sm" prefix={<MapPin size={16} className="text-blue-500 mr-2" />} />
                    </Form.Item>

                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="website" label={<span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Website</span>}>
                            <Input className="rounded-xl h-12 bg-gray-50 dark:bg-neutral-900 border-none px-4 font-bold text-sm" prefix={<Globe size={16} className="text-blue-500 mr-2" />} />
                        </Form.Item>
                        <Form.Item name="birthday" label={<span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Ngày sinh</span>}>
                            <DatePicker className="w-full rounded-xl h-12 bg-gray-50 dark:bg-neutral-900 border-none px-4 font-bold text-sm" format="DD/MM/YYYY" />
                        </Form.Item>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-50 dark:border-neutral-900">
                        <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} className="rounded-xl px-6 h-11 text-xs font-bold uppercase">Hủy</Button>
                        <Button variant="primary" type="submit" loading={loading} className="rounded-xl px-8 h-11 text-xs font-bold uppercase shadow-lg shadow-blue-500/20">Lưu lại</Button>
                    </div>
                </Form>
            </Modal>

            {/* Gallery Modal */}
            <Modal
                title={<span className="font-bold text-xl tracking-tight">Thư viện ảnh</span>}
                open={isGalleryModalOpen}
                onCancel={() => setIsGalleryModalOpen(false)}
                footer={null}
                width={900}
                centered
                className="profile-gallery-standard"
            >
                <div className="max-h-[70vh] overflow-y-auto mt-6 pr-2 custom-scrollbar">
                    {userMedia.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            <Image.PreviewGroup>
                                {userMedia.map((m, i) => (
                                    <div key={m.id || i} className="aspect-square bg-gray-50 dark:bg-neutral-900 overflow-hidden relative group rounded-2xl">
                                        <Image
                                            src={m.url}
                                            alt={m.alt || "Gallery"}
                                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                                        />
                                    </div>
                                ))}
                            </Image.PreviewGroup>
                        </div>
                    ) : (
                        <Empty description="Chưa có hình ảnh nào" className="py-20" />
                    )}
                </div>
            </Modal>

            <style jsx global>{`
        .profile-standard-modal .ant-modal-content {
          border-radius: 24px !important;
          padding: 32px !important;
        }
        .profile-gallery-standard .ant-modal-content {
          border-radius: 24px !important;
          padding: 32px !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
      `}</style>
        </>
    );
}
