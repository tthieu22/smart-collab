'use client';

import React from 'react';
import { Typography, List, theme } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import CommentInput from './CommentInput';
import CommentItem from './CommentItem';
import type { CardComment } from '@smart/types/project';

const { Text } = Typography;

interface Props {
  comments: CardComment[];
  newComment: string;
  setNewComment: (v: string) => void;
  addComment: () => void;
}

const ActivitySection: React.FC<Props> = ({ comments, newComment, setNewComment, addComment }) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        flex: 1,
        background: token.colorBgContainer,
        padding: 16,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
          color: token.colorText,
        }}
      >
        <MessageOutlined style={{ fontSize: 18, color: token.colorSuccess }} />
        <Text strong style={{ color: token.colorText }}>
          Activity
        </Text>
      </div>

      <CommentInput newComment={newComment} setNewComment={setNewComment} addComment={addComment} />

      <List
        dataSource={comments}
        renderItem={item => <CommentItem item={item} />}
        style={{
          background: token.colorBgContainer,
          color: token.colorText,
        }}
      />
    </div>
  );
};

export default ActivitySection;
