const { execFileSync } = require('node:child_process');
const path = require('node:path');
const prisma = require('../src/db');
const { conferirSenha, gerarHash } = require('../src/services/senha');

const backendDir = path.resolve(__dirname, '..');
const seedPath = path.join(backendDir, 'prisma', 'seed.js');
const emailOriginal = process.env.ADMIN_EMAIL;
const senhaOriginal = process.env.ADMIN_SENHA;
const emailAdminTeste = `Admin-Teste-${Date.now()}@observatorio.local`;
const emailAdminNormalizado = emailAdminTeste.trim().toLowerCase();
const senhaAdminTeste = 'senha-admin-teste-ficticia';

function executarSeed() {
  execFileSync(process.execPath, [seedPath], {
    cwd: backendDir,
    stdio: 'inherit',
  });
}

describe('Admin criado pelo seed', () => {
  beforeAll(() => {
    process.env.ADMIN_EMAIL = emailAdminTeste;
    process.env.ADMIN_SENHA = senhaAdminTeste;
    executarSeed();
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { email: emailAdminNormalizado } });
    await prisma.$disconnect();

    if (emailOriginal === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = emailOriginal;
    if (senhaOriginal === undefined) delete process.env.ADMIN_SENHA;
    else process.env.ADMIN_SENHA = senhaOriginal;
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
