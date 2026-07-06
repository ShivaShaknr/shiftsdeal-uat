'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabaseAuth, signInWithGoogle as googleSignIn } from '@/lib/auth/supabase-auth';
import logger from '@/lib/utils/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: 'renter' | 'owner' | 'admin' | null;
  isLoading: boolean;
  signUp: (email: string, password: string, name: string, role: 'renter' | 'owner') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (redirectTo?: string, role?: 'renter' | 'owner') => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUserRole: (newRole: 'renter' | 'owner') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize session and user synchronously from localStorage to avoid
  // calling setState inside the first render effect.
  const getStoredSession = (): { session: Session | null; user: User | null } => {
    if (typeof window === 'undefined') return { session: null, user: null };
    try {
      let storedValue: string | null = null;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          storedValue = localStorage.getItem(key);
          if (storedValue) break;
        }
      }
      if (!storedValue) return { session: null, user: null };
      const parsed = JSON.parse(storedValue);
      if (parsed?.access_token && parsed?.user) {
        const session: Session = {
          access_token: parsed.access_token,
          refresh_token: parsed.refresh_token || '',
          expires_in: parsed.expires_in || 3600,
          expires_at: parsed.expires_at,
          token_type: parsed.token_type || 'bearer',
          user: parsed.user,
        };
        return { session, user: parsed.user };
      }
    } catch (e) {
      logger.error('Error reading stored session:', e);
    }
    return { session: null, user: null };
  };

  const _initial = getStoredSession();

  const [user, setUser] = useState<User | null>(() => _initial.user);
  const [session, setSession] = useState<Session | null>(() => _initial.session);
  const [role, setRole] = useState<'renter' | 'owner' | 'admin' | null>(() => {
    const u = _initial.user;
    const roleFromMetadata = u?.user_metadata?.role || u?.app_metadata?.role;
    return (roleFromMetadata as 'renter' | 'owner' | 'admin') || null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => false);

  const fetchUserRole = async (userId: string, existingRole?: 'renter' | 'owner' | 'admin' | null) => {
    try {
      // If we already have a valid role from metadata, use it as the source of truth
      // and only fetch from DB to validate/update if needed
      if (existingRole) {
        logger.log('Using existing role from metadata:', existingRole);
        setRole(existingRole);
      }

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<null>((resolve) => {
        setTimeout(() => {
          logger.warn('fetchUserRole timed out after 5 seconds');
          resolve(null);
        }, 5000);
      });

      const rolePromise = supabaseAuth
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      const result = await Promise.race([rolePromise, timeoutPromise]);
      
      // Handle timeout - keep existing role instead of defaulting
      if (result === null) {
        logger.warn('Role fetch timed out, keeping existing role:', existingRole || 'renter');
        if (!existingRole) {
          setRole('renter');
        }
        return;
      }
      
      const { data, error } = result;
      
      if (error) {
        logger.error('Error fetching user role:', error);
        // Keep existing role on database error
        if (!existingRole) {
          logger.log('No existing role from metadata, defaulting to renter');
          setRole('renter');
        }
        return;
      }
      
      if (data?.role) {
        logger.log('Database confirmed role:', data.role);
        // Update role to what's in database (may be different if admin promoted user)
        setRole(data.role);
      } else {
        // User not in database yet
        logger.log('User not yet in database');
        if (!existingRole) {
          logger.log('No metadata role and not in DB, defaulting to renter');
          setRole('renter');
        }
      }
    } catch (error) {
      logger.error('Error fetching user role:', error);
      // Keep existing role on error - don't reset to renter
      if (!existingRole) {
        logger.log('Exception caught, no existing role, defaulting to renter');
        setRole('renter');
      }
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    let mounted = true;

    // If we initialized with an existing user, fetch authoritative role
    // from the database in the background (non-blocking).
    if (_initial.user?.id) {
      const initialRole = _initial.user?.user_metadata?.role || _initial.user?.app_metadata?.role;
      fetchUserRole(_initial.user.id, (initialRole as 'renter' | 'owner' | 'admin') || undefined);
    }

    // Listen for auth changes (handles cross-tab sync automatically)
    const { data: { subscription } } = supabaseAuth.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        logger.log('Auth state change:', event, session ? 'session exists' : 'no session');
        
        // Handle sign out event explicitly
        if (event === 'SIGNED_OUT') {
          logger.log('User signed out');
          setSession(null);
          setUser(null);
          setRole(null);
          return;
        }
        
        // Handle other events
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const metadataRole = session.user?.user_metadata?.role || session.user?.app_metadata?.role;
          await fetchUserRole(session.user.id, (metadataRole as 'renter' | 'owner' | 'admin') || undefined);
        } else {
          setRole(null);
        }
        
        setIsLoading(false);
      }
    );

    // Additional cross-tab sync via storage events
    const handleStorageChange = (e: StorageEvent) => {
      if (!mounted) return;
      
      // Listen for ANY Supabase auth storage changes in other tabs
      if (e.key?.startsWith('sb-') || e.key?.includes('supabase')) {
        logger.log('Storage change detected:', e.key, 'oldValue:', e.oldValue ? 'exists' : 'null', 'newValue:', e.newValue ? 'exists' : 'null');
        
        // If auth token was removed (sign out in another tab)
        if ((e.oldValue && !e.newValue) || e.newValue === null) {
          logger.log('Sign out detected in another tab');
          setSession(null);
          setUser(null);
          setRole(null);
          return;
        }
        
        // Otherwise refresh session to get latest state
        logger.log('Auth change in another tab, refreshing session');
        supabaseAuth.auth.getSession().then(({ data: { session } }) => {
          if (!mounted) return;
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            fetchUserRole(session.user.id);
          } else {
            setRole(null);
          }
        });
      }
    };

    // Listen to storage events for cross-tab synchronization
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const signUp = async (email: string, password: string, name: string, userRole: 'renter' | 'owner') => {
    const { data, error } = await supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: userRole },
      },
    });

    if (error) throw error;

    // Create user record in users table using upsert to avoid conflicts
    if (data.user) {
      const { error: upsertError } = await supabaseAuth
        .from('users')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          name,
          role: userRole,
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
        });
      
      if (upsertError) {
        logger.error('Error upserting user:', upsertError);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabaseAuth.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signInWithGoogle = async (redirectTo?: string, userRole?: 'renter' | 'owner') => {
    await googleSignIn(redirectTo, userRole);
  };

  const signOut = async () => {
    logger.log('Signing out...');
    
    // Clear local state FIRST
    setRole(null);
    setUser(null);
    setSession(null);
    
    // Clear localStorage directly (don't wait for Supabase API which can block)
    try {
      // Find and remove all Supabase auth keys from localStorage
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        logger.log('Removing localStorage key:', key);
        localStorage.removeItem(key);
      });
    } catch (e) {
      logger.error('Error clearing localStorage:', e);
    }
    
    // Try to call Supabase signOut in background (non-blocking)
    // This helps invalidate the token on the server but we don't wait for it
    supabaseAuth.auth.signOut({ scope: 'global' }).catch(e => {
      logger.error('Supabase signOut failed (non-critical):', e);
    });
    
    // Navigate to home page immediately
    window.location.href = '/';
  };

  const refreshSession = async () => {
    const { data: { session } } = await supabaseAuth.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
    if (session?.user) {
      await fetchUserRole(session.user.id);
    }
  };

  const updateUserRole = async (newRole: 'renter' | 'owner') => {
    if (!user) throw new Error('No user logged in');
    
    const { error } = await supabaseAuth
      .from('users')
      .update({ role: newRole })
      .eq('id', user.id);
    
    if (error) throw error;
    setRole(newRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isLoading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshSession,
        updateUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
