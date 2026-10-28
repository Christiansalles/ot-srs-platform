-- AlterTable
ALTER TABLE "usuario" ADD COLUMN     "perfil" VARCHAR(20) NOT NULL DEFAULT 'administrador';

-- Restringe os perfis permitidos
ALTER TABLE "usuario"
ADD CONSTRAINT "usuario_perfil_check"
CHECK ("perfil" IN ('administrador', 'editor'));
