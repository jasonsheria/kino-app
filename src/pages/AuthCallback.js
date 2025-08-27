import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

export default function AuthCallback() {
    const navigate = useNavigate();
    const location = useLocation();
    const { loginWithGoogle } = useAuth();
    const [error, setError] = React.useState(null);
    const from = location.state?.from?.pathname || '/dashboard';

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        
        if (error) {
            setError(`Google OAuth error: ${error}`);
            return;
        }
        
        if (!code) {
            setError('Code d\'autorisation manquant.');
            return;
        }

        const codeVerifier = localStorage.getItem('ndaku_pkce_code_verifier');
        if (!codeVerifier) {
            setError('Code verifier manquant. Veuillez réessayer.');
            return;
        }

        async function doExchange() {
            try {
                const redirect_uri = process.env.REACT_APP_GOOGLE_REDIRECT_URI || `${window.location.origin}/auth/callback`;
                const response = await authService.exchangeGoogleCode(code, codeVerifier, redirect_uri);
                
                if (response.accessToken) {
                    await loginWithGoogle(response.accessToken);
                    localStorage.removeItem('ndaku_pkce_code_verifier'); // Clean up
                    navigate(from, { replace: true });
                } else {
                    setError('Réponse invalide du serveur après l\'échange du code.');
                }
            } catch (e) {
                console.error(e);
                setError(e.message || String(e));
            }
        }
        doExchange();
    }, [loginWithGoogle, navigate, from]);

    if (error) return <div className="container py-5"><h3>Erreur d'authentification</h3><p>{error}</p></div>;
    return <div className="container py-5"><h3>Connexion en cours...</h3><p>Merci de patienter, nous vous redirigeons.</p></div>;
}
