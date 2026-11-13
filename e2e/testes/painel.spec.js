import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import {
  PRIMEIRO_ANO_DE_TESTE,
  criarIndicador,
  criarMedicao,
  idDoSetor,
  nomeUnico,
  tokenDe,
} from '../ajudantes/api.js';
import { entrarComo } from '../ajudantes/sessao.js';
import { usuarioDe } from '../ajudantes/usuarios.js';

const PDF_DE_TESTE = fileURLToPath(new URL('../../backend/tests/fixtures/minimo.pdf', import.meta.url));
const SEMESTRE = 1;
const PERIODO = `${PRIMEIRO_ANO_DE_TESTE}/${SEMESTRE}`;
// Valores de Número de leitos na carga de Hospedagem em 2025/2 e 2024/2.
const VALOR_INICIAL = 350;
const VALOR_EDITADO = 312;

async function prepararIndicador(request) {
  const token = await tokenDe(request, 'administrador');
  const indicador = await criarIndicador(request, token, {
    idSetor: await idDoSetor(request, 'Hospedagem'),
    nome: nomeUnico('Número de leitos'),
    unidade: 'leitos',
  });
  return { token, indicador };
}

async function prepararRascunho(request) {
  const { token, indicador } = await prepararIndicador(request);
  await criarMedicao(request, token, {
    idIndicador: indicador.id,
    ano: PRIMEIRO_ANO_DE_TESTE,
    semestre: SEMESTRE,
    valor: VALOR_INICIAL,
  });
  return indicador;
}

async function abrirModulo(page, modulo, isMobile) {
  if (isMobile) await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
  await page.getByRole('navigation', { name: 'Menu administrativo' }).getByRole('link', { name: modulo, exact: true }).click();
}

async function conferirLarguraNoCelular(page, isMobile) {
  if (isMobile) await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

async function preencherMedicao(page, indicador, valor) {
  const formulario = page.getByRole('form', { name: 'Formulário de medição' });
  await formulario.getByRole('combobox', { name: 'Indicador', exact: true }).selectOption(String(indicador.id));
  await formulario.getByLabel('Ano', { exact: true }).fill(String(PRIMEIRO_ANO_DE_TESTE));
  await formulario.getByLabel('Semestre', { exact: true }).selectOption(String(SEMESTRE));
  await formulario.getByLabel('Valor', { exact: true }).fill(String(valor));
  return formulario;
}

function linhaDaMedicao(page, nome) {
  return page.getByRole('row')
    .filter({ has: page.getByRole('cell', { name: nome, exact: true }) })
    .filter({ has: page.getByRole('cell', { name: PERIODO, exact: true }) });
}

async function preencherRelatorio(cadastro, titulo) {
  await cadastro.getByLabel('Título do relatório').fill(titulo);
  await cadastro.getByLabel('Edição / Código').fill(`E2E/${PRIMEIRO_ANO_DE_TESTE}`);
  await cadastro.getByLabel('Categoria temática').selectOption({ label: 'Setor Hoteleiro' });
  await cadastro.getByLabel('Data de publicação').fill(`${PRIMEIRO_ANO_DE_TESTE}-01-15`);
  await cadastro.getByLabel('Descrição curta / Resumo executivo').fill('Relatório criado pelo teste de ponta a ponta.');
}

test.describe('Cenários de desktop e do CT-24 no celular', () => {
  test('CT-16: senha errada mostra o erro e mantém a tela de login', async ({ page, isMobile }) => {
    await page.goto('/admin/login');
    await page.getByLabel('E-mail', { exact: true }).fill(usuarioDe('administrador').email);
    await page.getByLabel('Senha', { exact: true }).fill('senha-incorreta-e2e');
    await page.getByRole('button', { name: 'Entrar', exact: true }).click();

    await expect(page.getByRole('alert')).toHaveText('E-mail ou senha inválidos');
    await expect(page).toHaveURL(/\/admin\/login$/);
    await conferirLarguraNoCelular(page, isMobile);
  });

  test('CT-19: cadastra uma medição e lista o rascunho no painel', async ({ page, request, isMobile }) => {
    const { indicador } = await prepararIndicador(request);
    await entrarComo(page, 'administrador');
    await abrirModulo(page, 'Cadastrar medição', isMobile);
    const formulario = await preencherMedicao(page, indicador, VALOR_INICIAL);
    await conferirLarguraNoCelular(page, isMobile);
    await formulario.getByRole('button', { name: 'Salvar como rascunho' }).click();

    await expect(page.getByRole('status')).toHaveText('Medição cadastrada como rascunho.');
    await page.getByRole('link', { name: 'Voltar ao painel' }).click();
    const linha = linhaDaMedicao(page, indicador.nome);
    await expect(linha.getByRole('cell', { name: 'Rascunho', exact: true })).toBeVisible();
    await expect(linha.getByRole('cell', { name: `${VALOR_INICIAL} leitos`, exact: true })).toBeVisible();
    await conferirLarguraNoCelular(page, isMobile);
  });

  test('CT-23: envia PDF como rascunho e recusa arquivo que não é PDF', async ({ page, isMobile }) => {
    await entrarComo(page, 'administrador');
    await abrirModulo(page, 'Relatórios', isMobile);
    const cadastro = page.getByRole('region', { name: 'Cadastro de documento oficial' });
    const arquivo = cadastro.getByLabel(/Arraste o PDF aqui/);
    const enviar = cadastro.getByRole('button', { name: 'Enviar relatório', exact: true });
    const titulo = nomeUnico('Relatório do painel');
    await preencherRelatorio(cadastro, titulo);
    await conferirLarguraNoCelular(page, isMobile);
    await arquivo.setInputFiles(PDF_DE_TESTE);
    await enviar.click();

    await expect(cadastro.getByRole('status')).toHaveText(/Relatório enviado como rascunho/);
    const lista = page.getByRole('region', { name: 'Relatórios enviados' });
    const linha = lista.getByRole('row').filter({ hasText: titulo });
    await expect(linha.getByRole('cell', { name: 'Rascunho', exact: true })).toBeVisible();

    const tituloInvalido = nomeUnico('Relatório inválido');
    await preencherRelatorio(cadastro, tituloInvalido);
    await arquivo.setInputFiles({
      name: 'relatorio-invalido.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Conteúdo de teste sem formato PDF.'),
    });
    await enviar.click();

    await expect(cadastro.getByRole('alert')).toHaveText('Arquivo PDF obrigatório');
    await expect(lista.getByRole('row').filter({ hasText: tituloInvalido })).toHaveCount(0);
  });
});

