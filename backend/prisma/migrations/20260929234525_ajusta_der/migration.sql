/*
  Warnings:

  - You are about to alter the column `ano` on the `periodo` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `semestre` on the `periodo` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to drop the column `codigo` on the `relatorio` table. All the data in the column will be lost.
  - Added the required column `edicao` to the `relatorio` table without a default value. This is not possible if the table is not empty.
  - Made the column `descricao` on table `relatorio` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "periodo" ALTER COLUMN "ano" SET DATA TYPE SMALLINT,
ALTER COLUMN "semestre" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "relatorio" DROP COLUMN "codigo",
ADD COLUMN     "edicao" VARCHAR(20) NOT NULL,
ALTER COLUMN "descricao" SET NOT NULL,
ALTER COLUMN "tamanho_kb" DROP NOT NULL;
