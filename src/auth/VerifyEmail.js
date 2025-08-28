import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function VerifyEmail() {
  const [message, setMessage] = useState("Vérification en cours...");
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
      axios
        .get(`${process.env.REACT_APP_BACKEND_APP_URL}/auth/api/verify-email?token=${token}`)
        .then((res) => {
          setMessage(res.data.message || "Votre email a été vérifié !");
          setSuccess(true);
          setLoading(false);
          setTimeout(() => {
            navigate("/login");
          }, 2500); // 2.5s pour lire le message
        })
        .catch((err) => {
          setMessage(
            err.response?.data?.message ||
              "Erreur lors de la vérification du compte."
          );
          setSuccess(false);
          setLoading(false);
        });
    } else {
      setMessage("Lien de vérification invalide.");
      setSuccess(false);
      setLoading(false);
    }
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
          padding: "40px 24px",
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          {loading ? (
            <span style={{ display: "inline-block", marginBottom: 16 }}>
              <svg width="48" height="48" viewBox="0 0 48 48">
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="4"
                  strokeDasharray="100"
                  strokeDashoffset="60"
                  strokeLinecap="round"
                  style={{ animation: "spin 1s linear infinite" }}
                />
                <style>
                  {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
                </style>
              </svg>
            </span>
          ) : (
            <span
              style={{
                fontSize: 48,
                color: success ? "#22c55e" : "#ef4444",
              }}
            >
              {success ? "✅" : "❌"}
            </span>
          )}
        </div>
        <h2
          style={{
            fontWeight: 700,
            fontSize: 24,
            marginBottom: 16,
            color: "#1e293b",
          }}
        >
          Vérification de l'email
        </h2>
        <p
          style={{
            fontSize: 16,
            color: success ? "#22c55e" : "#ef4444",
            marginBottom: 0,
          }}
        >
          {message}
        </p>
        {!loading && success && (
          <p
            style={{
              fontSize: 14,
              color: "#64748b",
              marginTop: 16,
            }}
          >
            Redirection vers la page de connexion...
          </p>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;