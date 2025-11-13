'use client';

import { Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import TextArea from 'antd/es/input/TextArea';

interface Props {
  newComment: string;
  setNewComment: (v: string) => void;
  addComment: () => void;
}

const CommentInput: React.FC<Props> = ({ newComment, setNewComment, addComment }) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <TextArea
        placeholder="Viết bình luận..."
        value={newComment}
        onChange={e => setNewComment(e.target.value)}
        rows={3}
        style={{ marginBottom: 8 }}
      />
      <Button type="primary" onClick={addComment} disabled={!newComment.trim()} icon={<SendOutlined />}>
        Gửi
      </Button>
    </div>
  );
};

export default CommentInput;