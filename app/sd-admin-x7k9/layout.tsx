'use client';

import { ThemeProvider } from "@/lib/theme/ThemeContext";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider>
      {/* No AuthProvider - admin has its own authentication */}
      {/* No Navbar, Footer, or AIConcierge */}
      {children}
    </ThemeProvider>
  );
}
