import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  fetchEnseignants, 
  addEnseignant, 
  deleteEnseignant,
  updateEnseignant,
  fetchEnseignantById 
} from '../../services/enseignantService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Sidebar from '../../components/Sidebar';


const Enseignants = ({ user }) => { 
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    specialite: '',
    telephone: '',
    email: ''
  });
  const [filters, setFilters] = useState({
    filter_nom: '',
    filter_prenom: '',
    filter_email: '',
    filter_specialite: ''
  });
  const [enseignants, setEnseignants] = useState([]);

  useEffect(() => {
    const loadEnseignants = async () => {
      setIsLoading(true);
      try {
        const data = await fetchEnseignants(filters);
        setEnseignants(data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadEnseignants();
  }, [filters]);

  const handleLogout = () => {
    navigate('/login');
  };

  const handleSaveEnseignant = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Validez les données avant envoi
      if (!formData.nom || !formData.prenom || !formData.email || !formData.telephone || !formData.specialite) {
        throw new Error('Tous les champs sont obligatoires');
      }
  
      if (editingId) {
        await updateEnseignant(editingId, formData);
        toast.success('Enseignant mis à jour avec succès');
      } else {
        await addEnseignant(formData);
        toast.success('Enseignant ajouté avec succès');
      }
      
      // Réinitialisation et rechargement
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        nom: '',
        prenom: '',
        specialite: '',
        telephone: '',
        email: ''
      });
      const data = await fetchEnseignants(filters);
      setEnseignants(data);
    } catch (error) {
      toast.error(error.message);
      console.error('Erreur détaillée:', error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditEnseignant = async (id) => {
    setIsLoading(true);
    try {
      const enseignant = await fetchEnseignantById(id);
      setFormData({
        nom: enseignant.nom,
        prenom: enseignant.prenom,
        specialite: enseignant.specialite,
        telephone: enseignant.telephone,
        email: enseignant.email
      });
      setEditingId(id);
      setIsModalOpen(true);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteEnseignant = async (id) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) return;
    
    setIsLoading(true);
    try {
      await deleteEnseignant(id);
      toast.success('Enseignant supprimé avec succès');
      const data = await fetchEnseignants(filters);
      setEnseignants(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
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
          backgroundColor: 'white',
          padding: '20px 24px',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
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
              <i className="fas fa-user" style={{ color: '#92400e' }}></i>
              Gestion des enseignants
            </h1>
          </div>
          <div>
            <button 
              onClick={handleLogout}
              style={{
                color: '#dc2626',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500
              }}
            >
              Déconnexion
            </button>
          </div>
        </div>

        {/* Formulaire d'ajout et de filtrage */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.375rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: '600'
            }}>Filtrer les enseignants</h2>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  nom: '',
                  prenom: '',
                  specialite: '',
                  telephone: '',
                  email: ''
                });
                setIsModalOpen(true);
              }}
              style={{
                backgroundColor: '#4f46e5',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
              Ajouter un enseignant
            </button>
          </div>

          <form onSubmit={handleFilterSubmit} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}>Nom</label>
              <input
                type="text"
                name="filter_nom"
                value={filters.filter_nom}
                onChange={handleFilterChange}
                placeholder="Filtrer par nom"
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  outline: 'none',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}>Prénom</label>
              <input
                type="text"
                name="filter_prenom"
                value={filters.filter_prenom}
                onChange={handleFilterChange}
                placeholder="Filtrer par prénom"
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  outline: 'none',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}>Email</label>
              <input
                type="email"
                name="filter_email"
                value={filters.filter_email}
                onChange={handleFilterChange}
                placeholder="Filtrer par email"
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  outline: 'none',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.25rem'
              }}>Spécialité</label>
              <input
                type="text"
                name="filter_specialite"
                value={filters.filter_specialite}
                onChange={handleFilterChange}
                placeholder="Filtrer par spécialité"
                style={{
                  width: '100%',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  padding: '0.5rem',
                  outline: 'none',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
              />
            </div>
          </form>
        </div>

        {/* Tableau des enseignants */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '0.375rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '256px'
            }}>
              <div style={{
                width: '3rem',
                height: '3rem',
                border: '2px solid transparent',
                borderTopColor: '#4f46e5',
                borderBottomColor: '#4f46e5',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
            </div>
          ) : enseignants.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem 0',
              color: '#6b7280'
            }}>
              Aucun enseignant trouvé
            </div>
          ) : (
            <div style={{
              overflowX: 'auto'
            }}>
              <table style={{
                minWidth: '100%',
                divideY: '1px solid #e5e7eb'
              }}>
                <thead style={{
                  backgroundColor: '#f9fafb'
                }}>
                  <tr>
                    <th style={{
                      padding: '0.75rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>ID</th>
                    <th style={{
                      padding: '0.75rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Nom</th>
                    <th style={{
                      padding: '0.75rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Prénom</th>
                    <th style={{
                      padding: '0.75rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Email</th>
                    <th style={{
                      padding: '0.75rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Téléphone</th>
                    <th style={{
                      padding: '0.75rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>Spécialité</th>
                  </tr>
                </thead>
                <tbody>
                  {enseignants.map((enseignant) => (
                    <tr key={enseignant.id} style={{
                      backgroundColor: 'white',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <td style={{
                        padding: '1rem 1.5rem',
                        whiteSpace: 'nowrap',
                        fontSize: '0.875rem',
                        color: '#111827'
                      }}>{enseignant.id}</td>
                      <td style={{
                        padding: '1rem 1.5rem',
                        whiteSpace: 'nowrap',
                        fontSize: '0.875rem',
                        color: '#111827'
                      }}>{enseignant.nom}</td>
                      <td style={{
                        padding: '1rem 1.5rem',
                        whiteSpace: 'nowrap',
                        fontSize: '0.875rem',
                        color: '#111827'
                      }}>{enseignant.prenom}</td>
                      <td style={{
                        padding: '1rem 1.5rem',
                        whiteSpace: 'nowrap',
                        fontSize: '0.875rem',
                        color: '#111827'
                      }}>{enseignant.email}</td>
                      <td style={{
                        padding: '1rem 1.5rem',
                        whiteSpace: 'nowrap',
                        fontSize: '0.875rem',
                        color: '#111827'
                      }}>{enseignant.telephone}</td>
                      <td style={{
                        padding: '1rem 1.5rem',
                        whiteSpace: 'nowrap',
                        fontSize: '0.875rem',
                        color: '#111827'
                      }}>{enseignant.specialite}</td>
                      <td style={{
                        padding: '1rem 1.5rem',
                        whiteSpace: 'nowrap',
                        fontSize: '0.875rem',
                        color: '#111827'
                      }}>
                        <button
                          onClick={() => handleEditEnseignant(enseignant.id)}
                          style={{
                            color: '#4f46e5',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            marginRight: '0.75rem'
                          }}
                          title="Modifier"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteEnseignant(enseignant.id)}
                          style={{
                            color: '#dc2626',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                          title="Supprimer"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal pour ajouter/modifier un enseignant */}
        {isModalOpen && (
          <div style={{
            position: 'fixed',
            inset: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '50'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.375rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              width: '100%',
              maxWidth: '28rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h2 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold'
                }}>
                  {editingId ? 'Modifier un enseignant' : 'Ajouter un enseignant'}
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                  }}
                  style={{
                    color: '#6b7280',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <form onSubmit={handleSaveEnseignant}>
                <div style={{
                  display: 'grid',
                  gap: '1rem'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>Nom</label>
                    <input
                      type="text"
                      id="nom"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                      style={{
                        width: '100%',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        padding: '0.5rem',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>Prénom</label>
                    <input
                      type="text"
                      id="prenom"
                      value={formData.prenom}
                      onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                      style={{
                        width: '100%',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        padding: '0.5rem',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>Email</label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        padding: '0.5rem',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>Téléphone</label>
                    <input
                      type="text"
                      id="telephone"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                      style={{
                        width: '100%',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        padding: '0.5rem',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '0.25rem'
                    }}>Spécialité</label>
                    <input
                      type="text"
                      id="specialite"
                      value={formData.specialite}
                      onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                      style={{
                        width: '100%',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.375rem',
                        padding: '0.5rem',
                        outline: 'none'
                      }}
                      required
                    />
                  </div>
                </div>
                <div style={{
                  marginTop: '1.5rem',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingId(null);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      color: '#374151',
                      background: 'none',
                      cursor: 'pointer'
                    }}
                    disabled={isLoading}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#4f46e5',
                      color: 'white',
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <div style={{
                          width: '1rem',
                          height: '1rem',
                          border: '2px solid transparent',
                          borderTopColor: 'white',
                          borderBottomColor: 'white',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite',
                          marginRight: '0.5rem'
                        }}></div>
                        {editingId ? 'Mise à jour...' : 'Ajout...'}
                      </span>
                    ) : editingId ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Enseignants;