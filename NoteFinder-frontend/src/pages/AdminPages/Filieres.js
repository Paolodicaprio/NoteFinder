import React, { useState, useEffect } from 'react';
import { fetchFilieres, addFiliere, deleteFiliere, updateFiliere } from '../../services/filiereService';
import Sidebar from '../../components/Sidebar';

const Filieres = ({ user }) => {
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({});
  const [newFiliere, setNewFiliere] = useState({
    code: '',
    nom: '',
    mention: '',
    domaine: ''
  });
  const [editingFiliere, setEditingFiliere] = useState(null);
  const [editFiliereData, setEditFiliereData] = useState({
    code: '',
    nom: '',
    mention: '',
    domaine: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchFilieres();
      setFilieres(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const validateFiliere = (filiere) => {
  const errors = {};
  if (!filiere.code?.trim()) {
    errors.code = 'Le code est requis';
  } else if (filiere.code.length > 10) {
    errors.code = 'Max 10 caractères';
  }
  
  if (!filiere.nom?.trim()) {
    errors.nom = 'Le nom est requis';
  } else if (filiere.nom.length > 100) {
    errors.nom = 'Max 100 caractères';
  }
  
  return errors;
};
  const handleAddFiliere = async () => {
    const validationErrors = validateFiliere(newFiliere);
    setErrors(validationErrors);
    
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      await addFiliere(newFiliere);
      setNewFiliere({ code: '', nom: '', mention: '', domaine: '' });
      setErrors({});
      await loadData();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteFiliere = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette filière ?')) {
      try {
        await deleteFiliere(id);
        await loadData();
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const handleUpdateFiliere = async () => {
    try {
      await updateFiliere(editingFiliere.id, editFiliereData);
      setEditingFiliere(null);
      await loadData();
    } catch (error) {
      setError(error.message);
    }
  };

  const startEditing = (filiere) => {
    setEditingFiliere(filiere);
    setEditFiliereData({
      code: filiere.code,
      nom: filiere.nom,
      mention: filiere.mention,
      domaine: filiere.domaine
    });
  };

  return (
    <div style={{ display: 'flex', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <Sidebar user={user} />
      
      <div style={{ flex: 1, padding: '32px', marginLeft: '280px' }}>
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
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#1e293b', margin: 0 }}>
            <i className="fas fa-graduation-cap" style={{ color: '#16a34a', marginRight: '12px' }}></i>
            Gestion des Filières
          </h1>
        </div>

        {error && (
          <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
            {error}
          </div>
        )}

        {/* Formulaire d'ajout */}
        <div style={{ marginBottom: '32px', backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Ajouter une nouvelle filière</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <label>Code</label>
              <input
                type="text"
                value={newFiliere.code}
                onChange={(e) => setNewFiliere({...newFiliere, code: e.target.value})}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div>
              <label>Nom</label>
              <input
                type="text"
                value={newFiliere.nom}
                onChange={(e) => setNewFiliere({...newFiliere, nom: e.target.value})}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div>
              <label>Mention</label>
              <input
                type="text"
                value={newFiliere.mention}
                onChange={(e) => setNewFiliere({...newFiliere, mention: e.target.value})}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
              />
            </div>
            <div>
              <label>Domaine</label>
              <input
                type="text"
                value={newFiliere.domaine}
                onChange={(e) => setNewFiliere({...newFiliere, domaine: e.target.value})}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
              />
            </div>
          </div>
          <button
            onClick={handleAddFiliere}
            style={{ 
              marginTop: '16px', 
              backgroundColor: '#4f46e5', 
              color: 'white', 
              padding: '8px 16px', 
              borderRadius: '4px', 
              border: 'none', 
              cursor: 'pointer'
            }}
          >
            Ajouter
          </button>
        </div>

        {/* Tableau des filières */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center' }}>
              Chargement en cours...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8fafc' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Code</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nom</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Mention</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Domaine</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filieres.length > 0 ? (
                  filieres.map((filiere) => (
                    <tr key={filiere.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px' }}>
                        {editingFiliere?.id === filiere.id ? (
                          <input
                            value={editFiliereData.code}
                            onChange={(e) => setEditFiliereData({...editFiliereData, code: e.target.value})}
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                          />
                        ) : (
                          filiere.code
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {editingFiliere?.id === filiere.id ? (
                          <input
                            value={editFiliereData.nom}
                            onChange={(e) => setEditFiliereData({...editFiliereData, nom: e.target.value})}
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                          />
                        ) : (
                          filiere.nom
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {editingFiliere?.id === filiere.id ? (
                          <input
                            value={editFiliereData.mention}
                            onChange={(e) => setEditFiliereData({...editFiliereData, mention: e.target.value})}
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                          />
                        ) : (
                          filiere.mention
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {editingFiliere?.id === filiere.id ? (
                          <input
                            value={editFiliereData.domaine}
                            onChange={(e) => setEditFiliereData({...editFiliereData, domaine: e.target.value})}
                            style={{ width: '100%', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                          />
                        ) : (
                          filiere.domaine
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {editingFiliere?.id === filiere.id ? (
                          <>
                            <button
                              onClick={handleUpdateFiliere}
                              style={{ 
                                backgroundColor: '#10b981', 
                                color: 'white', 
                                padding: '6px 12px', 
                                borderRadius: '4px', 
                                border: 'none', 
                                cursor: 'pointer',
                                marginRight: '8px'
                              }}
                            >
                              Valider
                            </button>
                            <button
                              onClick={() => setEditingFiliere(null)}
                              style={{ 
                                backgroundColor: '#64748b', 
                                color: 'white', 
                                padding: '6px 12px', 
                                borderRadius: '4px', 
                                border: 'none', 
                                cursor: 'pointer'
                              }}
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(filiere)}
                              style={{ 
                                backgroundColor: '#3b82f6', 
                                color: 'white', 
                                padding: '6px 12px', 
                                borderRadius: '4px', 
                                border: 'none', 
                                cursor: 'pointer',
                                marginRight: '8px'
                              }}
                            >
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDeleteFiliere(filiere.id)}
                              style={{ 
                                backgroundColor: '#ef4444', 
                                color: 'white', 
                                padding: '6px 12px', 
                                borderRadius: '4px', 
                                border: 'none', 
                                cursor: 'pointer'
                              }}
                            >
                              Supprimer
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ padding: '24px', textAlign: 'center' }}>
                      Aucune filière trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Filieres;