test.describe('Demais cenários de desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'O CT-24 cobre login, cadastro e upload no celular.');

  test('CT-17: acesso ao painel sem sessão redireciona ao login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(page.getByRole('heading', { name: 'Acesso Administrativo' })).toBeVisible();
  });

  for (const perfil of ['administrador', 'editor']) {
    test(`CT-18: Sair volta à página inicial e encerra a sessão do ${perfil}`, async ({ page }) => {
      await entrarComo(page, perfil);
      await page.getByRole('button', { name: 'Sair', exact: true }).click();

      await expect(page).toHaveURL(new URL('/', page.url()).href);
      await expect(page.getByRole('heading', { level: 1, name: 'Indicadores do Turismo' })).toBeVisible();

      // Nem o Voltar nem o recarregar devolvem o painel.
      await page.goBack();
      await expect(page.getByRole('button', { name: 'Sair', exact: true })).toHaveCount(0);
      await page.goto('/admin');
      await expect(page).toHaveURL(/\/admin\/login$/);
      await page.reload();
      await expect(page).toHaveURL(/\/admin\/login$/);
      await expect(page.getByRole('heading', { name: 'Acesso Administrativo' })).toBeVisible();
    });
  }

  test('CT-20: medição duplicada mostra o erro e preserva os campos', async ({ page, request }) => {
    const indicador = await prepararRascunho(request);
    await entrarComo(page, 'administrador');
    await abrirModulo(page, 'Cadastrar medição', false);
    const formulario = await preencherMedicao(page, indicador, VALOR_EDITADO);
    await formulario.getByRole('button', { name: 'Salvar como rascunho' }).click();

    await expect(page.getByRole('alert')).toHaveText(`Já existe uma medição deste indicador em ${PERIODO}`);
    await expect(formulario.getByRole('combobox', { name: 'Indicador', exact: true })).toHaveValue(String(indicador.id));
    await expect(formulario.getByLabel('Ano', { exact: true })).toHaveValue(String(PRIMEIRO_ANO_DE_TESTE));
    await expect(formulario.getByLabel('Semestre', { exact: true })).toHaveValue(String(SEMESTRE));
    await expect(formulario.getByLabel('Valor', { exact: true })).toHaveValue(String(VALOR_EDITADO));
  });

  test('CT-21: edita um rascunho e mostra o novo valor na lista', async ({ page, request }) => {
    const indicador = await prepararRascunho(request);
    await entrarComo(page, 'administrador');
    await linhaDaMedicao(page, indicador.nome).getByRole('link', { name: `Editar ${indicador.nome}, ${PERIODO}` }).click();
    const valor = page.getByLabel('Valor', { exact: true });
    await expect(valor).toHaveValue(String(VALOR_INICIAL));
    await valor.fill(String(VALOR_EDITADO));
    await page.getByRole('button', { name: 'Salvar alterações' }).click();

    await expect(page.getByRole('status')).toHaveText('Medição atualizada com sucesso.');
    await page.getByRole('link', { name: 'Voltar ao painel' }).click();
    const linha = linhaDaMedicao(page, indicador.nome);
    await expect(linha.getByRole('cell', { name: `${VALOR_EDITADO} leitos`, exact: true })).toBeVisible();
    await expect(linha.getByRole('cell', { name: 'Rascunho', exact: true })).toBeVisible();
  });

  test('CT-22: medição publicada é somente leitura e mantém o valor no portal', async ({ page }) => {
    await entrarComo(page, 'administrador');
    await page.getByRole('link', { name: 'Editar Número de leitos, 2025/2', exact: true }).click();

    await expect(page.getByRole('status')).toHaveText('Esta medição está publicada e não pode ser editada. Despublique para editar.');
    await expect(page.getByLabel('Ano', { exact: true })).toBeDisabled();
    await expect(page.getByLabel('Semestre', { exact: true })).toBeDisabled();
    const valor = page.getByLabel('Valor', { exact: true });
    await expect(valor).toBeDisabled();
    await expect(valor).toHaveValue(String(VALOR_INICIAL));
    await expect(page.getByRole('button', { name: 'Salvar alterações' })).toHaveCount(0);

    await page.goto('/indicadores?ano=2025&semestre=2');
    const linha = page.getByRole('row').filter({ has: page.getByRole('cell', { name: 'Número de leitos', exact: true }) });
    await expect(linha.getByRole('cell', { name: String(VALOR_INICIAL), exact: true })).toBeVisible();
  });
});
