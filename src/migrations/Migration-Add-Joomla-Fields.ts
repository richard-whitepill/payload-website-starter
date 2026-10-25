import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages__blocks_mediaBlock" ADD COLUMN IF NOT EXISTS "alignment" varchar DEFAULT 'center';
   ALTER TABLE "pages__blocks_mediaBlock" ADD COLUMN IF NOT EXISTS "width" varchar DEFAULT '100%';
   ALTER TABLE "pages__blocks_mediaBlock" ADD COLUMN IF NOT EXISTS "enable_gutter" boolean DEFAULT false;
   ALTER TABLE "pages__blocks_mediaBlock" ADD COLUMN IF NOT EXISTS "caption" varchar;
   ALTER TABLE "pages__blocks_mediaBlock" ADD COLUMN IF NOT EXISTS "alt" varchar;

   ALTER TABLE "posts__blocks_mediaBlock" ADD COLUMN IF NOT EXISTS "alignment" varchar DEFAULT 'center';
   ALTER TABLE "posts__blocks_mediaBlock" ADD COLUMN IF NOT EXISTS "width" varchar DEFAULT '100%';
   ALTER TABLE "posts__blocks_mediaBlock" ADD COLUMN IF NOT EXISTS "enable_gutter" boolean DEFAULT false;
   ALTER TABLE "posts__blocks_mediaBlock" ADD COLUMN IF NOT EXISTS "caption" varchar;
   ALTER TABLE "posts__blocks_mediaBlock" ADD COLUMN IF NOT EXISTS "alt" varchar;

   -- For Lexical blocks, they are stored as JSON, but also check other tables
   ALTER TABLE "pages_blocks_mediaBlock" ADD COLUMN IF NOT EXISTS "alignment" varchar DEFAULT 'center';
   ALTER TABLE "pages_blocks_mediaBlock" ADD COLUMN IF NOT EXISTS "width" varchar DEFAULT '100%';
   ALTER TABLE "pages_blocks_mediaBlock" ADD COLUMN IF NOT EXISTS "enable_gutter" boolean DEFAULT false;
   ALTER TABLE "pages_blocks_mediaBlock" ADD COLUMN IF NOT EXISTS "caption" varchar;
   ALTER TABLE "pages_blocks_mediaBlock" ADD COLUMN IF NOT EXISTS "alt" varchar;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages__blocks_mediaBlock" DROP COLUMN IF EXISTS "alignment";
   ALTER TABLE "pages__blocks_mediaBlock" DROP COLUMN IF EXISTS "width";
   ALTER TABLE "pages__blocks_mediaBlock" DROP COLUMN IF EXISTS "enable_gutter";
   ALTER TABLE "pages__blocks_mediaBlock" DROP COLUMN IF EXISTS "caption";
   ALTER TABLE "pages__blocks_mediaBlock" DROP COLUMN IF EXISTS "alt";

   ALTER TABLE "posts__blocks_mediaBlock" DROP COLUMN IF EXISTS "alignment";
   ALTER TABLE "posts__blocks_mediaBlock" DROP COLUMN IF EXISTS "width";
   ALTER TABLE "posts__blocks_mediaBlock" DROP COLUMN IF EXISTS "enable_gutter";
   ALTER TABLE "posts__blocks_mediaBlock" DROP COLUMN IF EXISTS "caption";
   ALTER TABLE "posts__blocks_mediaBlock" DROP COLUMN IF EXISTS "alt";

   ALTER TABLE "pages_blocks_mediaBlock" DROP COLUMN IF EXISTS "alignment";
   ALTER TABLE "pages_blocks_mediaBlock" DROP COLUMN IF EXISTS "width";
   ALTER TABLE "pages_blocks_mediaBlock" DROP COLUMN IF EXISTS "enable_gutter";
   ALTER TABLE "pages_blocks_mediaBlock" DROP COLUMN IF EXISTS "caption";
   ALTER TABLE "pages_blocks_mediaBlock" DROP COLUMN IF EXISTS "alt";
  `)
}
