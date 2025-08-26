// Palette de couleurs réutilisable pour le thème
// Harmonized with owner styles (accent: --ndaku-primary)
// NOTE: MUI utilities require concrete color formats (hex/rgb) rather than CSS variables.
// Expose both a hex value for MUI and the CSS variable string for pure-CSS usage.
const CSS_PRIMARY = 'var(--ndaku-primary)';
const PRIMARY_HEX = '#13c296';
const PRIMARY_LIGHT_APPROX = '#eaf9f4'; // visual approximation of rgba(19,194,150,0.08)
const colors = {
  primary: {
    // Hex values for MUI (safe for alpha() and other color helpers)
    main: PRIMARY_HEX,
    light: PRIMARY_LIGHT_APPROX,
    dark: '#0ea078',
    contrastText: '#ffffff',
    // Keep the CSS variable available to components that render inline styles
    cssVar: CSS_PRIMARY,
  },
  secondary: {
    main: '#1976d2', // complementary blue for accents
    light: '#63a4ff',
    dark: '#004ba0',
    contrastText: '#ffffff',
  },
  background: {
    default: '#ffffff',
    paper: '#ffffff',
    dark: '#0b1220',
  },
  text: {
    primary: '#222222',
    secondary: '#666666',
    light: '#ffffff',
  },
};

export default colors;
