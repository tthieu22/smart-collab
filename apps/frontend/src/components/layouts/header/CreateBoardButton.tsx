"use client";

import { useState, useEffect } from "react";
import { 
  PlusOutlined, 
  BgColorsOutlined, 
  UploadOutlined, 
  CheckOutlined,
  RocketOutlined 
} from "@ant-design/icons";
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
  Modal,
  Steps,
  Spin,
  Divider
} from "antd";
import { useBoardStore } from "@smart/store/setting";
import { useNotificationStore } from '@smart/store/notification';
import { projectService } from "@smart/services/project.service";
import { uploadService } from "@smart/services/upload.service";
import { projectStore } from "@smart/store/project";
import type { Project } from "@smart/types/project";
import { getProjectSocketManager } from "@smart/store/realtime";
import { useRouter } from "next/navigation";

const { Option } = Select;
const { Text } = Typography;

export default function CreateBoardButton({ 
  children, 
  forceAiOpen = false,
  onAiClose
}: { 
  children?: React.ReactNode;
  forceAiOpen?: boolean;
  onAiClose?: () => void;
}) {
  const router = useRouter();
  const { colors, images } = useBoardStore();
  const { addNotification } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("workspace");
  const [background, setBackground] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [fileObjs, setFileObjs] = useState<File[]>([]);

  // AI create states (kept separate to not affect existing flow)
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Singleton socket manager
  const projectSocketManager = getProjectSocketManager();
  
  useEffect(() => {
    if (forceAiOpen) {
      setAiOpen(true);
    }
  }, [forceAiOpen]);

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

    const correlationId = crypto.randomUUID();
    const body: any = {
      name: title,
      visibility,
      correlationId,
    };

    if (!fileObjs.length && finalBackground) {
      if (images.includes(finalBackground)) body.background = finalBackground;
      else if (colors.includes(finalBackground)) body.color = finalBackground;
    }

    try {
      // Gọi API tạo project
      const createRes = await projectService.createProject(body);

      if (!createRes.success || !createRes.data?.fullProject) {
        throw new Error(createRes.message || "Tạo bảng thất bại");
      }

      let project = createRes.data.fullProject;

      // Lưu vào store và chuyển trang
      projectStore.getState().addProject(project);
      projectStore.getState().setCurrentProject(project);

      if (fileObjs.length > 0 || body.color) {
        const updateCorrelationId = crypto.randomUUID();
        const updateData: any = {
          projectId: project.id,
          correlationId: updateCorrelationId,
        };

        if (fileObjs.length > 0) {
          const folder = project.folderPath || project.id;
          const uploadRes = await uploadService.uploadFiles(folder, fileObjs);
          if (!uploadRes.success) throw new Error("File upload thất bại");

          updateData.files = (uploadRes.data || []).map((f: any) => ({
            publicId: f.public_id,
            url: f.url,
            type: f.type,
            size: f.size,
            originalFilename: f.original_filename,
            resourceType: f.resource_type,
          }));
        }

        if (body.color) {
          updateData.color = body.color;
        }

        // Gọi API update project
        const updateRes = await projectService.updateProject(updateData);
        if (!updateRes.success || !updateRes.data) {
          throw new Error(updateRes.message || "Cập nhật bảng thất bại");
        }

        project = updateRes.data;
        projectStore.getState().updateProject(project);
        projectStore.getState().setCurrentProject(project);
      }

      addNotification(`Tạo bảng "${project.name}" thành công`, "success");
      router.push(`/projects/${project.id}`);
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

  const handleCreateWithAI = async () => {
    if (!aiPrompt.trim()) {
      addNotification("Vui lòng nhập prompt cho AI", "error");
      return;
    }

    setAiLoading(true);
    setAiResult(null);

    try {
      const res = await projectService.aiBuildProject(aiPrompt.trim());
      setAiResult(res);

      const projectId =
        res?.project?.id ??
        res?.data?.project?.id ??
        res?.data?.fullProject?.id ??
        res?.data?.projectId;

      if (!projectId) {
        throw new Error("AI đã trả về nhưng không tìm thấy projectId");
      }

      addNotification("AI đã tạo project/board xong, đang chuyển hướng…", "success");
      setAiOpen(false);
      setAiPrompt("");
      router.push(`/projects/${projectId}`);
    } catch (err: any) {
      addNotification(err.message || "AI build thất bại", "error");
    } finally {
      setAiLoading(false);
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
    <div className="w-[280px]">
      <Space direction="vertical" size={16} className="w-full">
        <Card size="small" className="shadow-sm overflow-hidden"
          style={{
            backgroundImage: background?.startsWith("/background") || background?.startsWith("data:image") ? `url(${background})` : undefined,
            backgroundColor: background && !background.startsWith("http") && !background.startsWith("data:image") ? background : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            height: 100,
            borderRadius: 12,
            border: 'none'
          }}
        />
        <div>
          <Text strong className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Hình nền</Text>
          <Row gutter={[8, 8]}>
            {images.slice(0, 3).map(img => <Col span={6} key={img}>{renderImageBox(img)}</Col>)}
            <Col span={6}>{renderUploadBox()}</Col>
          </Row>
        </div>
        <div>
          <Text strong className="text-xs uppercase tracking-wider text-gray-400 mb-2 block">Màu sắc</Text>
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
        <div className="space-y-3">
          <Input placeholder="Tiêu đề bảng..." value={title} onChange={e => setTitle(e.target.value)} className="h-10 rounded-lg" />
          <Select value={visibility} onChange={setVisibility} className="w-full h-10 rounded-lg">
            <Option value="private">Cá nhân</Option>
            <Option value="workspace">Workspace</Option>
            <Option value="public">Công khai</Option>
          </Select>
        </div>
        
        <Button type="primary" block onClick={handleCreate} className="h-10 rounded-lg font-bold shadow-md shadow-blue-500/20">
          Tạo bảng mới
        </Button>

        <div className="flex items-center gap-2 py-1">
          <div className="h-[1px] flex-1 bg-gray-100" />
          <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Hoặc</span>
          <div className="h-[1px] flex-1 bg-gray-100" />
        </div>

        <Button
          block
          onClick={() => {
            setOpen(false);
            setAiOpen(true);
          }}
          className="h-11 rounded-xl border-none text-white font-bold flex items-center justify-center gap-2 overflow-hidden relative group"
          style={{
            background: 'linear-gradient(135deg, #4285F4 0%, #34A853 25%, #FBBC05 50%, #EA4335 100%)',
            boxShadow: '0 4px 15px rgba(66, 133, 244, 0.3)'
          }}
        >
          <span className="relative z-10 flex items-center gap-2">
            <PlusOutlined />
            Tạo bằng AI (Gemini)
          </span>
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Button>
      </Space>
    </div>
  );

  return (
    <>
      <Popover content={content} trigger="click" open={open} onOpenChange={setOpen} placement="bottomLeft" overlayClassName="premium-popover">
        {children || <Button type="primary" icon={<PlusOutlined />} className="rounded-lg shadow">Create Board</Button>}
      </Popover>

      <Modal
        title={
          <div className="flex items-center gap-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 font-black text-xl">
             <RocketOutlined className="text-blue-600" />
             Xây dựng dự án với AI
          </div>
        }
        open={aiOpen}
        onCancel={() => {
          if (aiLoading) return;
          setAiOpen(false);
          setAiPrompt("");
          setAiResult(null);
          onAiClose?.();
        }}
        onOk={handleCreateWithAI}
        okText={aiLoading ? "Đang xử lý..." : "Bắt đầu tạo"}
        cancelText="Hủy bỏ"
        okButtonProps={{ 
          className: "h-10 rounded-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 border-none shadow-lg shadow-blue-500/30",
          disabled: aiLoading 
        }}
        cancelButtonProps={{ disabled: aiLoading, className: "h-10 rounded-lg" }}
        destroyOnHidden
        width={600}
        centered
      >
        <Space direction="vertical" size={20} style={{ width: "100%" }} className="py-4">
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
          />

          <Input.TextArea
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder='Tôi muốn tạo một dự án về...'
            autoSize={{ minRows: 4, maxRows: 8 }}
            disabled={aiLoading}
            className="rounded-xl border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-lg p-4"
          />

          {aiLoading && (
            <div className="flex flex-col items-center justify-center py-6 animate-pulse">
              <Spin size="large" />
              <Text type="secondary" className="mt-4 font-medium italic">Gemini đang phân tích và thiết kế cấu trúc dự án cho bạn...</Text>
            </div>
          )}
        </Space>
      </Modal>
    </>
  );
}
