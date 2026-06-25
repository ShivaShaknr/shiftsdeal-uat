'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Building2, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { useTheme } from '@/lib/theme/ThemeContext';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/venues';
  
  const { user, role, signIn, signInWithGoogle, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  
  const [loginType, setLoginType] = useState<'renter' | 'owner'>('renter');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (role === 'owner') {
        router.push('/owner/dashboard');
      } else {
        router.push(redirect);
      }
    }
  }, [user, role, authLoading, router, redirect]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await signIn(email, password);
      // Redirect is handled by the useEffect above
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle(redirect, loginType);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setIsGoogleLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-background relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center p-12">
          <Link href="/" className="mb-8">
            <Image
              src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
              alt="ShiftsDeal"
              width={220}
              height={64}
              className="h-12 w-auto object-contain"
            />
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome to ShiftsDeal
          </h1>
          <p className="text-xl text-foreground-muted mb-8">
            India's premier platform for booking corporate event venues with AI-powered matching.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-foreground-muted">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <span>Access 1000+ verified venues across India</span>
            </div>
            <div className="flex items-center gap-3 text-foreground-muted">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <span>AI-powered recommendations for your perfect venue</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link href="/">
              <Image
                src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
                alt="ShiftsDeal"
                width={210}
                height={60}
                className="h-10 w-auto object-contain mx-auto"
              />
            </Link>
          </div>

          <Card className="p-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Sign In</h2>
            <p className="text-foreground-muted mb-6">
              Enter your credentials to access your account
            </p>

            {/* Login Type Toggle */}
            <div className="flex gap-2 p-1 bg-background-light rounded-xl mb-6">
              <button
                onClick={() => setLoginType('renter')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  loginType === 'renter'
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                <User className="w-4 h-4" />
                As Renter
              </button>
              <button
                onClick={() => setLoginType('owner')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  loginType === 'owner'
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                <Building2 className="w-4 h-4" />
                As Venue Owner
              </button>
            </div>

            {loginType === 'owner' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6"
              >
                <p className="text-sm text-primary">
                  <strong>Venue Owner?</strong> Sign in to manage your venues, view booking requests, and track earnings.
                </p>
              </motion.div>
            )}

            {error && (
              <div className="bg-error/10 border border-error/20 rounded-xl p-4 mb-6 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-error shrink-0" />
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* Email/Password Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-background-light border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-foreground-muted"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-12 pr-4 py-3 bg-background-light border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder:text-foreground-muted"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full py-6 text-base" 
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background-card text-foreground-muted">or continue with</span>
              </div>
            </div>

            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || isGoogleLoading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              Continue with Google
            </button>

            <p className="mt-6 text-center text-foreground-muted">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign Up
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
