"use client";

import { useState, useEffect } from "react";
import {
  Button, Popover, Input, Select, Row, Col, Card, Typography,
  Upload, ColorPicker, Space
} from "antd";
import { PlusOutlined, BgColorsOutlined, UploadOutlined, CheckOutlined } from "@ant-design/icons";
import { useBoardStore } from "@smart/store/board";
import { useNotificationStore } from '@smart/store/notification';
import { projectService } from "@smart/services/project.service";
import { uploadService } from "@smart/services/upload.service";
import { projectStore } from "@smart/store/project";
import type { Project } from "@smart/types/project";
import { getProjectSocketManager } from "@smart/store/realtime";

const { Option } = Select;
const { Text } = Typography;

export default function CreateBoardButton() {
  const { colors, images } = useBoardStore();
  const { addNotification } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("workspace");
  const [background, setBackground] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [fileObjs, setFileObjs] = useState<File[]>([]);

  // Singleton socket manager
  const projectSocketManager = getProjectSocketManager();
  useEffect(() => {
    if (open && !background) {
      if (images.length > 0) setBackground(images[0]);
      else if (colors.length > 0) setBackground(colors[0]);
    }
  }, [open, background, images, colors]);

  const handleCreate = async () => {
    if (!title) {
      addNotification("Vui lòng nhập tiêu đề bảng", "error");
      return;
    }
    setOpen(false);

    let finalBackground = background;
    if (!finalBackground) {
      if (images.length > 0) finalBackground = images[0];
      else if (colors.length > 0) finalBackground = colors[0];
    }

    const body: { name: string; visibility?: string; color?: string; background?: string } = { name: title, visibility };
    if (!fileObjs.length && finalBackground) {
      if (images.includes(finalBackground)) body.background = finalBackground;
      else if (colors.includes(finalBackground)) body.color = finalBackground;
    }

    try {
      const createCorrId = crypto.randomUUID();
      const waitForProject = (corrId: string) =>
        new Promise<Project>((resolve, reject) => {
          const unsubscribe = projectSocketManager.subscribeCorrelation(
            corrId,
            (msg: any) => {
              if (msg.status === "success" && msg.project) {
                resolve(msg.project);
                unsubscribe();
              } else if (msg.status === "error") {
                reject(new Error(msg.error || "Project operation failed"));
                unsubscribe();
              }
            }
          );
        });

      await projectService.createProject({ ...body, correlationId: createCorrId });

      let project = await waitForProject(createCorrId);

      projectStore.getState().addProject(project);
      projectStore.getState().setCurrentProject(project);

      if (fileObjs.length > 0 || body.color) {
        const updateCorrId = crypto.randomUUID();
        const updateData: any = { projectId: project.id, correlationId: updateCorrId };

        if (fileObjs.length > 0) {
          const folder = project.folderPath || project.id;
          const uploadRes = await uploadService.uploadFiles(folder, fileObjs);
          if (!uploadRes.success) throw new Error("File upload failed");

          updateData.files = (uploadRes.data || []).map((f: any) => ({
            publicId: f.public_id,
            url: f.url,
            type: f.type,
            size: f.size,
            originalFilename: f.original_filename,
            resourceType: f.resource_type,
          }));
        }

        if (body.color) updateData.color = body.color;

        await projectService.updateProject(updateData);
        project = await waitForProject(updateCorrId);

        projectStore.getState().updateProject(project);
        projectStore.getState().setCurrentProject(project);
      }

      addNotification(`Tạo bảng "${project.name}" thành công`, "success");
    } catch (err: any) {
      addNotification(err.message || "Tạo bảng thất bại", "error");
    } finally {
      setTitle("");
      setVisibility("workspace");
      setBackground(null);
      setColor(null);
      setFileObjs([]);
    }
  };

  const boxStyle: React.CSSProperties = { width: 60, height: 40, borderRadius: 8, border: "1px solid #ddd", cursor: "pointer", backgroundSize: "cover", backgroundPosition: "center", transition: "0.2s", position: "relative" };

  const renderImageBox = (src: string) => (
    <div onClick={() => { setBackground(src); setColor(src); setFileObjs([]); }}
      style={{
        ...boxStyle,
        backgroundImage: `url(${src})`,
        border: background === src ? "2px solid #1677ff" : "1px solid #ddd"
      }}>
      {background === src && <div style={{
        position: "absolute",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8
      }}>
        <CheckOutlined style={{ color: "#fff", fontSize: 18 }} />
      </div>}
    </div>
  );

  const renderUploadBox = () => (
    <Upload
      showUploadList={false}
      accept="image/*"
      multiple
      beforeUpload={(file) => {
        setFileObjs(prev => [...prev, file]);
        const reader = new FileReader();
        reader.onload = e => { if (e.target?.result) setBackground(e.target.result as string); };
        reader.readAsDataURL(file);
        setColor(null);
        return false;
      }}
    >
      <div style={{
        ...boxStyle,
        border: fileObjs.length ? "2px solid #1677ff" : "1px dashed #ccc",
        backgroundImage: fileObjs.length ? `url(${background})` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {!fileObjs.length && <UploadOutlined style={{ fontSize: 18, color: "#555" }} />}
      </div>
    </Upload>
  );

  const renderColorBox = (c: string) => (
    <div onClick={() => { setBackground(c); setColor(c); setFileObjs([]); }}
      style={{
        background: c,
        height: 34,
        borderRadius: 6,
        cursor: "pointer",
        border: background === c ? "2px solid #1677ff" : "1px solid #ddd",
        position: "relative"
      }}>
      {background === c && <CheckOutlined style={{
        color: "#fff",
        fontSize: 16,
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)"
      }} />}
    </div>
  );

  const content = (
    <div>
      <Space direction="vertical" size={16}>
        <Card size="small" className="shadow-sm"
          style={{
            backgroundImage: background?.startsWith("/background") || background?.startsWith("data:image") ? `url(${background})` : undefined,
            backgroundColor: background && !background.startsWith("http") && !background.startsWith("data:image") ? background : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            height: 120,
            borderRadius: 10,
          }}
        />
        <div>
          <Text strong className="block mb-1">Ảnh nền</Text>
          <Row gutter={[8, 8]}>
            {images.slice(0, 3).map(img => <Col span={6} key={img}>{renderImageBox(img)}</Col>)}
            <Col span={6}>{renderUploadBox()}</Col>
          </Row>
        </div>
        <div>
          <Text strong className="block mb-1">Màu nền</Text>
          <Row gutter={8}>
            {colors.slice(0, 5).map(c => <Col span={4} key={c}>{renderColorBox(c)}</Col>)}
            <Col span={4}>
              <ColorPicker value={color || "#1677ff"} onChange={clr => { setBackground(clr.toHexString()); setColor(clr.toHexString()); setFileObjs([]); }} trigger="click">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", height: 34, borderRadius: 6, border: "1px dashed #ccc", cursor: "pointer" }}>
                  <BgColorsOutlined style={{ fontSize: 18, color: "#555" }} />
                </div>
              </ColorPicker>
            </Col>
          </Row>
        </div>
        <Input placeholder="Nhập tiêu đề bảng..." value={title} onChange={e => setTitle(e.target.value)} className="mb-3 rounded-md" />
        <Select value={visibility} onChange={setVisibility} className="w-full rounded-md">
          <Option value="private">Cá nhân</Option>
          <Option value="workspace">Workspace</Option>
          <Option value="public">Public</Option>
        </Select>
        <Button type="primary" block onClick={handleCreate} className="rounded-md">Create</Button>
      </Space>
    </div>
  );

  return (
    <Popover content={content} trigger="click" open={open} onOpenChange={setOpen} placement="bottomLeft">
      <Button type="primary" icon={<PlusOutlined />} className="rounded-lg shadow">Create Board</Button>
    </Popover>
  );
}
