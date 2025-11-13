'use client';

import React from 'react';
import { Avatar, Typography, theme } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import type { CardComment } from '@smart/types/project';

const { Text, Paragraph } = Typography;

interface Props {
  item: CardComment;
}

const CommentItem: React.FC<Props> = ({ item }) => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '12px 0',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Avatar size={36} icon={<UserOutlined />} />
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <Text strong style={{ fontSize: 14, color: token.colorText }}>
            {item.userName}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, color: token.colorTextSecondary }}>
            {format(new Date(item.createdAt), 'HH:mm, dd/MM/yyyy')}
          </Text>
        </div>
        <Paragraph
          style={{
            margin: 0,
            color: token.colorText,
            lineHeight: 1.5,
          }}
        >
          {item.content}
        </Paragraph>
      </div>
    </div>
  );
};

export default CommentItem;
