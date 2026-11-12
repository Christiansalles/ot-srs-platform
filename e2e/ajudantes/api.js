import { usuarioDe } from './usuarios.js';

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:3000';

// A carga vai até 2025. Dado criado pelos testes fica de 2031 em diante, para nunca
// se misturar com a carga nem mudar o destaque ou a variação que outro teste confere.
export const PRIMEIRO_ANO_DE_TESTE = 2031;

async function chamar(request, metodo, rota, { token, dados } = {}) {
  const resposta = await request.fetch(`${API_URL}${rota}`, {
    method: metodo,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data: dados,
  });

  if (!resposta.ok()) {
    throw new Error(`${metodo} ${rota} respondeu ${resposta.status()}: ${await resposta.text()}`);
  }
  return resposta.json();
}

export async function tokenDe(request, perfil) {
  const { email, senha } = usuarioDe(perfil);
  const { token } = await chamar(request, 'POST', '/api/auth/login', { dados: { email, senha } });
  return token;
}

export async function consultar(request, rota, token) {
  return chamar(request, 'GET', rota, { token });
}

export async function idDoSetor(request, nome) {
  const setores = await consultar(request, '/api/setores');
  const setor = setores.find((item) => item.nome === nome);
  if (!setor) throw new Error(`Setor "${nome}" não está na carga`);
  return setor.id;
}

// Nome único por chamada: os projetos desktop e celular rodam o mesmo teste, e o banco é um só.
export function nomeUnico(prefixo) {
  const sufixo = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `${prefixo} E2E ${sufixo}`.slice(0, 80);
}

export async function criarIndicador(request, token, { idSetor, nome, unidade, descricao = null }) {
  return chamar(request, 'POST', '/api/admin/indicadores', {
    token,
    dados: { id_setor: idSetor, nome, unidade, descricao },
  });
}

// Nasce em rascunho, como pelo painel. Use um valor que já está na carga
// (backend/prisma/dados/*.json): teste também não inventa número.
export async function criarMedicao(request, token, { idIndicador, ano, semestre, valor }) {
  if (!Number.isInteger(ano) || ano < PRIMEIRO_ANO_DE_TESTE) {
    throw new Error(`Medição de teste precisa ser de ${PRIMEIRO_ANO_DE_TESTE} em diante (veio ${ano})`);
  }
  return chamar(request, 'POST', '/api/admin/medicoes', {
    token,
    dados: { id_indicador: idIndicador, ano, semestre, valor },
  });
}

// O menor PDF que a API aceita: tipo application/pdf e conteúdo começando com %PDF.
const PDF_DE_TESTE = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n');

// Nasce em rascunho, como pelo painel. A data é de 2031 em diante, como as medições de teste.
export async function criarRelatorio(request, token, {
  titulo,
  edicao = 'E2E/2031',
  categoria = 'Setor Hoteleiro',
  dataPublicacao = `${PRIMEIRO_ANO_DE_TESTE}-01-15`,
  descricao = 'Relatório criado pelo teste de ponta a ponta.',
}) {
  if (Number(dataPublicacao.slice(0, 4)) < PRIMEIRO_ANO_DE_TESTE) {
    throw new Error(`Relatório de teste precisa ser de ${PRIMEIRO_ANO_DE_TESTE} em diante (veio ${dataPublicacao})`);
  }
  const resposta = await request.post(`${API_URL}/api/admin/relatorios`, {
    headers: { Authorization: `Bearer ${token}` },
    multipart: {
      titulo,
      edicao,
      categoria,
      data_publicacao: dataPublicacao,
      descricao,
      arquivo: { name: 'relatorio-e2e.pdf', mimeType: 'application/pdf', buffer: PDF_DE_TESTE },
    },
  });
  if (!resposta.ok()) {
    throw new Error(`POST /api/admin/relatorios respondeu ${resposta.status()}: ${await resposta.text()}`);
  }
  return resposta.json();
}

// Rota pública de download, sem lançar erro: o teste confere o status.
export async function baixarArquivoDoRelatorio(request, id) {
  return request.get(`${API_URL}/api/relatorios/${id}/arquivo`);
}

// Só o administrador muda o status; com o token do editor a API responde 403 e isto lança erro.
export async function mudarStatusMedicao(request, token, idMedicao, status) {
  return chamar(request, 'PATCH', `/api/admin/medicoes/${idMedicao}/status`, {
    token,
    dados: { status },
  });
}

export async function mudarStatusRelatorio(request, token, idRelatorio, status) {
  return chamar(request, 'PATCH', `/api/admin/relatorios/${idRelatorio}/status`, {
    token,
    dados: { status },
  });
}

// Corta o acesso de um usuário criado pelo teste; usada na limpeza do fim do teste.
export async function desativarUsuario(request, token, idUsuario) {
  return chamar(request, 'PATCH', `/api/admin/usuarios/${idUsuario}`, {
    token,
    dados: { ativo: false },
  });
}
