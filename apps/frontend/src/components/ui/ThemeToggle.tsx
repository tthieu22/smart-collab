'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { useBoardStore } from '@smart/store/setting';
import { cn } from '@smart/lib/utils';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
    const theme = useBoardStore((s) => s.theme);
    const setTheme = useBoardStore((s) => s.setTheme);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSetTheme = (val: "light" | "dark" | "system") => {
        setTheme(val);
        
        // Manual DOM update to sync with AvatarMenu's behavior
        if (val === "dark") {
            document.documentElement.classList.add("dark");
        } else if (val === "light") {
            document.documentElement.classList.remove("dark");
        } else {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            if (prefersDark) document.documentElement.classList.add("dark");
            else document.documentElement.classList.remove("dark");
        }
    };

    const toggleTheme = () => {
        if (theme === 'light') {
            handleSetTheme('dark');
        } else if (theme === 'dark') {
            handleSetTheme('system');
        } else {
            handleSetTheme('light');
        }
    };

    if (!mounted) {
        return (
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
        );
    }

    return (
        <button
            onClick={toggleTheme}
            className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5"
            )}
            title={theme === 'light' ? 'Chuyển sang Tối' : theme === 'dark' ? 'Chuyển sang Hệ thống' : 'Chuyển sang Sáng'}
        >
            {theme === 'dark' ? (
                <Moon size={18} className="text-blue-400" />
            ) : theme === 'light' ? (
                <Sun size={18} className="text-amber-500" />
            ) : (
                <Monitor size={18} className="text-gray-500 dark:text-gray-400" />
            )}
        </button>
    );
}
