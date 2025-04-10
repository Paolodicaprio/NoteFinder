import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faShieldAlt, faCalendar, faPhone, faVenusMars, faIdCard } from '@fortawesome/free-solid-svg-icons';
import authService from '../../services/authService';

const Users = () => {
    const [formData, setFormData] = useState({
        prenom: '',
        nom: '',
        email: '',
        password: '',
        role: 'Admin',
        telephone: '',
        sexe: 'M',
        date_naissance: '',
        matricule: '',
        code: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            let response;
            
            if (formData.role === 'Etudiant') {
                // Format spécifique pour les étudiants
                const etudiantData = {
                    matricule: formData.matricule,
                    code: formData.code,
                    nom: formData.nom,
                    prenom: formData.prenom,
                    date_naissance: formData.date_naissance,
                    sexe: formData.sexe,
                    email: formData.email,
                    telephone: formData.telephone
                };
                response = await authService.registerEtudiant(etudiantData);
            } else {
                // Format standard pour autres rôles
                response = await authService.register(formData);
            }

            if (response.success) {
                setSuccess(response.message || 'Utilisateur créé avec succès !');
                setFormData({
                    prenom: '',
                    nom: '',
                    email: '',
                    password: '',
                    role: 'Admin',
                    telephone: '',
                    sexe: 'M',
                    date_naissance: '',
                    matricule: '',
                    code: ''
                });
            }
        } catch (error) {
            setError(error.message || 'Une erreur est survenue lors de la création.');
        } finally {
            setIsLoading(false);
        }
    };

    // Rendu conditionnel des champs étudiants
    const renderStudentFields = () => {
        if (formData.role !== 'Etudiant') return null;

        return (
            <>
                {/* Champ Matricule */}
                <div className="input-group">
                    <label>Matricule</label>
                    <div className="input-icon">
                        <FontAwesomeIcon icon={faIdCard} />
                        <input
                            type="text"
                            placeholder="Matricule de l'étudiant"
                            name="matricule"
                            value={formData.matricule}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* Champ Code */}
                <div className="input-group">
                    <label>Code d'accès</label>
                    <div className="input-icon">
                        <FontAwesomeIcon icon={faLock} />
                        <input
                            type="password"
                            placeholder="Code d'accès"
                            name="code"
                            value={formData.code}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* Champ Date de naissance */}
                <div className="input-group">
                    <label>Date de naissance</label>
                    <div className="input-icon">
                        <FontAwesomeIcon icon={faCalendar} />
                        <input
                            type="date"
                            name="date_naissance"
                            value={formData.date_naissance}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                {/* Champ Sexe */}
                <div className="input-group">
                    <label>Sexe</label>
                    <select
                        name="sexe"
                        value={formData.sexe}
                        onChange={handleChange}
                        required
                    >
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                    </select>
                </div>

                {/* Champ Téléphone */}
                <div className="input-group">
                    <label>Téléphone</label>
                    <div className="input-icon">
                        <FontAwesomeIcon icon={faPhone} />
                        <input
                            type="tel"
                            placeholder="Numéro de téléphone"
                            name="telephone"
                            value={formData.telephone}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="form-container">
            <div className="form-card">
                <div className="form-header">
                    <FontAwesomeIcon icon={faShieldAlt} />
                    <h1>Ajouter un Utilisateur</h1>
                </div>

                {error && <div className="alert error">{error}</div>}
                {success && <div className="alert success">{success}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Champ Rôle */}
                    <div className="input-group">
                        <label>Rôle</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                        >
                            <option value="Admin">Administrateur</option>
                            <option value="Enseignant">Enseignant</option>
                            <option value="Secrétaire">Secrétaire</option>
                            <option value="Etudiant">Étudiant</option>
                        </select>
                    </div>

                    {/* Champ Prénom */}
                    <div className="input-group">
                        <label>Prénom</label>
                        <div className="input-icon">
                            <FontAwesomeIcon icon={faUser} />
                            <input
                                type="text"
                                placeholder="Prénom"
                                name="prenom"
                                value={formData.prenom}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Champ Nom */}
                    <div className="input-group">
                        <label>Nom</label>
                        <div className="input-icon">
                            <FontAwesomeIcon icon={faUser} />
                            <input
                                type="text"
                                placeholder="Nom"
                                name="nom"
                                value={formData.nom}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Champ Email */}
                    <div className="input-group">
                        <label>Email</label>
                        <div className="input-icon">
                            <FontAwesomeIcon icon={faEnvelope} />
                            <input
                                type="email"
                                placeholder="Email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Champ Mot de passe */}
                    <div className="input-group">
                        <label>Mot de passe</label>
                        <div className="input-icon">
                            <FontAwesomeIcon icon={faLock} />
                            <input
                                type="password"
                                placeholder="Mot de passe"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required={formData.role !== 'Etudiant'}
                            />
                        </div>
                    </div>

                    {/* Champs spécifiques étudiants */}
                    {renderStudentFields()}

                    <button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <div className="spinner"></div>
                                Création en cours...
                            </>
                        ) : (
                            'Ajouter l\'utilisateur'
                        )}
                    </button>
                </form>

                <div className="form-footer">
                    <Link to="/dashboard">← Retour au dashboard</Link>
                </div>
            </div>

            <style jsx>{`
                .form-container {
                    background-color: #f8fafc;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                }
                
                .form-card {
                    background-color: white;
                    padding: 2rem;
                    border-radius: 0.5rem;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    width: 100%;
                    max-width: 32rem;
                }
                
                .form-header {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 1.5rem;
                    gap: 0.5rem;
                }
                
                .form-header h1 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: #1e293b;
                }
                
                .form-header svg {
                    font-size: 1.5rem;
                    color: #4f46e5;
                }
                
                .alert {
                    padding: 0.75rem;
                    border-radius: 0.375rem;
                    margin-bottom: 1rem;
                }
                
                .error {
                    background-color: #fee2e2;
                    border: 1px solid #fca5a5;
                    color: #dc2626;
                }
                
                .success {
                    background-color: #dcfce7;
                    border: 1px solid #86efac;
                    color: #16a34a;
                }
                
                .input-group {
                    margin-bottom: 1rem;
                }
                
                .input-group label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #334155;
                    margin-bottom: 0.25rem;
                }
                
                .input-icon {
                    position: relative;
                }
                
                .input-icon svg {
                    position: absolute;
                    left: 0.75rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #4f46e5;
                }
                
                .input-icon input,
                .input-group select {
                    border: 1px solid #e2e8f0;
                    padding: 0.5rem 0.5rem 0.5rem 2rem;
                    border-radius: 0.375rem;
                    width: 100%;
                    outline: none;
                    transition: all 0.2s;
                }
                
                .input-group select {
                    padding-left: 0.75rem;
                }
                
                .input-icon input:focus,
                .input-group select:focus {
                    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
                }
                
                button[type="submit"] {
                    background-color: #4f46e5;
                    color: white;
                    padding: 0.75rem;
                    border-radius: 0.375rem;
                    width: 100%;
                    border: none;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    margin-top: 0.5rem;
                    font-weight: 500;
                }
                
                button[type="submit"]:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                
                button[type="submit"]:hover:not(:disabled) {
                    background-color: #4338ca;
                }
                
                .spinner {
                    border: 2px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    width: 1rem;
                    height: 1rem;
                    animation: spin 1s linear infinite;
                    margin-right: 0.5rem;
                    display: inline-block;
                }
                
                .form-footer {
                    margin-top: 1rem;
                    text-align: center;
                    font-size: 0.875rem;
                    color: #64748b;
                }
                
                .form-footer a {
                    color: #4f46e5;
                    text-decoration: none;
                    font-weight: 500;
                }
                
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Users;