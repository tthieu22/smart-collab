"use client";

import { useState, useEffect, useRef } from "react";
import { Input, List, Card } from "antd";
import { SearchOutlined, CloseCircleFilled } from "@ant-design/icons";
import { useUserStore } from "@smart/store/user"; // path tương ứng

export function Search({ placeholder = "Search" }) {
  const { allUsers, query, setQuery } = useUserStore();

  const [filtered, setFiltered] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lọc gợi ý khi query hoặc allUsers thay đổi
  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      if (filtered.length > 0) setFiltered([]);
      return;
    }

    const results = allUsers
      .map((u) => u.email) // giả sử User có trường name
      .filter((name) => name.toLowerCase().includes(trimmed));

    // chỉ set nếu khác để tránh vòng lặp setState
    const same =
      results.length === filtered.length &&
      results.every((v, i) => v === filtered[i]);

    if (!same) setFiltered(results);
  }, [query, allUsers]);

  // handle search khi nhấn enter hoặc chọn item
  const handleSearch = (text?: string) => {
    const value = text ?? query;
    setQuery(value); // cập nhật store luôn
    console.log("Searching for:", value);
    setFocused(false);
    setActiveIndex(-1);
  };

  const handleClear = () => {
    setQuery("");
    setFiltered([]);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && filtered[activeIndex]) {
        setQuery(filtered[activeIndex]);
        handleSearch(filtered[activeIndex]);
      } else {
        handleSearch();
      }
    }
  };

  // click ngoài đóng popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", width: 600 }}>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        prefix={<SearchOutlined />}
        suffix={
          query ? (
            <CloseCircleFilled
              onClick={handleClear}
              style={{ color: "rgba(0,0,0,.45)", cursor: "pointer" }}
            />
          ) : null
        }
        allowClear={false}
        onPressEnter={() => handleSearch()}
      />

      {focused && filtered.length > 0 && (
        <Card
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            zIndex: 1000,
          }}
          bodyStyle={{ padding: 0 }}
        >
          <List
            dataSource={filtered}
            renderItem={(item, idx) => (
              <List.Item
                style={{
                  padding: "6px 12px",
                  cursor: "pointer",
                  background: idx === activeIndex ? "#e6f7ff" : undefined,
                }}
                onMouseDown={() => {
                  setQuery(item);
                  handleSearch(item);
                }}
              >
                {item}
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  );
}
