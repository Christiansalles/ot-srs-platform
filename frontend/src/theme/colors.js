/**
 * Identidade visual do OT-SRS.
 * Fonte: mockups/Stitch e proposta visual do projeto.
 */

export const colors = {
  primary: '#0A4AAD',
  secondary: '#6C5CE0',
  accent: '#C750D6',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceMuted: '#F1F5F9',

  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',

  chart: {
    cyan: '#5FE6E0',
    violet: '#6C5CE0',
    sky: '#27B7FD',
    lilac: '#B986ED',
    softLilac: '#F3B8F7',
    yellow: '#FADA77',
  },
};

export const gradients = {
  brand: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 52%, ${colors.accent} 100%)`,
  brandHorizontal: `linear-gradient(90deg, ${colors.primary} 0%, ${colors.secondary} 52%, ${colors.accent} 100%)`,
};

export const chartPalette = Object.values(colors.chart);
