"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Popover,
  Input,
  Select,
  Row,
  Col,
  Card,
  Typography,
  Upload,
  ColorPicker,
  Space,
} from "antd";
import {
  PlusOutlined,
  BgColorsOutlined,
  UploadOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useBoardStore } from "@smart/store/board";
import { createProjectWithFiles } from "@smart/lib/project-api";

const { Option } = Select;
const { Text } = Typography;

export default function CreateBoardButton() {
  const { colors, images } = useBoardStore();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("workspace");
  const [background, setBackground] = useState<string | null>(null);
  const [fileObjs, setFileObjs] = useState<File[]>([]);

  // Khi mở popover, nếu chưa có background, mặc định chọn ảnh đầu tiên hoặc màu đầu tiên
  useEffect(() => {
    if (open && !background) {
      if (images.length > 0) setBackground(images[0]);
      else if (colors.length > 0) setBackground(colors[0]);
    }
  }, [open, background, images, colors]);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleCreate = async () => {
    if (!title) return;
    setOpen(false);

    try {
      const filesBase64: string[] = await Promise.all(fileObjs.map(fileToBase64));

      const body: { name: string; visibility?: string; color?: string } = {
        name: title,
        visibility: visibility,
      };

      if (background && !background.startsWith("data:image")) {
        body.color = background;
      }

      await createProjectWithFiles(body, filesBase64);
    } catch (err) {
      console.error("Failed to create project:", err);
    } finally {
      setTitle("");
      setVisibility("workspace");
      setBackground(null);
      setFileObjs([]);
    }
  };

  const boxStyle: React.CSSProperties = {
    width: "60px",
    height: 40,
    borderRadius: 8,
    border: "1px solid #ddd",
    cursor: "pointer",
    backgroundSize: "cover",
    backgroundPosition: "center",
    transition: "0.2s",
    position: "relative",
  };

  const renderImageBox = (src: string) => (
    <div
      onClick={() => {
        setBackground(src);
        setFileObjs([]);
      }}
      style={{
        ...boxStyle,
        backgroundImage: `url(${src})`,
        border: background === src ? "2px solid #1677ff" : "1px solid #ddd",
      }}
    >
      {background === src && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
          }}
        >
          <CheckOutlined style={{ color: "#fff", fontSize: 18 }} />
        </div>
      )}
    </div>
  );

  const renderUploadBox = () => (
    <Upload
      showUploadList={false}
      accept="image/*"
      multiple
      beforeUpload={(file) => {
        setFileObjs((prev) => [...prev, file]);
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) setBackground(e.target.result as string);
        };
        reader.readAsDataURL(file);
        return false;
      }}
    >
      <div
        style={{
          ...boxStyle,
          border: fileObjs.length ? "2px solid #1677ff" : "1px dashed #ccc",
          backgroundImage: fileObjs.length ? `url(${background})` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {!fileObjs.length && <UploadOutlined style={{ fontSize: 18, color: "#555" }} />}
      </div>
    </Upload>
  );

  const renderColorBox = (color: string) => (
    <div
      onClick={() => {
        setBackground(color);
        setFileObjs([]);
      }}
      style={{
        background: color,
        height: 34,
        borderRadius: 6,
        cursor: "pointer",
        border: background === color ? "2px solid #1677ff" : "1px solid #ddd",
        transition: "0.2s",
        position: "relative",
      }}
    >
      {background === color && (
        <CheckOutlined
          style={{
            color: "#fff",
            fontSize: 16,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}
    </div>
  );

  const content = (
    <div>
      <Space direction="vertical" size={16}>
        <Card
          size="small"
          className="shadow-sm"
          style={{
            backgroundImage:
              background?.startsWith("/background") || background?.startsWith("data:image")
                ? `url(${background})`
                : undefined,
            backgroundColor:
              background && !background.startsWith("http") && !background.startsWith("data:image")
                ? background
                : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            height: 120,
            borderRadius: 10,
          }}
        />

        <div>
          <Text strong className="block mb-1">Ảnh nền</Text>
          <Row gutter={[8, 8]}>
            {images.slice(0, 3).map((img) => (
              <Col span={6} key={img}>{renderImageBox(img)}</Col>
            ))}
            <Col span={6}>{renderUploadBox()}</Col>
          </Row>
        </div>

        <div>
          <Text strong className="block mb-1">Màu nền</Text>
          <Row gutter={8}>
            {colors.slice(0, 5).map((c) => (
              <Col span={4} key={c}>{renderColorBox(c)}</Col>
            ))}
            <Col span={4}>
              <ColorPicker
                value={background || "#1677ff"}
                onChange={(color) => {
                  setBackground(color.toHexString());
                  setFileObjs([]);
                }}
                trigger="click"
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#fff",
                    height: 34,
                    borderRadius: 6,
                    border: "1px dashed #ccc",
                    cursor: "pointer",
                  }}
                >
                  <BgColorsOutlined style={{ fontSize: 18, color: "#555" }} />
                </div>
              </ColorPicker>
            </Col>
          </Row>
        </div>

        <Input
          placeholder="Nhập tiêu đề bảng..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 rounded-md"
        />

        <Select
          value={visibility}
          onChange={setVisibility}
          className="w-full rounded-md"
        >
          <Option value="private">Cá nhân</Option>
          <Option value="workspace">Workspace</Option>
          <Option value="public">Public</Option>
        </Select>

        <Button type="primary" block onClick={handleCreate} className="rounded-md">
          Create
        </Button>
      </Space>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={open}
      onOpenChange={setOpen}
      placement="bottomLeft"
    >
      <Button type="primary" icon={<PlusOutlined />} className="rounded-lg shadow">
        Create Board
      </Button>
    </Popover>
  );
}
