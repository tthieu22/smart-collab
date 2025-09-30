"use client";

import { useEffect, useState } from "react";
import { BellOutlined } from "@ant-design/icons";
import { Dropdown, Card, Switch, Tabs } from "antd";

export function NotificationMenu() {
  const [onlyRead, setOnlyRead] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("live");

  // load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("notification_onlyRead");
      if (raw !== null) setOnlyRead(raw === "true");
    } catch {}
  }, []);

  // persist
  useEffect(() => {
    try {
      localStorage.setItem("notification_onlyRead", String(onlyRead));
    } catch {}
  }, [onlyRead]);

  const content = (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ padding: 8, width: 400 }}
    >
      <Card title="Thông báo">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Switch checked={onlyRead} onChange={(v) => setOnlyRead(v)} />
          </div>
          <div style={{ userSelect: "none" }}>Chỉ hiện thông báo đã đọc</div>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          items={[
            {
              key: "live",
              label: "Trực tiếp",
              children: (
                <div style={{ minHeight: 80 }}>
                  <div style={{ padding: 8 }}>
                    Danh sách thông báo trực tiếp...
                  </div>
                </div>
              ),
            },
            {
              key: "read",
              label: "Đã xem",
              children: (
                <div style={{ minHeight: 80 }}>
                  <div style={{ padding: 8 }}>
                    Danh sách thông báo đã xem...
                  </div>
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
      dropdownRender={() => content}
    >
      <div
        className={`i-box ${open ? "active" : ""}`}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 32,
          borderRadius: 8,
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <BellOutlined style={{ fontSize: 20 }} />
      </div>
    </Dropdown>
  );

}
