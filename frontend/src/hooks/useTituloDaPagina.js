import { useEffect } from 'react';

export const NOME_DO_SITE = 'Observatório do Turismo';
export const NOME_COMPLETO_DO_SITE = 'Observatório do Turismo de Santa Rita do Sapucaí';

// Título da aba por página (WCAG 2.4.2): quem usa leitor de tela ou várias abas sabe onde está.
// Sem título, fica o nome completo do site, como no index.html.
export function montarTituloDaPagina(titulo) {
  return titulo ? `${titulo} · ${NOME_DO_SITE}` : NOME_COMPLETO_DO_SITE;
}

export function useTituloDaPagina(titulo) {
  useEffect(() => {
    document.title = montarTituloDaPagina(titulo);
  }, [titulo]);
}
