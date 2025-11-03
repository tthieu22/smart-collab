'use client';

import { useState } from 'react';
import { Card as CardType } from '@smart/types/project';
import {
  ClockCircleOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { Tooltip } from 'antd';

interface CardProps {
  card: CardType;
}

export function Card({ card }: CardProps) {
  const [checked, setChecked] = useState(false);

  const hasLabels = card.labels && card.labels.length > 0;
  const hasDescription = !!card.description;
  const hasFooter = card.deadline || card.priority !== undefined;

  return (
    <div className="group relative w-full rounded-lg border shadow-sm transition-all cursor-pointer p-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md">
      {/* Toggle check icon */}
      <div
        className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          setChecked((prev) => !prev);
        }}
      >
        {checked ? (
          <CheckCircleFilled className="text-[17px] text-blue-500 transition-all" />
        ) : (
          <CheckCircleOutlined className="text-[17px] text-gray-400 hover:text-blue-400 transition-all" />
        )}
      </div>

      {/* Nội dung Card */}
      <div className="flex flex-col gap-1 transition-all group-hover:pl-5 pl-0">
        {/* Labels */}
        {hasLabels && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {card.labels!.map((label, i) => (
              <span
                key={i}
                className="h-1.5 w-8 rounded-full"
                style={{ backgroundColor: label.color || '#61BD4F' }}
              />
            ))}
          </div>
        )}

        {/* Title */}
        <div className="font-medium text-[13.5px] text-gray-900 dark:text-gray-100 leading-snug">
          {card.title || 'Untitled Card'}
        </div>

        {/* Description */}
        {hasDescription && (
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {card.description}
          </p>
        )}

        {/* Footer */}
        {hasFooter && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {card.priority !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wide
                  ${
                    card.priority === 1
                      ? 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : card.priority === 2
                      ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }`}
                >
                  {card.priority === 1
                    ? 'High'
                    : card.priority === 2
                    ? 'Medium'
                    : 'Low'}
                </span>
              )}

              {card.deadline && (
                <Tooltip title="Deadline">
                  <span className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                    <ClockCircleOutlined className="text-[11px]" />
                    <span>
                      {new Date(card.deadline).toLocaleDateString('vi-VN')}
                    </span>
                  </span>
                </Tooltip>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
