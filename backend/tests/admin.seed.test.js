const prisma = require('../src/db');
const { conferirSenha, gerarHash } = require('../src/services/senha');
const { executarSeed: executarSeedComUploads, limparUploads } = require('./helpers/seed');

const emailAdminTeste = `Admin-Teste-${Date.now()}@observatorio.local`;
const emailAdminNormalizado = emailAdminTeste.trim().toLowerCase();
const senhaAdminTeste = 'senha-admin-teste-ficticia';
const emailEditorTeste = `Editor-Teste-${Date.now()}@observatorio.local`;
const emailEditorNormalizado = emailEditorTeste.trim().toLowerCase();
const senhaEditorTeste = 'senha-editor-teste-ficticia';

function executarSeed(variaveis = {}, stdio = 'inherit') {
  executarSeedComUploads({
    ADMIN_EMAIL: emailAdminTeste,
    ADMIN_SENHA: senhaAdminTeste,
    EDITOR_EMAIL: emailEditorTeste,
    EDITOR_SENHA: senhaEditorTeste,
    ...variaveis,
  }, stdio);
}

function erroDoSeed(envExtra) {
  try {
    executarSeed(envExtra, 'pipe');
  } catch (erro) {
    return erro.stderr.toString();
  }
  throw new Error('O seed deveria ter falhado.');
}

describe('Usuários de desenvolvimento criados pelo seed', () => {
  const emails = [emailAdminNormalizado, emailEditorNormalizado];

  beforeAll(async () => {
    await prisma.usuario.deleteMany({ where: { email: { in: emails } } });
    executarSeed();
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { email: { in: emails } } });
    await prisma.$disconnect();
    limparUploads();
  });

  it('cria o admin ativo usando e-mail normalizado e hash compatível', async () => {
    const admin = await prisma.usuario.findUnique({ where: { email: emailAdminNormalizado } });

    expect(admin).toMatchObject({
      nome: 'Administrador',
      email: emailAdminNormalizado,
      ativo: true,
      perfil: 'administrador',
    });
    await expect(conferirSenha(senhaAdminTeste, admin.senha_hash)).resolves.toBe(true);
  });

  it('cria o editor ativo com perfil editor', async () => {
    const editor = await prisma.usuario.findUnique({ where: { email: emailEditorNormalizado } });

    expect(editor).toMatchObject({
      nome: 'Editor',
      email: emailEditorNormalizado,
      ativo: true,
      perfil: 'editor',
    });
    await expect(conferirSenha(senhaEditorTeste, editor.senha_hash)).resolves.toBe(true);
  });

  it('atualiza admin e editor com as credenciais do ambiente ao executar o seed novamente', async () => {
    const admin = await prisma.usuario.findUnique({ where: { email: emailAdminNormalizado } });
    const editor = await prisma.usuario.findUnique({ where: { email: emailEditorNormalizado } });
    if (!admin || !editor) throw new Error('O seed não criou os usuários de teste.');

    const senhaAntiga = await gerarHash('senha-antiga');
    await prisma.usuario.update({
      where: { id_usuario: admin.id_usuario },
      data: { nome: 'Admin antigo', ativo: false, senha_hash: senhaAntiga, perfil: 'editor' },
    });
    await prisma.usuario.update({
      where: { id_usuario: editor.id_usuario },
      data: { nome: 'Editor antigo', ativo: false, senha_hash: senhaAntiga, perfil: 'administrador' },
    });

    executarSeed();
    const adminAtualizado = await prisma.usuario.findUnique({
      where: { email: emailAdminNormalizado },
    });
    const editorAtualizado = await prisma.usuario.findUnique({
      where: { email: emailEditorNormalizado },
    });

    expect(adminAtualizado).toMatchObject({ nome: 'Administrador', ativo: true, perfil: 'administrador' });
    expect(editorAtualizado).toMatchObject({ nome: 'Editor', ativo: true, perfil: 'editor' });
    await expect(conferirSenha(senhaAdminTeste, adminAtualizado.senha_hash)).resolves.toBe(true);
    await expect(conferirSenha(senhaEditorTeste, editorAtualizado.senha_hash)).resolves.toBe(true);
  }, 15000);

  it('mantém o usuário Carga inicial inativo', async () => {
    const cargaInicial = await prisma.usuario.findUnique({
      where: { email: 'carga-inicial@observatorio.local' },
    });

    expect(cargaInicial.ativo).toBe(false);
  });

  it('recusa executar com só uma das credenciais do editor', () => {
    expect(erroDoSeed({ EDITOR_EMAIL: '' }))
      .toContain('EDITOR_EMAIL e EDITOR_SENHA precisam estar configuradas');
    expect(erroDoSeed({ EDITOR_SENHA: '  ' }))
      .toContain('EDITOR_EMAIL e EDITOR_SENHA precisam estar configuradas');
  });

  it('não cria nem reativa o editor quando as duas credenciais estão vazias', async () => {
    const editor = await prisma.usuario.findUnique({ where: { email: emailEditorNormalizado } });
    await prisma.usuario.update({ where: { id_usuario: editor.id_usuario }, data: { ativo: false } });
    const editoresAntes = await prisma.usuario.count({ where: { perfil: 'editor' } });

    try {
      executarSeed({ EDITOR_EMAIL: '', EDITOR_SENHA: ' ' });
      executarSeed({ EDITOR_EMAIL: '', EDITOR_SENHA: '' });

      expect(await prisma.usuario.findUnique({ where: { email: emailEditorNormalizado } }))
        .toMatchObject({ ativo: false });
      expect(await prisma.usuario.count({ where: { perfil: 'editor' } })).toBe(editoresAntes);
      expect(await prisma.usuario.findUnique({ where: { email: emailAdminNormalizado } }))
        .toMatchObject({ ativo: true, perfil: 'administrador' });
    } finally {
      await prisma.usuario.update({ where: { id_usuario: editor.id_usuario }, data: { ativo: true } });
    }
  }, 15000);

  it('recusa o mesmo e-mail para admin e editor', () => {
    expect(erroDoSeed({ EDITOR_EMAIL: ` ${emailAdminTeste.toUpperCase()} ` }))
      .toContain('ADMIN_EMAIL e EDITOR_EMAIL precisam ser e-mails diferentes');
  });

  it('não aceita no banco um perfil fora de administrador e editor', async () => {
    await expect(prisma.usuario.update({
      where: { email: emailEditorNormalizado },
      data: { perfil: 'homologador' },
    })).rejects.toThrow(/usuario_perfil_check/);
  });
});
