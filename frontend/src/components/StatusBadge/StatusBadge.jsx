import './StatusBadge.css'

// Status de medições e relatórios definidos no contrato do M6
const STATUS = {
  rascunho: 'Rascunho',
  publicado: 'Publicado',
}

function StatusBadge({ status }) {
  const conhecido = Object.hasOwn(STATUS, status)
  const variante = conhecido ? status : 'desconhecido'

  return (
    <span className={`status-badge status-badge--${variante}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {conhecido ? STATUS[status] : status}
    </span>
  )
}

export default StatusBadge
