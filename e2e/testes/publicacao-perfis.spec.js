import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import {
  PRIMEIRO_ANO_DE_TESTE,
  baixarArquivoDoRelatorio,
  consultar,
  criarIndicador,
  desativarUsuario,
  idDoSetor,
  mudarStatusMedicao,
  mudarStatusRelatorio,
  nomeUnico,
  tokenDe,
} from '../ajudantes/api.js';
import { entrarCom, entrarComo } from '../ajudantes/sessao.js';

// Casos CT-26 a CT-29 e CT-31 do plano de testes (docs/testes/plano-de-testes.md).
// Os valores são os da carga: 350 é o Número de leitos de Hospedagem em 2025/2.

const PDF_DE_TESTE = fileURLToPath(new URL('../../backend/tests/fixtures/minimo.pdf', import.meta.url));
const SEMESTRE = 1;
const PERIODO = `${PRIMEIRO_ANO_DE_TESTE}/${SEMESTRE}`;
const VALOR = 350;
const FILTRO_DO_PERIODO = `ano=${PRIMEIRO_ANO_DE_TESTE}&semestre=${SEMESTRE}`;

// O painel no celular ainda depende da #269, e o CT-24 já cobre login, cadastro e upload lá.
test.skip(({ isMobile }) => isMobile, 'Publicação e perfis rodam no desktop; o painel no celular é o CT-24 (#269).');

// Se o teste falhar no meio, o que ele publicou volta para rascunho e o editor criado é
// desativado, para nada de 2031 ficar no portal e mudar o que outro teste confere.
const limpezas = [];
test.afterEach(async ({ request }) => {
  const token = await tokenDe(request, 'administrador');
  while (limpezas.length > 0) {
    const limpar = limpezas.pop();
    await limpar(request, token).catch(() => {});
  }
});

async function prepararIndicador(request) {
  const token = await tokenDe(request, 'administrador');
  return criarIndicador(request, token, {
    idSetor: await idDoSetor(request, 'Hospedagem'),
    nome: nomeUnico('Número de leitos'),
    unidade: 'leitos',
  });
}

async function abrirModulo(page, modulo) {
  await page.getByRole('navigation', { name: 'Menu administrativo' }).getByRole('link', { name: modulo, exact: true }).click();
}

async function cadastrarMedicaoPeloPainel(page, indicador) {
  await abrirModulo(page, 'Cadastrar medição');
  const formulario = page.getByRole('form', { name: 'Formulário de medição' });
  await formulario.getByRole('combobox', { name: 'Indicador', exact: true }).selectOption(String(indicador.id));
  await formulario.getByLabel('Ano', { exact: true }).fill(String(PRIMEIRO_ANO_DE_TESTE));
  await formulario.getByLabel('Semestre', { exact: true }).selectOption(String(SEMESTRE));
  await formulario.getByLabel('Valor', { exact: true }).fill(String(VALOR));
  await formulario.getByRole('button', { name: 'Salvar como rascunho' }).click();
  await expect(page.getByRole('status')).toHaveText('Medição cadastrada como rascunho.');
  await page.getByRole('link', { name: 'Voltar ao painel' }).click();
}

function linhaDaMedicao(page, nome) {
  return page.getByRole('row')
    .filter({ has: page.getByRole('cell', { name: nome, exact: true }) })
    .filter({ has: page.getByRole('cell', { name: PERIODO, exact: true }) });
}

async function medicaoDoIndicador(request, idIndicador) {
  const token = await tokenDe(request, 'administrador');
  const indicadores = await consultar(request, '/api/admin/indicadores', token);
  return indicadores.find((item) => item.id === idIndicador).medicoes[0];
}

// Publicar e despublicar passam pelo diálogo de confirmação, como no uso real.
async function alterarStatusPeloPainel(page, acao, rotulo, tituloDoDialogo) {
  await page.getByRole('button', { name: `${acao} ${rotulo}`, exact: true }).click();
  const dialogo = page.getByRole('dialog', { name: tituloDoDialogo });
  await dialogo.getByRole('button', { name: acao, exact: true }).click();
  await expect(dialogo).toHaveCount(0);
}

// Espera a página pública terminar de carregar: sem isso, "não aparece" passaria
// também com a tela ainda em "Carregando...".
async function esperarCarregar(page) {
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(/Carregando/)).toHaveCount(0);
}

function cardDoDashboard(page, nome) {
  return page.getByRole('article').filter({ has: page.getByRole('heading', { name: nome, exact: true }) });
}

function linhaDosIndicadores(page, nome) {
  return page.getByRole('row').filter({ has: page.getByRole('cell', { name: nome, exact: true }) });
}

