import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import CardIndicador from '../components/CardIndicador/CardIndicador';
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
          <p className="eyebrow">Portal de inteligência territorial · SRS-MG</p>
          <h1>Indicadores do Turismo</h1>
          <p className="lead">
            Dados e informações abertas para acompanhar a hospedagem e impulsionar o
            desenvolvimento turístico de Santa Rita do Sapucaí.
          </p>
          <div className="hero-actions">
            <Link className="hero-primary" to="/indicadores">Consultar indicadores →</Link>
            <Link className="hero-secondary" to="/dashboard">Explorar dashboard</Link>
          </div>
        </div>
      </section>

      <section className="content-section" aria-live="polite">
        <div className="section-header">
          <h2>Indicadores em destaque</h2>
          <Link to="/indicadores">Ver todos →</Link>
        </div>

        {loading ? (
          <p className="state-message">Carregando destaques...</p>
        ) : error ? (
          <p className="state-message error" role="alert">{error}</p>
        ) : destaques.length === 0 ? (
          <p className="state-message">Sem indicadores disponíveis no momento.</p>
        ) : (
          <div className="cards-grid">
            {destaques.map((indicador) => (
              <CardIndicador
                key={indicador.id}
                name={indicador.nome}
                value={indicador.valor}
                unit={indicador.unidade}
                variation={indicador.variacao_percentual}
                periodo={indicador.periodo}
              />
            ))}
          </div>
        )}
      </section>
      <section className="content-section report-teaser">
        <div><p className="eyebrow">Publicações do observatório</p><h2>Relatórios e análises</h2><p>Acompanhe as publicações sobre o turismo local.</p></div>
        <Link to="/relatorios" className="ot-button-secondary">Ver relatórios →</Link>
      </section>
    </div>
  );
}
