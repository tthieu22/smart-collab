'use client';

import React from 'react';
import Link from 'next/link';
import {
  Zap,
  Globe,
  Mail,
  ShieldCheck,
  Heart,
  Cpu,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@smart/components/ui/button';
import { Input } from 'antd';
import FooterLink from './FooterLink';
import SocialLinks from './SocialLinks';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-white dark:bg-[#030303] border-t border-gray-100 dark:border-white/5 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">

          {/* Section 1: Brand & Status (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                  <Zap size={20} className="text-white fill-current" />
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                SMART <span className="text-blue-600">COLLAB</span>
              </span>
            </div>

            <p className="text-sm leading-6 text-gray-500 dark:text-gray-400 font-medium max-w-sm">
              Nền tảng cộng tác thông minh giúp tối ưu hóa hiệu suất làm việc với sự hỗ trợ từ trí tuệ nhân tạo thế hệ mới.
            </p>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 space-y-3 shadow-sm">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <span>AI Service Status</span>
                <span className="flex items-center gap-1.5 text-green-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Operational
                </span>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#030303] bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                      <Cpu size={10} className="text-gray-500" />
                    </div>
                  ))}
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  3 AI Nodes Active
                </span>
              </div>
            </div>

            <SocialLinks />
          </div>

          {/* Section 2: Quick Links (5 cols split) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest px-1">Khám phá</h3>
              <ul className="flex flex-col gap-2">
                {[
                  { name: 'Quản lý Dự án', href: '/projects' },
                  { name: 'Trung tâm AI', href: '/admin/ai-auto-post' },
                  { name: 'Tin tức & Bài viết', href: '/news' },
                  { name: 'Tìm kiếm Thông minh', href: '/search' },
                ].map((item) => (
                  <li key={item.name}>
                    <FooterLink href={item.href}>{item.name}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest px-1">Tài nguyên</h3>
              <ul className="flex flex-col gap-2">
                {[
                  { name: 'Tài liệu', href: '/docs' },
                  { name: 'Hướng dẫn', href: '/docs/guide' },
                  { name: 'API Status', href: '/status' },
                  { name: 'Cộng đồng', href: '/community' },
                ].map((item) => (
                  <li key={item.name}>
                    <FooterLink href={item.href}>{item.name}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 3: Newsletter (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest px-1">Đăng ký bản tin</h3>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
              <div className="relative bg-white dark:bg-[#0a0a0a] rounded-2xl p-4 border border-gray-100 dark:border-white/5 space-y-4">
                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">
                  Nhận tin tức mới nhất về các tính năng AI mới nhất.
                </p>
                <div className="space-y-2">
                  <Input
                    placeholder="Email của bạn"
                    className="h-10 rounded-xl bg-gray-50 dark:bg-white/[0.03] border-none ring-1 ring-gray-200 dark:ring-white/[0.08] focus:ring-blue-500/50 transition-all"
                  />
                  <Button variant="primary" className="w-full rounded-xl h-10 font-bold shadow-md shadow-blue-500/10 gap-2">
                    Tham gia ngay <ArrowUpRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="mt-16 pt-8 border-t border-gray-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-4">
            <Link href="/privacy" className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-500 transition-colors">Quyền riêng tư</Link>
            <Link href="/terms" className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-500 transition-colors">Điều khoản</Link>
            <Link href="/security" className="text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-blue-500 transition-colors">Bảo mật</Link>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[12px] font-medium text-gray-400 dark:text-gray-500">
              © {currentYear} Smart Collab. Built with <Heart size={12} className="inline text-red-500 mx-0.5 fill-red-500" /> globally.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
