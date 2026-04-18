"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BellOutlined, LikeOutlined, CommentOutlined } from "@ant-design/icons";
import { Dropdown, Card, Switch, Tabs, List, Avatar, Badge } from "antd";
import { useUserNotificationStore } from "@smart/store/user-notifications";
import { useFeedStore } from "@smart/store/feed";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { autoRequest } from "@smart/services/auto.request";
import { useTheme } from "next-themes";

export function NotificationMenu() {
  const formatNotificationTime = useCallback((createdAt?: string) => {
    if (!createdAt) return "Vừa xong";
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return "Vừa xong";
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  }, []);

  const [onlyRead, setOnlyRead] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("live");
  const [loading, setLoading] = useState(false);

  const { notifications, unreadCount, markAsRead, setNotifications } = useUserNotificationStore();
  const setActivePostId = useFeedStore((s) => s.setActivePostId);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const data = await autoRequest<any[]>("/home/notifications", { method: "GET" });
        if (mounted) setNotifications(data || []);
      } catch {
        // Keep showing realtime items if history API fails.
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchHistory();
    return () => {
      mounted = false;
    };
  }, [open, setNotifications]);

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.isRead),
    [notifications]
  );

  const filteredNotifications = useMemo(
    () => (onlyRead ? notifications.filter((n) => n.isRead) : notifications),
    [onlyRead, notifications]
  );

  const handleNotificationClick = useCallback(
    (n: any) => {
      markAsRead(n.id);
      autoRequest(`/home/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => {});
      if (n.postId) {
        setActivePostId(n.postId);
      }
      setOpen(false);
    },
    [markAsRead, setActivePostId]
  );

  const renderNotification = useCallback((n: any) => {
    const isUnread = !n.isRead;
    return (
      <List.Item
        key={n.id}
        onClick={() => handleNotificationClick(n)}
        style={{
          cursor: "pointer",
          backgroundColor: isUnread
            ? isDark
              ? "rgba(0, 113, 227, 0.14)"
              : "#f0f5ff"
            : "transparent",
          padding: "8px 12px",
          borderRadius: 8,
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
            <span style={{ fontSize: 11, color: isDark ? "rgba(255,255,255,0.62)" : "#8c8c8c" }}>
              {formatNotificationTime(n.createdAt)}
            </span>
          }
        />
      </List.Item>
    );
  }, [formatNotificationTime, handleNotificationClick, isDark]);

  const content = (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        padding: 0,
        width: 400,
        borderRadius: 10,
        overflow: "hidden",
        background: isDark ? "#1d1d1f" : "#ffffff",
      }}
    >
      <Card
        title={<span style={{ color: isDark ? "#fff" : "#1d1d1f" }}>Thông báo</span>}
        styles={{
          body: { padding: 0 },
          header: {
            background: isDark ? "#1d1d1f" : "#ffffff",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#f0f0f0"}`,
            color: isDark ? "#fff" : "#1d1d1f",
          },
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 16px",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#f0f0f0"}`,
            background: isDark ? "#1d1d1f" : "#ffffff",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Switch size="small" checked={onlyRead} onChange={(v) => setOnlyRead(v)} />
            <span style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.85)" : "#1d1d1f" }}>
              Chỉ hiện thông báo đã đọc
            </span>
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
                <div style={{ maxHeight: 400, overflowY: "auto", padding: 8, background: isDark ? "#1d1d1f" : "#fff" }}>
                  <List
                    loading={loading}
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
                <div style={{ maxHeight: 400, overflowY: "auto", padding: 8, background: isDark ? "#1d1d1f" : "#fff" }}>
                  <List
                    loading={loading}
                    dataSource={unreadNotifications}
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
