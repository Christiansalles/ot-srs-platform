-- Preenche as medições existentes com a data da migração.
ALTER TABLE "medicao"
  ADD COLUMN "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- O Prisma Client mantém o @updatedAt; a coluna fica sem default no banco.
ALTER TABLE "medicao" ALTER COLUMN "atualizado_em" DROP DEFAULT;
