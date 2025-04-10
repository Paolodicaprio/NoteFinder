import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import authService from '../../services/authService'; 

const Register = () => {
    const [formData, setFormData] = useState({
        prenom: '',
        nom: '',
        email: '',
        password: '',
        role: 'Admin',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // Utiliser authService pour l'inscription
            const result = await authService.register(formData);

            if (result.success) {
                setSuccess('Compte créé avec succès !');
                setTimeout(() => {
                    navigate('/login'); // Rediriger vers la page de connexion après succès
                }, 2000);
            } else {
                setError(result.message || 'Erreur lors de la création du compte');
            }
        } catch (err) {
            setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    // Styles en ligne
    const containerStyle = {
        backgroundColor: '#f3f4f6',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    };

    const formContainerStyle = {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '0.375rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        width: '24rem',
    };

    const titleStyle = {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        textAlign: 'center',
    };

    const inputContainerStyle = {
        marginBottom: '1rem',
        position: 'relative',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.875rem',
        fontWeight: '500',
        marginBottom: '0.5rem',
    };

    const inputStyle = {
        border: '1px solid #d1d5db',
        padding: '0.5rem',
        borderRadius: '0.375rem',
        width: '100%',
        paddingLeft: '2.5rem',
        outline: 'none',
    };

    const iconStyle = {
        position: 'absolute',
        left: '0.75rem',
        top: '2.5rem',
        color: '#4f46e5',
    };

    const buttonStyle = {
        backgroundColor: '#4f46e5',
        color: 'white',
        padding: '0.5rem',
        borderRadius: '0.375rem',
        width: '100%',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    };

    const buttonHoverStyle = {
        backgroundColor: '#4338ca',
    };

    const linkStyle = {
        color: '#4f46e5',
        textDecoration: 'none',
    };

    const linkHoverStyle = {
        textDecoration: 'underline',
    };

    const errorStyle = {
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        color: '#dc2626',
        padding: '1rem',
        borderRadius: '0.375rem',
        marginBottom: '1rem',
    };

    const successStyle = {
        backgroundColor: '#f0fdf4',
        border: '1px solid #bbf7d0',
        color: '#16a34a',
        padding: '1rem',
        borderRadius: '0.375rem',
        marginBottom: '1rem',
    };

    return (
        <div style={containerStyle}>
            <div style={formContainerStyle}>
                <h1 style={titleStyle}>Créer un Compte</h1>

                {/* Affichage des messages d'erreur ou de succès */}
                {error && (
                    <div style={errorStyle}>
                        <strong>{error}</strong>
                    </div>
                )}
                {success && (
                    <div style={successStyle}>
                        <strong>{success}</strong>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* Champ Prénom */}
                    <div style={inputContainerStyle}>
                        <label style={labelStyle} htmlFor="prenom">
                            Prénom
                        </label>
                        <FontAwesomeIcon icon={faUser} style={iconStyle} />
                        <input
                            type="text"
                            placeholder="Entrez votre prénom"
                            name="prenom"
                            id="prenom"
                            value={formData.prenom}
                            onChange={handleChange}
                            required
                            style={inputStyle}
                        />
                    </div>

                    {/* Champ Nom */}
                    <div style={inputContainerStyle}>
                        <label style={labelStyle} htmlFor="nom">
                            Nom
                        </label>
                        <FontAwesomeIcon icon={faUser} style={iconStyle} />
                        <input
                            type="text"
                            placeholder="Entrez votre nom"
                            name="nom"
                            id="nom"
                            value={formData.nom}
                            onChange={handleChange}
                            required
                            style={inputStyle}
                        />
                    </div>

                    {/* Champ Email */}
                    <div style={inputContainerStyle}>
                        <label style={labelStyle} htmlFor="email">
                            Email
                        </label>
                        <FontAwesomeIcon icon={faEnvelope} style={iconStyle} />
                        <input
                            type="email"
                            placeholder="Entrez votre email"
                            name="email"
                            id="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            style={inputStyle}
                        />
                    </div>

                    {/* Champ Mot de passe */}
                    <div style={inputContainerStyle}>
                        <label style={labelStyle} htmlFor="password">
                            Mot de passe
                        </label>
                        <FontAwesomeIcon icon={faLock} style={iconStyle} />
                        <input
                            type="password"
                            placeholder="Entrez votre mot de passe"
                            name="password"
                            id="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            style={inputStyle}
                        />
                    </div>

                    {/* Champ Rôle */}
                    <div style={inputContainerStyle}>
                        <label style={labelStyle} htmlFor="role">
                            Rôle
                        </label>
                        <select
                            name="role"
                            id="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            style={inputStyle}
                        >
                            <option value="Admin">Admin</option>
                            <option value="Enseignant">Enseignant</option>
                            <option value="Secrétaire">Secrétaire</option>
                        </select>
                    </div>

                    {/* Bouton de soumission */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={buttonStyle}
                        onMouseEnter={(e) => (e.target.style.backgroundColor = buttonHoverStyle.backgroundColor)}
                        onMouseLeave={(e) => (e.target.style.backgroundColor = buttonStyle.backgroundColor)}
                    >
                        {isLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ borderTop: '2px solid white', borderRight: '2px solid transparent', borderRadius: '50%', width: '1rem', height: '1rem', marginRight: '0.5rem', animation: 'spin 1s linear infinite' }}></span>
                                Création en cours...
                            </div>
                        ) : (
                            'Créer un Compte'
                        )}
                    </button>
                </form>

                {/* Lien vers la page de connexion */}
                <p style={{ marginTop: '1rem', textAlign: 'center' }}>
                    Déjà un compte ?{' '}
                    <Link
                        to="/login"
                        style={linkStyle}
                        onMouseEnter={(e) => (e.target.style.textDecoration = linkHoverStyle.textDecoration)}
                        onMouseLeave={(e) => (e.target.style.textDecoration = linkStyle.textDecoration)}
                    >
                        Connectez-vous
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;