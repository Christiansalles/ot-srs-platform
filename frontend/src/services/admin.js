import { API_URL } from '../config';
import {
  criarEstadoAdminMock,
  criarMockIndicador,
} from '../mocks/admin';
import { mockSetores } from '../mocks/dados';
import { AUTH_UNAUTHORIZED_EVENT, getToken, logout } from './auth';

const mensagensPorStatus = {
  400: 'Confira os dados informados e tente novamente.',
  403: 'Seu perfil não tem permissão para realizar esta ação.',
  409: 'Há um conflito com os dados atuais. Confira se a medição já existe ou está publicada.',
  413: 'O arquivo excede o limite permitido de 10 MiB.',
};

let estadoMock = criarEstadoAdminMock();

function estaUsandoMock() {
  return import.meta.env.VITE_USE_MOCK === 'true';
}

function erroHttp(status, detalhe) {
  const erro = new Error(detalhe || mensagensPorStatus[status] || `Falha na operação administrativa (HTTP ${status}).`);
  erro.status = status;
  return erro;
}

async function requisitarAdmin(caminho, { method = 'GET', body } = {}) {
  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let corpo = body;
  const ehFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !ehFormData) {
    headers['Content-Type'] = 'application/json';
    corpo = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_URL}/api/admin/${caminho}`, { method, headers, body: corpo });
  } catch {
    throw new Error('Não foi possível conectar à API administrativa. Tente novamente.');
  }

  if (response.status === 401) {
    logout();
    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
  }

  let dados;
  try {
    dados = await response.json();
  } catch {
    dados = null;
  }

  if (!response.ok) throw erroHttp(response.status, dados?.erro);
  return dados;
}

function montarQuery(filtros) {
  const params = new URLSearchParams();
  for (const campo of ['setor', 'status']) {
    const valor = filtros[campo];
    if (valor !== undefined && valor !== null && valor !== '') params.set(campo, valor);
  }
  return params.size ? `?${params}` : '';
}

function erroMock(status, mensagem) {
  throw erroHttp(status, mensagem);
}

function listarIndicadoresMock(filtros) {
  if (filtros.setor && !/^[1-9]\d*$/.test(String(filtros.setor))) {
    erroMock(400, 'setor deve ser um número inteiro positivo');
  }
  if (filtros.status && !['rascunho', 'publicado'].includes(filtros.status)) {
    erroMock(400, 'Status inválido');
  }

  return structuredClone(estadoMock.indicadores)
    .filter((indicador) => !filtros.setor || indicador.setor?.id === Number(filtros.setor))
    .map((indicador) => ({
      ...indicador,
      medicoes: filtros.status
        ? indicador.medicoes.filter((medicao) => medicao.status === filtros.status)
        : indicador.medicoes,
    }))
    .filter((indicador) => !filtros.status || indicador.medicoes.length > 0);
}

export async function listarIndicadoresAdmin(filtros = {}) {
  if (estaUsandoMock()) return listarIndicadoresMock(filtros);
  return requisitarAdmin(`indicadores${montarQuery(filtros)}`);
}

export async function criarIndicador(dados) {
  if (!estaUsandoMock()) return requisitarAdmin('indicadores', { method: 'POST', body: dados });

  if (!mockSetorExiste(dados.id_setor)) erroMock(400, 'Setor inválido');
  const id = Math.max(0, ...estadoMock.indicadores.map((item) => item.id)) + 1;
  const indicador = criarMockIndicador(dados, id);
  estadoMock.indicadores.push(indicador);
  return structuredClone(indicador);
}

export async function editarIndicador(id, dados) {
  if (!estaUsandoMock()) return requisitarAdmin(`indicadores/${id}`, { method: 'PUT', body: dados });

  const indicador = estadoMock.indicadores.find((item) => item.id === Number(id));
  if (!indicador) erroMock(404, 'Indicador não encontrado');
  if (!mockSetorExiste(dados.id_setor)) erroMock(400, 'Setor inválido');
  const atualizado = criarMockIndicador(dados, indicador.id);
  Object.assign(indicador, {
    nome: atualizado.nome,
    unidade: atualizado.unidade,
    descricao: atualizado.descricao,
    setor: atualizado.setor,
  });
  return structuredClone(indicador);
}

function mockSetorExiste(idSetor) {
  return mockSetores.some((setor) => setor.id === Number(idSetor));
}

export async function criarMedicao(dados) {
  if (!estaUsandoMock()) return requisitarAdmin('medicoes', { method: 'POST', body: dados });

  const indicador = estadoMock.indicadores.find((item) => item.id === Number(dados.id_indicador));
  if (!indicador) erroMock(400, 'Indicador inválido');
  const duplicada = estadoMock.indicadores.some((item) => item.medicoes.some((medicao) =>
    medicao.ano === Number(dados.ano)
      && medicao.semestre === Number(dados.semestre)
      && item.id === indicador.id));
  if (duplicada) erroMock(409, `Já existe uma medição deste indicador em ${dados.ano}/${dados.semestre}`);

  const id = Math.max(0, ...estadoMock.indicadores.flatMap((item) => item.medicoes.map((medicao) => medicao.id))) + 1;
  const medicao = {
    id,
    ano: Number(dados.ano),
    semestre: Number(dados.semestre),
    valor: Number(dados.valor),
    status: 'rascunho',
  };
  indicador.medicoes.push(medicao);
  indicador.medicoes.sort((a, b) => a.ano - b.ano || a.semestre - b.semestre);
  return structuredClone(medicao);
}

function buscarMedicao(id) {
  for (const indicador of estadoMock.indicadores) {
    const medicao = indicador.medicoes.find((item) => item.id === Number(id));
    if (medicao) return { indicador, medicao };
  }
  return null;
}

export async function editarMedicao(id, dados) {
  if (!estaUsandoMock()) return requisitarAdmin(`medicoes/${id}`, { method: 'PUT', body: dados });

  const encontrada = buscarMedicao(id);
  if (!encontrada) erroMock(404, 'Medição não encontrada');
  if (encontrada.medicao.status === 'publicado') erroMock(409, 'Despublique a medição antes de editar');

  const ano = dados.ano === undefined ? encontrada.medicao.ano : Number(dados.ano);
  const semestre = dados.semestre === undefined ? encontrada.medicao.semestre : Number(dados.semestre);
  const duplicada = encontrada.indicador.medicoes.some((item) => item.id !== Number(id)
    && item.ano === ano && item.semestre === semestre);
  if (duplicada) erroMock(409, `Já existe uma medição deste indicador em ${ano}/${semestre}`);

  Object.assign(encontrada.medicao, { valor: Number(dados.valor), ano, semestre });
  encontrada.indicador.medicoes.sort((a, b) => a.ano - b.ano || a.semestre - b.semestre);
  return structuredClone(encontrada.medicao);
}

export async function alterarStatusMedicao(id, status) {
  if (!estaUsandoMock()) {
    return requisitarAdmin(`medicoes/${id}/status`, { method: 'PATCH', body: { status } });
  }

  const encontrada = buscarMedicao(id);
  if (!encontrada) erroMock(404, 'Medição não encontrada');
  if (!['rascunho', 'publicado'].includes(status)) erroMock(400, 'Status inválido');
  encontrada.medicao.status = status;
  return structuredClone(encontrada.medicao);
}

export async function listarRelatoriosAdmin() {
  if (estaUsandoMock()) return structuredClone(estadoMock.relatorios);
  return requisitarAdmin('relatorios');
}

export async function enviarRelatorio(formData) {
  if (!estaUsandoMock()) return requisitarAdmin('relatorios', { method: 'POST', body: formData });

  const arquivo = formData.get('arquivo');
  if (arquivo?.size > 10 * 1024 * 1024) erroMock(413, 'Arquivo muito grande');

  const id = Math.max(0, ...estadoMock.relatorios.map((item) => item.id)) + 1;
  const relatorio = {
    id,
    titulo: formData.get('titulo'),
    edicao: formData.get('edicao'),
    categoria: formData.get('categoria'),
    data_publicacao: formData.get('data_publicacao'),
    descricao: formData.get('descricao'),
    tamanho_kb: arquivo?.size ? Math.ceil(arquivo.size / 1024) : null,
    url_arquivo: `/api/relatorios/${id}/arquivo`,
    status: 'rascunho',
  };
  estadoMock.relatorios.push(relatorio);
  return structuredClone(relatorio);
}

export async function alterarStatusRelatorio(id, status) {
  if (!estaUsandoMock()) {
    return requisitarAdmin(`relatorios/${id}/status`, { method: 'PATCH', body: { status } });
  }

  const relatorio = estadoMock.relatorios.find((item) => item.id === Number(id));
  if (!relatorio) erroMock(404, 'Relatório não encontrado');
  if (!['rascunho', 'publicado'].includes(status)) erroMock(400, 'Status inválido');
  relatorio.status = status;
  return structuredClone(relatorio);
}

export function resetarMocksAdmin() {
  estadoMock = criarEstadoAdminMock();
}
