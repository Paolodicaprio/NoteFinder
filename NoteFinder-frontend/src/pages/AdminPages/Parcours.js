import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import parcourService from '../../services/parcourService';
import { fetchAnneesAcademiques } from '../../services/anneeService';
import { fetchFilieres } from '../../services/filiereService';
import { fetchGrades } from '../../services/gradeService';

const Parcours = ({ user = {} }) => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [filterAnnee, setFilterAnnee] = useState('');
    const [filterFiliere, setFilterFiliere] = useState('');
    const [filterGrade, setFilterGrade] = useState('');
    const [filterNiveau, setFilterNiveau] = useState('');
    const [filterMatricule, setFilterMatricule] = useState('');

    const [anneesAcademiques, setAnneesAcademiques] = useState([]);
    const [filieres, setFilieres] = useState([]);
    const [grades, setGrades] = useState([]);

    const fetchParcours = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await parcourService.getParcours({
                filter_annee: filterAnnee,
                filter_filiere: filterFiliere,
                filter_grade: filterGrade,
                filter_niveau: filterNiveau,
                filter_matricule: filterMatricule,
            });
            setData(response.data);
        } catch (error) {
            setError('Erreur lors de la récupération des parcours.');
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const [anneesResponse, filieresResponse, gradesResponse] = await Promise.all([
                fetchAnneesAcademiques(),
                fetchFilieres(),
                fetchGrades(),
            ]);

            setAnneesAcademiques(anneesResponse.data);
            setFilieres(filieresResponse.data);
            setGrades(gradesResponse.data);
        } catch (error) {
            setError('Erreur lors de la récupération des options.');
            console.error('Erreur:', error);
        }
    };

    useEffect(() => {
        fetchOptions();
    }, []);

    useEffect(() => {
        fetchParcours();
    }, [filterAnnee, filterFiliere, filterGrade, filterNiveau, filterMatricule]);

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchParcours();
    };

    const handleLogout = () => {
        navigate('/login');
    };

    const handleEdit = async (id) => {
        try {
            const response = await parcourService.getParcoursById(id);
            const parcours = response.data;
            console.log('Éditer le parcours:', parcours);
        } catch (error) {
            setError('Erreur lors de la récupération du parcours.');
            console.error('Erreur:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce parcours ?')) {
            try {
                await parcourService.deleteParcours(id);
                fetchParcours();
            } catch (error) {
                setError('Erreur lors de la suppression du parcours.');
                console.error('Erreur:', error);
            }
        }
    };

    return (
        <div style={{ backgroundColor: '#f3f4f6', display: 'flex', minHeight: '100vh' }}>
            {/* Menu de navigation à gauche */}
            <nav style={{ backgroundColor: '#ffffff', width: '25%', minHeight: '100vh', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <div style={{ padding: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Menu</h2>
                    <ul>
                        <li style={{ marginBottom: '0.5rem', padding: '0.5rem', color: '#374151', transition: 'background-color 0.3s' }}>
                            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                                <i className="fas fa-tachometer-alt" style={{ marginRight: '0.5rem' }}></i>
                                Tableau de bord
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>

            {/* Contenu principal */}
            <div style={{ flex: 1, padding: '1.5rem' }}>
                {/* Barre supérieure */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.375rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            <i className="fas fa-chalkboard-teacher" style={{ color: '#f59e0b', marginRight: '0.5rem' }}></i> Gestion des parcours étudiants
                        </h1>
                    </div>
                    <div style={{ color: '#4b5563' }}>
                        <span style={{ marginRight: '1rem' }}>Utilisateur : <strong>{user ? user.email : "Non connecté"}</strong></span>
                        <button onClick={handleLogout} style={{ color: '#dc2626', textDecoration: 'underline', cursor: 'pointer' }}>
                            Déconnexion
                        </button>
                    </div>
                </div>

                {/* Affichage des erreurs */}
                {error && (
                    <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '0.375rem' }}>
                        {error}
                    </div>
                )}

                {/* Formulaire de filtrage */}
                <div style={{ display: 'flex', backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                    <form style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }} onSubmit={handleFilterSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label htmlFor="filter_annee" style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                                Année académique
                            </label>
                            <select
                                id="filter_annee"
                                value={filterAnnee}
                                onChange={(e) => setFilterAnnee(e.target.value)}
                                style={{ border: '1px solid #d1d5db', padding: '0.5rem', borderRadius: '0.375rem', width: '100%', outline: 'none', boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.5)' }}
                            >
                                <option value="">Sélectionner</option>
                                {anneesAcademiques.map((annee) => (
                                    <option key={annee.id} value={annee.id}>
                                        {annee.nom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label htmlFor="filter_filiere" style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                                Filière
                            </label>
                            <select
                                id="filter_filiere"
                                value={filterFiliere}
                                onChange={(e) => setFilterFiliere(e.target.value)}
                                style={{ border: '1px solid #d1d5db', padding: '0.5rem', borderRadius: '0.375rem', width: '100%', outline: 'none', boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.5)' }}
                            >
                                <option value="">Sélectionner</option>
                                {filieres.map((filiere) => (
                                    <option key={filiere.id} value={filiere.id}>
                                        {filiere.nom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label htmlFor="filter_grade" style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                                Grade
                            </label>
                            <select
                                id="filter_grade"
                                value={filterGrade}
                                onChange={(e) => setFilterGrade(e.target.value)}
                                style={{ border: '1px solid #d1d5db', padding: '0.5rem', borderRadius: '0.375rem', width: '100%', outline: 'none', boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.5)' }}
                            >
                                <option value="">Sélectionner</option>
                                {grades.map((grade) => (
                                    <option key={grade.id} value={grade.id}>
                                        {grade.nom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label htmlFor="filter_niveau" style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                                Niveau
                            </label>
                            <select
                                id="filter_niveau"
                                value={filterNiveau}
                                onChange={(e) => setFilterNiveau(e.target.value)}
                                style={{ border: '1px solid #d1d5db', padding: '0.5rem', borderRadius: '0.375rem', width: '100%', outline: 'none', boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.5)' }}
                            >
                                <option value="">Sélectionner</option>
                                <option value="1">1</option>
                                <option value="2">2</option>
                                <option value="3">3</option>
                            </select>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label htmlFor="filter_matricule" style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                                Matricule
                            </label>
                            <input
                                type="text"
                                id="filter_matricule"
                                value={filterMatricule}
                                onChange={(e) => setFilterMatricule(e.target.value)}
                                style={{ border: '1px solid #d1d5db', borderRadius: '0.375rem', padding: '0.5rem', outline: 'none', boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.5)' }}
                                placeholder="Filtrer par matricule"
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                            <button type="submit" style={{ width: '100%', backgroundColor: '#6366f1', color: '#ffffff', borderRadius: '0.375rem', padding: '0.5rem', transition: 'background-color 0.3s', cursor: 'pointer' }}>
                                Rechercher
                            </button>
                        </div>
                    </form>
                </div>

                {/* Affichage du chargement */}
                {loading && (
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <i className="fas fa-spinner fa-spin" style={{ color: '#6366f1', marginRight: '0.5rem' }}></i> Chargement en cours...
                    </div>
                )}

                {/* Tableau des parcours */}
                {!loading && (
                    <div style={{ width: '100%', marginTop: '1.5rem' }}>
                        <table style={{ minWidth: '100%', borderCollapse: 'separate', borderSpacing: '0', borderColor: '#e5e7eb' }}>
                            <thead style={{ backgroundColor: '#f9fafb' }}>
                                <tr>
                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID</th>
                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Matricule</th>
                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Année Académique</th>
                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Année Étude</th>
                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Décision</th>
                                    <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody style={{ backgroundColor: '#ffffff' }}>
                                {data.map((row) => (
                                    <tr key={row.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1f2937', whiteSpace: 'nowrap' }}>{row.id}</td>
                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1f2937', whiteSpace: 'nowrap' }}>{row.etudiant_matricule}</td>
                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1f2937', whiteSpace: 'nowrap' }}>{row.annee_academique}</td>
                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1f2937', whiteSpace: 'nowrap' }}>{row.annee_etude}</td>
                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1f2937', whiteSpace: 'nowrap' }}>{row.decision}</td>
                                        <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1f2937', whiteSpace: 'nowrap' }}>
                                            <button onClick={() => handleEdit(row.id)} style={{ color: '#4f46e5', marginRight: '0.5rem', cursor: 'pointer' }}>
                                                <i className="fas fa-edit" style={{ fontSize: '1.125rem' }}></i>
                                            </button>
                                            <button onClick={() => handleDelete(row.id)} style={{ color: '#dc2626', cursor: 'pointer' }}>
                                                <i className="fas fa-trash-alt" style={{ fontSize: '1.125rem' }}></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Parcours;