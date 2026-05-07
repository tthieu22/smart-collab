"use client";

import React from "react";
import {
  Row,
  Col,
  Input,
  Select,
  Typography,
  Space,
  Button,
  ColorPicker,
} from "antd";
import {
  BgColorsOutlined,
  CheckOutlined,
  UploadOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { cn } from "@smart/lib/utils";
import { UI_CONFIG } from "@smart/lib/constants";

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface ManualCreationContentProps {
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  visibility: string;
  setVisibility: (val: string) => void;
  background: string | null;
  setBackground: (val: string | null) => void;
  color: string | null;
  setColor: (val: string | null) => void;
  fileObjs: File[];
  setFileObjs: (val: File[]) => void;
  handleCreate: () => void;
  onOpenAi: () => void;
  images: string[];
  colors: string[];
  renderImageBox: (src: string) => React.ReactNode;
  renderUploadBox: () => React.ReactNode;
  renderColorBox: (c: string) => React.ReactNode;
}

export function ManualCreationContent({
  title,
  setTitle,
  description,
  setDescription,
  visibility,
  setVisibility,
  background,
  setBackground,
  color,
  setColor,
  fileObjs,
  setFileObjs,
  handleCreate,
  onOpenAi,
  images,
  colors,
  renderImageBox,
  renderUploadBox,
  renderColorBox,
}: ManualCreationContentProps) {
  return (
    <div className={cn(
      "w-full max-w-[640px] bg-white dark:bg-neutral-950",
      UI_CONFIG.ANIMATION.FADE_IN,
      "p-4 md:p-6"
    )}>
      <Row gutter={[{ xs: 8, sm: 16, md: 24 }, 24]} align="stretch">
        {/* Left Side: Live Preview (Hidden on mobile) */}
        <Col span={0} md={12} className="hidden md:flex flex-col">
          <Text strong className="text-[10px] uppercase tracking-widest text-gray-400 mb-3 block">Bảng của bạn</Text>
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 dark:bg-neutral-900 rounded-2xl p-3 border border-gray-100 dark:border-neutral-800 relative overflow-hidden group min-h-[200px]">
            <div
              className="w-full aspect-[4/3] md:h-full rounded-xl shadow-2xl shadow-black/20 transition-all duration-500 bg-cover bg-center flex flex-col overflow-hidden relative border border-white/10"
              style={{
                backgroundImage: background?.startsWith("/background") || background?.startsWith("data:image") ? `url(${background})` : undefined,
                backgroundColor: background && !background.startsWith("http") && !background.startsWith("data:image") ? background : undefined,
              }}
            >
              <div className="h-6 w-full bg-black/20 backdrop-blur-md flex items-center justify-between px-2 gap-2 border-b border-white/5">
                <div className="flex items-center gap-1.5 truncate">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[7px] font-black uppercase tracking-tight truncate text-white drop-shadow-sm">
                    {title || "Dự án mới"}
                  </span>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-white/20 border border-white/10" />)}
                </div>
              </div>

              <div className="flex-1 p-2 flex gap-2">
                {[1, 2, 3].map(col => (
                  <div key={col} className="w-16 h-full flex flex-col gap-1.5">
                    <div className="h-2 w-8 bg-white/30 rounded-sm" />
                    {[1, 2, 3].map(card => (
                      <div key={card} className="bg-white/10 backdrop-blur-sm p-1 rounded-md border border-white/5 shadow-sm">
                        <div className="h-1 w-full bg-white/40 rounded flex mb-1" />
                        <div className="h-1 w-2/3 bg-white/20 rounded flex" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <div className="absolute bottom-2 left-2 flex items-center gap-1 opacity-60 text-[6px] font-black uppercase text-white tracking-widest bg-black/20 px-1.5 py-0.5 rounded-full">
                <div className={cn("w-1 h-1 rounded-full", visibility === 'public' ? 'bg-green-400' : 'bg-blue-400')} />
                {visibility}
              </div>
            </div>
          </div>
        </Col>

        {/* Right Side: Configuration */}
        <Col span={24} md={12} className="md:border-l border-gray-100 dark:border-neutral-800 md:pl-4">
          <Space direction="vertical" size={20} className="w-full">
            <div className="space-y-4">
              <div className="space-y-2">
                <Text strong className="text-[10px] uppercase tracking-widest text-gray-400 ml-1 block">Tiêu đề</Text>
                <Input
                  placeholder="Tên bảng..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="h-10 rounded-xl bg-gray-50 dark:bg-neutral-900 border-none focus:bg-white dark:focus:bg-neutral-800 focus:ring-2 focus:ring-blue-500/20 px-4 font-medium dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Text strong className="text-[10px] uppercase tracking-widest text-gray-400 ml-1 block">Mô tả</Text>
                <TextArea
                  placeholder="Thêm mô tả cho bảng này..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  className="rounded-xl bg-gray-50 dark:bg-neutral-900 border-none focus:bg-white dark:focus:bg-neutral-800 focus:ring-2 focus:ring-blue-500/20 px-4 py-3 dark:text-white"
                />
              </div>
            </div>

            <div>
              <Text strong className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 block">Giao diện</Text>
              <Row gutter={[6, 6]} className="mb-3">
                {images.slice(0, 3).map(img => <Col span={6} key={img}>{renderImageBox(img)}</Col>)}
                <Col span={6}>{renderUploadBox()}</Col>
              </Row>
              <Row gutter={6} align="middle">
                {colors.slice(0, 4).map(c => <Col span={5} key={c}>{renderColorBox(c)}</Col>)}
                <Col span={4}>
                  <ColorPicker value={color || "#1677ff"} onChange={clr => { setBackground(clr.toHexString()); setColor(clr.toHexString()); setFileObjs([]); }} trigger="click">
                    <div className="flex items-center justify-center bg-white dark:bg-neutral-800 h-[34px] rounded-lg border border-dashed border-gray-300 dark:border-neutral-700 cursor-pointer hover:border-blue-500 hover:text-blue-500 transition-all">
                      <BgColorsOutlined className="dark:text-white" />
                    </div>
                  </ColorPicker>
                </Col>
              </Row>
            </div>

            <div>
              <Text strong className="text-[10px] uppercase tracking-widest text-gray-400 mb-2 block">Quyền truy cập</Text>
              <Select value={visibility} onChange={setVisibility} className="w-full premium-select-compact dark:text-white">
                <Option value="private">🔒 Only me</Option>
                <Option value="workspace">👥 Workspace</Option>
                <Option value="public">🌐 Public</Option>
              </Select>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-neutral-800">
              <Button
                type="primary"
                block
                onClick={handleCreate}
                className="h-11 rounded-xl bg-neutral-900 dark:bg-white dark:text-black border-none font-bold text-xs tracking-widest hover:opacity-90 shadow-xl shadow-black/10"
              >
                XÁC NHẬN TẠO
              </Button>
              <Button
                className="h-11 w-11 rounded-xl flex items-center justify-center p-0 border-none relative group overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  boxShadow: '0 8px 16px -4px rgba(168, 85, 247, 0.4)'
                }}
                onClick={onOpenAi}
              >
                <RocketOutlined className="text-white text-lg group-hover:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Button>
            </div>
          </Space>
        </Col>
      </Row>
    </div>
  );
}
