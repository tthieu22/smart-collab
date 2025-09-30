"use client";

import React from "react";
import "./logo.css";
import { useTheme } from "next-themes";

const EMOJIS = ["❤️", "😍", "🥰", "😘", "👌", "🤣", "💡", "✨", "🔥", "🌟"];
const COLUMNS = [
  EMOJIS.slice(0, 5),
  EMOJIS.slice(5, 10),
  EMOJIS.slice(3, 8),
];

export function Logo() {
  const { theme } = useTheme();

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <mark
        className={`logo-mark ${theme}`}
        style={{ height: 35 }}
      >
        <div className="logo-board">
          {COLUMNS.map((col, colIndex) => (
            <div key={colIndex} className="logo-column">
              {col.map((emoji, i) => (
                <span
                  key={i}
                  className={`logo-emoji row-${i % 2}`}
                >
                  {emoji}
                </span>
              ))}
            </div>
          ))}
        </div>
      </mark>
      {/* <span lang="en" translate="no" style={{ fontWeight: 700, fontSize: 16, userSelect: "none" }}>
        Collab
      </span> */}
    </div>
  );
}