test('CT-26: medição de 2031/1 publicada aparece no dashboard e em Indicadores; despublicada, some', async ({ page, request }) => {
  const indicador = await prepararIndicador(request);
  await entrarComo(page, 'administrador');
  await cadastrarMedicaoPeloPainel(page, indicador);
  const medicao = await medicaoDoIndicador(request, indicador.id);
  limpezas.push((api, token) => mudarStatusMedicao(api, token, medicao.id, 'rascunho'));

  const rotulo = `${indicador.nome}, ${PERIODO}`;
  await alterarStatusPeloPainel(page, 'Publicar', rotulo, 'Publicar medição?');
  await expect(page.getByRole('status')).toHaveText(`${rotulo}: publicada no portal.`);
  await expect(linhaDaMedicao(page, indicador.nome).getByRole('cell', { name: 'Publicado', exact: true })).toBeVisible();

  await page.goto(`/dashboard?${FILTRO_DO_PERIODO}`);
  const card = cardDoDashboard(page, indicador.nome);
  await expect(card).toContainText(String(VALOR));
  await expect(card).toContainText(PERIODO);

  await page.goto(`/indicadores?${FILTRO_DO_PERIODO}`);
  const linha = linhaDosIndicadores(page, indicador.nome);
  await expect(linha.getByRole('cell', { name: String(VALOR), exact: true })).toBeVisible();
  await expect(linha.getByRole('cell', { name: String(PRIMEIRO_ANO_DE_TESTE), exact: true })).toBeVisible();

  await page.goto('/admin');
  await alterarStatusPeloPainel(page, 'Despublicar', rotulo, 'Despublicar medição?');
  await expect(page.getByRole('status')).toHaveText(`${rotulo}: voltou para rascunho.`);
  await expect(linhaDaMedicao(page, indicador.nome).getByRole('cell', { name: 'Rascunho', exact: true })).toBeVisible();

  await page.goto(`/dashboard?${FILTRO_DO_PERIODO}`);
  await esperarCarregar(page);
  await expect(cardDoDashboard(page, indicador.nome)).toHaveCount(0);

  await page.goto(`/indicadores?${FILTRO_DO_PERIODO}`);
  await esperarCarregar(page);
  await expect(linhaDosIndicadores(page, indicador.nome)).toHaveCount(0);
});

test('CT-27: PDF publicado aparece em /relatorios e baixa; despublicado, some e o download dá 404', async ({ page, request }) => {
  const titulo = nomeUnico('Relatório publicado');
  await entrarComo(page, 'administrador');
  await abrirModulo(page, 'Relatórios');
  const cadastro = page.getByRole('region', { name: 'Cadastro de documento oficial' });
  await cadastro.getByLabel('Título do relatório').fill(titulo);
  await cadastro.getByLabel('Edição / Código').fill(`E2E/${PRIMEIRO_ANO_DE_TESTE}`);
  await cadastro.getByLabel('Categoria temática').selectOption({ label: 'Setor Hoteleiro' });
  await cadastro.getByLabel('Data de publicação').fill(`${PRIMEIRO_ANO_DE_TESTE}-01-15`);
  await cadastro.getByLabel('Descrição curta / Resumo executivo').fill('Relatório criado pelo teste de ponta a ponta.');
  await cadastro.getByLabel(/Arraste o PDF aqui/).setInputFiles(PDF_DE_TESTE);
  await cadastro.getByRole('button', { name: 'Enviar relatório', exact: true }).click();
  await expect(cadastro.getByRole('status')).toHaveText(/Relatório enviado como rascunho/);

  const token = await tokenDe(request, 'administrador');
  const relatorio = (await consultar(request, '/api/admin/relatorios', token)).find((item) => item.titulo === titulo);
  limpezas.push((api, tokenAdmin) => mudarStatusRelatorio(api, tokenAdmin, relatorio.id, 'rascunho'));

  await alterarStatusPeloPainel(page, 'Publicar', titulo, 'Publicar relatório?');
  const lista = page.getByRole('region', { name: 'Relatórios enviados' });
  await expect(lista.getByRole('status')).toHaveText(`${titulo}: publicado no portal.`);
  await expect(lista.getByRole('row').filter({ hasText: titulo }).getByRole('cell', { name: 'Publicado', exact: true })).toBeVisible();

  await page.goto('/relatorios');
  const publicacoes = page.getByRole('region', { name: 'Publicações disponíveis' });
  const card = publicacoes.getByRole('article').filter({ has: page.getByRole('heading', { level: 3, name: titulo, exact: true }) });
  await expect(card).toContainText(`Edição E2E/${PRIMEIRO_ANO_DE_TESTE}`);
  await expect(card).toContainText('Publicado em 15/01/2031');

  const download = page.waitForEvent('download');
  await card.getByRole('link', { name: `Baixar PDF: ${titulo}` }).click();
  const conteudo = await readFile(await (await download).path());
  expect(conteudo.subarray(0, 4).toString()).toBe('%PDF');

  await page.goto('/admin/relatorios');
  await alterarStatusPeloPainel(page, 'Despublicar', titulo, 'Despublicar relatório?');
  await expect(lista.getByRole('status')).toHaveText(`${titulo}: voltou para rascunho.`);

  await page.goto('/relatorios');
  // A lista carregou quando o relatório da carga aparece.
  await expect(publicacoes.getByRole('heading', { level: 3, name: 'Indicadores do setor hoteleiro', exact: true })).toBeVisible();
  await expect(page.getByText(titulo)).toHaveCount(0);

  const resposta = await baixarArquivoDoRelatorio(request, relatorio.id);
  expect(resposta.status()).toBe(404);
  expect(await resposta.json()).toEqual({ erro: 'Relatório não encontrado' });
});

