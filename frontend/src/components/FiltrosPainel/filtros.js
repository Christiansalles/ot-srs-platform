// As opções mostram onde há dados. A URL também aceita filtros válidos sem resultado.
export function lerFiltros(params) {
  const anoParam = params.get('ano') ?? '';
  const setorParam = params.get('setor') ?? '';
  const semestreParam = params.get('semestre') ?? '';
  const ano = /^[1-9]\d{3}$/.test(anoParam) ? anoParam : '';
  const setor = /^[1-9]\d*$/.test(setorParam) ? setorParam : '';
  const semestre = ano && ['1', '2'].includes(semestreParam) ? semestreParam : '';
  return { setor, ano, semestre };
}
