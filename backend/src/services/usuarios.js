// Cadastro de usuários pelo painel (só administrador). Usuário não se apaga:
// desativar preserva quem lançou cada medição e cada relatório.

const prisma = require('../db');
const { gerarHash } = require('./senha');

const PERFIS = ['administrador', 'editor'];
const TAMANHO_MINIMO_SENHA = 8;

const ERROS = {
  campos: 'Campos obrigatórios inválidos',
  email: 'E-mail inválido',
  senha: `A senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres`,
  perfil: 'Perfil inválido',
  emailRepetido: 'Já existe um usuário com este e-mail',
  proprioUsuario: 'Você não pode desativar nem rebaixar o próprio usuário',
  perfilProibido: 'Só o administrador gerencia usuários',
};

const CAMPOS_EDITAVEIS = ['nome', 'email', 'senha', 'perfil', 'ativo'];
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatarUsuario(usuario) {
  return {
    id: usuario.id_usuario,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    ativo: usuario.ativo,
  };
}

// Cada validador devolve { valor } ou { erro }. Tipo errado, vazio ou acima do
// limite do schema é "campos"; os outros erros têm mensagem própria.
const VALIDADORES = {
  nome(valor) {
    if (typeof valor !== 'string') return { erro: ERROS.campos };
    const nome = valor.trim();
    if (!nome || nome.length > 80) return { erro: ERROS.campos };
    return { valor: nome };
  },
  email(valor) {
    if (typeof valor !== 'string') return { erro: ERROS.campos };
    const email = valor.trim().toLowerCase();
    if (!email || email.length > 120) return { erro: ERROS.campos };
    if (!FORMATO_EMAIL.test(email)) return { erro: ERROS.email };
    return { valor: email };
  },
  senha(valor) {
    if (typeof valor !== 'string') return { erro: ERROS.campos };
    if (valor.length < TAMANHO_MINIMO_SENHA) return { erro: ERROS.senha };
    return { valor };
  },
  perfil(valor) {
    if (typeof valor !== 'string') return { erro: ERROS.campos };
    if (!PERFIS.includes(valor)) return { erro: ERROS.perfil };
    return { valor };
  },
  ativo(valor) {
    if (typeof valor !== 'boolean') return { erro: ERROS.campos };
    return { valor };
  },
};

// `obrigatorios` lista os campos que precisam vir; os outros de CAMPOS_EDITAVEIS
// são validados só se vierem. Campo fora da lista é ignorado.
function lerCampos(corpo, obrigatorios) {
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) return { erro: ERROS.campos };

  const dados = {};
  for (const campo of CAMPOS_EDITAVEIS) {
    if (corpo[campo] === undefined) {
      if (obrigatorios.includes(campo)) return { erro: ERROS.campos };
      continue;
    }
    const resultado = VALIDADORES[campo](corpo[campo]);
    if (resultado.erro) return { erro: resultado.erro };
    dados[campo] = resultado.valor;
  }

  if (Object.keys(dados).length === 0) return { erro: ERROS.campos };
  return { dados };
}

async function paraGravar(dados) {
  const { senha, ...resto } = dados;
  return senha === undefined ? resto : { ...resto, senha_hash: await gerarHash(senha) };
}

async function listarUsuarios() {
  const usuarios = await prisma.usuario.findMany({ orderBy: [{ nome: 'asc' }, { id_usuario: 'asc' }] });
  return usuarios.map(formatarUsuario);
}

async function criarUsuario(dados) {
  try {
    const usuario = await prisma.usuario.create({
      data: { ...(await paraGravar(dados)), ativo: true },
    });
    return formatarUsuario(usuario);
  } catch (erro) {
    if (erro.code === 'P2002') return { emailRepetido: true };
    throw erro;
  }
}

// `idLogado` é quem faz a requisição: ele não pode se desativar nem virar editor,
// para o sistema nunca ficar sem administrador por engano.
async function atualizarUsuario(id, dados, idLogado) {
  if (id === idLogado && (dados.ativo === false || dados.perfil === 'editor')) {
    return { proprioUsuario: true };
  }

  try {
    const usuario = await prisma.usuario.update({
      where: { id_usuario: id },
      data: await paraGravar(dados),
    });
    return formatarUsuario(usuario);
  } catch (erro) {
    if (erro.code === 'P2025') return { naoEncontrado: true };
    if (erro.code === 'P2002') return { emailRepetido: true };
    throw erro;
  }
}

module.exports = {
  ERROS,
  PERFIS,
  lerCampos,
  listarUsuarios,
  criarUsuario,
  atualizarUsuario,
};
