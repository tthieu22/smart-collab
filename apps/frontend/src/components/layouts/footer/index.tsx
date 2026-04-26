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
    <footer className="relative bg-white/80 dark:bg-[#050505] border-t border-gray-200 dark:border-neutral-800 backdrop-blur-xl overflow-hidden shadow-[inset_0_1px_0_0_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Section 1: Brand & Status (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                  <Zap size={18} className="text-white fill-current" />
                </div>
              </div>
              <span className="text-lg font-black tracking-tighter text-gray-900 dark:text-white uppercase">
                SMART <span className="text-blue-600">COLLAB</span>
              </span>
            </div>

            <p className="text-[13px] leading-relaxed text-gray-500 dark:text-neutral-400 font-medium max-w-sm">
              Nền tảng cộng tác thông minh giúp tối ưu hóa hiệu suất làm việc với sự hỗ trợ từ trí tuệ nhân tạo thế hệ mới.
            </p>

            <div className="p-3 rounded-[24px] bg-white/50 dark:bg-neutral-950/20 border border-gray-200 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/5 space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-gray-400 dark:text-neutral-500">
                <span>Trạng thái hệ thống</span>
                <span className="flex items-center gap-1.5 text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full">
                  <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                  Ổn định
                </span>
              </div>
              <div className="flex items-center gap-3 pt-0.5">
                <div className="flex -space-x-1.5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-5 h-5 rounded-full border border-white dark:border-[#030303] bg-gray-100 dark:bg-neutral-800 flex items-center justify-center text-gray-400">
                      <Cpu size={10} />
                    </div>
                  ))}
                </div>
                <span className="text-[10px] font-bold text-gray-600 dark:text-neutral-400">
                  3 AI Nodes đang hoạt động
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Quick Links (4 cols split) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-4 pt-1">
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] opacity-70">Khám phá</h3>
              <ul className="flex flex-col gap-2">
                {[
                  { name: 'Quản lý Dự án', href: '/projects' },
                  { name: 'Trung tâm AI', href: '/admin/ai-auto-post' },
                  { name: 'Tin tức & Bài viết', href: '/news' },
                  { name: 'Tìm kiếm Thông minh', href: '/search' },
                ].map((item) => (
                  <li key={item.name}>
                    <FooterLink href={item.href} className="text-[13px]">{item.name}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] opacity-70">Tài nguyên</h3>
              <ul className="flex flex-col gap-2">
                {[
                  { name: 'Tài liệu', href: '/docs' },
                  { name: 'Hướng dẫn', href: '/docs/guide' },
                  { name: 'API Status', href: '/status' },
                  { name: 'Cộng đồng', href: '/community' },
                ].map((item) => (
                  <li key={item.name}>
                    <FooterLink href={item.href} className="text-[13px]">{item.name}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 3: Newsletter (4 cols) */}
          <div className="lg:col-span-4 pt-1">
            <div className="bg-white/50 dark:bg-neutral-950/20 rounded-[24px] p-3.5 border border-gray-200 dark:border-neutral-800 ring-1 ring-black/5 dark:ring-white/5 space-y-3.5 shadow-sm">
              <div className="space-y-1">
                <h3 className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-[0.2em] opacity-70">Đăng ký bản tin</h3>
                <p className="text-[12px] text-gray-500 dark:text-neutral-400 font-medium leading-relaxed">
                  Nhận thông báo mới nhất về các tính năng AI.
                </p>
              </div>
              <div className="space-y-2">
                <Input
                  placeholder="Email của bạn"
                  className="h-9 rounded-xl bg-gray-50 dark:bg-white/[0.03] border-none ring-1 ring-gray-200 dark:ring-white/[0.1] focus:ring-blue-500/50 transition-all text-[12px]"
                />
                <Button variant="primary" className="w-full rounded-xl h-9 font-bold shadow-md shadow-blue-500/10 gap-2 text-[12px] bg-blue-600">
                  Tham gia ngay <ArrowUpRight size={14} />
                </Button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Bottom */}
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-3">
              <Link href="/privacy" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-500 transition-colors">Quyền riêng tư</Link>
              <Link href="/terms" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-500 transition-colors">Điều khoản</Link>
              <Link href="/security" className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-500 transition-colors">Bảo mật</Link>
            </div>
            <div className="h-4 w-px bg-gray-200 dark:bg-neutral-800 hidden md:block" />
            <SocialLinks />
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 tracking-tight">
              © {currentYear} SMART COLLAB. Built with <Heart size={10} className="inline text-red-500 mx-0.5 fill-red-500 animate-pulse" /> by <Link target="_blank" href="https://github.com/tthieu22" className="text-blue-500 hover:text-blue-600 transition-colors">tthieu22</Link>.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
