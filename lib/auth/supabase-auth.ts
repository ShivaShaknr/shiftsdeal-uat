import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

export const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-auth-token',
  },
});

// Google OAuth Sign In
export async function signInWithGoogle(redirectTo?: string, role?: 'renter' | 'owner') {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const callbackUrl = `${baseUrl}/auth/callback${role ? `?role=${role}` : ''}${redirectTo ? `${role ? '&' : '?'}redirectTo=${encodeURIComponent(redirectTo)}` : ''}`;
  
  const { data, error } = await supabaseAuth.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data;
}

export async function signUpWithEmail(email: string, password: string, name: string, role: 'renter' | 'owner') {
  const { data, error } = await supabaseAuth.auth.signUp({
    email,
    password,
    options: {
      data: { name, role },
    },
  });

  if (error) throw error;

  // Create user record in users table
  if (data.user) {
    const { error: insertError } = await supabaseAuth
      .from('users')
      .insert([{
        id: data.user.id,
        email: data.user.email,
        name,
        role,
      }]);

    if (insertError) console.error('Error creating user record:', insertError);
  }

  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  // Sign out from Supabase with global scope
  const { error } = await supabaseAuth.auth.signOut({ scope: 'global' });
  
  // Clear all auth-related items from localStorage
  if (typeof window !== 'undefined') {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('supabase') || key.startsWith('sb-'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed: ${key}`);
    });
  }
  
  if (error) throw error;
}

export async function getSession() {
  const { data: { session }, error } = await supabaseAuth.auth.getSession();
  if (error) throw error;
  return session;
}

export async function getUser() {
  const { data: { user }, error } = await supabaseAuth.auth.getUser();
  if (error) throw error;
  return user;
}

export async function getUserRole(userId: string) {
  const { data, error } = await supabaseAuth
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data?.role;
}
