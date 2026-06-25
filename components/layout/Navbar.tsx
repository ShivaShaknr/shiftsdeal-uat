'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, User, LogOut, Building2, LayoutDashboard, Settings, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTheme } from '@/lib/theme/ThemeContext';
import Button from '../ui/Button';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const pathname = usePathname();
  const { user, role, isLoading, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  const navLinks = [
    { href: '/venues', label: 'Find Venues' },
    { href: '/list-venue', label: 'List Your Venue' },
    { href: '/how-it-works', label: 'How It Works' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const isActive = (href: string) => pathname === href;

  const handleSignOut = async () => {
    setIsProfileOpen(false);
    await signOut();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-black border-b border-black backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo-dark.png"
              alt="ShiftsDeal"
              width={220}
              height={64}
              className="h-10 sm:h-11 md:h-12 w-auto object-contain transition-all"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors relative',
                  isActive(link.href) ? 'text-white' : 'text-white/65 hover:text-white'
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-white rounded-full"
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Auth / Profile */}
          <div className="hidden md:flex items-center gap-4">
            {/* Theme Toggle Button */}
            <motion.button
              onClick={toggleTheme}
              className={cn(
                'p-2 rounded-xl border transition-colors',
                theme === 'dark'
                  ? 'bg-black hover:bg-neutral-900 border-white/30 text-white'
                  : 'bg-white hover:bg-neutral-100 border-white text-black'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-5 h-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
            
            {isLoading ? (
              <div className="w-24 h-10 skeleton rounded-xl" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-background-card transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                    {userAvatar ? (
                      <Image
                        src={userAvatar}
                        alt={userName}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-white">{userName.split(' ')[0]}</span>
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 bg-black border border-white/15 rounded-xl shadow-xl overflow-hidden"
                    >
                      <div className="p-4 border-b border-white/15">
                        <p className="font-medium text-white">{userName}</p>
                        <p className="text-sm text-white/65">{userEmail}</p>
                        <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-white/10 text-white rounded-full capitalize">
                          {role || 'renter'}
                        </span>
                      </div>
                      <div className="py-2">
                        {role === 'owner' && (
                          <Link
                            href="/owner/dashboard"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Owner Dashboard
                          </Link>
                        )}
                        {role === 'admin' && (
                          <Link
                            href="/admin"
                            onClick={() => setIsProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Admin Panel
                          </Link>
                        )}
                        <Link
                          href="/bookings"
                          onClick={() => setIsProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          <Building2 className="w-4 h-4" />
                          My Bookings
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-error hover:bg-error/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="outline" size="md" className="!border-white !text-white hover:!bg-white hover:!text-black">
                    Sign In
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="md" className="!bg-white !text-black hover:!bg-neutral-200">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            {/* Mobile Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              className={cn(
                'p-2 rounded-lg border transition-colors',
                theme === 'dark'
                  ? 'bg-black hover:bg-neutral-900 border-white/30 text-white'
                  : 'bg-white hover:bg-neutral-100 border-white text-black'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </motion.button>
            
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Menu className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-white/15 bg-black"
          >
            <div className="px-4 py-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'block py-2 text-base font-medium transition-colors',
                    isActive(link.href) ? 'text-white' : 'text-white/65 hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-white/15">
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                        {userAvatar ? (
                          <Image
                            src={userAvatar}
                            alt={userName}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">{userName}</p>
                        <p className="text-sm text-white/65">{userEmail}</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleSignOut}
                      variant="outline"
                      className="w-full"
                    >
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Link href="/login">
                      <Button variant="outline" className="w-full !border-white !text-white hover:!bg-white hover:!text-black">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button className="w-full !bg-white !text-black hover:!bg-neutral-200">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
