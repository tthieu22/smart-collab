'use client';
import { useEffect } from 'react';
import { useAuthStore } from '../store/auth';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};
