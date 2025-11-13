'use client';

import React from 'react';
import { Space, Tag, Avatar, Button, Typography, theme } from 'antd';
import { PlusOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Props {
  labels: Label[];
}

const LabelsAndMembers: React.FC<Props> = ({ labels }) => {
  const { token } = theme.useToken();

  return (
    <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
      <div>
        <Text strong style={{ color: token.colorText }}>Labels:</Text>{' '}
        <Space>
          {labels.map(l => (
            <Tag key={l.id} color={l.color}>
              {l.name}
            </Tag>
          ))}
          <Button size="small" icon={<PlusOutlined />}>
            Add
          </Button>
        </Space>
      </div>

      <div>
        <Text strong style={{ color: token.colorText }}>Members:</Text>{' '}
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Avatar size="small" style={{ backgroundColor: token.colorSuccess }}>
            A
          </Avatar>
          <Avatar size="small" style={{ backgroundColor: token.colorWarning }}>
            B
          </Avatar>
          <Button size="small" icon={<PlusOutlined />}>
            Add
          </Button>
        </Space>
      </div>
    </Space>
  );
};

export default LabelsAndMembers;
