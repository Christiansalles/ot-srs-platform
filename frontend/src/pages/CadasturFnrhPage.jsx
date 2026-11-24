import LinkExterno from '../components/LinkExterno/LinkExterno';
import { DATA_DA_CONFERENCIA, SECOES } from '../config/cadasturFnrh';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import './CadasturFnrhPage.css';

function Fontes({ fontes }) {
  return (
    <p className="cadastur-fnrh__fonte">
      {fontes.length > 1 ? 'Fontes: ' : 'Fonte: '}
      {fontes.map((fonte, indice) => (
        <span key={fonte.url}>
          {indice > 0 && '; '}
          <LinkExterno href={fonte.url}>{fonte.rotulo}</LinkExterno>
        </span>
      ))}
    </p>
  );
}

export default function CadasturFnrhPage() {
  useTituloDaPagina('Cadastur e FNRH Digital');

  return (
    <div className="page cadastur-fnrh">
      <header className="page-heading">
        <p className="eyebrow cadastur-fnrh__sobretitulo">Para quem trabalha com turismo</p>
        <h1>Cadastur e FNRH Digital</h1>
        <p>
          Orientações sobre dois sistemas do Ministério do Turismo usados por prestadores de
          serviços turísticos e meios de hospedagem, com os links oficiais.
        </p>
      </header>

      <aside className="cadastur-fnrh__nota" aria-label="Sobre esta página">
        <p>
          <strong>O Observatório não faz o cadastro no Cadastur nem o registro de hóspedes, e não tem
          integração com esses sistemas.</strong> Esta página resume páginas oficiais do governo
          federal, citadas em cada trecho. Em caso de dúvida, vale o que está na página oficial.
        </p>
        <p className="cadastur-fnrh__conferencia">Informações conferidas em {DATA_DA_CONFERENCIA}.</p>
      </aside>

      <div className="cadastur-fnrh__secoes">
        {SECOES.map((secao) => (
          <section key={secao.id} className="cadastur-fnrh__secao" aria-labelledby={`secao-${secao.id}`}>
            <h2 id={`secao-${secao.id}`}>{secao.titulo}</h2>
            <p className="cadastur-fnrh__resumo">{secao.resumo}</p>

            {secao.blocos.map((bloco) => (
              <div key={bloco.titulo} className="cadastur-fnrh__bloco">
                <h3>{bloco.titulo}</h3>
                {bloco.paragrafos?.map((paragrafo) => <p key={paragrafo}>{paragrafo}</p>)}
                {bloco.passos && (
                  <ol>
                    {bloco.passos.map((passo) => <li key={passo}>{passo}</li>)}
                  </ol>
                )}
                <Fontes fontes={bloco.fontes} />
              </div>
            ))}

            <h3>Links oficiais</h3>
            <ul className="cadastur-fnrh__links">
              {secao.links.map((link) => (
                <li key={link.url}><LinkExterno href={link.url}>{link.rotulo}</LinkExterno></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
