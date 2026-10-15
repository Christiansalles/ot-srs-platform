import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

import { chartPalette } from '../../theme'
import { formatarValor } from '../../utils/formatarValor'

import './GraficoDistribuicaoSetor.css'

const CORES = chartPalette.slice(0, 5)

function corDoSetor(indice) {
  return CORES[indice % CORES.length]
}

function somar(dados) {
  return dados.reduce((soma, item) => soma + item.valor, 0)
}

function GraficoDistribuicaoSetor({
  dados = [],
  ano,
  titulo,
  subtitulo = 'Participação econômica dos setores monitorados',
  nota,
  animar = true,
}) {
  const tituloFinal =
    titulo ?? (ano ? `Distribuição por setor (${ano})` : 'Distribuição por setor')

  return (
    <section
      className="grafico-distribuicao"
      aria-label="Distribuição por setor"
    >
      <header className="grafico-distribuicao__header">
        <h2 className="grafico-distribuicao__title">
          {tituloFinal}
        </h2>

        <p className="grafico-distribuicao__subtitle">
          {subtitulo}
        </p>
      </header>

      {dados.length === 0 ? (
        <div className="grafico-distribuicao__empty">
          Não há dados disponíveis para exibir a distribuição por setor.
        </div>
      ) : (
        <div className="grafico-distribuicao__conteudo">
          <div className="grafico-distribuicao__rosca" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dados}
                  dataKey="valor"
                  nameKey="nome"
                  innerRadius="62%"
                  outerRadius="92%"
                  paddingAngle={2}
                  stroke="none"
                  isAnimationActive={animar}
                >
                  {dados.map((item, indice) => (
                    <Cell key={item.nome} fill={corDoSetor(indice)} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="grafico-distribuicao__centro">
              <strong>{formatarValor(somar(dados), '%')}</strong>
              <span>PARTICIPAÇÃO</span>
            </div>
          </div>

          <ul className="grafico-distribuicao__legenda">
            {dados.map((item, indice) => (
              <li key={item.nome} className="grafico-distribuicao__item">
                <span
                  className="grafico-distribuicao__cor"
                  style={{ backgroundColor: corDoSetor(indice) }}
                  aria-hidden="true"
                />

                <span className="grafico-distribuicao__nome">
                  {item.nome}
                </span>

                <strong className="grafico-distribuicao__valor">
                  {formatarValor(item.valor, '%')}
                </strong>
              </li>
            ))}
          </ul>
        </div>
      )}

      {nota && dados.length > 0 && (
        <p className="grafico-distribuicao__nota">
          {nota}
        </p>
      )}
    </section>
  )
}

export default GraficoDistribuicaoSetor
