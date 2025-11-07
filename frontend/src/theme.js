import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0B6E4F' },
    secondary: { main: '#3A86FF' },
    background: { default: '#f7f9fb' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].join(','),
    h4: { fontWeight: 800 },
    h6: { fontWeight: 700 },
  },
});

export default theme;


