import { useEffect, useMemo, useState } from 'react';
import { getIndicadores, getSetores } from '../services/api';

export default function IndicadoresPage() {
  const [setores, setSetores] = useState([]);
  const [setorSelecionado, setSetorSelecionado] = useState(1);
  const [indicadores, setIndicadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [setoresError, setSetoresError] = useState('');

  useEffect(() => {
    let active = true;

    getSetores()
      .then((dados) => {
        if (!active) return;
        setSetores(dados);
      })
      .catch(() => {
        if (active) {
          setSetoresError('Não foi possível carregar os setores.');
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    getIndicadores(setorSelecionado)
      .then((dados) => {
        if (!active) return;
        setIndicadores(dados);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError('Não foi possível consultar os indicadores do setor selecionado.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [setorSelecionado]);

  const linhas = useMemo(
    () =>
      indicadores.flatMap((indicador) =>
        indicador.medicoes.map((medicao) => ({
          id: `${indicador.id}-${medicao.ano}-${medicao.semestre}`,
          nome: indicador.nome,
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
        <p>Consulte as séries de hospedagem e acompanhe sua evolução por período.</p>
      </header>
      <section className="content-section">
        <div className="filter-bar">

          <label className="select-control">
            <span>Setor</span>
            <select
              value={setorSelecionado}
              onChange={(event) => {
                setLoading(true);
                setError('');
                setSetorSelecionado(Number(event.target.value));
              }}
            >
              {setores.map((setor) => (
                <option key={setor.id} value={setor.id}>
                  {setor.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {setoresError ? <p className="state-message error" role="alert">{setoresError}</p> : loading ? (
          <p className="state-message">Carregando indicadores...</p>
        ) : error ? (
          <p className="state-message error" role="alert">{error}</p>
        ) : linhas.length === 0 ? (
          <p className="state-message">Sem dados para esse setor.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Indicador</th>
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
                    <td>{linha.unidade}</td>
                    <td>{linha.ano}</td>
                    <td>{linha.semestre}</td>
                    <td>{linha.valor}</td>
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
