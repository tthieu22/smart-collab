"use client";

import SiteLayout from "@smart/components/layouts/SiteLayout";
import { UserSettingForm } from "@smart/components/user/UserSettingForm";
import { SettingOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useRouter } from "next/navigation";

export default function UserSettingsPage() {
  const router = useRouter();

  return (
    <SiteLayout
      hideLeftSidebar={true}
      hideRightSidebar={true}
      hideFooter={true}
      noScroll={true}
    >
      <div className="h-full flex flex-col items-center bg-gray-50/30 dark:bg-neutral-900/10">
        <div className="w-full max-w-[1400px] h-full flex flex-col pt-4 pb-4 px-4 lg:px-6">
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center gap-4 mb-4 shrink-0">
              <Button
                icon={<ArrowLeftOutlined />}
                type="text"
                onClick={() => router.back()}
                className="hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full h-10 w-10 flex items-center justify-center text-gray-500"
              />
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3 !m-0">
                  <SettingOutlined className="text-blue-500" />
                  Cài đặt tài khoản
                </h1>
                <p className="text-gray-400 font-medium text-[10px]">Quản lý thông tin cá nhân và bảo mật.</p>
              </div>
            </div>

            <UserSettingForm />
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
