'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ThemeProvider } from '@/lib/theme/ThemeContext';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
