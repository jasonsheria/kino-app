import React, { useState } from 'react';
import './styles/ColorSystem.css';
import './App.css';
import { ThemeProvider, CssBaseline, IconButton, Tooltip } from '@mui/material';
import { HashRouter } from 'react-router-dom';
import getTheme from './theme';
import AppRoutes from './routes';
import { FaMoon, FaSun } from 'react-icons/fa';
import { startEventSync } from './services/recommendationService';
import { useGlobalCallModal } from './components/common/useGlobalCallModal';
import { AuthProvider } from './contexts/AuthContext';
import NotificationProvider from './contexts/NotificationContext';
import { GoogleOAuthProvider } from '@react-oauth/google'; // Nouvel import
import GoogleAuthPromptInternal from '../src/auth/GoogleAuthPrompt'; // Renommé pour éviter conflit de nom
import { SnackbarProvider, useSnackbar } from 'notistack';
import { MessageProvider } from './contexts/MessageContext';
import { SocketProvider } from './contexts/SocketContext';

function App() {
  // Force le mode à 'light' ou 'dark' uniquement
  const getValidMode = (value) => (value === 'dark' ? 'dark' : 'light');
  const [mode, setMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored !== 'light' && stored !== 'dark') {
        localStorage.setItem('theme', 'light');
        return 'light';
      }
      return stored || 'light';
    }
    return 'light';
  });
  const theme = getTheme(mode);

  // Persiste le mode (toujours 'light' ou 'dark')
  React.useEffect(() => {
    if (mode !== 'light' && mode !== 'dark') {
      localStorage.setItem('theme', 'light');
    } else {
      localStorage.setItem('theme', mode);
    }
  }, [mode]);

  // start background event sync (flush queued events when online)
  React.useEffect(() => {
    try {
      startEventSync();
    } catch (e) { console.error('ndaku: startEventSync', e); }
    return () => {
      try { /* no-op: sync will stop on page unload */ } catch (e) { }
    };
  }, []);

  // Listen for property load errors dispatched by fakedata module
  // We register the event handler inside a child component that has access to notistack's hook

  // Global call modal integration
  const { CallModal } = useGlobalCallModal();
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "900358554333-g3k99qk3da90po7cc3ajm5cv8oq2dkda.apps.googleusercontent.com";

  return (
    <AuthProvider>
      <SocketProvider>
        <MessageProvider>
          <NotificationProvider>
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}>
                {/* local component that can use useSnackbar (must be rendered under SnackbarProvider) */}
                <InnerNotifier />
                <ThemeProvider theme={theme}>
                  <CssBaseline />
                  <Tooltip title={mode === 'dark' ? 'Mode clair' : 'Mode sombre'}>
                    <IconButton
                      onClick={() => setMode(prev => getValidMode(prev === 'dark' ? 'light' : 'dark'))}
                      style={{
                        position: 'fixed',
                        bottom: 17,
                        right: 71,
                        zIndex: 9999,
                        background: theme.palette.background.paper,
                        color: "white",
                        borderRadius: '50%',
                        width: 48,
                        height: 48,
                        boxShadow: '0 2px 8px var(--ndaku-primary-22)',
                        transition: 'background 0.3s, color 0.3s',
                      }}
                      aria-label="Changer le mode de couleur"
                    >
                      {mode === 'dark' ? <FaSun size={22} /> : <FaMoon size={22} />}
                    </IconButton>
                  </Tooltip>
                  <HashRouter>
                    <AppRoutes />
                  </HashRouter>
                  <CallModal />
                </ThemeProvider>
              </SnackbarProvider>
            </GoogleOAuthProvider>
          </NotificationProvider>
        </MessageProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;

// InnerNotifier: a tiny component rendered under SnackbarProvider so we can display
// global notifications from window events (e.g. ndaku:properties-error).
function InnerNotifier() {
  const { enqueueSnackbar } = useSnackbar();
  try {
    React.useEffect(() => {
      const onErr = (e) => {
        try {
          const msg = (e && e.detail && e.detail.message) ? e.detail.message : 'Impossible de charger les biens depuis le serveur.';
          enqueueSnackbar(msg, { variant: 'error', autoHideDuration: 7000 });
        } catch (err) { console.error('ndaku:properties-error handler', err); }
      };
      window.addEventListener('ndaku:properties-error', onErr);
      return () => window.removeEventListener('ndaku:properties-error', onErr);
    }, [enqueueSnackbar]);
  } catch (err) {
    // If hook cannot be used for any reason, no-op
  }
  return null;
}
