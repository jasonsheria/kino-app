// Thème Material UI personnalisé
import { createTheme } from '@mui/material/styles';
import colors from './components/common/colors';

const getTheme = (mode = 'light') =>
  createTheme({
    palette: {
      mode,
      primary: colors.primary,
      secondary: colors.secondary,
      background: {
        default: mode === 'light' ? colors.background.default : colors.background.dark,
        paper: colors.background.paper,
      },
      text: {
        primary: mode === 'light' ? colors.text.primary : colors.text.light,
        secondary: colors.text.secondary,
      },
    },
    typography: {
      fontFamily: 'Inter, Arial, Helvetica, sans-serif',
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
    },
  });

export default getTheme;
