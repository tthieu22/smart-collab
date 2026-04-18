"use client";

import { useEffect, useState } from "react";
import { BellOutlined, LikeOutlined, CommentOutlined } from "@ant-design/icons";
import { Dropdown, Card, Switch, Tabs, List, Avatar, Badge } from "antd";
import { useUserNotificationStore } from "@smart/store/user-notifications";
import { useFeedStore } from "@smart/store/feed";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

export function NotificationMenu() {
  const [onlyRead, setOnlyRead] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("live");

  const { notifications, unreadCount, markAsRead } = useUserNotificationStore();
  const setActivePostId = useFeedStore((s) => s.setActivePostId);

  const renderNotification = (n: any) => {
    const isUnread = !n.isRead;
    return (
      <List.Item
        onClick={() => {
          markAsRead(n.id);
          if (n.postId) {
            setActivePostId(n.postId);
            setOpen(false);
          }
        }}
        style={{
          cursor: "pointer",
          backgroundColor: isUnread ? "#f0f5ff" : "transparent",
          padding: "8px 12px",
          borderRadius: 4,
          marginBottom: 4,
        }}
      >
        <List.Item.Meta
          avatar={
            <Avatar
              icon={n.type === "LIKE" ? <LikeOutlined /> : <CommentOutlined />}
              style={{ backgroundColor: n.type === "LIKE" ? "#1890ff" : "#52c41a" }}
            />
          }
          title={
            <span style={{ fontSize: 13 }}>
              {n.type === "LIKE" ? "Một người đã thích bài viết của bạn" : "Một người đã bình luận về bài viết của bạn"}
            </span>
          }
          description={
            <span style={{ fontSize: 11, color: "#8c8c8c" }}>
              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
            </span>
          }
        />
      </List.Item>
    );
  };

  const filteredNotifications = onlyRead 
    ? notifications.filter(n => n.isRead) 
    : notifications;

  const content = (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ padding: 0, width: 400 }}
    >
      <Card title="Thông báo" bodyStyle={{ padding: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 16px",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Switch size="small" checked={onlyRead} onChange={(v) => setOnlyRead(v)} />
            <span style={{ fontSize: 12 }}>Chỉ hiện thông báo đã đọc</span>
          </div>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          centered
          items={[
            {
              key: "live",
              label: `Tất cả (${notifications.length})`,
              children: (
                <div style={{ maxHeight: 400, overflowY: "auto", padding: 8 }}>
                  <List
                    dataSource={filteredNotifications}
                    renderItem={renderNotification}
                    locale={{ emptyText: "Không có thông báo nào" }}
                  />
                </div>
              ),
            },
            {
              key: "unread",
              label: `Chưa đọc (${unreadCount})`,
              children: (
                <div style={{ maxHeight: 400, overflowY: "auto", padding: 8 }}>
                  <List
                    dataSource={notifications.filter(n => !n.isRead)}
                    renderItem={renderNotification}
                    locale={{ emptyText: "Không có thông báo chưa đọc" }}
                  />
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      popupRender={() => content}
    >
      <div
        className={`i-box ${open ? "active" : ""} hover:bg-gray-50 dark:hover:bg-neutral-800`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 8,
          cursor: "pointer",
          transition: "all 0.2s ease",
          position: "relative",
        }}
      >
        <Badge count={unreadCount} size="small" offset={[2, -2]}>
          <BellOutlined style={{ fontSize: 20 }} />
        </Badge>
      </div>
    </Dropdown>
  );
}
