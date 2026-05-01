// Verity brand tokens — single source for hex values.
// Mirrored as CSS custom properties in globals.css; import the TS values
// when you need them inline (e.g., for dynamic style or canvas/sharp work).

export const brand = {
  gradient: {
    start: '#FFE6E6', // warm blush, upper-left
    mid: '#F4D2FF',   // lilac, upper
    end: '#C2DDFF',   // azure, right
    warm: '#FFCB9A',  // soft orange, lower-left accent
  },
  chassis: {
    cream: '#FFFDF3',
    creamWarm: '#F5F1D6',
    shadow: 'rgba(67, 56, 202, 0.12)',
  },
  glass: {
    fill: 'rgba(255, 253, 243, 0.55)',
    fillStrong: 'rgba(255, 253, 243, 0.78)',
    fillSoft: 'rgba(255, 253, 243, 0.35)',
    border: 'rgba(255, 255, 255, 0.6)',
    borderInk: 'rgba(22, 39, 44, 0.08)',
    blur: '20px',
  },
  ink: '#16272C',
  inkSoft: '#4A5560',
  inkMuted: '#8A95A0',
  accent: {
    coral: '#FF6B5C',
    coralDark: '#E85544',
    olive: '#90B34D',
    oliveDark: '#6F8E37',
    darkTeal: '#16272C',
    avaxRed: '#E84142', // deferred — reserved for AVAX co-branding
  },
} as const;

// Convenience: full gradient backdrop string.
export const verityGradient =
  'radial-gradient(ellipse 80% 60% at 15% 95%, ' + brand.gradient.warm + ' 0%, transparent 55%), ' +
  'linear-gradient(135deg, ' + brand.gradient.start + ' 0%, ' + brand.gradient.mid + ' 45%, ' + brand.gradient.end + ' 100%)';
