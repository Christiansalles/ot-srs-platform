// Regras de estilo de frontend/AGENTS.md que dá para conferir lendo os arquivos. Roda no CI junto com
// os outros testes; se falhar, a mensagem diz o arquivo e o trecho que fugiu do padrão.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

// O Vitest roda dentro de frontend/, local e no CI
const SRC = join(process.cwd(), 'src');

function listar(pasta) {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    const caminho = join(pasta, item.name);
    return item.isDirectory() ? listar(caminho) : [caminho];
  });
}

const arquivos = listar(SRC).map((caminho) => ({
  nome: relative(SRC, caminho).replaceAll('\\', '/'),
  texto: readFileSync(caminho, 'utf-8'),
}));
const css = arquivos.filter(({ nome }) => nome.endsWith('.css'));
const codigo = arquivos.filter(({ nome }) => /\.(jsx?|css)$/.test(nome));

function semComentarios(texto) {
  return texto.replace(/\/\*[\s\S]*?\*\//g, '');
}

// Pares [propriedade, valor] de cada declaração `propriedade: valor;`
function declaracoes(texto) {
  return [...semComentarios(texto).matchAll(/([a-z-]+)\s*:\s*([^;{}]+);/g)].map(([, prop, valor]) => [prop, valor.trim()]);
}

// Seletores de cada regra, separados por vírgula
function seletores(texto) {
  return [...semComentarios(texto).matchAll(/([^{}]+)\{/g)]
    .map(([, seletor]) => seletor.trim())
    .filter((seletor) => !seletor.startsWith('@'))
    .flatMap((seletor) => seletor.split(',').map((parte) => parte.trim()));
}

// Montado pelo código para este arquivo não reprovar a si mesmo
const TRAVESSAO = String.fromCharCode(0x2014);

const COR_SOLTA = /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\(|\b(?:white|black|red|green|blue|gray|grey|silver|yellow|orange|purple|pink)\b/i;

// Classes de AdminPagina.css e do AdminCabecalho: só esses arquivos as definem
const CLASSES_DO_PAINEL = /^\.admin-(?:pagina|cabecalho|cartao|estado|mensagem|nota|campo|acoes|botao|tabela)\b/;
const BASE_DO_PAINEL = ['components/AdminLayout/AdminPagina.css', 'components/AdminCabecalho/AdminCabecalho.css'];
const paginasDoPainel = arquivos.filter(({ nome }) => /^pages\/Admin(?!Login)\w*Page\.jsx$/.test(nome));

describe('padrão visual', () => {
  it('não usa cor fora dos tokens de theme/', () => {
    const problemas = css
      .filter(({ nome }) => !nome.startsWith('theme/'))
      .flatMap(({ nome, texto }) => declaracoes(texto)
        .filter(([, valor]) => COR_SOLTA.test(valor))
        .map(([prop, valor]) => `${nome}: ${prop}: ${valor}`));

    expect(problemas, 'Use var(--color-...) de theme/theme.css').toEqual([]);
  });

  it('não troca a fonte fora de theme/', () => {
    const problemas = css
      .filter(({ nome }) => !nome.startsWith('theme/'))
      .flatMap(({ nome, texto }) => declaracoes(texto)
        .filter(([prop, valor]) => prop === 'font-family' && valor !== 'inherit')
        .map(([, valor]) => `${nome}: font-family: ${valor}`));

    expect(problemas).toEqual([]);
  });

  it('não usa travessão em código, textos de interface ou testes', () => {
    const problemas = codigo
      .filter(({ texto }) => texto.includes(TRAVESSAO))
      .map(({ nome, texto }) => `${nome}: ${texto.split('\n').find((linha) => linha.includes(TRAVESSAO)).trim()}`);

    expect(problemas, 'Troque o travessão por vírgula, dois-pontos ou parênteses').toEqual([]);
  });

  it('toda página do painel usa o AdminCabecalho e a classe admin-pagina', () => {
    expect(paginasDoPainel.length).toBeGreaterThanOrEqual(3);
    const problemas = paginasDoPainel
      .filter(({ texto }) => !texto.includes('<AdminCabecalho') || !/className="admin-pagina\b/.test(texto))
      .map(({ nome }) => nome);

    expect(problemas, 'Ver "Painel administrativo" em frontend/AGENTS.md').toEqual([]);
  });

  it('as páginas do painel não redefinem o cabeçalho nem as classes da base', () => {
    const problemas = css
      .filter(({ nome }) => !BASE_DO_PAINEL.includes(nome))
      .flatMap(({ nome, texto }) => seletores(texto)
        .filter((seletor) => CLASSES_DO_PAINEL.test(seletor)
          || (nome.startsWith('pages/Admin') && !nome.startsWith('pages/AdminLogin') && /(^|[\s>+~])h1\b/.test(seletor)))
        .map((seletor) => `${nome}: ${seletor}`));

    expect(problemas, 'Ajuste a base em AdminPagina.css ou escopo pela classe da página (.minha-pagina .admin-...)').toEqual([]);
  });
});
