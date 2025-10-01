"use client";

import { useState, useEffect, useRef } from "react";
import { Input, List, Card } from "antd";
import { SearchOutlined, CloseCircleFilled } from "@ant-design/icons";

interface SearchProps {
  placeholder?: string;
  suggestions?: string[];
  onSearch?: (query: string) => void;
}

export function Search({
  placeholder = "Search",
  suggestions = [],
  onSearch,
}: SearchProps) {
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // lọc gợi ý
  useEffect(() => {
    if (query.trim()) {
      const results = suggestions.filter((item) =>
        item.toLowerCase().includes(query.toLowerCase())
      );
      setFiltered(results);
    } else {
      setFiltered([]);
    }
  }, [query, suggestions]);

  // xử lý tìm kiếm
  const handleSearch = (text?: string) => {
    const value = text ?? query;
    if (onSearch) onSearch(value.trim());
    console.log("Searching for:", value);
    setFocused(false);
    setActiveIndex(-1);
  };

  // clear input
  const handleClear = () => {
    setQuery("");
    setFiltered([]);
    setActiveIndex(-1);
    if (onSearch) onSearch("");
  };

  // di chuyển bằng phím
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev > 0 ? prev - 1 : filtered.length - 1
      );
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

  // click ngoài thì đóng
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", width: 500 }}>
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
        allowClear={false} // mình custom clear button
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
                  // dùng onMouseDown để tránh mất focus trước khi onClick
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
