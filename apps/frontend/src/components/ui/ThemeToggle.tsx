'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from 'antd';

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-neutral-900 animate-pulse" />
        );
    }

    const isDark = resolvedTheme === 'dark';

    return (
        <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-all duration-300"
        >
            {isDark ? (
                <Sun size={18} className="text-amber-500" />
            ) : (
                <Moon size={18} className="text-blue-600" />
            )}
        </button>
    );
}
