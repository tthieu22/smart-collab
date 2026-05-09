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
      width={900}
      centered
      destroyOnHidden
      styles={{
        content: { padding: 0, borderRadius: 32 },
        body: { padding: 0 }
      }}
      className="post-detail-modal-responsive"
    >
      <style jsx global>{`
        .post-detail-modal-responsive {
          max-width: 95vw !important;
          padding-bottom: 0 !important;
        }
        
        .post-detail-modal-responsive .ant-modal-content {
          background-color: white !important;
          border-radius: 0 !important;
          height: 100vh !important;
          overflow-y: auto;
          overflow-x: hidden;
          position: relative;
        }

        .dark .post-detail-modal-responsive .ant-modal-content {
          background-color: #0a0a0a !important;
        }

        @media (min-width: 768px) {
          .post-detail-modal-responsive {
            max-width: 900px !important;
          }
          .post-detail-modal-responsive .ant-modal-content {
            height: auto !important;
            max-height: 90vh !important;
            border-radius: 32px !important;
            overflow-y: auto !important;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
          }
        }
        
        .post-detail-modal-responsive .ant-modal-content::-webkit-scrollbar {
          width: 6px;
        }
        .post-detail-modal-responsive .ant-modal-content::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .dark .post-detail-modal-responsive .ant-modal-content::-webkit-scrollbar-thumb {
          background: #262626;
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
