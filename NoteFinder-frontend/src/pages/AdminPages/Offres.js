import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import offreService from '../../services/offreService';
import { fetchFilieres } from '../../services/filiereService';
import { fetchGrades } from '../../services/gradeService';

const Offres = ({ user = {} }) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    filter_filiere: '',
    filter_grade: '',
    filter_niveau: '',
  });

  const [offres, setOffres] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOffres = async () => {
    try {
      const response = await offreService.getOffres(filters);
      setOffres(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des offres:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFilieres = async () => {
    try {
      const response = await fetchFilieres();
      setFilieres(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des filières:', error);
    }
  };

  const loadGrades = async () => {
    try {
      const response = await fetchGrades();
      setGrades(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des grades:', error);
    }
  };

  useEffect(() => {
    fetchOffres();
    loadFilieres();
    loadGrades();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    if (!filters.filter_filiere || !filters.filter_grade || !filters.filter_niveau) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    fetchOffres();
  };

  const handleDeleteOffre = async (id) => {
    try {
      await offreService.deleteOffre(id);
      fetchOffres();
      alert('Offre supprimée avec succès');
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'offre:', error);
    }
  };

  const handleEdit = async (id) => {
    try {
      const response = await offreService.getOffre(id);
      const offre = response.data;
      console.log('Éditer l\'offre:', offre);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'offre:', error);
    }
  };

  const handleLogout = () => {
    navigate('/login');
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
            {/* Ajoutez d'autres éléments de menu ici */}
          </ul>
        </div>
      </nav>

      {/* Contenu principal */}
      <div style={{ flex: 1, padding: '1.5rem' }}>
        {/* Barre supérieure */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', backgroundColor: '#ffffff', padding: '1rem', borderRadius: '0.375rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              <i className="fas fa-chalkboard-teacher" style={{ color: '#f59e0b', marginRight: '0.5rem' }}></i> Gestion des offres de formation
            </h1>
          </div>
          <div style={{ color: '#4b5563' }}>
            <span style={{ marginRight: '1rem' }}>Utilisateur : <strong>{user ? user.email : "Non connecté"}</strong></span>
            <button onClick={handleLogout} style={{ color: '#dc2626', textDecoration: 'underline', cursor: 'pointer' }}>
              Déconnexion
            </button>
          </div>
        </div>

        {/* Formulaire de filtrage */}
        <div style={{ display: 'flex', backgroundColor: '#f3f4f6', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <form style={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }} onSubmit={handleFilterSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label htmlFor="filter_filiere" style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                Filière
              </label>
              <select
                id="filter_filiere"
                name="filter_filiere"
                value={filters.filter_filiere}
                onChange={handleFilterChange}
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
                name="filter_grade"
                value={filters.filter_grade}
                onChange={handleFilterChange}
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
                name="filter_niveau"
                value={filters.filter_niveau}
                onChange={handleFilterChange}
                style={{ border: '1px solid #d1d5db', padding: '0.5rem', borderRadius: '0.375rem', width: '100%', outline: 'none', boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.5)' }}
              >
                <option value="">Sélectionner</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
              <button type="submit" style={{ width: '100%', backgroundColor: '#6366f1', color: '#ffffff', borderRadius: '0.375rem', padding: '0.5rem', transition: 'background-color 0.3s', cursor: 'pointer' }}>
                Rechercher
              </button>
            </div>
          </form>
        </div>

        {/* Tableau des offres */}
        <div style={{ width: '100%', marginTop: '1.5rem' }}>
          {loading ? (
            <p>Chargement des offres...</p>
          ) : (
            <table style={{ minWidth: '100%', borderCollapse: 'separate', borderSpacing: '0', borderColor: '#e5e7eb' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Semestre</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code UE</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Intitulé UE</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Crédit</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Code ECUE</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Intitulé ECUE</th>
                  <th style={{ padding: '0.75rem 1.5rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '500', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ backgroundColor: '#ffffff' }}>
                {offres.map((offre) => (
                  <tr key={offre.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1f2937', whiteSpace: 'nowrap' }}>{offre.semestre}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1f2937', whiteSpace: 'nowrap' }}>{offre.code_ue}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1f2937', whiteSpace: 'nowrap' }}>{offre.nom_ue}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1f2937', whiteSpace: 'nowrap' }}>{offre.credit}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1f2937', whiteSpace: 'nowrap' }}>{offre.code_ecue}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1f2937', whiteSpace: 'nowrap' }}>{offre.nom_ecue}</td>
                    <td style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: '#1f2937', whiteSpace: 'nowrap' }}>
                      <button onClick={() => handleEdit(offre.id)} style={{ color: '#4f46e5', marginRight: '0.5rem', cursor: 'pointer' }}>
                        <i className="fas fa-edit" style={{ fontSize: '1.125rem' }}></i>
                      </button>
                      <button onClick={() => handleDeleteOffre(offre.id)} style={{ color: '#dc2626', cursor: 'pointer' }}>
                        <i className="fas fa-trash-alt" style={{ fontSize: '1.125rem' }}></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Offres;