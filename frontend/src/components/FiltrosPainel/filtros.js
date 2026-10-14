// Sem as opções carregadas, valida apenas o formato e a dependência do semestre.
export function lerFiltros(params, { anos, setores } = {}) {
  const anoParam = params.get('ano') ?? '';
  const setorParam = params.get('setor') ?? '';
  const semestreParam = params.get('semestre') ?? '';
  const ano = /^[1-9]\d{3}$/.test(anoParam)
    && (!anos || anos.some((item) => String(item) === anoParam)) ? anoParam : '';
  const setor = /^[1-9]\d*$/.test(setorParam)
    && (!setores || setores.some((item) => String(item.id) === setorParam)) ? setorParam : '';
  const semestre = ano && ['1', '2'].includes(semestreParam) ? semestreParam : '';
  return { setor, ano, semestre };
}
