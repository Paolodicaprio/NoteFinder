import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEtudiants, addEtudiant, deleteEtudiant } from '../../services/etudiantService';
import Sidebar from '../../components/Sidebar';

const Etudiants = ({ user }) => {
  const navigate = useNavigate();
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newEtudiant, setNewEtudiant] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    date_naissance: '',
    sexe: 'M',
    email: '',
    telephone: ''
  });

  // Convertit le tableau de tableaux en tableau d'objets
  const formatEtudiantsData = (data) => {
    return data.map(item => ({
      matricule: item[0],
      nom: item[1],
      prenom: item[2],
      date_naissance: item[3],
      sexe: item[4],
      email: item[5],
      telephone: item[6]
    }));
  };

  const loadEtudiants = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchEtudiants();
      console.log('Raw API response:', response); // Debug
      
      if (!Array.isArray(response)) {
        throw new Error('Format de données inattendu');
      }

      const formattedData = formatEtudiantsData(response);
      console.log('Formatted data:', formattedData); // Debug
      
      setEtudiants(formattedData);
      setError(null);
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message);
      setEtudiants([]);
    } finally {
      setLoading(false);
    }
  }, []);


  const validateForm = () => {
    const errors = [];
    const { matricule, nom, prenom, date_naissance, email, telephone } = newEtudiant;

    if (!matricule.trim()) errors.push('Matricule requis');
    if (!nom.trim()) errors.push('Nom requis');
    if (!prenom.trim()) errors.push('Prénom requis');
    if (!date_naissance) errors.push('Date de naissance requise');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email invalide');
    if (!telephone.trim()) errors.push('Téléphone requis');

    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEtudiant(prev => ({ ...prev, [name]: value }));
  };

  const handleAddEtudiant = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      alert(validationErrors.join('\n'));
      return;
    }

    try {
      // Formatage des données pour l'API
      const etudiantToSend = {
        ...newEtudiant,
        date_naissance: new Date(newEtudiant.date_naissance).toISOString().split('T')[0] // Format YYYY-MM-DD
      };

      await addEtudiant(etudiantToSend);
      setShowModal(false);
      setNewEtudiant({
        matricule: '',
        nom: '',
        prenom: '',
        date_naissance: '',
        sexe: 'M',
        email: '',
        telephone: ''
      });
      await loadEtudiants();
      alert('Étudiant ajouté avec succès');
    } catch (err) {
      alert(err.message || "Erreur lors de l'ajout de l'étudiant");
    }
  };

  const handleDelete = async (matricule) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet étudiant ?')) return;
    
    try {
      await deleteEtudiant(matricule);
      await loadEtudiants();
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    loadEtudiants();
  }, [loadEtudiants]);

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non renseigné';
    try {
      const date = new Date(dateString);
      return isNaN(date) ? dateString : date.toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  return (
    <div style={{ display: 'flex', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
    {/* Sidebar importée */}
    <Sidebar user={user} />
    
    {/* Contenu principal - ajusté avec marginLeft pour la sidebar */}
    <div style={{ 
      flex: 1, 
      padding: '32px', 
      marginLeft: '280px' // Ajustement pour la largeur de la sidebar
    }}>
      {/* Barre supérieure */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '32px', 
        backgroundColor: '#ffffff', 
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)', 
        padding: '20px 24px', 
        borderRadius: '12px',
        border: '1px solid #e2e8f0'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 600, 
            color: '#1e293b',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <i className="fas fa-user-graduate" style={{ color: '#4a6baf' }}></i>
            Gestion des Étudiants
          </h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ 
            backgroundColor: '#4a6baf',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className="fas fa-plus"></i>
          Ajouter un étudiant
        </button>
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div style={{ 
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Modal */}
      {showModal && (
  <div style={{ 
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    overflow: 'auto' // Permet le scroll sur toute la modal
  }}>
    <div style={{ 
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '12px',
      width: '500px',
      maxWidth: '90%',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      margin: '20px 0', // Ajoute de l'espace en haut et en bas
      maxHeight: '90vh', // Limite la hauteur
      overflowY: 'auto', // Active le scroll vertical
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: 600,
              marginBottom: '20px',
              color: '#1e293b'
            }}>
              Ajouter un nouvel étudiant
            </h2>
            
            <form onSubmit={handleAddEtudiant}>
              {['matricule', 'nom', 'prenom'].map((field) => (
                <div key={`form-field-${field}`} style={{ marginBottom: '16px' }}>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#64748b',
                    marginBottom: '8px'
                  }}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}*
                  </label>
                  <input
                    type="text"
                    name={field}
                    value={newEtudiant[field]}
                    onChange={handleInputChange}
                    required
                    style={{ 
                      width: '100%', 
                      padding: '10px 14px', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '8px',
                      fontSize: '14px',
                      ':focus': {
                        outline: 'none',
                        borderColor: '#4f46e5',
                        boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.2)'
                      }
                    }}
                  />
                </div>
              ))}

              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#64748b',
                  marginBottom: '8px'
                }}>
                  Date de naissance*
                </label>
                <input
                  type="date"
                  name="date_naissance"
                  value={newEtudiant.date_naissance}
                  onChange={handleInputChange}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '10px 14px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    fontSize: '14px',
                    ':focus': {
                      outline: 'none',
                      borderColor: '#4f46e5',
                      boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.2)'
                    }
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#64748b',
                  marginBottom: '8px'
                }}>
                  Sexe*
                </label>
                <select
                  name="sexe"
                  value={newEtudiant.sexe}
                  onChange={handleInputChange}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '10px 14px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    fontSize: '14px',
                    ':focus': {
                      outline: 'none',
                      borderColor: '#4f46e5',
                      boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.2)'
                    }
                  }}
                >
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#64748b',
                  marginBottom: '8px'
                }}>
                  Email*
                </label>
                <input
                  type="email"
                  name="email"
                  value={newEtudiant.email}
                  onChange={handleInputChange}
                  required
                  style={{ 
                    width: '100%', 
                    padding: '10px 14px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    fontSize: '14px',
                    ':focus': {
                      outline: 'none',
                      borderColor: '#4f46e5',
                      boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.2)'
                    }
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#64748b',
                  marginBottom: '8px'
                }}>
                  Téléphone*
                </label>
                <input
                  type="text"
                  name="telephone"
                  value={newEtudiant.telephone}
                  onChange={handleInputChange}
                  required
                  placeholder="+229XXXXXXXX"
                  style={{ 
                    width: '100%', 
                    padding: '10px 14px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px',
                    fontSize: '14px',
                    ':focus': {
                      outline: 'none',
                      borderColor: '#4f46e5',
                      boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.2)'
                    }
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    backgroundColor: '#e2e8f0',
                    color: '#64748b',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: '#4a6baf',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 500
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tableau des étudiants */}
      {loading ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          padding: '24px',
          color: '#64748b'
        }}>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
          Chargement des étudiants...
        </div>
      ) : (
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderRadius: '8px', 
          overflow: 'hidden',
          border: '1px solid #e2e8f0'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>
                {['matricule', 'nom', 'prenom', 'date_naissance', 'sexe', 'email', 'telephone'].map((header) => (
                  <th 
                    key={`header-${header}`}
                    style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      color: '#64748b',
                      borderBottom: '1px solid #e2e8f0'
                    }}
                  >
                    {header === 'date_naissance' ? 'Date Naiss.' 
                     : header === 'actions' ? 'Actions'
                     : header.charAt(0).toUpperCase() + header.slice(1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {etudiants.length > 0 ? (
                etudiants.map((etudiant, index) => (
                  <tr key={`etudiant-${etudiant.matricule || index}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>{etudiant.matricule || 'Non renseigné'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>{etudiant.nom || 'Non renseigné'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>{etudiant.prenom || 'Non renseigné'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>{formatDate(etudiant.date_naissance)}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>{etudiant.sexe === 'M' ? 'Masculin' : 'Féminin'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>{etudiant.email || 'Non renseigné'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>{etudiant.telephone || 'Non renseigné'}</td>
                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>
                      <button
                        onClick={() => handleDelete(etudiant.matricule)}
                        style={{ 
                          color: '#ef4444', 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ 
                    padding: '24px', 
                    textAlign: 'center', 
                    color: '#64748b',
                    fontStyle: 'italic'
                  }}>
                    {error ? 'Erreur de chargement' : 'Aucun étudiant trouvé'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
);
};

export default Etudiants;