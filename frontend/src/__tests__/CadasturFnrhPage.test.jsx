import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CadasturFnrhPage from '../pages/CadasturFnrhPage';
import { SECOES } from '../config/cadasturFnrh';

function abrir() {
  return render(<MemoryRouter><CadasturFnrhPage /></MemoryRouter>);
}

function ehSiteDoGoverno(url) {
  const { protocol, hostname } = new URL(url);
  return protocol === 'https:' && (hostname === 'gov.br' || hostname.endsWith('.gov.br'));
}

describe('CadasturFnrhPage', () => {
  it('mostra o título, as duas seções e o título da aba', () => {
    abrir();

    expect(screen.getByRole('heading', { level: 1, name: 'Cadastur e FNRH Digital' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Cadastur' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'FNRH Digital' })).toBeInTheDocument();
    expect(document.title).toBe('Cadastur e FNRH Digital · Observatório do Turismo');
  });

  it('avisa que o Observatório não faz o cadastro nem tem integração', () => {
    abrir();

    const nota = screen.getByRole('complementary', { name: 'Sobre esta página' });
    expect(nota).toHaveTextContent('O Observatório não faz o cadastro no Cadastur nem o registro de hóspedes');
    expect(nota).toHaveTextContent('não tem integração com esses sistemas');
    expect(nota).toHaveTextContent(/conferidas em \d{2}\/\d{2}\/\d{4}/);
  });

  it.each(SECOES.map((secao) => [secao.titulo, secao]))('cita a fonte oficial em cada trecho de %s', (titulo, secao) => {
    abrir();
    const regiao = within(screen.getByRole('region', { name: titulo }));

    for (const bloco of secao.blocos) {
      expect(bloco.fontes.length).toBeGreaterThan(0);
      expect(regiao.getByRole('heading', { level: 3, name: bloco.titulo })).toBeInTheDocument();
    }
    expect(regiao.getByRole('heading', { level: 3, name: 'Links oficiais' })).toBeInTheDocument();
    expect(regiao.getAllByText(/^Fontes?:/)).toHaveLength(secao.blocos.length);
  });

  it('só aponta para sites do governo, em https', () => {
    const urls = SECOES.flatMap((secao) => [
      ...secao.blocos.flatMap((bloco) => bloco.fontes.map((fonte) => fonte.url)),
      ...secao.links.map((link) => link.url),
    ]);

    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(ehSiteDoGoverno(url), url).toBe(true);
  });

  it('abre os links oficiais em aba nova, sem dar acesso à página de origem, e avisa o leitor de tela', () => {
    abrir();
    // A página não tem link interno: todo link dela sai do Observatório.
    const externos = screen.getAllByRole('link');

    expect(externos.length).toBeGreaterThan(0);
    for (const link of externos) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      expect(link).toHaveAccessibleName(/\(abre em nova aba\)$/);
    }
  });

  it('leva ao site do Cadastur e à entrada da FNRH Digital', () => {
    abrir();

    expect(screen.getByRole('link', { name: 'Site do Cadastur (abre em nova aba)' }))
      .toHaveAttribute('href', 'https://cadastur.turismo.gov.br/');
    expect(screen.getByRole('link', { name: 'Entrar como meio de hospedagem (abre em nova aba)' }))
      .toHaveAttribute('href', 'https://fnrh.turismo.serpro.gov.br/FNRH_SRH/Login');
  });
});
