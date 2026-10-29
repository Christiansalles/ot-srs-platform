const prisma = require('../src/db');
const { conferirSenha, gerarHash } = require('../src/services/senha');
const { executarSeed: executarSeedComUploads, limparUploads } = require('./helpers/seed');

const emailAdminTeste = `Admin-Teste-${Date.now()}@observatorio.local`;
const emailAdminNormalizado = emailAdminTeste.trim().toLowerCase();
const senhaAdminTeste = 'senha-admin-teste-ficticia';

function executarSeed() {
  executarSeedComUploads({
    ADMIN_EMAIL: emailAdminTeste,
    ADMIN_SENHA: senhaAdminTeste,
  });
}

describe('Admin criado pelo seed', () => {
  beforeAll(async () => {
    await prisma.usuario.deleteMany({ where: { email: emailAdminNormalizado } });
    executarSeed();
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { email: emailAdminNormalizado } });
    await prisma.$disconnect();
    limparUploads();
  });

  it('cria o admin ativo usando e-mail normalizado e hash compatível', async () => {
    const admin = await prisma.usuario.findUnique({ where: { email: emailAdminNormalizado } });

    expect(admin).toMatchObject({
      nome: 'Administrador',
      email: emailAdminNormalizado,
      ativo: true,
    });
    await expect(conferirSenha(senhaAdminTeste, admin.senha_hash)).resolves.toBe(true);
  });

  it('atualiza o admin com as credenciais do ambiente ao executar o seed novamente', async () => {
    const admin = await prisma.usuario.findUnique({ where: { email: emailAdminNormalizado } });
    if (!admin) throw new Error('O seed não criou o administrador de teste.');

    await prisma.usuario.update({
      where: { id_usuario: admin.id_usuario },
      data: {
        nome: 'Admin antigo',
        ativo: false,
        senha_hash: await gerarHash('senha-antiga'),
      },
    });

    executarSeed();
    const adminAtualizado = await prisma.usuario.findUnique({
      where: { email: emailAdminNormalizado },
    });

    expect(adminAtualizado).toMatchObject({ nome: 'Administrador', ativo: true });
    await expect(conferirSenha(senhaAdminTeste, adminAtualizado.senha_hash)).resolves.toBe(true);
  });

  it('mantém o usuário Carga inicial inativo', async () => {
    const cargaInicial = await prisma.usuario.findUnique({
      where: { email: 'carga-inicial@observatorio.local' },
    });

    expect(cargaInicial.ativo).toBe(false);
  });
});
