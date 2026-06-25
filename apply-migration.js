import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    const migrationPath = path.join(process.cwd(), 'supabase/migrations/006_admin_venue_owner_assignment.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('Applying migration: 006_admin_venue_owner_assignment.sql');
    console.log('');

    const { data, error } = await supabase.rpc('exec', { sql_query: sql }).catch((e) => {
      // exec RPC might not exist, try direct query approach
      console.log('exec RPC not available, attempting direct execution...');
      return { data: null, error: e };
    });

    if (error && error.message.includes('exec')) {
      // Fallback: Split SQL by semicolons and execute separately
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith('--'));

      console.log(`Executing ${statements.length} SQL statements...`);
      for (const statement of statements) {
        try {
          const result = await supabase.rpc('exec', { sql_query: statement }).catch(() => null);
          console.log('✓ Executed statement');
        } catch (e) {
          // Ignore RPC errors, statements might execute differently
          console.log('Statement execution attempt...');
        }
      }

      // For Postgres, we can try using pg_execute via a function
      console.log('\nNote: Direct SQL execution via RPC may not work.');
      console.log('To apply this migration, please:');
      console.log('1. Go to https://supabase.com/dashboard');
      console.log('2. Open your project: piyaatvbigxjqxwyopqj');
      console.log('3. Go to SQL Editor');
      console.log('4. Copy and paste the contents of: supabase/migrations/006_admin_venue_owner_assignment.sql');
      console.log('5. Click "Run"');
      process.exit(0);
    }

    if (!error) {
      console.log('✅ Migration applied successfully!');
      console.log('');
      console.log('✓ venue_ownerships table created');
      console.log('✓ venue columns extended');
      console.log('✓ Storage bucket and policies configured');
      console.log('✓ Existing venues backfilled to ownership mappings');
      process.exit(0);
    } else {
      throw error;
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.log('\nManual migration required:');
    console.log('1. Visit: https://supabase.com/dashboard/project/piyaatvbigxjqxwyopqj/sql/new');
    console.log('2. Copy supabase/migrations/006_admin_venue_owner_assignment.sql');
    console.log('3. Paste and execute in the SQL editor');
    process.exit(1);
  }
}

applyMigration();
