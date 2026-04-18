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
      width={1024}
      centered
      destroyOnClose
      styles={{
        body: { padding: 0 }
      }}
      className="post-detail-modal"
    >
      {activePostId && (
        <PostDetail 
          postId={activePostId} 
          onBack={() => setActivePostId(null)} 
        />
      )}
    </Modal>
  );
}
