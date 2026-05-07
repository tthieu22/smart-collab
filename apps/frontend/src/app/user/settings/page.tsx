"use client";

import SiteLayout from "@smart/components/layouts/SiteLayout";
import { UserSettingForm } from "@smart/components/user/UserSettingForm";
import { SettingOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useRouter } from "next/navigation";
import { UI_CONFIG } from "@smart/lib/constants";
import { cn } from "@smart/lib/utils";

export default function UserSettingsPage() {
  const router = useRouter();

  return (
    <SiteLayout
      hideRightSidebar={true}
      hideFooter={true}
      noScroll={true}
      fullWidth={true}
    >
      <div className={cn(
        "min-h-screen flex flex-col items-center bg-gray-50/30 dark:bg-neutral-900/10",
        UI_CONFIG.ANIMATION.FADE_IN
      )}>
        <div className={cn(
          UI_CONFIG.CONTAINER,
          UI_CONFIG.MAX_WIDTH.WIDE,
          UI_CONFIG.PAGE_SPACING,
          "px-4 md:px-6"
        )}>
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="hidden md:flex items-center gap-4 mb-8 shrink-0">
              <Button
                icon={<ArrowLeftOutlined />}
                type="text"
                onClick={() => router.back()}
                className="hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-full h-11 w-11 flex items-center justify-center text-gray-500 shadow-sm border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900"
              />
              <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white flex items-center gap-3 !m-0">
                  <SettingOutlined className="text-blue-500" />
                  Cài đặt tài khoản
                </h1>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-1">Quản lý thông tin cá nhân và bảo mật.</p>
              </div>
            </div>

            <div className={cn(
              "bg-white dark:bg-neutral-950 rounded-[24px] border border-gray-100 dark:border-neutral-800 shadow-sm overflow-hidden",
              "p-0 md:p-1" // Minimal padding to show the border nicely
            )}>
              <UserSettingForm />
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
