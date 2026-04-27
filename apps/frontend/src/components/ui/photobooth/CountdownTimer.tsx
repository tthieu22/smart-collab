'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound } from './sounds';

interface CountdownTimerProps {
    seconds: number;
    onFinish: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ seconds, onFinish }) => {
    const [count, setCount] = useState(seconds);

    useEffect(() => {
        if (count > 0) {
            playSound('countdown');
        }

        if (count === 1) {
            // Predict shutter sound to sync with capture
            setTimeout(() => playSound('shutter'), 800);
        }

        if (count <= 0) {
            onFinish();
            return;
        }

        const timer = setTimeout(() => {
            setCount(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [count, onFinish]);

    return (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={count}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "backOut" }}
                    className="text-[12rem] font-black text-white drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
                >
                    {count > 0 ? count : ''}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
