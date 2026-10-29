import { useEffect, useState } from 'react';
import { getRelatorios } from '../services/api';
import './RelatoriosPage.css';

function formatarData(data) {
  return new Date(`${data}T00:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatarTamanho(tamanhoKb) {
  if (tamanhoKb === null || tamanhoKb === undefined) return 'Tamanho não informado';
  const emMb = tamanhoKb >= 1024;
  const tamanho = emMb ? tamanhoKb / 1024 : tamanhoKb;
  return `${tamanho.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${emMb ? 'MB' : 'KB'}`;
}

export default function RelatoriosPage() {
  const [estado, setEstado] = useState({ status: 'carregando', relatorios: [], erro: '' });

  useEffect(() => {
    let ativo = true;
    getRelatorios()
      .then((relatorios) => {
        if (ativo) setEstado({ status: 'pronto', relatorios, erro: '' });
      })
      .catch((erro) => {
        if (ativo) setEstado({
          status: 'erro', relatorios: [],
          erro: erro?.message || 'Não foi possível consultar os relatórios. Tente novamente.',
        });
      });
    return () => { ativo = false; };
  }, []);

  return (
    <div className="page relatorios-page">
      <header className="page-heading">
        <p className="eyebrow">Publicações do Observatório</p>
        <h1>Relatórios</h1>
        <p>Relatórios e análises sobre o turismo em Santa Rita do Sapucaí.</p>
      </header>

      <p className="relatorios-aviso">
        Os relatórios disponíveis são ilustrativos, elaborados pelo grupo a partir dos protótipos do projeto.
        {' '}Aguardamos os dados oficiais da Secretaria Municipal de Cultura, Esporte, Lazer e Turismo (SMCELT).
      </p>

      <section className="content-section" aria-labelledby="publicacoes-heading">
        <div className="relatorios-cabecalho">
          <h2 id="publicacoes-heading">Publicações disponíveis</h2>
          {estado.status === 'pronto' && (
            <span className="relatorios-contagem">
              {estado.relatorios.length} {estado.relatorios.length === 1 ? 'relatório' : 'relatórios'}
            </span>
          )}
        </div>
        <div aria-live="polite">
          {estado.status === 'carregando' ? (
            <p className="state-message" role="status">Carregando relatórios...</p>
          ) : estado.status === 'erro' ? (
            <p className="state-message error" role="alert">{estado.erro}</p>
          ) : estado.relatorios.length === 0 ? (
            <p className="state-message" role="status">Nenhum relatório publicado para esse filtro</p>
          ) : (
            <div className="relatorios-lista">
              {estado.relatorios.map((relatorio) => (
                <article className="relatorio-card" key={relatorio.id} aria-labelledby={`relatorio-${relatorio.id}`}>
                  <div className="relatorio-card__icone" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z" />
                      <path d="M14 3v5h5M8 12h8M8 16h8" />
                    </svg>
                  </div>
                  <div className="relatorio-card__conteudo">
                    <div className="relatorio-card__rotulos">
                      <span className="relatorio-card__edicao">Edição {relatorio.edicao}</span>
                      <span className="relatorio-card__categoria">{relatorio.categoria}</span>
                    </div>
                    <h3 id={`relatorio-${relatorio.id}`}>{relatorio.titulo}</h3>
                    <p className="relatorio-card__descricao">{relatorio.descricao}</p>
                    <div className="relatorio-card__metadados">
                      <span>Publicado em <time dateTime={relatorio.data_publicacao}>{formatarData(relatorio.data_publicacao)}</time></span>
                      <span>PDF · {formatarTamanho(relatorio.tamanho_kb)}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
