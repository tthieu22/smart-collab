"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  ThumbsUp,
  MessageSquare,
  UserPlus,
  Check,
  X,
  Clock,
  ExternalLink
} from "lucide-react";
import { Dropdown, Card, Switch, Tabs, List, Avatar, Badge, Button } from "antd";
import { useUserNotificationStore } from "@smart/store/user-notifications";
import { useFeedStore } from "@smart/store/feed";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { autoRequest } from "@smart/services/auto.request";
import { useTheme } from "next-themes";
import { cn } from "@smart/lib/utils";

export function NotificationMenu() {
  const formatNotificationTime = useCallback((createdAt?: any) => {
    if (!createdAt) return "Vừa xong";

    let date: Date;
    if (Array.isArray(createdAt)) {
      // Handle Spring Boot LocalDateTime array [year, month, day, hour, minute, second]
      date = new Date(
        createdAt[0],
        (createdAt[1] || 1) - 1,
        createdAt[2] || 1,
        createdAt[3] || 0,
        createdAt[4] || 0,
        createdAt[5] || 0
      );
    } else {
      date = new Date(createdAt);
    }

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
      autoRequest(`/home/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => { });
      if (n.postId) {
        setActivePostId(n.postId);
      }
      setOpen(false);
    },
    [markAsRead, setActivePostId]
  );

  const handleRespondInvite = useCallback(async (projectId: string, accept: boolean, notificationId: string) => {
    try {
      const res: any = await autoRequest(`/projects/${projectId}/respond-invite`, {
        method: "POST",
        body: JSON.stringify({ accept })
      });
      if (res?.success) {
        markAsRead(notificationId);
        autoRequest(`/home/notifications/${notificationId}/read`, { method: "PATCH" }).catch(() => { });
        setOpen(false);
        if (accept) {
          window.location.href = `/projects/${projectId}`;
        }
      }
    } catch (err) {
      console.error("Failed to respond invite", err);
    }
  }, [markAsRead]);

  const renderNotification = useCallback((n: any) => {
    const isUnread = !n.isRead;
    const isInvite = n.type === "PROJECT_INVITE";

    const getIcon = () => {
      if (isInvite) return <UserPlus size={14} />;
      if (n.type === "LIKE") return <ThumbsUp size={14} />;
      return <MessageSquare size={14} />;
    };

    const getIconColor = () => {
      if (isInvite) return "bg-amber-500";
      if (n.type === "LIKE") return "bg-blue-500";
      return "bg-green-500";
    };

    return (
      <div
        key={n.id}
        onClick={() => !isInvite && handleNotificationClick(n)}
        className={cn(
          "relative p-4 mb-2 rounded-2xl transition-all duration-300 border cursor-pointer",
          isUnread
            ? "bg-blue-50/50 dark:bg-blue-500/5 border-blue-100 dark:border-blue-400/20"
            : "bg-white dark:bg-white/[0.02] border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5"
        )}
      >
        <div className="flex gap-4">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm",
            getIconColor()
          )}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-bold text-gray-900 dark:text-white leading-snug mb-1">
              {isInvite
                ? `Lời mời dự án: ${n.projectName || 'Dự án mới'}`
                : n.type === "LIKE"
                  ? "Một người đã thích bài viết của bạn"
                  : "Một người đã bình luận bài viết"}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500 font-medium">
              <Clock size={10} />
              {formatNotificationTime(n.createdAt)}
            </div>
          </div>
          {isUnread && <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />}
        </div>

        {isInvite && isUnread && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
            <Button
              size="small"
              className="flex-1 rounded-lg text-[11px] font-bold h-8"
              onClick={() => handleRespondInvite(n.projectId, false, n.id)}
            >
              Từ chối
            </Button>
            <Button
              size="small"
              type="primary"
              className="flex-1 rounded-lg text-[11px] font-bold h-8"
              onClick={() => handleRespondInvite(n.projectId, true, n.id)}
            >
              Chấp nhận
            </Button>
          </div>
        )}
      </div>
    );
  }, [formatNotificationTime, handleNotificationClick, handleRespondInvite]);

  const content = (
    <div
      onClick={(e) => e.stopPropagation()}
      className="w-[400px] bg-white dark:bg-[#0a0a0a] rounded-[24px] overflow-hidden border border-gray-100 dark:border-white/10 shadow-2xl"
    >
      <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Tín hiệu vũ trụ</h3>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400">Chỉ hiện đã đọc</span>
          <Switch size="small" checked={onlyRead} onChange={setOnlyRead} />
        </div>
      </div>

      <div className="p-2">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          className="custom-notification-tabs"
          items={[
            {
              key: "live",
              label: (
                <span className="text-xs font-bold px-4">
                  Tất cả ({notifications.length})
                </span>
              ),
              children: (
                <div className="max-h-[450px] overflow-y-auto px-2 py-2 custom-scrollbar">
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map(n => renderNotification(n))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center opacity-50">
                      <Bell className="mb-2 text-gray-400" />
                      <span className="text-xs font-bold">Trạm radar chưa nhận được tín hiệu nào</span>
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "unread",
              label: (
                <span className="text-xs font-bold px-4 flex items-center gap-2">
                  Chưa đọc <Badge count={unreadCount} size="small" className="notification-badge" />
                </span>
              ),
              children: (
                <div className="max-h-[450px] overflow-y-auto px-2 py-2 custom-scrollbar">
                  {unreadNotifications.length > 0 ? (
                    unreadNotifications.map(n => renderNotification(n))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center opacity-50">
                      <Check className="mb-2 text-gray-400" />
                      <span className="text-xs font-bold">Hệ thống đã tiếp nhận mọi tín hiệu!</span>
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      <div className="p-3 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5 text-center">
        <button className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 mx-auto">
          Xem tất cả lịch sử <ExternalLink size={10} />
        </button>
      </div>

      <style jsx global>{`
        .custom-notification-tabs .ant-tabs-nav::before {
            border-bottom: none !important;
        }
        .custom-notification-tabs .ant-tabs-tab-btn {
            font-size: 11px !important;
        }
        .notification-badge .ant-badge-count {
            background: #3b82f6 !important;
            box-shadow: none !important;
        }
      `}</style>
    </div>
  );

  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      popupRender={() => content}
      overlayClassName="rounded-3xl"
    >
      <div
        className={cn(
          "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 cursor-pointer",
          open
            ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
            : "bg-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
        )}
      >
        <Badge count={unreadCount} size="small" offset={[2, -2]} className="notification-badge-main">
          <Bell size={18} />
        </Badge>
      </div>
    </Dropdown>
  );
}
