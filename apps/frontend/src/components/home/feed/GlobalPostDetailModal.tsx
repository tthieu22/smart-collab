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
      width={1200}
      centered
      destroyOnClose
      styles={{
        content: { padding: 0, borderRadius: '32px', overflow: 'hidden' },
        body: { padding: 0 }
      }}
      className="post-detail-modal"
    >
      {activePostId && (
        <PostDetail 
          postId={activePostId} 
        />
      )}
    </Modal>
  );
}
