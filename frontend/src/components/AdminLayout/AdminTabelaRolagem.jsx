export default function AdminTabelaRolagem({ rotulo, children }) {
  return (
    <>
      <p className="admin-tabela-dica">Deslize na horizontal para ver as demais colunas.</p>
      <div className="admin-tabela-rolagem" role="region" aria-label={rotulo} tabIndex={0}>
        {children}
      </div>
    </>
  );
}
