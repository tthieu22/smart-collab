'use client';

import React, { useState, useEffect } from 'react';
import { Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import TextArea from 'antd/es/input/TextArea';

interface Props {
  newComment: string;
  setNewComment: (v: string) => void;
  addComment: () => void;
}

const CommentInput: React.FC<Props> = ({ newComment, setNewComment, addComment }) => {
  const [localComment, setLocalComment] = useState(newComment);

  useEffect(() => {
    setLocalComment(newComment);
  }, [newComment]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalComment(e.target.value);
  };

  const handleSend = () => {
    if (localComment.trim()) {
      setNewComment(localComment.trim());
      addComment();
      setLocalComment('');
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <TextArea
        placeholder="Viết bình luận..."
        value={localComment}
        onChange={handleChange}
        onKeyDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        rows={3}
        style={{ marginBottom: 8 }}
      />
      <Button
        type="primary"
        onClick={handleSend}
        disabled={!localComment.trim()}
        icon={<SendOutlined />}
      >
        Gửi
      </Button>
    </div>
  );
};

export default CommentInput;
