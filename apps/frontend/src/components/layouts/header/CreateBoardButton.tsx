"use client";

import { useState, useEffect } from "react";
import {
  PlusOutlined,
  CheckOutlined,
  UploadOutlined,
  RocketOutlined
} from "@ant-design/icons";
import {
  Button,
  Popover,
  Upload,
  Modal,
} from "antd";
import { useBoardStore } from "@smart/store/setting";
import { useNotificationStore } from '@smart/store/notification';
import { projectService } from "@smart/services/project.service";
import { uploadService } from "@smart/services/upload.service";
import { projectStore } from "@smart/store/project";
import { useRouter } from "next/navigation";
import { ManualCreationContent } from "./create-board/ManualCreationContent";
import { AIModal } from "./create-board/AIModal";

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
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("workspace");
  const [background, setBackground] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [fileObjs, setFileObjs] = useState<File[]>([]);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (forceAiOpen) {
      setAiOpen(true);
    }
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
      description,
      visibility,
      correlationId,
    };

    if (!fileObjs.length && finalBackground) {
      if (images.includes(finalBackground)) body.background = finalBackground;
      else if (colors.includes(finalBackground)) body.color = finalBackground;
    }

    try {
      const createRes = await projectService.createProject(body);
      if (!createRes.success || !createRes.data?.fullProject) {
        throw new Error(createRes.message || "Tạo bảng thất bại");
      }

      let project = createRes.data.fullProject;
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
      setDescription("");
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

      const projectId = res?.project?.id ?? res?.data?.project?.id ?? res?.data?.fullProject?.id ?? res?.data?.projectId;

      if (!projectId) {
        throw new Error("AI đã trả về nhưng không tìm thấy projectId");
      }

      const finalBackground = images[0] || colors[0];
      if (finalBackground) {
        const updateData: any = { projectId: projectId };
        if (images.includes(finalBackground)) updateData.background = finalBackground;
        else if (colors.includes(finalBackground)) updateData.color = finalBackground;
        await projectService.updateProject(updateData);
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

  const manualContent = (
    <ManualCreationContent
      title={title}
      setTitle={setTitle}
      description={description}
      setDescription={setDescription}
      visibility={visibility}
      setVisibility={setVisibility}
      background={background}
      setBackground={setBackground}
      color={color}
      setColor={setColor}
      fileObjs={fileObjs}
      setFileObjs={setFileObjs}
      handleCreate={handleCreate}
      onOpenAi={() => { setOpen(false); setAiOpen(true); }}
      images={images}
      colors={colors}
      renderImageBox={renderImageBox}
      renderUploadBox={renderUploadBox}
      renderColorBox={renderColorBox}
    />
  );

  return (
    <>
      {isMobile ? (
        <div onClick={() => setOpen(true)}>
          {children || (
            <Button type="primary" icon={<PlusOutlined />} className="h-9 rounded-full px-5 bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-lg shadow-blue-500/20 font-bold">
              Create
            </Button>
          )}
        </div>
      ) : (
        <Popover
          content={manualContent}
          trigger="click"
          open={open}
          onOpenChange={setOpen}
          placement="bottomLeft"
          overlayClassName="modern-popover-wide"
          overlayStyle={{ maxWidth: 'calc(100vw - 24px)' }}
          overlayInnerStyle={{ padding: 0, borderRadius: '24px', overflow: 'hidden' }}
          align={{ offset: [0, 8] }}
          getPopupContainer={(trigger) => trigger.parentElement || document.body}
        >
          {children || (
            <Button type="primary" icon={<RocketOutlined />} className="h-9 rounded-full px-5 bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-lg shadow-blue-500/20 font-bold">
              Create
            </Button>
          )}
        </Popover>
      )}

      {/* Manual Modal (Mobile Only) */}
      <Modal
        open={isMobile && open}
        onCancel={() => setOpen(false)}
        footer={null}
        width="100%"
        centered
        className="mobile-create-modal"
        styles={{ 
          content: { backgroundColor: 'transparent', boxShadow: 'none', padding: 0 },
          body: { padding: 0, overflow: 'hidden' }
        }}
      >
        <div className="bg-white dark:bg-neutral-950 rounded-[24px] border border-gray-200 dark:border-neutral-800 overflow-hidden shadow-2xl">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-neutral-900 bg-gray-50/50 dark:bg-neutral-900/50 flex items-center">
            <div className="font-black text-lg uppercase tracking-tight dark:text-white">Tạo bảng mới</div>
          </div>
          <div className="p-1">
            {manualContent}
          </div>
        </div>
      </Modal>

      {/* AI Modal (Universal) */}
      <AIModal
        open={aiOpen}
        onClose={() => {
          setAiOpen(false);
          setAiPrompt("");
          setAiResult(null);
          onAiClose?.();
        }}
        aiPrompt={aiPrompt}
        setAiPrompt={setAiPrompt}
        aiLoading={aiLoading}
        aiResult={aiResult}
        handleCreateWithAI={handleCreateWithAI}
      />
    </>
  );
}
