'use client';

import { Modal } from 'antd';
import { useFeedStore } from '@smart/store/feed';
import PostDetail from './PostDetail';

export default function GlobalPostDetailModal() {
  const activePostId = useFeedStore((s) => s.activePostId);
  const setActivePostId = useFeedStore((s) => s.setActivePostId);

  return (
    <Modal
      open={!!activePostId}
      onCancel={() => setActivePostId(null)}
      footer={null}
      title={null}
      closable={false}
      width={1000}
      destroyOnHidden
      style={{ top: 0, paddingBottom: 0 }}
      styles={{
        content: { padding: 0, borderRadius: 0, background: 'transparent', boxShadow: 'none' },
        body: { padding: 0 }
      }}
      className="post-detail-modal-responsive"
    >
      <style jsx global>{`
        .post-detail-modal-responsive {
          max-width: 100vw !important;
          margin: 0 !important;
          top: 0 !important;
          padding-bottom: 0 !important;
          height: 100vh;
        }
        .post-detail-modal-responsive .ant-modal-content {
          height: 100vh !important;
          overflow-y: auto;
          overflow-x: hidden;
          background-color: white !important;
          border-radius: 0 !important;
        }
        .dark .post-detail-modal-responsive .ant-modal-content {
          background-color: #0a0a0a !important;
        }
        
        .post-detail-modal-responsive .ant-modal-content::-webkit-scrollbar {
          width: 4px;
        }
        .post-detail-modal-responsive .ant-modal-content::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .post-detail-modal-responsive .ant-modal-content::-webkit-scrollbar-thumb {
          background: #1e293b;
        }

        @media (min-width: 768px) {
          .post-detail-modal-responsive {
            max-width: 1000px !important;
            margin: 20px auto !important;
            top: 20px !important;
            height: auto;
          }
          .post-detail-modal-responsive .ant-modal-content {
            height: auto !important;
            max-height: calc(100vh - 40px);
            border-radius: 32px !important;
            background-color: transparent !important;
          }
        }
      `}</style>
      {activePostId && (
        <PostDetail 
          postId={activePostId} 
        />
      )}
    </Modal>
  );
}
