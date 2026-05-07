'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from '@smart/components/layouts';
import { useAIStore } from '@smart/store/ai';
import { AIChatWindow } from '../shared/AIChatWindow';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@smart/lib/utils';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');
  const { isAIChatOpen, setIsAIChatOpen, toggleAIChat } = useAIStore();
  const isAllowedPage = pathname === '/' || pathname === '/feed' || pathname === '/projects' || pathname === '/news';

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen relative">
      <div className="sticky top-0 z-50">
        <Header />
      </div>
      <main className="flex-1">
        {children}
      </main>

      {/* Floating AI Assistant Button */}
      <AnimatePresence>
        {!isAIChatOpen && isAllowedPage && (
          <motion.button
            drag="y"
            dragConstraints={{ top: -400, bottom: 200 }}
            dragElastic={0.1}
            dragMomentum={false}
            initial={{ scale: 0, opacity: 0, x: 20 }}
            animate={{ scale: 1, opacity: 1, x: 0 }}
            exit={{ scale: 0, opacity: 0, x: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9, cursor: "grabbing" }}
            onClick={toggleAIChat}
            className={cn(
              "fixed top-[75%] right-6 z-[60] w-10 h-10 rounded-xl flex lg:hidden items-center justify-center",
              "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-2xl shadow-blue-500/40",
              "border border-white/20 backdrop-blur-md overflow-hidden group touch-none"
            )}
            title="Trợ lý AI (Kéo để di chuyển)"
          >
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            <Sparkles size={18} className="relative z-10 animate-pulse pointer-events-none" />
            
            {/* Visual pulse effect */}
            <div className="absolute inset-0 rounded-2xl ring-4 ring-blue-500/30 animate-ping opacity-20 pointer-events-none" />
          </motion.button>
        )}
      </AnimatePresence>

      <AIChatWindow isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} />
    </div>
  );
}
