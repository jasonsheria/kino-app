import React, { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext'; // Ajustez le chemin si nécessaire
import { Button } from '@mui/material'; // Ou votre composant Button préféré
import GoogleIcon from '@mui/icons-material/Google'; // Pour l'icône Google
import { io } from 'socket.io-client';

// Assurez-vous que GOOGLE_CLIENT_ID est accessible ici aussi
const GOOGLE_CLIENT_ID_PROMPT = process.env.REACT_APP_GOOGLE_CLIENT_ID || "900358554333-g3k99qk3da90po7cc3ajm5cv8oq2dkda.apps.googleusercontent.com";

const GoogleAuthPrompt = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { user, loginWithGoogle, authLoading } = useAuth(); // 'user' au lieu de 'token' pour vérifier la session
  const [promptShown, setPromptShown] = useState(false);

  const handleGoogleSuccess = async (credentialResponse) => {
    if (credentialResponse.credential) {
      try {
        await loginWithGoogle(credentialResponse.credential);
        enqueueSnackbar('Connexion Google réussie !', { variant: 'success' });
        closeSnackbar('google-auth-prompt'); // Ferme la notification persistante
      } catch (error) {
        enqueueSnackbar(error.message || 'Échec de la connexion Google côté serveur.', { variant: 'error' });
      }
    } else {
      enqueueSnackbar('Identifiant Google non reçu.', { variant: 'error' });
    }
  };

  const handleGoogleFailure = (error) => {
    console.error('Google Sign-In Error:', error);
    let message = 'Échec de la connexion avec Google.';
    if (error?.error === 'popup_closed_by_user') {
        message = 'Connexion Google annulée par l\'utilisateur.';
    } else if (error?.error) {
        message = `Erreur Google : ${error.error_description || error.error}`;
    }
    enqueueSnackbar(message, { variant: 'warning' });
  };

  useEffect(() => {
    // Ne pas afficher si l'utilisateur est déjà connecté ou si le chargement initial est en cours
    if (authLoading || user || promptShown) {
        // Si l'utilisateur se connecte, fermer le prompt s'il était affiché
        if (user && promptShown) {
            closeSnackbar('google-auth-prompt');
            setPromptShown(false);
        }
      return;
    }

    // Afficher la notification après un court délai pour ne pas être trop intrusif au chargement
    const timer = setTimeout(() => {
        const key = 'google-auth-prompt';
        enqueueSnackbar(
        (
          <div style={{  padding: '10px' }}>
            Connectez-vous rapidement avec Google !
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleFailure}
              useOneTap={false} // false pour afficher le bouton classique dans la notif
              shape="rectangular"
              theme="outline"
              size="medium"
              logo_alignment="left"
              width="210px" // Ajustez la largeur si nécessaire
              paddingTop="10px"
                paddingBottom="10px"
            />
            <Button size="small" onClick={() => closeSnackbar(key)} style={{ marginLeft: '8px', textTransform: 'none', color: 'white' }}>
              Plus tard
            </Button>
          </div>
        ),
        {
          variant: 'info', // Ou 'default'
          persist: true, // L'utilisateur doit la fermer manuellement ou se connecter
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
          key,
          preventDuplicate: true,
        }
      );
      setPromptShown(true);
      // Ajout d'un timer pour fermer automatiquement la notification après 10 secondes
      setTimeout(() => closeSnackbar(key), 10000);
    }, 2500); // Délai de 2.5 secondes

    return () => clearTimeout(timer);
  }, [user, authLoading, enqueueSnackbar, closeSnackbar, loginWithGoogle, promptShown]);

  useEffect(() => {
    // Notification de déconnexion WebSocket (userLogout)
    const socket = io( process.env.REACT_APP_BACKEND_APP_URL, {
      auth: { token: user?.token },
      autoConnect: !!user,
      transports: ['websocket'],
    });
    socket.on('userLogout', ({ userId }) => {
      if (user && user._id === userId) {
        enqueueSnackbar('Vous avez été déconnecté(e) de la session.', { variant: 'info' });
        // Optionnel: forcer la déconnexion côté front si besoin
      } else {
        // Optionnel: notification si un autre utilisateur se déconnecte
        // enqueueSnackbar(`Utilisateur ${userId} déconnecté.`, { variant: 'default' });
      }
    });
    return () => {
      socket.disconnect();
    };
  }, [user, enqueueSnackbar, closeSnackbar]);

  return null; // Le composant lui-même n'affiche rien, tout passe par notistack
};
export default function GoogleAuthPromptWrapper() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID_PROMPT}>
      <GoogleAuthPrompt />
    </GoogleOAuthProvider>
  );
}