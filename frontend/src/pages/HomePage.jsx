import { useEffect, useState } from 'react';
import CardIndicador from '../components/CardIndicador';
import { getDestaques } from '../services/api';

export default function HomePage() {
  const [destaques, setDestaques] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    getDestaques()
      .then((dados) => {
        if (active) {
          setDestaques(dados);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError('Não foi possível carregar os destaques agora.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page home-page">
      <section className="hero-banner">
        <div>
          <p className="eyebrow">Observatório do Turismo</p>
          <h1>Indicadores do Turismo</h1>
          <p className="lead">
            Acompanhe a evolução da hospedagem e dos principais indicadores do setor.
          </p>
        </div>
      </section>

      <section className="content-section" aria-live="polite">
        <div className="section-header">
          <h2>Indicadores em destaque</h2>
        </div>

        {loading ? (
          <p className="state-message">Carregando destaques...</p>
        ) : error ? (
          <p className="state-message error">{error}</p>
        ) : destaques.length === 0 ? (
          <p className="state-message">Sem indicadores disponíveis no momento.</p>
        ) : (
          <div className="cards-grid">
            {destaques.map((indicador) => (
              <CardIndicador
                key={indicador.id}
                nome={indicador.nome}
                valor={indicador.valor}
                unidade={indicador.unidade}
                variacaoPercentual={indicador.variacao_percentual}
                periodo={indicador.periodo}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
