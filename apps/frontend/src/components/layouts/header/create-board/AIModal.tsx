"use client";

import React from "react";
import { Modal, Space, Steps, Input, Spin, Typography, Button } from "antd";
import { RocketOutlined } from "@ant-design/icons";
import { UI_CONFIG } from "@smart/lib/constants";
import { cn } from "@smart/lib/utils";

const { Text } = Typography;

interface AIModalProps {
  open: boolean;
  onClose: () => void;
  aiPrompt: string;
  setAiPrompt: (val: string) => void;
  aiLoading: boolean;
  aiResult: any;
  handleCreateWithAI: () => void;
}

export function AIModal({
  open,
  onClose,
  aiPrompt,
  setAiPrompt,
  aiLoading,
  aiResult,
  handleCreateWithAI,
}: AIModalProps) {
  return (
    <Modal
      open={open}
      onCancel={() => {
        if (aiLoading) return;
        onClose();
      }}
      footer={null}
      destroyOnHidden
      width={600}
      centered
      className="ai-create-modal"
      styles={{
        content: { borderRadius: "24px", overflow: "hidden", padding: 0, backgroundColor: "transparent" },
        body: { padding: 0 },
      }}
    >
      <div className="bg-white dark:bg-neutral-950 rounded-[24px] border border-gray-200 dark:border-neutral-800 overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-neutral-900 bg-gray-50/50 dark:bg-neutral-900/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-black text-xl">
            <RocketOutlined className="text-blue-600" />
            Xây dựng dự án với AI
          </div>
        </div>
        <div className={cn("p-4 md:p-6", UI_CONFIG.ANIMATION.FADE_IN)}>
          <Space direction="vertical" size={20} style={{ width: "100%" }} className="py-2">
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
              <Text className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                💡 Mẹo: Mô tả chi tiết dự án của bạn (ví dụ: "Tạo một bảng quản lý dự án xây dựng website thương mại điện tử với các giai đoạn thiết kế, phát triển và test").
              </Text>
            </div>

            <Steps
              size="small"
              current={aiLoading ? 1 : aiResult ? 2 : 0}
              items={[
                { title: "Mô tả ý tưởng" },
                { title: "AI đang xây dựng" },
                { title: "Hoàn tất" },
              ]}
              className="dark:text-white"
            />

            <Input.TextArea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Tôi muốn tạo một dự án về..."
              autoSize={{ minRows: 4, maxRows: 8 }}
              disabled={aiLoading}
              className="rounded-xl border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 text-lg p-4 dark:text-white"
            />

            {aiLoading && (
              <div className="flex flex-col items-center justify-center py-6 animate-pulse">
                <Spin size="large" />
                <Text type="secondary" className="mt-4 font-medium italic dark:text-gray-400">
                  Gemini đang phân tích và thiết kế cấu trúc dự án cho bạn...
                </Text>
              </div>
            )}
          </Space>
        </div>

        {/* Custom Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-neutral-900 bg-gray-50/50 dark:bg-neutral-900/50 flex justify-end gap-3">
          <Button
            onClick={onClose}
            disabled={aiLoading}
            className="h-11 px-6 rounded-xl font-bold border-gray-200 dark:border-neutral-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-all"
          >
            Hủy bỏ
          </Button>
          <Button
            type="primary"
            onClick={handleCreateWithAI}
            disabled={aiLoading || !aiPrompt.trim()}
            className="h-11 px-8 rounded-xl font-bold !bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-lg shadow-blue-500/20 hover:opacity-90 transition-all flex items-center justify-center min-w-[140px] !text-white"
          >
            {aiLoading ? (
              <div className="flex items-center gap-2">
                <Spin size="small" className="brightness-200" />
                <span>Đang xử lý...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <RocketOutlined className="text-sm" />
                <span>Bắt đầu tạo</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
