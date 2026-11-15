// Contraste de texto sobre foto ou gradiente, que o axe não mede: esconde o texto,
// captura o que está atrás dele e compara a cor do texto com cada pixel do fundo.
// Devolve o percentil 5, o mesmo critério da auditoria da #258: um pixel claro isolado
// não reprova, mas uma faixa de fundo claro atrás do texto, sim.
export async function contrasteSobreFundo(alvo, { percentil = 0.05 } = {}) {
  const page = alvo.page();
  await alvo.scrollIntoViewIfNeeded();

  const { cor, area } = await alvo.evaluate((elemento) => {
    const trecho = document.createRange();
    trecho.selectNodeContents(elemento);
    const { x, y, width, height } = trecho.getBoundingClientRect();
    return { cor: getComputedStyle(elemento).color, area: { x, y, width, height } };
  });

  await alvo.evaluate((elemento) => {
    for (const no of [elemento, ...elemento.querySelectorAll('*')]) {
      no.style.setProperty('color', 'transparent', 'important');
      no.style.setProperty('text-shadow', 'none', 'important');
    }
  });
  let imagem;
  try {
    imagem = await page.screenshot({ clip: area, animations: 'disabled' });
  } finally {
    await alvo.evaluate((elemento) => {
      for (const no of [elemento, ...elemento.querySelectorAll('*')]) {
        no.style.removeProperty('color');
        no.style.removeProperty('text-shadow');
      }
    });
  }

  return page.evaluate(async ({ base64, cor, percentil }) => {
    const figura = new Image();
    figura.src = `data:image/png;base64,${base64}`;
    await figura.decode();
    const canvas = document.createElement('canvas');
    canvas.width = figura.width;
    canvas.height = figura.height;
    const contexto = canvas.getContext('2d', { willReadFrequently: true });
    contexto.drawImage(figura, 0, 0);
    const pixels = contexto.getImageData(0, 0, canvas.width, canvas.height).data;

    // O Chromium devolve "rgb(...)", "rgba(...)" ou, com color-mix, "color(srgb r g b / a)".
    const numeros = cor.match(/[\d.]+/g).map(Number);
    const emSrgb = cor.startsWith('color(');
    const texto = numeros.slice(0, 3).map((valor) => (emSrgb ? valor * 255 : valor));
    const opacidade = numeros.length > 3 ? numeros[3] : 1;

    function luminancia([vermelho, verde, azul]) {
      const canais = [vermelho, verde, azul].map((valor) => {
        const canal = valor / 255;
        return canal <= 0.04045 ? canal / 12.92 : ((canal + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2];
    }

    const contrastes = [];
    for (let indice = 0; indice < pixels.length; indice += 4) {
      const fundo = [pixels[indice], pixels[indice + 1], pixels[indice + 2]];
      // Texto translúcido se mistura ao fundo antes de ser visto.
      const visto = texto.map((canal, posicao) => opacidade * canal + (1 - opacidade) * fundo[posicao]);
      const [maior, menor] = [luminancia(visto), luminancia(fundo)].sort((a, b) => b - a);
      contrastes.push((maior + 0.05) / (menor + 0.05));
    }
    contrastes.sort((a, b) => a - b);
    return contrastes[Math.floor(contrastes.length * percentil)];
  }, { base64: imagem.toString('base64'), cor, percentil });
}
