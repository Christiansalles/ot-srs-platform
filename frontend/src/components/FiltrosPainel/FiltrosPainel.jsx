import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPeriodos, getSetores } from '../../services/api';
import './FiltrosPainel.css';

export default function FiltrosPainel() {
  const [params, setParams] = useSearchParams();
  const [dados, setDados] = useState({ anos: [], setores: [], status: 'carregando' });

  useEffect(() => {
    let ativo = true;
    Promise.all([getPeriodos(), getSetores()])
      .then(([periodos, setores]) => {
        if (ativo) setDados({
          anos: [...new Set(periodos.map((periodo) => periodo.ano))].sort((a, b) => a - b),
          setores, status: 'pronto',
        });
      })
      .catch(() => {
        if (ativo) setDados({ anos: [], setores: [], status: 'erro' });
      });
    return () => { ativo = false; };
  }, []);

  function alterarFiltro(campo, valor) {
    setParams((anteriores) => {
      const proximos = new URLSearchParams(anteriores);
      if (valor) proximos.set(campo, valor);
      else proximos.delete(campo);
      if (campo === 'ano' && !valor) proximos.delete('semestre');
      return proximos;
    });
  }

  function limparFiltros() {
    setParams((anteriores) => {
      const proximos = new URLSearchParams(anteriores);
      for (const campo of ['ano', 'semestre', 'setor']) proximos.delete(campo);
      return proximos;
    });
  }

  return (
    <div className="filter-bar filtros-painel">
      <label className="select-control">
        <span>Período</span>
        <select value={params.get('ano') ?? ''} disabled={dados.status !== 'pronto'}
          onChange={(evento) => alterarFiltro('ano', evento.target.value)}>
          <option value="">Todos os períodos</option>
          {dados.anos.map((ano) => <option key={ano} value={ano}>{ano}</option>)}
        </select>
      </label>
      <label className="select-control">
        <span>Semestre</span>
        <select value={params.get('ano') ? params.get('semestre') ?? '' : ''} disabled={!params.get('ano')}
          onChange={(evento) => alterarFiltro('semestre', evento.target.value)}>
          <option value="">Todos</option>
          <option value="1">1º semestre</option>
          <option value="2">2º semestre</option>
        </select>
      </label>
      <label className="select-control">
        <span>Setor</span>
        <select value={params.get('setor') ?? ''} disabled={dados.status !== 'pronto'}
          onChange={(evento) => alterarFiltro('setor', evento.target.value)}>
          <option value="">Todos os setores</option>
          {dados.setores.map((setor) => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}
        </select>
      </label>
      <button type="button" className="ot-button-secondary" onClick={limparFiltros}>Limpar filtros</button>
      {dados.status === 'carregando' && <p role="status">Carregando filtros...</p>}
      {dados.status === 'erro' && <p role="alert">Não foi possível carregar os filtros.</p>}
    </div>
  );
}
