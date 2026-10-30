import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminCabecalho from '../components/AdminCabecalho/AdminCabecalho';
import DialogoConfirmacao from '../components/DialogoConfirmacao/DialogoConfirmacao';
import StatusBadge from '../components/StatusBadge/StatusBadge';
import { getSetores } from '../services/api';
import { alterarStatusMedicao, listarIndicadoresAdmin } from '../services/admin';
import { podePublicar } from '../services/auth';
import { formatarValor } from '../utils/formatarValor';
import './AdminPage.css';

function normalizarTexto(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

function criarLinhas(indicadores) {
  return indicadores.flatMap((indicador) => (indicador.medicoes.length > 0
    ? indicador.medicoes.map((medicao) => ({ indicador, medicao }))
    : [{ indicador, medicao: null }]));
}

function AdminPage() {
  const [indicadores, setIndicadores] = useState([]);
  const [setores, setSetores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [setorSelecionado, setSetorSelecionado] = useState('');
  const [statusSelecionado, setStatusSelecionado] = useState('');
  const [busca, setBusca] = useState('');
  const [confirmacao, setConfirmacao] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const mostrarPublicacao = podePublicar();

  useEffect(() => {
    let ativo = true;

    Promise.all([getSetores(), listarIndicadoresAdmin()])
      .then(([setoresCarregados, indicadoresCarregados]) => {
        if (!ativo) return;
        setSetores(setoresCarregados);
        setIndicadores(indicadoresCarregados);
      })
      .catch(() => {
        if (ativo) setErro('Não foi possível carregar os indicadores. Tente novamente.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => { ativo = false; };
  }, [tentativa]);

  function tentarNovamente() {
    setErro('');
    setCarregando(true);
    setTentativa((atual) => atual + 1);
  }

  const linhas = useMemo(() => {
    const termo = normalizarTexto(busca.trim());
    return criarLinhas(indicadores)
      .filter(({ indicador }) => !setorSelecionado || String(indicador.setor.id) === setorSelecionado)
      .filter(({ medicao }) => !statusSelecionado || medicao?.status === statusSelecionado)
      .filter(({ indicador, medicao }) => {
        if (!termo) return true;
        const texto = [
          indicador.nome,
          indicador.setor.nome,
          medicao ? `${medicao.ano}/${medicao.semestre}` : '',
          medicao ? formatarValor(medicao.valor, indicador.unidade) : '',
        ].join(' ');
        return normalizarTexto(texto).includes(termo);
      });
  }, [busca, indicadores, setorSelecionado, statusSelecionado]);

  const contadores = useMemo(() => {
    const medicoes = indicadores.flatMap((indicador) => indicador.medicoes);
    return {
      indicadores: indicadores.length,
      publicados: medicoes.filter((medicao) => medicao.status === 'publicado').length,
      rascunhos: medicoes.filter((medicao) => medicao.status === 'rascunho').length,
    };
  }, [indicadores]);

  function limparFiltros() {
    setSetorSelecionado('');
    setStatusSelecionado('');
    setBusca('');
  }

  async function alterarStatus() {
    const { indicador, medicao, publicar, rotulo } = confirmacao;

    setAviso(null);
    setEnviando(true);
    try {
      const atualizada = await alterarStatusMedicao(medicao.id, publicar ? 'publicado' : 'rascunho');
      setIndicadores((atuais) => atuais.map((item) => (item.id === indicador.id
        ? {
          ...item,
          medicoes: item.medicoes.map((atual) => (atual.id === medicao.id ? { ...atual, ...atualizada } : atual)),
        }
        : item)));
      setAviso({
        tipo: 'sucesso',
        texto: `${rotulo}: ${publicar ? 'publicada no portal' : 'voltou para rascunho'}.`,
      });
    } catch (falha) {
      setAviso({ tipo: 'erro', texto: falha.message || 'Não foi possível alterar o status. Tente novamente.' });
    } finally {
      setEnviando(false);
      setConfirmacao(null);
    }
  }

  return (
    <section className="admin-pagina admin-dashboard" aria-labelledby="admin-heading">
      <AdminCabecalho
        id="admin-heading"
        sobretitulo="Gestão de dados"
        titulo="Indicadores"
        descricao="Gerencie os indicadores do Observatório do Turismo de Santa Rita do Sapucaí."
      />

      {!carregando && !erro && (
        <section className="admin-dashboard__summary" aria-label="Resumo dos indicadores">
          <article className="admin-cartao admin-summary-card">
            <div>
              <h2>Total de indicadores</h2>
              <p className="admin-summary-card__value">{contadores.indicadores}</p>
              <span>Cadastros no painel</span>
            </div>
            <span className="admin-summary-card__icon" aria-hidden="true">▦</span>
          </article>
          <article className="admin-cartao admin-summary-card admin-summary-card--published">
            <div>
              <h2>Publicados no portal</h2>
              <p className="admin-summary-card__value">{contadores.publicados}</p>
              <span>Visíveis ao público</span>
            </div>
            <span className="admin-summary-card__icon" aria-hidden="true">◉</span>
          </article>
          <article className="admin-cartao admin-summary-card admin-summary-card--draft">
            <div>
              <h2>Rascunhos pendentes</h2>
              <p className="admin-summary-card__value">{contadores.rascunhos}</p>
              <span>Aguardando revisão</span>
            </div>
            <span className="admin-summary-card__icon" aria-hidden="true">✎</span>
          </article>
        </section>
      )}

      {aviso && (
        <p className={`admin-mensagem admin-mensagem--${aviso.tipo}`} role={aviso.tipo === 'erro' ? 'alert' : 'status'}>
          {aviso.texto}
        </p>
      )}

      <section className="admin-cartao admin-dashboard__list" aria-label="Lista de indicadores">
        <div className="admin-dashboard__list-heading">
          <h2 className="admin-cartao__titulo">Indicadores cadastrados</h2>
          {!carregando && !erro && (
            <span>{linhas.length} {linhas.length === 1 ? 'registro' : 'registros'}</span>
          )}
        </div>

        <div className="admin-dashboard__filters">
          <label className="admin-dashboard__search">
            <span className="admin-dashboard__search-icon" aria-hidden="true">⌕</span>
            <span className="sr-only">Buscar por indicador, setor ou valor</span>
            <input
              type="search"
              placeholder="Buscar por indicador, setor ou valor..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              disabled={carregando || Boolean(erro)}
            />
          </label>
          <label className="admin-dashboard__filter">
            <span className="sr-only">Filtrar por setor</span>
            <select
              aria-label="Filtrar por setor"
              value={setorSelecionado}
              onChange={(event) => setSetorSelecionado(event.target.value)}
              disabled={carregando || Boolean(erro)}
            >
              <option value="">Todos os setores</option>
              {setores.map((setor) => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}
            </select>
          </label>
          <label className="admin-dashboard__filter">
            <span className="sr-only">Filtrar por status</span>
            <select
              aria-label="Filtrar por status"
              value={statusSelecionado}
              onChange={(event) => setStatusSelecionado(event.target.value)}
              disabled={carregando || Boolean(erro)}
            >
              <option value="">Todos os status</option>
              <option value="publicado">Publicado</option>
              <option value="rascunho">Rascunho</option>
            </select>
          </label>
        </div>

        {carregando && <p className="admin-estado" role="status">Carregando indicadores...</p>}
        {erro && (
          <div className="admin-estado admin-estado--erro" role="alert">
            <p>{erro}</p>
            <button className="admin-botao-contorno" type="button" onClick={tentarNovamente}>Tentar novamente</button>
          </div>
        )}
        {!carregando && !erro && linhas.length === 0 && (
          <div className="admin-estado" role="status">
            <p>Nenhum indicador encontrado para os filtros selecionados.</p>
            {(setorSelecionado || statusSelecionado || busca) && (
              <button className="admin-botao-contorno" type="button" onClick={limparFiltros}>Limpar filtros</button>
            )}
          </div>
        )}

        {!carregando && !erro && linhas.length > 0 && (
          <div className="admin-tabela-rolagem">
            <table className="admin-tabela admin-dashboard__table">
              <thead>
                <tr>
                  <th scope="col">Indicador</th>
                  <th scope="col">Setor</th>
                  <th scope="col">Período</th>
                  <th scope="col">Valor</th>
                  <th scope="col">Status</th>
                  <th scope="col"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                {linhas.map(({ indicador, medicao }) => (
                  <tr key={`${indicador.id}-${medicao?.id ?? 'sem-medicao'}`}>
                    <td>
                      <strong>{indicador.nome}</strong>
                      {indicador.descricao && <small>{indicador.descricao}</small>}
                    </td>
                    <td><span className="admin-dashboard__sector">{indicador.setor.nome}</span></td>
                    <td>{medicao && `${medicao.ano}/${medicao.semestre}`}</td>
                    <td className="admin-dashboard__value">
                      {medicao && formatarValor(medicao.valor, indicador.unidade)}
                    </td>
                    <td>
                      {medicao
                        ? <StatusBadge status={medicao.status} />
                        : <span className="admin-dashboard__no-measurement">Sem medições</span>}
                    </td>
                    <td className="admin-dashboard__action-cell">
                      {mostrarPublicacao && medicao && (
                        <button
                          type="button"
                          aria-label={`${medicao.status === 'rascunho' ? 'Publicar' : 'Despublicar'} ${indicador.nome}, ${medicao.ano}/${medicao.semestre}`}
                          onClick={() => setConfirmacao({
                            indicador,
                            medicao,
                            publicar: medicao.status === 'rascunho',
                            rotulo: `${indicador.nome}, ${medicao.ano}/${medicao.semestre}`,
                          })}
                        >
                          {medicao.status === 'rascunho' ? 'Publicar' : 'Despublicar'}
                        </button>
                      )}
                      <Link
                        to={medicao
                          ? `/admin/medicoes/${medicao.id}/editar`
                          : `/admin/medicoes/nova?indicador=${indicador.id}`}
                        aria-label={`Editar ${indicador.nome}${medicao ? `, ${medicao.ano}/${medicao.semestre}` : ''}`}
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {confirmacao && (
        <DialogoConfirmacao
          titulo={confirmacao.publicar ? 'Publicar medição?' : 'Despublicar medição?'}
          destaque={`${confirmacao.indicador.nome} - ${confirmacao.medicao.ano}/${confirmacao.medicao.semestre}`}
          descricao={confirmacao.publicar
            ? 'Após a publicação, a medição ficará visível no portal público.'
            : 'Após a despublicação, a medição deixará de aparecer no portal público e voltará para rascunho.'}
          rotuloConfirmar={confirmacao.publicar ? 'Publicar' : 'Despublicar'}
          enviando={enviando}
          onConfirmar={alterarStatus}
          onCancelar={() => setConfirmacao(null)}
        />
      )}
    </section>
  );
}

export default AdminPage;
