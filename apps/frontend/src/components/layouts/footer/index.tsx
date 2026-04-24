'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Github, 
  Youtube,
  Globe,
  Mail,
  Zap,
  ArrowRight,
  ShieldCheck,
  Heart
} from 'lucide-react';
import { Button } from '@smart/components/ui/button';
import { Input } from 'antd';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-white dark:bg-neutral-950 border-t border-gray-100 dark:border-neutral-900 overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      
      <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 sm:pt-24 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand Section */}
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
                <Zap size={24} className="text-white fill-current" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white uppercase">
                Smart Collab
              </span>
            </div>
            <p className="text-sm leading-6 text-gray-600 dark:text-gray-400 max-w-xs font-medium">
              Nền tảng cộng tác thông minh giúp tối ưu hóa hiệu suất làm việc của bạn với sự hỗ trợ từ trí tuệ nhân tạo.
            </p>
            <div className="flex space-x-6">
              {[
                { icon: <Facebook size={20} />, href: '#', label: 'Facebook' },
                { icon: <Twitter size={20} />, href: '#', label: 'Twitter' },
                { icon: <Instagram size={20} />, href: '#', label: 'Instagram' },
                { icon: <Github size={20} />, href: '#', label: 'GitHub' },
                { icon: <Youtube size={20} />, href: '#', label: 'YouTube' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-gray-400 hover:text-blue-500 transition-all duration-300 transform hover:scale-110"
                >
                  <span className="sr-only">{social.label}</span>
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links Grid */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Giải pháp</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {[
                    { name: 'Quản lý Dự án', href: '/projects' },
                    { name: 'Trung tâm AI', href: '/admin/ai-auto-post' },
                    { name: 'Tin tức & Bài viết', href: '/news' },
                    { name: 'Tìm kiếm Thông minh', href: '/search' },
                  ].map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-medium">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Hỗ trợ</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {['Tài liệu', 'Hướng dẫn', 'API Status', 'Trung tâm trợ giúp'].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors font-medium">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-1 md:gap-8">
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Bản tin</h3>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Đăng ký để nhận những cập nhật mới nhất về tính năng AI.
                </p>
                <form className="mt-6 sm:flex sm:max-w-md gap-2">
                  <Input 
                    placeholder="Email của bạn" 
                    className="h-11 rounded-xl bg-gray-50 dark:bg-neutral-900 border-none ring-1 ring-black/5 dark:ring-white/5"
                  />
                  <Button variant="primary" type="submit" className="mt-4 sm:mt-0 rounded-xl h-11 px-6 font-bold shadow-lg shadow-blue-500/20">
                    Đăng ký
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-gray-100 dark:border-neutral-900 pt-8 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 order-2 sm:order-1">
             <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-[10px] font-black uppercase tracking-widest border border-green-500/20">
               <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               System Operational
             </div>
             <div className="hidden md:flex items-center gap-4 text-[11px] text-gray-500 font-medium">
                <Link href="/about" className="hover:text-blue-500 transition-colors">Giới thiệu</Link>
                <Link href="/help" className="hover:text-blue-500 transition-colors">Hỗ trợ</Link>
                <Link href="/privacy" className="hover:text-blue-500 transition-colors">Quyền riêng tư</Link>
                <Link href="/terms" className="hover:text-blue-500 transition-colors">Điều khoản</Link>
             </div>
          </div>
          
          <p className="mt-8 text-[11px] text-gray-500 dark:text-gray-400 sm:mt-0 order-1 sm:order-2 font-medium">
            © {currentYear} Smart Collab. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}
