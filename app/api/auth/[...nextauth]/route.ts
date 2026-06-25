import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { supabase } from '@/lib/db/supabase';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      id: 'owner-login',
      name: 'Owner Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        // Check if user exists in Supabase as owner
        const { data: user } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .eq('role', 'owner')
          .single();

        if (user) {
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: 'owner',
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          const normalizedEmail = String(user.email || '').toLowerCase();

          // Check if user exists in Supabase
          const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', normalizedEmail)
            .single();
          
          if (!existingUser) {
            // Check if they have an ownership record (admin pre-assigned them)
            const { data: ownershipRecord } = await supabase
              .from('venue_ownerships')
              .select('*')
              .eq('owner_email', normalizedEmail)
              .limit(1)
              .maybeSingle();

            const role = ownershipRecord ? 'owner' : 'renter';

            // Create new user in Supabase
            const { data: newUser, error } = await supabase
              .from('users')
              .insert([{
                email: normalizedEmail,
                name: user.name || '',
                role,
              }])
              .select('id')
              .single();
            
            if (error) {
              console.error('Error creating user:', error);
            } else if (newUser) {
              // Update Supabase auth user metadata with role for AuthContext to read on refresh
              try {
                const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
                const supabaseAdminClient = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321', supabaseServiceKey, {
                  auth: { autoRefreshToken: false, persistSession: false },
                });
                
                // Update auth user metadata with role
                await supabaseAdminClient.auth.admin.updateUserById(newUser.id, {
                  user_metadata: { role },
                });
              } catch (metaError) {
                console.warn('Could not update auth metadata, will fall back to database query:', metaError);
              }

              if (ownershipRecord) {
                // Link the new user to their venue ownership records
                await supabase
                  .from('venue_ownerships')
                  .update({ owner_user_id: newUser.id })
                  .eq('owner_email', normalizedEmail)
                  .eq('owner_user_id', null); // Only update if not already linked
              }
            }
          } else if (existingUser.role === 'owner') {
            // Already owner, make sure metadata is synced
            try {
              const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
              const supabaseAdminClient = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321', supabaseServiceKey, {
                auth: { autoRefreshToken: false, persistSession: false },
              });
              
              await supabaseAdminClient.auth.admin.updateUserById(existingUser.id, {
                user_metadata: { role: 'owner' },
              });
            } catch (metaError) {
              console.warn('Could not sync owner metadata:', metaError);
            }
          } else if (existingUser.role !== 'owner') {
            // Check if they should be promoted to owner (have ownership records)
            const { data: ownershipRecord } = await supabase
              .from('venue_ownerships')
              .select('*')
              .eq('owner_email', normalizedEmail)
              .limit(1)
              .maybeSingle();

            if (ownershipRecord && !ownershipRecord.owner_user_id) {
              // Update their role and link them to ownership
              await supabase
                .from('users')
                .update({ role: 'owner' })
                .eq('id', existingUser.id);

              // Also update auth metadata so AuthContext can read it on refresh
              try {
                const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
                const supabaseAdminClient = require('@supabase/supabase-js').createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321', supabaseServiceKey, {
                  auth: { autoRefreshToken: false, persistSession: false },
                });
                
                await supabaseAdminClient.auth.admin.updateUserById(existingUser.id, {
                  user_metadata: { role: 'owner' },
                });
              } catch (metaError) {
                console.warn('Could not update auth metadata on promotion:', metaError);
              }

              await supabase
                .from('venue_ownerships')
                .update({ owner_user_id: existingUser.id })
                .eq('owner_email', normalizedEmail)
                .eq('owner_user_id', null);
            }
          }
          
          return true;
        } catch (error) {
          console.error('Sign in error:', error);
          return true; // Still allow sign-in even if DB fails
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        try {
          const { data: dbUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', user.email)
            .single();
          
          if (dbUser) {
            token.role = dbUser.role;
            token.userId = dbUser.id;
          } else {
            token.role = 'renter';
          }
        } catch (error) {
          console.error('JWT callback error:', error);
          token.role = 'renter';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).userId = token.userId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
