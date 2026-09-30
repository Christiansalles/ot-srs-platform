import { useEffect, useMemo, useState } from 'react';
import { getIndicadores, getSetores } from '../services/api';

export default function IndicadoresPage() {
  const [setores, setSetores] = useState([]);
  const [setorSelecionado, setSetorSelecionado] = useState(1);
  const [indicadores, setIndicadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getSetores()
      .then((dados) => {
        if (!active) return;
        setSetores(dados);
        if (dados.length > 0 && !setorSelecionado) {
          setSetorSelecionado(dados[0].id);
        }
      })
      .catch(() => {
        if (active) {
          setError('Não foi possível carregar os setores.');
        }
      });

    return () => {
      active = false;
    };
  }, [setorSelecionado]);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError('');

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
      <section className="content-section">
        <div className="section-header split-header">
          <h2>Indicadores turísticos</h2>

          <label className="select-control">
            <span>Setor</span>
            <select
              value={setorSelecionado}
              onChange={(event) => setSetorSelecionado(Number(event.target.value))}
            >
              {setores.map((setor) => (
                <option key={setor.id} value={setor.id}>
                  {setor.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <p className="state-message">Carregando indicadores...</p>
        ) : error ? (
          <p className="state-message error">{error}</p>
        ) : linhas.length === 0 ? (
          <p className="state-message">Sem dados para esse setor.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th>Unidade</th>
                  <th>Ano</th>
                  <th>Semestre</th>
                  <th>Valor</th>
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
      </section>
    </div>
  );
}
