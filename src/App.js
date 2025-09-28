

import React, { useState } from 'react';
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
import { SnackbarProvider } from 'notistack';
import { showToast } from './components/common/ToastManager';
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
  React.useEffect(() => {
    const onErr = (e) => {
      try {
        const msg = (e && e.detail && e.detail.message) ? e.detail.message : 'Impossible de charger les biens depuis le serveur.';
        showToast(msg, 'error', 7000);
      } catch (err) { console.error('ndaku:properties-error handler', err); }
    };
    window.addEventListener('ndaku:properties-error', onErr);
    return () => window.removeEventListener('ndaku:properties-error', onErr);
  }, []);

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
                <ThemeProvider theme={theme}>
                  <CssBaseline />
                  <Tooltip title={mode === 'dark' ? 'Mode clair' : 'Mode sombre'}>
                    <IconButton
                      onClick={() => setMode(prev => getValidMode(prev === 'dark' ? 'light' : 'dark'))}
                      style={{
                        position: 'fixed',
                        bottom: 13,
                        right: 64,
                        zIndex: 9999,
                        background: theme.palette.background.paper,
                        color: theme.palette.text.primary,
                        border: '2px solid var(--ndaku-primary)',
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
                  {/* Global Call Modal (always present) */}
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
