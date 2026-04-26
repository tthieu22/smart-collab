'use client';

import React from 'react';
import { Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

interface ProjectViewHeaderProps {
    icon: React.ReactNode;
    title: string;
    tagText?: string;
    tagColor?: string;
    count: number;
    filterText?: string;
    extra?: React.ReactNode;
}

const ProjectViewHeader: React.FC<ProjectViewHeaderProps> = ({
    icon,
    title,
    tagText,
    tagColor = 'blue',
    count,
    filterText = 'Tất cả',
    extra
}) => {
    return (
        <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-neutral-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    {icon}
                </div>
                <div>
                    {tagText && (
                        <Space className="mb-0.5">
                            <Tag color={tagColor} bordered={false} className="rounded-full px-3 text-[10px] font-bold uppercase m-0">
                                {tagText}
                            </Tag>
                            <Text type="secondary" className="text-[10px]">
                                {dayjs().format('dddd, DD MMMM YYYY')}
                            </Text>
                        </Space>
                    )}
                    <h1 className="text-xl font-bold dark:text-white m-0 leading-none">
                        {title}
                    </h1>
                    <Space className="text-[11px] text-gray-500 dark:text-neutral-400 mt-1">
                        <span className="font-bold text-blue-500">{count} thẻ</span>
                        <span className="opacity-30">|</span>
                        <span>Đang lọc: {filterText}</span>
                    </Space>
                </div>
            </div>

            {extra && (
                <div className="flex items-center gap-3 no-print w-full lg:w-auto">
                    {extra}
                </div>
            )}
        </div>
    );
};

export default ProjectViewHeader;
