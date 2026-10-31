import './AdminCabecalho.css';

// Cabeçalho de toda página do painel: sobretítulo, título (h1), descrição e uma ação opcional à direita
function AdminCabecalho({ id, sobretitulo, titulo, descricao, children }) {
  return (
    <div className="admin-cabecalho">
      <div>
        <p className="admin-cabecalho__sobretitulo">{sobretitulo}</p>
        <h1 id={id}>{titulo}</h1>
        {descricao && <p className="admin-cabecalho__descricao">{descricao}</p>}
      </div>
      {children}
    </div>
  );
}

export default AdminCabecalho;
