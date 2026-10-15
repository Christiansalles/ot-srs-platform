import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import FiltrosPainel from '../components/FiltrosPainel/FiltrosPainel';
import { lerFiltros } from '../components/FiltrosPainel/filtros';
import { getIndicadores } from '../services/api';

export default function IndicadoresPage() {
  const [params] = useSearchParams();
  const { setor, ano, semestre } = lerFiltros(params);
  const consulta = `${setor}/${ano}/${semestre}`;
  const [resultado, setResultado] = useState({ consulta: null, indicadores: [], erro: '' });
  const carregando = resultado.consulta !== consulta;
  const { indicadores, erro } = resultado;

  useEffect(() => {
    let ativo = true;

    getIndicadores({ setor, ano, semestre })
      .then((dados) => {
        if (!ativo) return;
        setResultado({ consulta, indicadores: dados, erro: '' });
      })
      .catch(() => {
        if (!ativo) return;
        setResultado({ consulta, indicadores: [], erro: 'Não foi possível consultar os indicadores.' });
      });

    return () => {
      ativo = false;
    };
  }, [setor, ano, semestre, consulta]);

  const linhas = useMemo(
    () =>
      indicadores.flatMap((indicador) =>
        indicador.medicoes.map((medicao) => ({
          id: `${indicador.id}-${medicao.ano}-${medicao.semestre}`,
          nome: indicador.nome,
          setor: indicador.setor.nome,
          unidade: indicador.unidade,
          ano: medicao.ano,
          semestre: medicao.semestre,
          valor: medicao.valor,
        })),
      ),
    [indicadores],
  );

  return (
    <div className="page indicadores-page">
      <header className="page-heading">
        <p className="eyebrow">Dados abertos · Consulta detalhada</p>
        <h1>Indicadores turísticos</h1>
        <p>Consulte e filtre os indicadores do turismo em Santa Rita do Sapucaí.</p>
      </header>
      <section className="content-section">
        <FiltrosPainel />

        {carregando ? (
          <p className="state-message" role="status">Carregando indicadores...</p>
        ) : erro ? (
          <p className="state-message error" role="alert">{erro}</p>
        ) : linhas.length === 0 ? (
          <p className="state-message" role="status">Sem dados para os filtros selecionados. Use "Limpar filtros" para consultar todos os indicadores.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Indicador</th>
                  <th scope="col">Setor</th>
                  <th scope="col">Unidade</th>
                  <th scope="col">Ano</th>
                  <th scope="col">Semestre</th>
                  <th scope="col">Valor</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((linha) => (
                  <tr key={linha.id}>
                    <td>{linha.nome}</td>
                    <td>{linha.setor}</td>
                    <td>{linha.unidade}</td>
                    <td>{linha.ano}</td>
                    <td>{linha.semestre}</td>
                    <td>{linha.valor.toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="data-note">Valores ilustrativos do Milestone III. A unidade e o período acompanham cada medição.</p>
      </section>
    </div>
  );
}
