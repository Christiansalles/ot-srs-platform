import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPeriodos, getSetores } from '../../services/api';
import { lerFiltros } from './filtros';
import './FiltrosPainel.css';

export default function FiltrosPainel({ opcoes, statusOpcoes = 'pronto' }) {
  const [params, setParams] = useSearchParams();
  const [dados, setDados] = useState({ anos: [], setores: [], status: 'carregando' });
  const filtros = opcoes
    ? Object.fromEntries(opcoes.map(({ campo }) => [campo, params.get(campo) ?? '']))
    : lerFiltros(params, dados);
  const status = opcoes ? statusOpcoes : dados.status;
  const campos = opcoes ?? [
    { campo: 'ano', rotulo: 'Período', todos: 'Todos os períodos',
      valores: dados.anos.map((ano, indice) => ({ valor: String(ano), nome: `${ano}${indice === 0 ? ' (Atual)' : ''}` })) },
    { campo: 'semestre', rotulo: 'Semestre', todos: 'Todos', desabilitado: !filtros.ano,
      valores: [{ valor: '1', nome: '1º semestre' }, { valor: '2', nome: '2º semestre' }] },
    { campo: 'setor', rotulo: 'Setor', todos: 'Todos os setores',
      valores: dados.setores.map((setor) => ({ valor: String(setor.id), nome: setor.nome })) },
  ];

  useEffect(() => {
    if (opcoes) return;
    let ativo = true;
    Promise.all([getPeriodos(), getSetores()])
      .then(([periodos, setores]) => {
        if (ativo) setDados({
          anos: [...new Set(periodos.map((periodo) => periodo.ano))].sort((a, b) => b - a),
          setores, status: 'pronto',
        });
      })
      .catch(() => {
        if (ativo) setDados({ anos: [], setores: [], status: 'erro' });
      });
    return () => { ativo = false; };
  }, [opcoes]);

  useEffect(() => {
    if (opcoes || dados.status !== 'pronto') return;
    const validos = lerFiltros(params, dados);
    const proximos = new URLSearchParams(params);
    for (const [campo, valor] of Object.entries(validos)) {
      if (!valor) proximos.delete(campo);
    }
    if (proximos.toString() !== params.toString()) {
      setParams(proximos, { replace: true });
    }
  }, [params, setParams, dados, opcoes]);

  function alterarFiltro(campo, valor) {
    setParams((anteriores) => {
      const proximos = new URLSearchParams(anteriores);
      if (valor) proximos.set(campo, valor);
      else proximos.delete(campo);
      if (!opcoes && campo === 'ano' && !valor) proximos.delete('semestre');
      return proximos;
    });
  }

  function limparFiltros() {
    setParams((anteriores) => {
      const proximos = new URLSearchParams(anteriores);
      for (const { campo } of campos) proximos.delete(campo);
      return proximos;
    });
  }

  return (
    <div className="filter-bar filtros-painel">
      {campos.map(({ campo, rotulo, todos, valores, desabilitado }) => (
        <label className="select-control" key={campo}>
          <span>{rotulo}</span>
          <select value={filtros[campo]} disabled={status !== 'pronto' || desabilitado}
            onChange={(evento) => alterarFiltro(campo, evento.target.value)}>
            <option value="">{todos}</option>
            {opcoes && filtros[campo] && !valores.some(({ valor }) => valor === filtros[campo]) && (
              <option value={filtros[campo]} hidden>{filtros[campo]}</option>
            )}
            {valores.map(({ valor, nome }) => <option key={valor} value={valor}>{nome}</option>)}
          </select>
        </label>
      ))}
      <button type="button" className="ot-button-secondary" onClick={limparFiltros}>Limpar filtros</button>
      {status === 'carregando' && <p role="status">Carregando filtros...</p>}
      {status === 'erro' && <p role="alert">Não foi possível carregar os filtros.</p>}
    </div>
  );
}
