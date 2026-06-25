import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string
);

(async () => {
  // Find the owner user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', 'owner@shiftsdeal.com')
    .single();

  if (userError || !user) {
    console.error('Error finding user:', userError);
    console.log('User with email owner@shiftsdeal.com not found');
    process.exit(1);
  }

  console.log('Found user:', user);

  // Update Presidium venue with owner_id
  const { data, error } = await supabase
    .from('venues')
    .update({ owner_id: user.id })
    .eq('id', '07fb50cf-5dee-4b02-bcb3-857b9a261e6d')
    .select();

  if (error) {
    console.error('Error updating venue:', error);
    process.exit(1);
  }

  console.log('✅ Presidium venue owner updated successfully');
})();
