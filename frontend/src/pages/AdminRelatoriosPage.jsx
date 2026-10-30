import { useEffect, useRef, useState } from 'react';
import StatusBadge from '../components/StatusBadge/StatusBadge';
import { CATEGORIAS_RELATORIO } from '../config/relatorios';
import { enviarRelatorio, listarRelatoriosAdmin } from '../services/admin';
import './AdminRelatoriosPage.css';

const LIMITE_PDF = 10 * 1024 * 1024;
const CAMPOS_INICIAIS = {
  titulo: '',
  edicao: '',
  categoria: '',
  data_publicacao: '',
  descricao: '',
};

function validarArquivo(arquivo) {
  if (!arquivo) return 'Selecione um arquivo PDF.';
  if (!arquivo.name.toLowerCase().endsWith('.pdf') || arquivo.type !== 'application/pdf') {
    return 'Selecione um arquivo PDF válido.';
  }
  if (arquivo.size > LIMITE_PDF) return 'O arquivo excede o limite de 10 MiB.';
  return '';
}

function validarCampos(campos) {
  if (!campos.titulo.trim() || !campos.edicao.trim() || !campos.categoria
      || !campos.data_publicacao || !campos.descricao.trim()) {
    return 'Preencha todos os campos obrigatórios.';
  }
  if (campos.titulo.length > 150 || campos.edicao.length > 20 || campos.descricao.length > 500) {
    return 'Confira o limite de caracteres dos campos.';
  }
  if (!CATEGORIAS_RELATORIO.includes(campos.categoria)) return 'Selecione uma categoria válida.';
  const data = new Date(`${campos.data_publicacao}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(campos.data_publicacao)
      || Number.isNaN(data.valueOf()) || data.toISOString().slice(0, 10) !== campos.data_publicacao) {
    return 'Informe uma data de publicação válida.';
  }
  return '';
}

function formatarData(data) {
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

function AdminRelatoriosPage() {
  const [relatorios, setRelatorios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [campos, setCampos] = useState(CAMPOS_INICIAIS);
  const [arquivo, setArquivo] = useState(null);
  const [arrastando, setArrastando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState('');
  const [sucesso, setSucesso] = useState('');
  const arquivoRef = useRef(null);

  useEffect(() => {
    let ativo = true;
    listarRelatoriosAdmin()
      .then((dados) => {
        if (ativo) setRelatorios(dados);
      })
      .catch((erro) => {
        if (ativo) setErroLista(erro.message || 'Não foi possível carregar os relatórios.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => { ativo = false; };
  }, [tentativa]);

  function atualizarCampo(event) {
    const { name, value } = event.target;
    setCampos((atuais) => ({ ...atuais, [name]: value }));
    setErroEnvio('');
    setSucesso('');
  }

  function selecionarArquivo(selecionado) {
    if (!selecionado) return;
    const erro = validarArquivo(selecionado);
    setArquivo(erro ? null : selecionado);
    setErroEnvio(erro);
    setSucesso('');
    if (erro && arquivoRef.current) arquivoRef.current.value = '';
  }

  function limparFormulario() {
    setCampos(CAMPOS_INICIAIS);
    setArquivo(null);
    setErroEnvio('');
    setSucesso('');
    if (arquivoRef.current) arquivoRef.current.value = '';
  }

  async function enviar(event) {
    event.preventDefault();
    setSucesso('');
    const erro = validarCampos(campos) || validarArquivo(arquivo);
    if (erro) {
      setErroEnvio(erro);
      return;
    }

    const formData = new FormData();
    for (const [campo, valor] of Object.entries(campos)) formData.append(campo, valor.trim());
    formData.append('arquivo', arquivo);

    setErroEnvio('');
    setEnviando(true);
    try {
      const novo = await enviarRelatorio(formData);
      setRelatorios((atuais) => [novo, ...atuais]);
      limparFormulario();
      setSucesso('Relatório enviado como rascunho. Ele ainda não aparece no portal público.');
    } catch (falha) {
      setErroEnvio(falha.message || 'Não foi possível enviar o relatório. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="admin-relatorios" aria-labelledby="admin-relatorios-titulo">
      <header className="admin-relatorios__cabecalho">
        <p className="admin-relatorios__eyebrow">Gestão de documentos</p>
        <h1 id="admin-relatorios-titulo">Publicador de Relatórios</h1>
        <p>Cadastre relatórios técnicos em PDF e acompanhe o status de publicação.</p>
      </header>

      <section className="admin-relatorios__painel" aria-labelledby="cadastro-relatorio-titulo">
        <div className="admin-relatorios__painel-cabecalho">
          <h2 id="cadastro-relatorio-titulo">Cadastro de documento oficial</h2>
          <p>Campos com * são obrigatórios. O documento começa como rascunho.</p>
        </div>

        <form onSubmit={enviar} noValidate>
          <label
            className={`admin-relatorios__dropzone${arrastando ? ' admin-relatorios__dropzone--ativo' : ''}`}
            htmlFor="arquivo-relatorio"
            onDragEnter={(event) => { event.preventDefault(); setArrastando(true); }}
            onDragOver={(event) => { event.preventDefault(); setArrastando(true); }}
            onDragLeave={(event) => { event.preventDefault(); setArrastando(false); }}
            onDrop={(event) => {
              event.preventDefault();
              setArrastando(false);
              selecionarArquivo(event.dataTransfer.files[0]);
            }}
          >
            <span className="admin-relatorios__dropzone-icone" aria-hidden="true">PDF</span>
            <strong>Arraste o PDF aqui ou clique para selecionar *</strong>
            <span id="arquivo-relatorio-ajuda">Formato aceito: .pdf, até 10 MiB</span>
            <input
              ref={arquivoRef}
              id="arquivo-relatorio"
              type="file"
              accept=".pdf,application/pdf"
              aria-describedby="arquivo-relatorio-ajuda"
              onChange={(event) => selecionarArquivo(event.target.files[0])}
              disabled={enviando}
            />
          </label>
          {arquivo && (
            <p className="admin-relatorios__arquivo" role="status">
              <strong>{arquivo.name}</strong> · {(arquivo.size / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MiB
              <button type="button" onClick={() => { setArquivo(null); arquivoRef.current.value = ''; }} disabled={enviando}>
                Remover arquivo
              </button>
            </p>
          )}

          <div className="admin-relatorios__campos">
            <label className="admin-relatorios__campo">
              <span>Título do relatório *</span>
              <input name="titulo" type="text" maxLength={150} value={campos.titulo} onChange={atualizarCampo} disabled={enviando} />
            </label>
            <label className="admin-relatorios__campo">
              <span>Edição / Código *</span>
              <input name="edicao" type="text" maxLength={20} value={campos.edicao} onChange={atualizarCampo} disabled={enviando} />
            </label>
            <label className="admin-relatorios__campo">
              <span>Categoria temática *</span>
              <select name="categoria" value={campos.categoria} onChange={atualizarCampo} disabled={enviando}>
                <option value="">Selecione uma categoria</option>
                {CATEGORIAS_RELATORIO.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
              </select>
            </label>
            <label className="admin-relatorios__campo">
              <span>Data de publicação *</span>
              <input name="data_publicacao" type="date" value={campos.data_publicacao} onChange={atualizarCampo} disabled={enviando} />
            </label>
            <label className="admin-relatorios__campo admin-relatorios__campo--inteiro">
              <span>Descrição curta / Resumo executivo *</span>
              <textarea name="descricao" rows={4} maxLength={500} value={campos.descricao} onChange={atualizarCampo} disabled={enviando} aria-describedby="contador-descricao" />
              <small id="contador-descricao">{campos.descricao.length} / 500 caracteres</small>
            </label>
          </div>

          <p className="admin-relatorios__visibilidade">Status inicial: <strong>Rascunho</strong>. A publicação fica disponível em uma etapa separada para administradores.</p>
          {erroEnvio && <p className="admin-relatorios__erro" role="alert">{erroEnvio}</p>}
          {sucesso && <p className="admin-relatorios__sucesso" role="status">{sucesso}</p>}
          <div className="admin-relatorios__acoes">
            <button className="ot-button-secondary" type="button" onClick={limparFormulario} disabled={enviando}>Limpar formulário</button>
            <button className="ot-button-primary" type="submit" disabled={enviando}>{enviando ? 'Enviando relatório...' : 'Enviar relatório'}</button>
          </div>
        </form>
      </section>

      <section className="admin-relatorios__painel" aria-labelledby="lista-relatorios-titulo">
        <div className="admin-relatorios__painel-cabecalho admin-relatorios__painel-cabecalho--lista">
          <h2 id="lista-relatorios-titulo">Relatórios enviados</h2>
          {!carregando && !erroLista && <span>{relatorios.length} {relatorios.length === 1 ? 'relatório' : 'relatórios'}</span>}
        </div>
        {carregando && <p className="admin-relatorios__estado" role="status">Carregando relatórios...</p>}
        {erroLista && (
          <div className="admin-relatorios__estado" role="alert">
            <p>{erroLista}</p>
            <button type="button" onClick={() => { setErroLista(''); setCarregando(true); setTentativa((atual) => atual + 1); }}>Tentar novamente</button>
          </div>
        )}
        {!carregando && !erroLista && relatorios.length === 0 && <p className="admin-relatorios__estado" role="status">Nenhum relatório cadastrado.</p>}
        {!carregando && !erroLista && relatorios.length > 0 && (
          <div className="admin-relatorios__table-wrap">
            <table className="admin-relatorios__table">
              <thead><tr><th scope="col">Relatório</th><th scope="col">Edição</th><th scope="col">Categoria</th><th scope="col">Data</th><th scope="col">Status</th></tr></thead>
              <tbody>
                {relatorios.map((relatorio) => (
                  <tr key={relatorio.id}>
                    <td><strong>{relatorio.titulo}</strong><small>PDF · {relatorio.tamanho_kb} KB</small></td>
                    <td>{relatorio.edicao}</td>
                    <td>{relatorio.categoria}</td>
                    <td>{formatarData(relatorio.data_publicacao)}</td>
                    <td><StatusBadge status={relatorio.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default AdminRelatoriosPage;