test('CT-28: editor cadastra em rascunho e não vê publicar, despublicar nem o menu Usuários', async ({ page, request }) => {
  const indicador = await prepararIndicador(request);
  await entrarComo(page, 'editor');
  await expect(page.getByRole('navigation', { name: 'Menu administrativo' }).getByRole('link', { name: 'Usuários', exact: true })).toHaveCount(0);

  await cadastrarMedicaoPeloPainel(page, indicador);
  await expect(linhaDaMedicao(page, indicador.nome).getByRole('cell', { name: 'Rascunho', exact: true })).toBeVisible();
  // A carga tem medições publicadas: para o administrador, esta tela teria vários "Despublicar".
  await expect(page.getByRole('button', { name: /^(Publicar|Despublicar)\b/ })).toHaveCount(0);

  await abrirModulo(page, 'Relatórios');
  await expect(page.getByRole('region', { name: 'Relatórios enviados' }).getByRole('row').filter({ hasText: 'Indicadores do setor hoteleiro' })).toBeVisible();
  await expect(page.getByRole('button', { name: /^(Publicar|Despublicar)\b/ })).toHaveCount(0);
});

test('CT-29: editor não acessa Usuários pelo menu nem pelo endereço', async ({ page }) => {
  await entrarComo(page, 'editor');
  await expect(page.getByRole('link', { name: 'Usuários', exact: true })).toHaveCount(0);
  await page.goto('/admin/usuarios');
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Usuários', exact: true })).toHaveCount(0);
});

test('CT-31: administrador cria um editor, ele entra; desativado, não entra mais', async ({ page, request }) => {
  const nome = nomeUnico('Editora');
  const sufixo = nome.split(' ').at(-1);
  const novo = { email: `editora-${sufixo}@observatorio.local`, senha: `senha-e2e-${sufixo}` };

  await entrarComo(page, 'administrador');
  await abrirModulo(page, 'Usuários');
  await page.getByRole('textbox', { name: 'Nome', exact: true }).fill(nome);
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(novo.email);
  await page.getByLabel('Senha inicial', { exact: true }).fill(novo.senha);
  await page.getByRole('combobox', { name: 'Perfil', exact: true }).selectOption('editor');
  await page.getByRole('button', { name: 'Criar usuário', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(`Usuário ${nome} criado com sucesso.`);

  const token = await tokenDe(request, 'administrador');
  const criado = (await consultar(request, '/api/admin/usuarios', token)).find((item) => item.email === novo.email);
  limpezas.push((api, tokenAdmin) => desativarUsuario(api, tokenAdmin, criado.id));
  const linha = page.getByRole('row').filter({ has: page.getByRole('cell', { name: novo.email, exact: true }) });
  await expect(linha.getByRole('cell', { name: 'Editor', exact: true })).toBeVisible();
  await expect(linha.getByText('Ativo', { exact: true })).toBeVisible();

  // A sessão fica no sessionStorage, que é de cada aba: outra aba é outra pessoa.
  const outraAba = await page.context().newPage();
  await entrarCom(outraAba, novo);
  const usuario = await outraAba.evaluate(() => JSON.parse(sessionStorage.getItem('ot-srs-user')));
  expect(usuario).toEqual(expect.objectContaining({ nome, perfil: 'editor' }));
  await outraAba.close();

  await linha.getByRole('button', { name: `Desativar ${nome}`, exact: true }).click();
  const dialogo = page.getByRole('dialog', { name: 'Desativar usuário?' });
  await dialogo.getByRole('button', { name: 'Desativar usuário', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(`${nome} desativado com sucesso.`);
  await expect(linha.getByText('Inativo', { exact: true })).toBeVisible();

  const depois = await page.context().newPage();
  await depois.goto('/admin/login');
  await depois.getByLabel('E-mail', { exact: true }).fill(novo.email);
  await depois.getByLabel('Senha', { exact: true }).fill(novo.senha);
  await depois.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(depois.getByRole('alert')).toHaveText('E-mail ou senha inválidos');
  await expect(depois).toHaveURL(/\/admin\/login$/);
});
