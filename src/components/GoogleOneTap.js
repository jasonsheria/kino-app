import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const GoogleOneTap = () => {
    const { loginWithGoogle, isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) return; // Ne pas afficher si l'utilisateur est déjà connecté

        // Initialiser Google One Tap
        const initGoogleOneTap = () => {
            if (!window.google || isAuthenticated) return;

            window.google.accounts.id.initialize({
                client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
                callback: async (response) => {
                    if (response.credential) {
                        try {
                            await loginWithGoogle(response.credential);
                            if (window.enqueueSnackbar) {
                                window.enqueueSnackbar('Connexion réussie!', { variant: 'success' });
                            }
                        } catch (error) {
                            console.error('Erreur de connexion Google:', error);
                            if (window.enqueueSnackbar) {
                                window.enqueueSnackbar('Erreur de connexion avec Google', { variant: 'error' });
                            }
                        }
                    }
                },
                auto_select: true, // Permet la sélection automatique si un seul compte est disponible
            });

            // Afficher le bouton One Tap
            window.google.accounts.id.prompt((notification) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    console.log('One Tap non affiché:', notification.getNotDisplayedReason() || notification.getSkippedReason());
                }
            });
        };

        // Charger le script Google
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = initGoogleOneTap;
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        return () => {
            // Cleanup
            if (window.google?.accounts?.id) {
                window.google.accounts.id.cancel();
            }
            document.body.removeChild(script);
        };
    }, [isAuthenticated, loginWithGoogle]);

    if (isAuthenticated) return null;

    return (
        <div
            id="g_id_onload"
            style={{
                position: 'fixed',
                top: '32px',
                right: '32px',
                zIndex: 1000,
            }}
            data-auto_prompt="false"
        />
    );
};

export default GoogleOneTap;
