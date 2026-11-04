-- Backfill existing measurements with the migration timestamp.
ALTER TABLE "medicao"
  ADD COLUMN "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Prisma Client maintains @updatedAt; keep no database default on this column.
ALTER TABLE "medicao" ALTER COLUMN "atualizado_em" DROP DEFAULT;
