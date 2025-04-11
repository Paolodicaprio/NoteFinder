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
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Annees = ({ user }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [annees, setAnnees] = useState([]);
  const [grades, setGrades] = useState([]);
  const [filters, setFilters] = useState({
    filterAnnee: '',
    filterGrade: ''
  });
  const [formData, setFormData] = useState({
    newAnnee: '',
    newGrade: ''
  });
  const [editingItem, setEditingItem] = useState({
    type: null, // 'annee' ou 'grade'
    id: null,
    value: ''
  });

  // Charger les données en fonction des filtres
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Charger les années académiques
        const anneesData = await fetchAnneesAcademiques();
        const formattedAnnees = anneesData.map(item => ({
          id: item.id,
          annee: item.annee
        }));
        setAnnees(formattedAnnees);
        
        // Charger les grades
        const gradesData = await fetchGrades();
        setGrades(gradesData);
      } catch (error) {
        toast.error(`Erreur de chargement: ${error.message}`);
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [filters]); // Réagit aux changements de filtres

  // Gestion des filtres
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  // Ajouter une année académique
  const handleAddAnnee = async () => {
    if (!formData.newAnnee.trim()) {
      toast.error('Veuillez entrer une année valide');
      return;
    }

    setIsLoading(true);
    try {
      await addAnneeAcademique({ annee: formData.newAnnee });
      toast.success('Année ajoutée avec succès');
      setFormData({ ...formData, newAnnee: '' });
      
      // Actualiser les filtres pour déclencher le rechargement
      setFilters({ ...filters });
    } catch (error) {
      toast.error(`Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour une année académique
  const handleUpdateAnnee = async () => {
    if (!editingItem.value.trim()) {
      toast.error('Veuillez entrer une année valide');
      return;
    }

    setIsLoading(true);
    try {
      await updateAnneeAcademique(editingItem.id, { annee: editingItem.value });
      toast.success('Année mise à jour avec succès');
      setEditingItem({ type: null, id: null, value: '' });
      
      // Actualiser les filtres pour déclencher le rechargement
      setFilters({ ...filters });
    } catch (error) {
      toast.error(`Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer une année académique
  const handleDeleteAnnee = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette année académique ?')) return;

    setIsLoading(true);
    try {
      await deleteAnneeAcademique(id);
      toast.success('Année supprimée avec succès');
      
      // Actualiser les filtres pour déclencher le rechargement
      setFilters({ ...filters });
    } catch (error) {
      toast.error(`Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Ajouter un grade
  const handleAddGrade = async () => {
    if (!formData.newGrade.trim()) {
      toast.error('Veuillez entrer un grade valide');
      return;
    }

    setIsLoading(true);
    try {
      await addGrade({ nom: formData.newGrade });
      toast.success('Grade ajouté avec succès');
      setFormData({ ...formData, newGrade: '' });
      
      // Actualiser les filtres pour déclencher le rechargement
      setFilters({ ...filters });
    } catch (error) {
      toast.error(`Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour un grade
  const handleUpdateGrade = async () => {
    if (!editingItem.value.trim()) {
      toast.error('Veuillez entrer un grade valide');
      return;
    }

    setIsLoading(true);
    try {
      await updateGrade(editingItem.id, { nom: editingItem.value });
      toast.success('Grade mis à jour avec succès');
      setEditingItem({ type: null, id: null, value: '' });
      
      // Actualiser les filtres pour déclencher le rechargement
      setFilters({ ...filters });
    } catch (error) {
      toast.error(`Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer un grade
  const handleDeleteGrade = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce grade ?')) return;

    setIsLoading(true);
    try {
      await deleteGrade(id);
      toast.success('Grade supprimé avec succès');
      
      // Actualiser les filtres pour déclencher le rechargement
      setFilters({ ...filters });
    } catch (error) {
      toast.error(`Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les données
  const filteredAnnees = annees.filter(annee =>
    annee.annee.toLowerCase().includes(filters.filterAnnee.toLowerCase())
  );

  const filteredGrades = grades.filter(grade =>
    grade.nom.toLowerCase().includes(filters.filterGrade.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Sidebar user={user} />
      
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
              Gestion des Années Académiques et Grades
            </h1>
          </div>
        </div>

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
                name="newAnnee"
                value={formData.newAnnee}
                onChange={(e) => setFormData({ ...formData, newAnnee: e.target.value })}
                placeholder="Ex: 2023-2024"
                style={{ 
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px'
                }}
              />
            </div>
            <button
              onClick={handleAddAnnee}
              disabled={isLoading}
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
                opacity: isLoading ? 0.7 : 1
              }}
            >
              <i className="fas fa-plus"></i>
              {isLoading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>

          {/* Filtre */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              name="filterAnnee"
              value={filters.filterAnnee}
              onChange={handleFilterChange}
              placeholder="Filtrer les années..."
              style={{ 
                width: '100%',
                maxWidth: '300px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Tableau */}
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '8px', 
            overflow: 'hidden',
            border: '1px solid #e2e8f0'
          }}>
            {isLoading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                padding: '24px',
                color: '#64748b'
              }}>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                Chargement des données...
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Année Académique</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnnees.length > 0 ? (
                    filteredAnnees.map((annee) => (
                      <tr key={annee.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>{annee.id}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>
                          {editingItem.type === 'annee' && editingItem.id === annee.id ? (
                            <input
                              type="text"
                              value={editingItem.value}
                              onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
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
                          {editingItem.type === 'annee' && editingItem.id === annee.id ? (
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
                                onClick={() => setEditingItem({ type: null, id: null, value: '' })}
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
                                onClick={() => setEditingItem({ type: 'annee', id: annee.id, value: annee.annee })}
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
                      <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                        Aucune année académique trouvée
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
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
                name="newGrade"
                value={formData.newGrade}
                onChange={(e) => setFormData({ ...formData, newGrade: e.target.value })}
                placeholder="Ex: Licence 1"
                style={{ 
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px'
                }}
              />
            </div>
            <button
              onClick={handleAddGrade}
              disabled={isLoading}
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
                opacity: isLoading ? 0.7 : 1
              }}
            >
              <i className="fas fa-plus"></i>
              {isLoading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>

          {/* Filtre */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              name="filterGrade"
              value={filters.filterGrade}
              onChange={handleFilterChange}
              placeholder="Filtrer les grades..."
              style={{ 
                width: '100%',
                maxWidth: '300px',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '14px'
              }}
            />
          </div>

          {/* Tableau */}
          <div style={{ 
            backgroundColor: '#ffffff', 
            borderRadius: '8px', 
            overflow: 'hidden',
            border: '1px solid #e2e8f0'
          }}>
            {isLoading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                padding: '24px',
                color: '#64748b'
              }}>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                Chargement des données...
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>ID</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Nom</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '14px', fontWeight: 500, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGrades.length > 0 ? (
                    filteredGrades.map((grade) => (
                      <tr key={grade.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>{grade.id}</td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', color: '#334155' }}>
                          {editingItem.type === 'grade' && editingItem.id === grade.id ? (
                            <input
                              type="text"
                              value={editingItem.value}
                              onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
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
                          {editingItem.type === 'grade' && editingItem.id === grade.id ? (
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
                                onClick={() => setEditingItem({ type: null, id: null, value: '' })}
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
                                onClick={() => setEditingItem({ type: 'grade', id: grade.id, value: grade.nom })}
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
                      <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                        Aucun grade trouvé
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Annees;