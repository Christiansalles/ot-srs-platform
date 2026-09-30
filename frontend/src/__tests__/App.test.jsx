import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../App'

describe('App', () => {
  it('renderiza a página inicial do OT-SRS', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'OT-SRS' }),
    ).toBeInTheDocument()

    expect(
      screen.getByText(
        'Observatório do Turismo de Santa Rita do Sapucaí',
      ),
    ).toBeInTheDocument()
  })
})