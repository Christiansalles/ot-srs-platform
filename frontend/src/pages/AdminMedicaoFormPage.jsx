import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getSetores } from '../services/api';
import {
  criarIndicador,
  criarMedicao,
  editarMedicao,
  listarIndicadoresAdmin,
} from '../services/admin';
import './AdminMedicaoFormPage.css';

const NOVO_INDICADOR = 'novo';

function AdminMedicaoFormPage() {
  const { id: idDaRota } = useParams();
  const [searchParams] = useSearchParams();
  const idDaQuery = searchParams.get('medicao');
  const idMedicao = idDaRota || idDaQuery;
  const idIndicadorInicial = searchParams.get('indicador') || '';
  const estaEditando = Boolean(idMedicao);

  const [indicadores, setIndicadores] = useState([]);
  const [setores, setSetores] = useState([]);
  const [indicadorId, setIndicadorId] = useState(idIndicadorInicial);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [setorId, setSetorId] = useState('');
  const [unidade, setUnidade] = useState('');
  const [ano, setAno] = useState('');
  const [semestre, setSemestre] = useState('');
  const [valor, setValor] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    Promise.all([getSetores(), listarIndicadoresAdmin()])
      .then(([setoresCarregados, indicadoresCarregados]) => {
        if (!ativo) return;
        setSetores(setoresCarregados);
        setIndicadores(indicadoresCarregados);

        if (estaEditando) {
          const resultado = indicadoresCarregados
            .flatMap((indicador) => indicador.medicoes.map((medicao) => ({ indicador, medicao })))
            .find(({ medicao }) => String(medicao.id) === String(idMedicao));

          if (!resultado) {
            setErro('Medição não encontrada. Volte ao painel e escolha um registro existente.');
            return;
          }

          setIndicadorId(String(resultado.indicador.id));
          setAno(String(resultado.medicao.ano));
          setSemestre(String(resultado.medicao.semestre));
          setValor(String(resultado.medicao.valor));
        }
      })
      .catch(() => {
        if (ativo) setErro('Não foi possível carregar os dados do formulário. Tente novamente.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => { ativo = false; };
  }, [estaEditando, idMedicao, tentativa]);

  let medicaoAtual = null;
  if (estaEditando) {
    for (const indicador of indicadores) {
      const medicao = indicador.medicoes.find((item) => String(item.id) === String(idMedicao));
      if (medicao) {
        medicaoAtual = { indicador, medicao };
        break;
      }
    }
  }

  const medicaoPublicada = medicaoAtual?.medicao.status === 'publicado';
  const selecionouNovoIndicador = !estaEditando && indicadorId === NOVO_INDICADOR;

  function validarFormulario() {
    if (!estaEditando && !selecionouNovoIndicador
        && !indicadores.some((indicador) => String(indicador.id) === indicadorId)) {
      return 'Selecione um indicador ou escolha cadastrar um novo.';
    }
    if (selecionouNovoIndicador) {
      if (!nome.trim() || nome.length > 80 || !unidade.trim() || unidade.length > 20
          || !setores.some((setor) => String(setor.id) === setorId)) {
        return 'Preencha nome, setor e unidade do indicador dentro dos limites informados.';
      }
      if (descricao.length > 200) return 'A descrição do indicador deve ter no máximo 200 caracteres.';
    }
    if (!/^\d{4}$/.test(ano) || Number(ano) < 1000) return 'Informe um ano válido com quatro dígitos.';
    if (!['1', '2'].includes(semestre)) return 'Selecione o semestre 1 ou 2.';
    const numeroValor = Number(valor);
    if (valor === '' || !Number.isFinite(numeroValor) || numeroValor < 0 || numeroValor > 9999999999.99
        || !/^\d{1,10}(?:\.\d{1,2})?$/.test(valor)) {
      return 'Informe um valor numérico válido, com até duas casas decimais.';
    }
    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (medicaoPublicada) return;

    const erroValidacao = validarFormulario();
    if (erroValidacao) {
      setErro(erroValidacao);
      setSucesso('');
      return;
    }

    setErro('');
    setSucesso('');
    setSalvando(true);
    try {
      if (estaEditando) {
        await editarMedicao(idMedicao, {
          valor: Number(valor),
          ano: Number(ano),
          semestre: Number(semestre),
        });
        setSucesso('Medição atualizada com sucesso.');
      } else {
        let idIndicador = Number(indicadorId);
        if (selecionouNovoIndicador) {
          const indicadorCriado = await criarIndicador({
            nome: nome.trim(),
            descricao: descricao.trim() || null,
            id_setor: Number(setorId),
            unidade: unidade.trim(),
          });
          idIndicador = indicadorCriado.id;
          setIndicadores((atuais) => [...atuais, indicadorCriado]);
          setIndicadorId(String(idIndicador));
        }

        await criarMedicao({
          id_indicador: idIndicador,
          ano: Number(ano),
          semestre: Number(semestre),
          valor: Number(valor),
        });
        setSucesso('Medição cadastrada como rascunho.');
        setAno('');
        setSemestre('');
        setValor('');
      }
    } catch (falha) {
      setErro(falha.message || 'Não foi possível salvar a medição. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  }

  function tentarNovamente() {
    setErro('');
    setCarregando(true);
    setTentativa((atual) => atual + 1);
  }

  if (carregando) {
    return <p className="admin-medicao-state" role="status">Carregando formulário...</p>;
  }

  if (erro && indicadores.length === 0 && setores.length === 0) {
    return (
      <div className="admin-medicao-state admin-medicao-state--error" role="alert">
        <p>{erro}</p>
        <button type="button" onClick={tentarNovamente}>Tentar novamente</button>
      </div>
    );
  }

  if (estaEditando && !medicaoAtual) {
    return (
      <div className="admin-medicao-state admin-medicao-state--error" role="alert">
        <p>{erro || 'Medição não encontrada.'}</p>
        <Link to="/admin">Voltar ao painel</Link>
      </div>
    );
  }

  const indicadorSelecionado = estaEditando
    ? medicaoAtual?.indicador
    : indicadores.find((item) => String(item.id) === indicadorId);

  return (
    <section className="admin-medicao-page" aria-labelledby="medicao-heading">
      <div className="admin-medicao-heading">
        <div>
          <p className="admin-medicao-eyebrow">Gestão de dados</p>
          <h1 id="medicao-heading">{estaEditando ? 'Editar medição' : 'Cadastrar medição'}</h1>
          <p>Registre os dados semestrais dos indicadores do Observatório do Turismo.</p>
        </div>
        <Link className="admin-medicao-back" to="/admin">Voltar ao painel</Link>
      </div>

      {erro && <p className="admin-medicao-message admin-medicao-message--error" role="alert">{erro}</p>}
      {sucesso && <p className="admin-medicao-message admin-medicao-message--success" role="status">{sucesso}</p>}

      {medicaoPublicada && (
        <p className="admin-medicao-message admin-medicao-message--notice" role="status">
          Esta medição está publicada e não pode ser editada. Despublique para editar.
        </p>
      )}

      <form className="admin-medicao-form" aria-label="Formulário de medição" noValidate onSubmit={handleSubmit}>
        <section className="admin-medicao-card" aria-labelledby="indicador-section-heading">
          <div className="admin-medicao-card-heading">
            <span aria-hidden="true">1</span>
            <div>
              <h2 id="indicador-section-heading">Indicador</h2>
              <p>Selecione um cadastro existente ou informe os dados de um novo.</p>
            </div>
          </div>

          {!estaEditando ? (
            <>
              <label className="admin-medicao-field">
                Indicador existente ou novo
                <select
                  aria-label="Indicador"
                  value={indicadorId}
                  onChange={(event) => setIndicadorId(event.target.value)}
                >
                  <option value="">Selecione um indicador</option>
                  {indicadores.map((indicador) => (
                    <option key={indicador.id} value={indicador.id}>
                      {indicador.nome} ({indicador.setor.nome})
                    </option>
                  ))}
                  <option value={NOVO_INDICADOR}>Cadastrar novo indicador</option>
                </select>
              </label>

              {indicadores.length === 0 && (
                <p className="admin-medicao-empty" role="status">
                  Nenhum indicador cadastrado. Selecione “Cadastrar novo indicador” para começar.
                </p>
              )}

              {selecionouNovoIndicador && (
                <div className="admin-medicao-indicator-fields">
                  <label className="admin-medicao-field">
                    Nome do indicador
                    <input aria-label="Nome do indicador" value={nome} maxLength={80} onChange={(event) => setNome(event.target.value)} />
                  </label>
                  <label className="admin-medicao-field">
                    Descrição <span>(opcional)</span>
                    <textarea aria-label="Descrição" value={descricao} maxLength={200} rows={3} onChange={(event) => setDescricao(event.target.value)} />
                  </label>
                  <label className="admin-medicao-field">
                    Setor
                    <select aria-label="Setor" value={setorId} onChange={(event) => setSetorId(event.target.value)}>
                      <option value="">Selecione um setor</option>
                      {setores.map((setor) => <option key={setor.id} value={setor.id}>{setor.nome}</option>)}
                    </select>
                  </label>
                  <label className="admin-medicao-field">
                    Unidade
                    <input aria-label="Unidade" value={unidade} maxLength={20} onChange={(event) => setUnidade(event.target.value)} placeholder="Ex.: leitos, %, R$" />
                  </label>
                </div>
              )}

              {indicadorSelecionado && (
                <div className="admin-medicao-selected-indicator" aria-live="polite">
                  <strong>{indicadorSelecionado.nome}</strong>
                  <span>{indicadorSelecionado.setor.nome} · {indicadorSelecionado.unidade}</span>
                  {indicadorSelecionado.descricao && <small>{indicadorSelecionado.descricao}</small>}
                </div>
              )}
            </>
          ) : (
            <div className="admin-medicao-selected-indicator">
              <strong>{medicaoAtual.indicador.nome}</strong>
              <span>{medicaoAtual.indicador.setor.nome} · {medicaoAtual.indicador.unidade}</span>
              {medicaoAtual.indicador.descricao && <small>{medicaoAtual.indicador.descricao}</small>}
            </div>
          )}
        </section>

        <section className="admin-medicao-card" aria-labelledby="periodo-section-heading">
          <div className="admin-medicao-card-heading">
            <span aria-hidden="true">2</span>
            <div>
              <h2 id="periodo-section-heading">Período e valor</h2>
              <p>Existe apenas uma medição por indicador em cada semestre.</p>
            </div>
          </div>

          <div className="admin-medicao-period-fields">
            <label className="admin-medicao-field">
              Ano
              <input
                aria-label="Ano"
                type="number"
                min="1000"
                max="9999"
                step="1"
                value={ano}
                disabled={medicaoPublicada}
                onChange={(event) => setAno(event.target.value)}
              />
            </label>
            <label className="admin-medicao-field">
              Semestre
              <select
                aria-label="Semestre"
                value={semestre}
                disabled={medicaoPublicada}
                onChange={(event) => setSemestre(event.target.value)}
              >
                <option value="">Selecione</option>
                <option value="1">1º semestre</option>
                <option value="2">2º semestre</option>
              </select>
            </label>
            <label className="admin-medicao-field">
              Valor {indicadorSelecionado?.unidade && <span>({indicadorSelecionado.unidade})</span>}
              <input
                aria-label="Valor"
                type="number"
                min="0"
                max="9999999999.99"
                step="0.01"
                value={valor}
                disabled={medicaoPublicada}
                onChange={(event) => setValor(event.target.value)}
              />
            </label>
          </div>

          <p className="admin-medicao-rule">
            Antes de salvar, confira o indicador e o período: não é possível cadastrar duas medições do mesmo indicador no mesmo semestre.
          </p>
        </section>

        <div className="admin-medicao-actions">
          <Link to="/admin">Cancelar</Link>
          {!medicaoPublicada && (
            <button type="submit" disabled={salvando}>
              {salvando ? 'Salvando...' : estaEditando ? 'Salvar alterações' : 'Salvar como rascunho'}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default AdminMedicaoFormPage;
