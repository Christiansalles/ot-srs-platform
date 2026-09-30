-- CreateTable
CREATE TABLE "setor" (
    "id_setor" SERIAL NOT NULL,
    "nome" VARCHAR(60) NOT NULL,
    "descricao" VARCHAR(200),

    CONSTRAINT "setor_pkey" PRIMARY KEY ("id_setor")
);

-- CreateTable
CREATE TABLE "indicador" (
    "id_indicador" SERIAL NOT NULL,
    "id_setor" INTEGER NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "descricao" VARCHAR(200),
    "unidade" VARCHAR(20) NOT NULL,

    CONSTRAINT "indicador_pkey" PRIMARY KEY ("id_indicador")
);

-- CreateTable
CREATE TABLE "periodo" (
    "id_periodo" SERIAL NOT NULL,
    "ano" INTEGER NOT NULL,
    "semestre" INTEGER NOT NULL,

    CONSTRAINT "periodo_pkey" PRIMARY KEY ("id_periodo")
);

-- CreateTable
CREATE TABLE "medicao" (
    "id_medicao" SERIAL NOT NULL,
    "id_indicador" INTEGER NOT NULL,
    "id_periodo" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "status" VARCHAR(10) NOT NULL,

    CONSTRAINT "medicao_pkey" PRIMARY KEY ("id_medicao")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id_usuario" SERIAL NOT NULL,
    "nome" VARCHAR(80) NOT NULL,
    "email" VARCHAR(120) NOT NULL,
    "senha_hash" VARCHAR(255) NOT NULL,
    "ativo" BOOLEAN NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "relatorio" (
    "id_relatorio" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "titulo" VARCHAR(150) NOT NULL,
    "codigo" VARCHAR(40) NOT NULL,
    "categoria" VARCHAR(40) NOT NULL,
    "data_publicacao" DATE NOT NULL,
    "descricao" VARCHAR(500),
    "arquivo_url" VARCHAR(255) NOT NULL,
    "tamanho_kb" INTEGER NOT NULL,
    "status" VARCHAR(10) NOT NULL,

    CONSTRAINT "relatorio_pkey" PRIMARY KEY ("id_relatorio")
);

-- CreateIndex
CREATE UNIQUE INDEX "setor_nome_key" ON "setor"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "periodo_ano_semestre_key" ON "periodo"("ano", "semestre");

-- CreateIndex
CREATE UNIQUE INDEX "medicao_id_indicador_id_periodo_key" ON "medicao"("id_indicador", "id_periodo");

-- CreateIndex
CREATE UNIQUE INDEX "usuario_email_key" ON "usuario"("email");

-- AddForeignKey
ALTER TABLE "indicador" ADD CONSTRAINT "indicador_id_setor_fkey" FOREIGN KEY ("id_setor") REFERENCES "setor"("id_setor") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicao" ADD CONSTRAINT "medicao_id_indicador_fkey" FOREIGN KEY ("id_indicador") REFERENCES "indicador"("id_indicador") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicao" ADD CONSTRAINT "medicao_id_periodo_fkey" FOREIGN KEY ("id_periodo") REFERENCES "periodo"("id_periodo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicao" ADD CONSTRAINT "medicao_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relatorio" ADD CONSTRAINT "relatorio_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Restringe os status permitidos
ALTER TABLE "medicao"
ADD CONSTRAINT "medicao_status_check"
CHECK ("status" IN ('rascunho', 'publicado'));

ALTER TABLE "relatorio"
ADD CONSTRAINT "relatorio_status_check"
CHECK ("status" IN ('rascunho', 'publicado'));
