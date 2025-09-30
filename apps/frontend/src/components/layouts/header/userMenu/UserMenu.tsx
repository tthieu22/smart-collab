"use client";

import { NotificationMenu } from "./NotificationMenu";
import { SettingMenu } from "./SettingMenu";
import { AvatarMenu } from "./AvatarMenu";

export function UserMenu() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <NotificationMenu />
      <SettingMenu />
      <AvatarMenu />
    </div>
  );
}
