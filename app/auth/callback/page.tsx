'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseAuth } from '@/lib/auth/supabase-auth';
import { Loader2 } from 'lucide-react';
import { Session, User } from '@supabase/supabase-js';

// Helper to get session from localStorage (same as AuthContext)
function getStoredSession(): { session: Session | null; user: User | null } {
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
    
    if (parsed.expires_at && parsed.expires_at * 1000 < Date.now()) {
      return { session: null, user: null };
    }

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
    console.error('Error reading stored session:', e);
  }
  
  return { session: null, user: null };
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // First, wait a brief moment for Supabase to process the OAuth callback
        // and store the session in localStorage
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Try to get session from localStorage first (non-blocking)
        let sessionData = getStoredSession();
        
        // If no session in localStorage, try with a timeout
        if (!sessionData.session) {
          const timeoutPromise = new Promise<null>(resolve => setTimeout(() => resolve(null), 5000));
          const sessionPromise = supabaseAuth.auth.getSession().then(r => r);
          const result = await Promise.race([sessionPromise, timeoutPromise]);
          
          if (result && 'data' in result && result.data.session) {
            sessionData = { session: result.data.session, user: result.data.session.user };
          }
        }
        
        // Still no session? Check localStorage one more time
        if (!sessionData.session) {
          sessionData = getStoredSession();
        }

        if (sessionData.session?.user) {
          const session = sessionData.session;
          const normalizedEmail = session.user.email?.trim().toLowerCase();
          const role = searchParams.get('role') as 'renter' | 'owner' | null;
          const redirectTo = searchParams.get('redirectTo');

          // Check if user exists in public.users table
          const { data: existingUser, error: fetchError } = await supabaseAuth
            .from('users')
            .select('id, role')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!existingUser && !fetchError) {
            // Create new user record with role from OAuth flow
            const userRole = role || 'renter';
            const userName = session.user.user_metadata?.full_name || 
                           session.user.user_metadata?.name || 
                           session.user.email?.split('@')[0] || 
                           'User';

            const { error: upsertError } = await supabaseAuth.from('users').upsert({
              id: session.user.id,
              email: session.user.email,
              name: userName,
              role: userRole,
            }, {
              onConflict: 'id',
              ignoreDuplicates: false
            });

            if (upsertError) {
              console.error('Error upserting user record:', upsertError);
            }

            // Redirect based on role
            if (userRole === 'owner') {
              router.push('/owner/dashboard');
            } else {
              router.push(redirectTo || '/venues');
            }
          } else if (existingUser) {
            let effectiveRole = existingUser.role;

            if (normalizedEmail) {
              // If admin already assigned venues to this email, bind assignments to this user.
              // Gracefully skip if venue_ownerships table doesn't exist yet.
              try {
                const { data: assignments, error: assignmentError } = await supabaseAuth
                  .from('venue_ownerships')
                  .select('venue_id, owner_user_id, is_primary, is_active')
                  .eq('owner_email', normalizedEmail)
                  .eq('is_active', true);

                if (assignmentError) {
                  console.warn('Venue ownership lookup skipped:', assignmentError.message);
                } else if (assignments && assignments.length > 0) {
                  if (effectiveRole !== 'owner') {
                    await supabaseAuth
                      .from('users')
                      .update({ role: 'owner', updated_at: new Date().toISOString() })
                      .eq('id', existingUser.id);
                    effectiveRole = 'owner';
                  }

                  await supabaseAuth
                    .from('venue_ownerships')
                    .update({ owner_user_id: existingUser.id, updated_at: new Date().toISOString() })
                    .eq('owner_email', normalizedEmail)
                    .eq('is_active', true);

                  const primaryVenueIds = assignments
                    .filter((assignment) => assignment.is_primary)
                    .map((assignment) => assignment.venue_id);

                  if (primaryVenueIds.length > 0) {
                    await supabaseAuth
                      .from('venues')
                      .update({ owner_id: existingUser.id, updated_at: new Date().toISOString() })
                      .in('id', primaryVenueIds);
                  }
                }
              } catch (ownershipError) {
                console.warn('Error checking venue ownerships:', ownershipError);
              }
            }

            if (effectiveRole === 'owner') {
              router.push('/owner/dashboard');
            } else {
              router.push(redirectTo || '/venues');
            }
          } else {
            // If fetch error occurred but user might exist, just redirect to venues
            router.push(redirectTo || '/venues');
          }
        } else {
          // No session, redirect to login
          router.push('/login');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-error mb-4">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="text-primary hover:underline"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-foreground-muted">Completing sign in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
