import { render, screen } from '@testing-library/react'
import App from '../App'

describe('App', () => {
  it('renderiza a página inicial', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: 'Get started' }),
    ).toBeInTheDocument()
  })
})
