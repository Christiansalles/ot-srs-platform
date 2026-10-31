import { useEffect, useRef, useState } from 'react';
import AdminCabecalho from '../components/AdminCabecalho/AdminCabecalho';
import DialogoConfirmacao from '../components/DialogoConfirmacao/DialogoConfirmacao';
import StatusBadge from '../components/StatusBadge/StatusBadge';
import { CATEGORIAS_RELATORIO } from '../config/relatorios';
import { useAlteracaoStatus } from '../hooks/useAlteracaoStatus';
import { alterarStatusRelatorio, enviarRelatorio, listarRelatoriosAdmin } from '../services/admin';
import { podePublicar } from '../services/auth';
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

// Abaixo de 1 MiB em KB, como a lista; evita "0 MiB" para arquivo pequeno
function formatarTamanho(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MiB`;
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
  const mostrarPublicacao = podePublicar();
  const {
    confirmacao, enviando: alterandoStatus, aviso, avisoRef, abrir, cancelar, confirmar, limparAviso,
  } = useAlteracaoStatus(async ({ relatorio, publicar }) => {
    const atualizado = await alterarStatusRelatorio(relatorio.id, publicar ? 'publicado' : 'rascunho');
    setRelatorios((atuais) => atuais.map((item) => (item.id === relatorio.id ? { ...item, ...atualizado } : item)));
    return `${relatorio.titulo}: ${publicar ? 'publicado no portal' : 'voltou para rascunho'}.`;
  });

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
    limparAviso();
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
    <section className="admin-pagina admin-relatorios" aria-labelledby="admin-relatorios-titulo">
      <AdminCabecalho
        id="admin-relatorios-titulo"
        sobretitulo="Gestão de documentos"
        titulo="Publicador de Relatórios"
        descricao="Cadastre relatórios técnicos em PDF e acompanhe o status de publicação."
      />

      <section className="admin-cartao admin-relatorios__painel" aria-labelledby="cadastro-relatorio-titulo">
        <div className="admin-relatorios__painel-cabecalho">
          <h2 className="admin-cartao__titulo" id="cadastro-relatorio-titulo">Cadastro de documento oficial</h2>
          <p className="admin-cartao__descricao">Campos com * são obrigatórios. O documento começa como rascunho.</p>
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
              <strong>{arquivo.name}</strong> · {formatarTamanho(arquivo.size)}
              <button type="button" onClick={() => { setArquivo(null); arquivoRef.current.value = ''; }} disabled={enviando}>
                Remover arquivo
              </button>
            </p>
          )}

          <div className="admin-relatorios__campos">
            <label className="admin-campo">
              Título do relatório *
              <input name="titulo" type="text" maxLength={150} value={campos.titulo} onChange={atualizarCampo} disabled={enviando} />
            </label>
            <label className="admin-campo">
              Edição / Código *
              <input name="edicao" type="text" maxLength={20} value={campos.edicao} onChange={atualizarCampo} disabled={enviando} />
            </label>
            <label className="admin-campo">
              Categoria temática *
              <select name="categoria" value={campos.categoria} onChange={atualizarCampo} disabled={enviando}>
                <option value="">Selecione uma categoria</option>
                {CATEGORIAS_RELATORIO.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
              </select>
            </label>
            <label className="admin-campo">
              Data de publicação *
              <input name="data_publicacao" type="date" value={campos.data_publicacao} onChange={atualizarCampo} disabled={enviando} />
            </label>
            <label className="admin-campo admin-relatorios__campo--inteiro">
              Descrição curta / Resumo executivo *
              <textarea name="descricao" rows={4} maxLength={500} value={campos.descricao} onChange={atualizarCampo} disabled={enviando} aria-describedby="contador-descricao" />
              <small id="contador-descricao">{campos.descricao.length} / 500 caracteres</small>
            </label>
          </div>

          <p className="admin-nota admin-relatorios__visibilidade">Status inicial: <strong>Rascunho</strong>. A publicação fica disponível em uma etapa separada para administradores.</p>
          {erroEnvio && <p className="admin-mensagem admin-mensagem--erro" role="alert">{erroEnvio}</p>}
          {sucesso && <p className="admin-mensagem admin-mensagem--sucesso" role="status">{sucesso}</p>}
          <div className="admin-acoes admin-relatorios__acoes">
            <button className="admin-botao admin-botao--secundario" type="button" onClick={limparFormulario} disabled={enviando}>Limpar formulário</button>
            <button className="admin-botao admin-botao--primario" type="submit" disabled={enviando}>{enviando ? 'Enviando relatório...' : 'Enviar relatório'}</button>
          </div>
        </form>
      </section>

      <section className="admin-cartao admin-relatorios__painel" aria-labelledby="lista-relatorios-titulo">
        <div className="admin-relatorios__painel-cabecalho admin-relatorios__painel-cabecalho--lista">
          <h2 className="admin-cartao__titulo" id="lista-relatorios-titulo">Relatórios enviados</h2>
          {!carregando && !erroLista && <span>{relatorios.length} {relatorios.length === 1 ? 'relatório' : 'relatórios'}</span>}
        </div>
        {aviso && (
          <p ref={avisoRef} tabIndex={-1} className={`admin-mensagem admin-mensagem--${aviso.tipo}`} role={aviso.tipo === 'erro' ? 'alert' : 'status'}>
            {aviso.texto}
          </p>
        )}
        {carregando && <p className="admin-estado" role="status">Carregando relatórios...</p>}
        {erroLista && (
          <div className="admin-estado admin-estado--erro" role="alert">
            <p>{erroLista}</p>
            <button className="admin-botao-contorno" type="button" onClick={() => { setErroLista(''); setCarregando(true); setTentativa((atual) => atual + 1); }}>Tentar novamente</button>
          </div>
        )}
        {!carregando && !erroLista && relatorios.length === 0 && <p className="admin-estado" role="status">Nenhum relatório cadastrado.</p>}
        {!carregando && !erroLista && relatorios.length > 0 && (
          <div className="admin-tabela-rolagem">
            <table className="admin-tabela admin-relatorios__table">
              <thead><tr><th scope="col">Relatório</th><th scope="col">Edição</th><th scope="col">Categoria</th><th scope="col">Data</th><th scope="col">Status</th>{mostrarPublicacao && <th scope="col"><span className="sr-only">Ações</span></th>}</tr></thead>
              <tbody>
                {relatorios.map((relatorio) => (
                  <tr key={relatorio.id}>
                    <td><strong>{relatorio.titulo}</strong><small>PDF · {relatorio.tamanho_kb} KB</small></td>
                    <td>{relatorio.edicao}</td>
                    <td>{relatorio.categoria}</td>
                    <td>{formatarData(relatorio.data_publicacao)}</td>
                    <td><StatusBadge status={relatorio.status} /></td>
                    {mostrarPublicacao && (
                      <td className="admin-tabela__acoes">
                        <button
                          type="button"
                          aria-label={`${relatorio.status === 'rascunho' ? 'Publicar' : 'Despublicar'} ${relatorio.titulo}`}
                          onClick={() => {
                            setSucesso('');
                            abrir({ relatorio, publicar: relatorio.status === 'rascunho' });
                          }}
                        >
                          {relatorio.status === 'rascunho' ? 'Publicar' : 'Despublicar'}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {confirmacao && (
        <DialogoConfirmacao
          titulo={confirmacao.publicar ? 'Publicar relatório?' : 'Despublicar relatório?'}
          destaque={`${confirmacao.relatorio.titulo} - ${confirmacao.relatorio.edicao}`}
          descricao={confirmacao.publicar
            ? 'Após a publicação, o relatório ficará visível no portal público e disponível para download.'
            : 'Após a despublicação, o relatório deixará de aparecer no portal público e voltará para rascunho.'}
          rotuloConfirmar={confirmacao.publicar ? 'Publicar' : 'Despublicar'}
          enviando={alterandoStatus}
          onConfirmar={confirmar}
          onCancelar={cancelar}
        />
      )}
    </section>
  );
}

export default AdminRelatoriosPage;
