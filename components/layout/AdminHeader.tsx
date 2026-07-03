'use client';

import { CalendarIcon, FileTextIcon, HomeIcon, PlusIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

const Icons = {
  LogOut: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Home: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
};

interface AdminHeaderProps {
  onLogout: () => void;
}

export default function AdminHeader({ onLogout }: AdminHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: 'Bookings', path: '/sd-admin-x7k9', icon: <CalendarIcon /> },
    { label: 'Venue Requests', path: '/sd-admin-x7k9/venues', icon: <FileTextIcon /> },
    { label: 'Listed Venues', path: '/sd-admin-x7k9/listed-venues', icon: <HomeIcon /> },
    { label: 'Add Venue', path: '/sd-admin-x7k9/add-venue', icon: <PlusIcon /> },
  ];

  return (
    <>
      {/* Admin Mode Banner */}
      <div className="bg-orange-500/20 border-b border-orange-500/30 py-2 px-4 text-center">
        <span className="text-orange-400 text-sm font-semibold">
          🔐 Admin Mode - This dashboard is isolated from the main application
        </span>
      </div>

      {/* Header */}
      <header className="bg-background-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-primary">ShiftsDeal Admin</h1>
              <p className="text-xs text-foreground-muted">Internal Dashboard</p>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 text-sm font-medium"
            >
              <Icons.LogOut />
              Logout
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`flex items-center gap-2 px-3 py-[6px] rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  pathname === item.path
                    ? 'bg-primary/20 text-primary border border-primary/30 cursor-default'
                    : 'bg-background-light text-foreground-muted hover:bg-background-light/80 border border-border cursor-pointer'
                }`}
              >
                <span className="inline-flex shrink-0 [&_svg]:w-3 [&_svg]:h-3">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>
    </>
  );
}
