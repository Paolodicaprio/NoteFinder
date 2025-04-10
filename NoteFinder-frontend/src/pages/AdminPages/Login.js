import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authService from "../../services/authService";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Fonction pour valider l'email
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
  
    // Validation côté client pour l'email
    if (!validateEmail(email)) {
      setError("Veuillez entrer une adresse email valide.");
      return;
    }
  
    try {
      console.log("Tentative de connexion avec l'email :", email);
      console.log("Mot de passe envoyé :", password);  // Debugging
      const response = await authService.login(email, password);
      console.log("Réponse du serveur :", response);
  
      if (response.success) {
        navigate("/dashboard");
      } else {
        setError(response.message || "Identifiants incorrects");
      }
    } catch (err) {
      console.error("Erreur lors de la connexion :", err);
      console.error("Détails de l'erreur :", err.response);
  
      if (err.response && err.response.status === 400) {
        setError("Email et mot de passe requis");
      } else if (err.response && err.response.status === 401) {
        setError("Identifiants incorrects");
      } else {
        setError("Échec de la connexion. Vérifiez vos identifiants.");
      }
    }
};

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#f3f4f6",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "28rem",
          padding: "1.5rem",
          backgroundColor: "#ffffff",
          borderRadius: "0.5rem",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: "600",
            textAlign: "center",
            color: "#374151",
          }}
        >
          Connexion
        </h2>
        {error && (
          <p style={{ color: "#ef4444", textAlign: "center" }}>{error}</p>
        )}
        <form onSubmit={handleLogin} style={{ marginTop: "1rem" }}>
          <div style={{ marginBottom: "1rem", position: "relative" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                marginBottom: "0.5rem",
                color: "#374151",
              }}
              htmlFor="email"
            >
              Email
            </label>
            <input
              type="email"
              placeholder="Entrez votre email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              id="email"
              required
              style={{
                border: "1px solid #d1d5db",
                padding: "0.5rem",
                borderRadius: "0.375rem",
                width: "100%",
                paddingLeft: "0.5rem",
                outline: "none",
                focus: { ring: "2px solid #4f46e5" },
              }}
            />
          </div>
          <div style={{ marginBottom: "1rem", position: "relative" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: "500",
                marginBottom: "0.5rem",
                color: "#374151",
              }}
              htmlFor="password"
            >
              Mot de passe
            </label>
            <input
              type="password"
              placeholder="Entrez votre mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              id="password"
              required
              style={{
                border: "1px solid #d1d5db",
                padding: "0.5rem",
                borderRadius: "0.375rem",
                width: "100%",
                paddingLeft: "0.5rem",
                outline: "none",
                focus: { ring: "2px solid #4f46e5" },
              }}
            />
          </div>
          <button
            type="submit"
            style={{
              width: "100%",
              padding: "0.5rem 1rem",
              marginTop: "1rem",
              fontWeight: "600",
              color: "#ffffff",
              backgroundColor: "#4f46e5",
              borderRadius: "0.5rem",
              hover: { backgroundColor: "#4338ca" },
            }}
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;