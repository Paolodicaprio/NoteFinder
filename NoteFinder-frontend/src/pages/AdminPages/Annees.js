import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchAnneesAcademiques, 
  addAnneeAcademique, 
  deleteAnneeAcademique,
  updateAnneeAcademique
} from '../../services/anneeService';
import { 
  fetchGrades, 
  addGrade, 
  deleteGrade,
  updateGrade
} from '../../services/gradeService';
import Sidebar from '../../components/Sidebar';

const Annees = ({ user }) => {
  const navigate = useNavigate();
  const [annees, setAnnees] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterAnnee, setFilterAnnee] = useState('');
  const [filterNom, setFilterNom] = useState('');
  const [newAnnee, setNewAnnee] = useState('');
  const [newGrade, setNewGrade] = useState('');
  const [editingAnnee, setEditingAnnee] = useState(null);
  const [editingGrade, setEditingGrade] = useState(null);
  const [editAnneeValue, setEditAnneeValue] = useState('');
  const [editGradeValue, setEditGradeValue] = useState('');

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les années académiques
      const anneesData = await fetchAnneesAcademiques();
      const formattedAnnees = anneesData.map(item => ({
        id: item[0],
        annee: item[1]
      }));
      setAnnees(formattedAnnees);
      
      // Charger les grades (avec gestion d'erreur séparée)
      try {
        const gradesData = await fetchGrades();
        setGrades(gradesData);
      } catch (gradesError) {
        console.error("Error loading grades:", gradesError);
        setGrades([]);
      }
      
    } catch (error) {
      console.error("Error loading data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Ajouter une année d'étude
  const handleAddAnnee = async () => {
    if (!newAnnee.trim()) {
      alert('Veuillez entrer une année valide');
      return;
    }

    try {
      await addAnneeAcademique({ annee: newAnnee });
      setNewAnnee('');
      await loadData();
    } catch (error) {
      console.error("Erreur détaillée :", error.response?.data || error.message);
      setError(`Erreur: ${error.response?.data?.message || error.message}`);
    }
  };

  // Mettre à jour une année d'étude
  const handleUpdateAnnee = async () => {
    if (!editAnneeValue.trim()) {
      alert('Veuillez entrer une année valide');
      return;
    }

    try {
      await updateAnneeAcademique(editingAnnee.id, { annee: editAnneeValue });
      setEditingAnnee(null);
      setEditAnneeValue('');
      await loadData();
    } catch (error) {
      setError('Erreur lors de la mise à jour : ' + error.message);
    }
  };

  // Supprimer une année d'étude
  const handleDeleteAnnee = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette année académique ?')) {
      try {
        await deleteAnneeAcademique(id);
        await loadData();
      } catch (error) {
        setError('Erreur lors de la suppression : ' + error.message);
      }
    }
  };

  // Ajouter un grade
  const handleAddGrade = async () => {
    if (!newGrade.trim()) {
      alert('Veuillez entrer un grade valide');
      return;
    }
    try {
      await addGrade({ nom: newGrade });
      setNewGrade('');
      await loadData();
    } catch (error) {
      setError('Erreur lors de l\'ajout du grade : ' + error.message);
    }
  };

  // Mettre à jour un grade
  const handleUpdateGrade = async () => {
    if (!editGradeValue.trim()) {
      alert('Veuillez entrer un grade valide');
      return;
    }

    try {
      await updateGrade(editingGrade.id, { nom: editGradeValue });
      setEditingGrade(null);
      setEditGradeValue('');
      await loadData();
    } catch (error) {
      setError('Erreur lors de la mise à jour du grade : ' + error.message);
    }
  };

  // Supprimer un grade
  const handleDeleteGrade = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce grade ?')) {
      try {
        await deleteGrade(id);
        await loadData();
      } catch (error) {
        setError('Erreur lors de la suppression du grade : ' + error.message);
      }
    }
  };

  // Filtrer les données
  const filteredAnnees = annees.filter(annee =>
    annee.annee.toLowerCase().includes(filterAnnee.toLowerCase())
  );

  const filteredGrades = grades.filter(grade =>
    grade.nom.toLowerCase().includes(filterNom.toLowerCase())
  );

  // Charger les données au montage
  useEffect(() => {
    loadData();
  }, []);

  return (
    <div style={{ display: 'flex', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {/* Utilisation du composant Sidebar */}
      <Sidebar user={user} />
      
      {/* Contenu principal */}
      <div style={{ flex: 1, padding: '32px', marginLeft: '280px' }}>
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
              <i className="fas fa-calendar-alt" style={{ color: '#16a34a' }}></i>
              Gestion des Années Académiques
            </h1>
          </div>
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

        {/* Section Années Académiques */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 600, 
            color: '#1e293b',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fas fa-calendar"></i>
            Années Académiques
          </h2>

          {/* Formulaire d'ajout */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '24px',
            alignItems: 'flex-end'
          }}>
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: 500, 
                color: '#64748b',
                marginBottom: '8px'
              }}>
                Nouvelle année académique
              </label>
              <input
                type="text"
                value={newAnnee}
                onChange={(e) => setNewAnnee(e.target.value)}
                placeholder="Ex: 2023-2024"
                style={{ 
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  ':focus': {
                    outline: 'none',
                    borderColor: '#4f46e5',
                    boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.2)'
                  }
                }}
              />
            </div>
            <button
              onClick={handleAddAnnee}
              style={{ 
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                ':hover': {
                  backgroundColor: '#4338ca'
                }
              }}
            >
              <i className="fas fa-plus"></i>
              Ajouter
            </button>
          </div>

          {/* Filtre et tableau */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={filterAnnee}
              onChange={(e) => setFilterAnnee(e.target.value)}
              placeholder="Filtrer les années..."
              style={{ 
                width: '100%',
                maxWidth: '300px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                transition: 'all 0.2s',
                ':focus': {
                  outline: 'none',
                  borderColor: '#4f46e5',
                  boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.2)'
                }
              }}
            />
          </div>

          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              padding: '24px',
              color: '#64748b'
            }}>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
              Chargement des années académiques...
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
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      color: '#64748b',
                      borderBottom: '1px solid #e2e8f0'
                    }}>ID</th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      color: '#64748b',
                      borderBottom: '1px solid #e2e8f0'
                    }}>Année Académique</th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      color: '#64748b',
                      borderBottom: '1px solid #e2e8f0'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnnees.length > 0 ? (
                    filteredAnnees.map((annee) => (
                      <tr key={annee.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>{annee.id}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>
                          {editingAnnee?.id === annee.id ? (
                            <input
                              type="text"
                              value={editAnneeValue}
                              onChange={(e) => setEditAnneeValue(e.target.value)}
                              style={{ 
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px',
                                width: '100%'
                              }}
                            />
                          ) : (
                            annee.annee
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>
                          {editingAnnee?.id === annee.id ? (
                            <>
                              <button
                                onClick={handleUpdateAnnee}
                                style={{ 
                                  backgroundColor: '#10b981',
                                  color: '#ffffff',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  marginRight: '8px',
                                  fontSize: '14px'
                                }}
                              >
                                <i className="fas fa-check"></i> Valider
                              </button>
                              <button
                                onClick={() => {
                                  setEditingAnnee(null);
                                  setEditAnneeValue('');
                                }}
                                style={{ 
                                  backgroundColor: '#64748b',
                                  color: '#ffffff',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                <i className="fas fa-times"></i> Annuler
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingAnnee(annee);
                                  setEditAnneeValue(annee.annee);
                                }}
                                style={{ 
                                  color: '#4f46e5', 
                                  background: 'none', 
                                  border: 'none', 
                                  cursor: 'pointer',
                                  marginRight: '12px',
                                  fontSize: '14px'
                                }}
                              >
                                <i className="fas fa-edit"></i> Modifier
                              </button>
                              <button
                                onClick={() => handleDeleteAnnee(annee.id)}
                                style={{ 
                                  color: '#ef4444', 
                                  background: 'none', 
                                  border: 'none', 
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                <i className="fas fa-trash-alt"></i> Supprimer
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ 
                        padding: '24px', 
                        textAlign: 'center', 
                        color: '#64748b',
                        fontStyle: 'italic'
                      }}>
                        Aucune année académique trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section Grades */}
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: 600, 
            color: '#1e293b',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <i className="fas fa-graduation-cap"></i>
            Grades
          </h2>

          {/* Formulaire d'ajout */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '24px',
            alignItems: 'flex-end'
          }}>
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block', 
                fontSize: '14px', 
                fontWeight: 500, 
                color: '#64748b',
                marginBottom: '8px'
              }}>
                Nouveau grade
              </label>
              <input
                type="text"
                value={newGrade}
                onChange={(e) => setNewGrade(e.target.value)}
                placeholder="Ex: Licence 1"
                style={{ 
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px',
                  transition: 'all 0.2s',
                  ':focus': {
                    outline: 'none',
                    borderColor: '#4f46e5',
                    boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.2)'
                  }
                }}
              />
            </div>
            <button
              onClick={handleAddGrade}
              style={{ 
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                ':hover': {
                  backgroundColor: '#4338ca'
                }
              }}
            >
              <i className="fas fa-plus"></i>
              Ajouter
            </button>
          </div>

          {/* Filtre et tableau */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              value={filterNom}
              onChange={(e) => setFilterNom(e.target.value)}
              placeholder="Filtrer les grades..."
              style={{ 
                width: '100%',
                maxWidth: '300px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '14px',
                transition: 'all 0.2s',
                ':focus': {
                  outline: 'none',
                  borderColor: '#4f46e5',
                  boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.2)'
                }
              }}
            />
          </div>

          {loading ? (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              padding: '24px',
              color: '#64748b'
            }}>
              <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
              Chargement des grades...
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
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      color: '#64748b',
                      borderBottom: '1px solid #e2e8f0'
                    }}>ID</th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      color: '#64748b',
                      borderBottom: '1px solid #e2e8f0'
                    }}>Nom</th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      color: '#64748b',
                      borderBottom: '1px solid #e2e8f0'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrades.length > 0 ? (
                    filteredGrades.map((grade) => (
                      <tr key={grade.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>{grade.id}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>
                          {editingGrade?.id === grade.id ? (
                            <input
                              type="text"
                              value={editGradeValue}
                              onChange={(e) => setEditGradeValue(e.target.value)}
                              style={{ 
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                fontSize: '14px',
                                width: '100%'
                              }}
                            />
                          ) : (
                            grade.nom
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>
                          {editingGrade?.id === grade.id ? (
                            <>
                              <button
                                onClick={handleUpdateGrade}
                                style={{ 
                                  backgroundColor: '#10b981',
                                  color: '#ffffff',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  marginRight: '8px',
                                  fontSize: '14px'
                                }}
                              >
                                <i className="fas fa-check"></i> Valider
                              </button>
                              <button
                                onClick={() => {
                                  setEditingGrade(null);
                                  setEditGradeValue('');
                                }}
                                style={{ 
                                  backgroundColor: '#64748b',
                                  color: '#ffffff',
                                  padding: '6px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                <i className="fas fa-times"></i> Annuler
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingGrade(grade);
                                  setEditGradeValue(grade.nom);
                                }}
                                style={{ 
                                  color: '#4f46e5', 
                                  background: 'none', 
                                  border: 'none', 
                                  cursor: 'pointer',
                                  marginRight: '12px',
                                  fontSize: '14px'
                                }}
                              >
                                <i className="fas fa-edit"></i> Modifier
                              </button>
                              <button
                                onClick={() => handleDeleteGrade(grade.id)}
                                style={{ 
                                  color: '#ef4444', 
                                  background: 'none', 
                                  border: 'none', 
                                  cursor: 'pointer',
                                  fontSize: '14px'
                                }}
                              >
                                <i className="fas fa-trash-alt"></i> Supprimer
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ 
                        padding: '24px', 
                        textAlign: 'center', 
                        color: '#64748b',
                        fontStyle: 'italic'
                      }}>
                        Aucun grade trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Annees;