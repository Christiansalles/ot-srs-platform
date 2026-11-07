import { expect, test } from '@playwright/test';
import {
  PRIMEIRO_ANO_DE_TESTE,
  consultar,
  criarIndicador,
  criarMedicao,
  criarRelatorio,
  idDoSetor,
  nomeUnico,
  tokenDe,
} from '../ajudantes/api.js';
import { entrarComo } from '../ajudantes/sessao.js';

// Confere os ajudantes que os outros testes de ponta a ponta usam.

for (const perfil of ['administrador', 'editor']) {
  test(`entrarComo("${perfil}") abre o painel`, async ({ page }) => {
    await entrarComo(page, perfil);

    const usuario = await page.evaluate(() => JSON.parse(sessionStorage.getItem('ot-srs-user')));
    expect(usuario.perfil).toBe(perfil);
  });
}

test('dado criado pela API nasce em rascunho e fica fora do portal', async ({ request }) => {
  const token = await tokenDe(request, 'editor');
  const nome = nomeUnico('Número de leitos');
  const indicador = await criarIndicador(request, token, {
    idSetor: await idDoSetor(request, 'Hospedagem'),
    nome,
    unidade: 'leitos',
  });
  const medicao = await criarMedicao(request, token, {
    idIndicador: indicador.id,
    ano: PRIMEIRO_ANO_DE_TESTE,
    semestre: 1,
    valor: 350,
  });

  expect(medicao.status).toBe('rascunho');

  const noPainel = await consultar(request, '/api/admin/indicadores', token);
  expect(noPainel.find((item) => item.id === indicador.id).medicoes).toEqual([
    expect.objectContaining({ ano: PRIMEIRO_ANO_DE_TESTE, semestre: 1, valor: 350, status: 'rascunho' }),
  ]);

  const noPortal = await consultar(request, '/api/indicadores');
  expect(noPortal.map((item) => item.nome)).not.toContain(nome);
});

test('criarMedicao recusa período da carga', async ({ request }) => {
  await expect(criarMedicao(request, 'sem-token', {
    idIndicador: 1, ano: 2025, semestre: 2, valor: 350,
  })).rejects.toThrow('2031 em diante');
});

test('criarRelatorio recusa data antes de 2031', async ({ request }) => {
  await expect(criarRelatorio(request, 'sem-token', {
    titulo: 'Relatório fora do período de teste', dataPublicacao: '2026-10-21',
  })).rejects.toThrow('2031 em diante');
});
