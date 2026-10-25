import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_media_block_alignment" AS ENUM('left', 'center', 'right', 'full');
  CREATE TYPE "public"."enum_pages_blocks_media_block_width" AS ENUM('25', '33', '50', '75', '100');
  CREATE TYPE "public"."enum__pages_v_blocks_media_block_alignment" AS ENUM('left', 'center', 'right', 'full');
  CREATE TYPE "public"."enum__pages_v_blocks_media_block_width" AS ENUM('25', '33', '50', '75', '100');
  
  ALTER TABLE "pages_blocks_media_block" ADD COLUMN "alignment" "enum_pages_blocks_media_block_alignment" DEFAULT 'center';
  ALTER TABLE "pages_blocks_media_block" ADD COLUMN "width" "enum_pages_blocks_media_block_width" DEFAULT '50';
  ALTER TABLE "pages_blocks_media_block" ADD COLUMN "enable_gutter" boolean DEFAULT true;
  ALTER TABLE "pages_blocks_media_block" ADD COLUMN "caption" varchar;
  ALTER TABLE "pages_blocks_media_block" ADD COLUMN "alt" varchar;

  ALTER TABLE "_pages_v_blocks_media_block" ADD COLUMN "alignment" "enum__pages_v_blocks_media_block_alignment" DEFAULT 'center';
  ALTER TABLE "_pages_v_blocks_media_block" ADD COLUMN "width" "enum__pages_v_blocks_media_block_width" DEFAULT '50';
  ALTER TABLE "_pages_v_blocks_media_block" ADD COLUMN "enable_gutter" boolean DEFAULT true;
  ALTER TABLE "_pages_v_blocks_media_block" ADD COLUMN "caption" varchar;
  ALTER TABLE "_pages_v_blocks_media_block" ADD COLUMN "alt" varchar;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_media_block" DROP COLUMN IF EXISTS "alignment";
  ALTER TABLE "pages_blocks_media_block" DROP COLUMN IF EXISTS "width";
  ALTER TABLE "pages_blocks_media_block" DROP COLUMN IF EXISTS "enable_gutter";
  ALTER TABLE "pages_blocks_media_block" DROP COLUMN IF EXISTS "caption";
  ALTER TABLE "pages_blocks_media_block" DROP COLUMN IF EXISTS "alt";

  ALTER TABLE "_pages_v_blocks_media_block" DROP COLUMN IF EXISTS "alignment";
  ALTER TABLE "_pages_v_blocks_media_block" DROP COLUMN IF EXISTS "width";
  ALTER TABLE "_pages_v_blocks_media_block" DROP COLUMN IF EXISTS "enable_gutter";
  ALTER TABLE "_pages_v_blocks_media_block" DROP COLUMN IF EXISTS "caption";
  ALTER TABLE "_pages_v_blocks_media_block" DROP COLUMN IF EXISTS "alt";

  DROP TYPE IF EXISTS "public"."enum_pages_blocks_media_block_alignment";
  DROP TYPE IF EXISTS "public"."enum_pages_blocks_media_block_width";
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_media_block_alignment";
  DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_media_block_width";
  `)
}
