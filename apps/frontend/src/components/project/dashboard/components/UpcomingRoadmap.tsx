'use client';

import React from 'react';
import { Row, Col, Card, Typography, Tag, Button, Avatar, Empty } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';

const { Title } = Typography;

interface Props {
    tasks: any[];
    columns: any;
    glassStyle: React.CSSProperties;
}

const UpcomingRoadmap: React.FC<Props> = ({ tasks, columns, glassStyle }) => {
    return (
        <Card bordered={false} style={glassStyle} title={<div className="flex justify-between items-center"><span><ClockCircleOutlined /> Lộ trình công việc sắp tới</span> <Button type="link" size="small" className="text-indigo-500 font-bold">Xem tất cả</Button></div>}>
            <Row gutter={[24, 24]}>
                {tasks.length > 0 ? tasks.map((task, i) => (
                    <Col xs={24} md={8} lg={6} key={i}>
                        <motion.div
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="p-6 rounded-[32px] bg-white dark:bg-black/40 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-2xl transition-all h-full flex flex-col group cursor-pointer"
                        >
                            <div className="flex justify-between mb-6">
                                <Tag color={task.priority === 3 ? 'red' : 'orange'} bordered={false} className="m-0 rounded-xl text-[10px] font-[900] px-4 py-1">
                                    {task.priority === 3 ? 'KHẨN CẤP' : 'CAO'}
                                </Tag>
                                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 group-hover:text-indigo-400">
                                    <ClockCircleOutlined />
                                    {dayjs(task.deadline).format('DD MMM')}
                                </div>
                            </div>
                            <Title level={5} className="m-0 mb-6 line-clamp-2 dark:text-white flex-1 font-bold leading-snug group-hover:text-indigo-500 transition-colors">
                                {task.title}
                            </Title>
                            <div className="flex justify-between items-center pt-6 border-t border-gray-50 dark:border-white/5">
                                <Avatar.Group size="small" max={{ count: 2 }}>
                                    {task.members?.map((m: any) => <Avatar src={m.userAvatar} key={m.userId} className="border-2 border-white dark:border-gray-800" />)}
                                </Avatar.Group>
                                <Tag color="blue" bordered={false} className="m-0 text-[9px] font-[900] tracking-wider uppercase px-2 py-0.5 rounded-lg opacity-60 group-hover:opacity-100">{columns[task.columnId!]?.title}</Tag>
                            </div>
                        </motion.div>
                    </Col>
                )) : <Empty description="Hiện không có công việc khẩn cấp sắp tới" />}
            </Row>
        </Card>
    );
};

export default UpcomingRoadmap;
