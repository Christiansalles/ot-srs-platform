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

// Só o administrador muda o status; com o token do editor a API responde 403 e isto lança erro.
export async function mudarStatusMedicao(request, token, idMedicao, status) {
  return chamar(request, 'PATCH', `/api/admin/medicoes/${idMedicao}/status`, {
    token,
    dados: { status },
  });
}
