import { useEffect, useRef, useState } from 'react';
import AdminCabecalho from '../components/AdminCabecalho/AdminCabecalho';
import DialogoConfirmacao from '../components/DialogoConfirmacao/DialogoConfirmacao';
import { atualizarUsuario, criarUsuario, getUsuarios } from '../services/admin';
import { getUsuarioLogado } from '../services/auth';
import { useTituloDaPagina } from '../hooks/useTituloDaPagina';
import './AdminUsuariosPage.css';

const NOVO_USUARIO = { nome: '', email: '', senha: '', perfil: 'editor' };
const PERFIS = { administrador: 'Administrador', editor: 'Editor' };

function ordenarUsuarios(usuarios) {
  return [...usuarios].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR') || a.id - b.id);
}

function AdminUsuariosPage() {
  useTituloDaPagina('Usuários · Painel administrativo');

  const [usuarios, setUsuarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLista, setErroLista] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [novo, setNovo] = useState(NOVO_USUARIO);
  const [criando, setCriando] = useState(false);
  const [edicao, setEdicao] = useState(null);
  const [aberturaEdicao, setAberturaEdicao] = useState(0);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [confirmacao, setConfirmacao] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [avisoEdicao, setAvisoEdicao] = useState('');
  const cartaoEdicaoRef = useRef(null);
  const campoEdicaoRef = useRef(null);
  const botaoEdicaoRef = useRef(null);
  const avisoRef = useRef(null);
  const avisoEdicaoRef = useRef(null);
  const usuarioLogado = getUsuarioLogado();

  useEffect(() => {
    if (!aberturaEdicao) return;
    cartaoEdicaoRef.current?.scrollIntoView?.({ block: 'start', behavior: 'instant' });
    campoEdicaoRef.current?.focus({ preventScroll: true });
  }, [aberturaEdicao]);

  useEffect(() => {
    if (!aviso) return;
    avisoRef.current?.focus({ preventScroll: true });
    avisoRef.current?.scrollIntoView?.({ block: 'center', behavior: 'instant' });
  }, [aviso]);

  useEffect(() => {
    if (!avisoEdicao) return;
    avisoEdicaoRef.current?.focus({ preventScroll: true });
    avisoEdicaoRef.current?.scrollIntoView?.({ block: 'center', behavior: 'instant' });
  }, [avisoEdicao]);

  useEffect(() => {
    let ativo = true;
    getUsuarios()
      .then((lista) => {
        if (ativo) setUsuarios(ordenarUsuarios(lista));
      })
      .catch(() => {
        if (ativo) setErroLista('Não foi possível carregar os usuários. Tente novamente.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => { ativo = false; };
  }, [tentativa]);

  function atualizarNaLista(usuario) {
    setUsuarios((atuais) => ordenarUsuarios(atuais.map((item) => (item.id === usuario.id ? usuario : item))));
  }

  async function cadastrar(evento) {
    evento.preventDefault();
    setAviso(null);
    setCriando(true);
    try {
      const criado = await criarUsuario({ ...novo, nome: novo.nome.trim(), email: novo.email.trim() });
      setUsuarios((atuais) => ordenarUsuarios([...atuais, criado]));
      setNovo(NOVO_USUARIO);
      setAviso({ tipo: 'sucesso', texto: `Usuário ${criado.nome} criado com sucesso.` });
    } catch (erro) {
      setAviso({ tipo: 'erro', texto: erro.message || 'Não foi possível criar o usuário.' });
    } finally {
      setCriando(false);
    }
  }

  function iniciarEdicao(usuario, tipo, botao) {
    botaoEdicaoRef.current = botao;
    setAviso(null);
    setAvisoEdicao('');
    setEdicao({ usuario, tipo, valor: tipo === 'perfil' ? usuario.perfil : '' });
    setAberturaEdicao((atual) => atual + 1);
  }

  function cancelarEdicao() {
    setEdicao(null);
    botaoEdicaoRef.current?.focus();
  }

  async function salvarEdicao(evento) {
    evento.preventDefault();
    if (!edicao) return;
    setAvisoEdicao('');
    setSalvandoEdicao(true);
    try {
      const dados = { [edicao.tipo]: edicao.valor };
      const atualizado = await atualizarUsuario(edicao.usuario.id, dados);
      atualizarNaLista(atualizado);
      setEdicao(null);
      setAviso({ tipo: 'sucesso', texto: edicao.tipo === 'perfil'
        ? `Perfil de ${atualizado.nome} atualizado com sucesso.`
        : `Senha de ${atualizado.nome} redefinida com sucesso.` });
    } catch (erro) {
      setAvisoEdicao(erro.message || 'Não foi possível atualizar o usuário.');
    } finally {
      setSalvandoEdicao(false);
    }
  }

  async function confirmarSituacao() {
    if (!confirmacao) return;
    setConfirmando(true);
    setAviso(null);
    try {
      const atualizado = await atualizarUsuario(confirmacao.usuario.id, { ativo: confirmacao.ativar });
      atualizarNaLista(atualizado);
      setAviso({ tipo: 'sucesso', texto: `${atualizado.nome} ${confirmacao.ativar ? 'reativado' : 'desativado'} com sucesso.` });
    } catch (erro) {
      setAviso({ tipo: 'erro', texto: erro.message || 'Não foi possível alterar a situação do usuário.' });
    } finally {
      setConfirmacao(null);
      setConfirmando(false);
    }
  }

  return (
    <section className="admin-pagina admin-usuarios" aria-labelledby="admin-usuarios-titulo">
      <AdminCabecalho
        id="admin-usuarios-titulo"
        sobretitulo="Acesso administrativo"
        titulo="Usuários"
        descricao="Cadastre a equipe e gerencie quem pode acessar o painel."
      />

      {aviso && (
        <p ref={avisoRef} tabIndex={-1} className={`admin-mensagem admin-mensagem--${aviso.tipo}`} role={aviso.tipo === 'erro' ? 'alert' : 'status'}>
          {aviso.texto}
        </p>
      )}

      <section className="admin-cartao admin-usuarios__cartao" aria-labelledby="novo-usuario-titulo">
        <div className="admin-usuarios__cartao-cabecalho">
          <h2 className="admin-cartao__titulo" id="novo-usuario-titulo">Novo usuário</h2>
          <p className="admin-cartao__descricao">O acesso começa ativo. A senha precisa ter pelo menos 8 caracteres.</p>
        </div>
        <form className="admin-usuarios__form" onSubmit={cadastrar}>
          <div className="admin-usuarios__campos">
            <label className="admin-campo">Nome
              <input autoComplete="name" maxLength={80} onChange={(evento) => setNovo({ ...novo, nome: evento.target.value })} required value={novo.nome} />
            </label>
            <label className="admin-campo">E-mail
              <input autoComplete="email" maxLength={120} onChange={(evento) => setNovo({ ...novo, email: evento.target.value })} required type="email" value={novo.email} />
            </label>
            <label className="admin-campo">Senha inicial
              <input autoComplete="new-password" minLength={8} onChange={(evento) => setNovo({ ...novo, senha: evento.target.value })} required type="password" value={novo.senha} />
            </label>
            <label className="admin-campo">Perfil
              <select onChange={(evento) => setNovo({ ...novo, perfil: evento.target.value })} value={novo.perfil}>
                <option value="editor">Editor</option>
                <option value="administrador">Administrador</option>
              </select>
            </label>
          </div>
          <div className="admin-acoes admin-usuarios__acoes">
            <button className="admin-botao admin-botao--primario" disabled={criando} type="submit">{criando ? 'Cadastrando...' : 'Criar usuário'}</button>
          </div>
        </form>
      </section>

      <section className="admin-cartao admin-usuarios__cartao" aria-labelledby="lista-usuarios-titulo">
        <div className="admin-usuarios__cartao-cabecalho">
          <h2 className="admin-cartao__titulo" id="lista-usuarios-titulo">Equipe cadastrada</h2>
          <p className="admin-cartao__descricao">Desativar corta o acesso e preserva o histórico de quem lançou os dados.</p>
        </div>
        {carregando && <p className="admin-estado" role="status">Carregando usuários...</p>}
        {erroLista && (
          <div className="admin-estado admin-estado--erro" role="alert">
            <p>{erroLista}</p>
            <button className="admin-botao-contorno" onClick={() => { setErroLista(''); setCarregando(true); setTentativa((valor) => valor + 1); }} type="button">Tentar novamente</button>
          </div>
        )}
        {!carregando && !erroLista && usuarios.length === 0 && <p className="admin-estado" role="status">Nenhum usuário cadastrado.</p>}
        {!carregando && !erroLista && usuarios.length > 0 && (
          <div className="admin-tabela-rolagem">
            <table className="admin-tabela admin-usuarios__tabela">
              <thead><tr><th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">Perfil</th><th scope="col">Situação</th><th scope="col"><span className="sr-only">Ações</span></th></tr></thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td><strong>{usuario.nome}</strong>{usuario.id === usuarioLogado?.id && <small>Sua conta</small>}</td>
                    <td>{usuario.email}</td>
                    <td>{PERFIS[usuario.perfil] || usuario.perfil}</td>
                    <td><span className={`admin-usuarios__situacao admin-usuarios__situacao--${usuario.ativo ? 'ativo' : 'inativo'}`}>{usuario.ativo ? 'Ativo' : 'Inativo'}</span></td>
                    <td className="admin-tabela__acoes">
                      <button aria-label={`Alterar perfil de ${usuario.nome}`} onClick={(evento) => iniciarEdicao(usuario, 'perfil', evento.currentTarget)} type="button">Alterar perfil</button>
                      <button aria-label={`Redefinir senha de ${usuario.nome}`} onClick={(evento) => iniciarEdicao(usuario, 'senha', evento.currentTarget)} type="button">Redefinir senha</button>
                      <button
                        aria-label={`${usuario.ativo ? 'Desativar' : 'Reativar'} ${usuario.nome}`}
                        disabled={usuario.ativo && usuario.id === usuarioLogado?.id}
                        onClick={() => { setAviso(null); setConfirmacao({ usuario, ativar: !usuario.ativo }); }}
                        type="button"
                      >
                        {usuario.ativo ? 'Desativar' : 'Reativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {edicao && (
        <section ref={cartaoEdicaoRef} tabIndex={-1} className="admin-cartao admin-usuarios__cartao admin-usuarios__edicao" aria-labelledby="editar-usuario-titulo">
          <div className="admin-usuarios__cartao-cabecalho">
            <h2 className="admin-cartao__titulo" id="editar-usuario-titulo">{edicao.tipo === 'perfil' ? 'Alterar perfil' : 'Redefinir senha'} de {edicao.usuario.nome}</h2>
            <p className="admin-cartao__descricao">{edicao.tipo === 'senha' ? 'A senha nova precisa ter pelo menos 8 caracteres.' : 'A alteração de perfil vale na próxima requisição.'}</p>
          </div>
          <form className="admin-usuarios__form admin-usuarios__form--edicao" onSubmit={salvarEdicao}>
            {avisoEdicao && <p ref={avisoEdicaoRef} tabIndex={-1} className="admin-mensagem admin-mensagem--erro" role="alert">{avisoEdicao}</p>}
            {edicao.tipo === 'perfil' ? (
              <label className="admin-campo">Novo perfil
                <select ref={campoEdicaoRef} onChange={(evento) => setEdicao({ ...edicao, valor: evento.target.value })} value={edicao.valor}>
                  <option value="editor">Editor</option>
                  <option value="administrador">Administrador</option>
                </select>
              </label>
            ) : (
              <label className="admin-campo">Nova senha
                <input ref={campoEdicaoRef} autoComplete="new-password" minLength={8} onChange={(evento) => setEdicao({ ...edicao, valor: evento.target.value })} required type="password" value={edicao.valor} />
              </label>
            )}
            <div className="admin-acoes admin-usuarios__acoes">
              <button className="admin-botao admin-botao--secundario" disabled={salvandoEdicao} onClick={cancelarEdicao} type="button">Cancelar</button>
              <button className="admin-botao admin-botao--primario" disabled={salvandoEdicao} type="submit">{salvandoEdicao ? 'Salvando...' : edicao.tipo === 'perfil' ? 'Salvar perfil' : 'Salvar nova senha'}</button>
            </div>
          </form>
        </section>
      )}

      {confirmacao && (
        <DialogoConfirmacao
          titulo={`${confirmacao.ativar ? 'Reativar' : 'Desativar'} usuário?`}
          destaque={confirmacao.usuario.nome}
          descricao={confirmacao.ativar ? ' voltará a acessar o painel.' : ' perderá o acesso ao painel, mas seu histórico será preservado.'}
          rotuloConfirmar={confirmacao.ativar ? 'Reativar usuário' : 'Desativar usuário'}
          enviando={confirmando}
          onConfirmar={confirmarSituacao}
          onCancelar={() => setConfirmacao(null)}
        />
      )}
    </section>
  );
}

export default AdminUsuariosPage;
