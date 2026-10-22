const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  const cols = await sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'resumes' AND table_schema = 'public'
  `;
  console.log("Columns in resumes:", cols);

  // Check if is_published exists
  const hasPublished = cols.some(c => c.column_name === 'is_published');
  if (!hasPublished) {
    console.log("Adding is_published column to resumes...");
    await sql`ALTER TABLE public.resumes ADD COLUMN is_published BOOLEAN DEFAULT false;`;
    console.log("Added is_published column!");
  } else {
    console.log("is_published column already exists.");
  }
}

main().catch(console.error);
