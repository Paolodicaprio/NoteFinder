import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import noteService from '../../services/noteService';
import Sidebar from '../../components/Sidebar';
import authService from '../../services/authService';
import parcourService from '../../services/parcourService';

const Notes = ({ user = { email: '', role: '' } }) => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);
  
  // États pour le formulaire d'ajout
  const [addFormData, setAddFormData] = useState({
    annee_academique: '',
    annee_etude: '',
    ue: '',
    ecue: '',
    images: null
  });

  // États pour le formulaire d'édition
  const [editFormData, setEditFormData] = useState({
    ecue_id: '',
    parcours_etudiant_id: '',
    note: ''
  });

  // Données statiques pour les sélecteurs
  const academicYears = [
    { id: '1', name: '2023-2024' },
    { id: '2', name: '2022-2023' }
  ];

  const studyYears = [
    { id: '1', name: 'GL_Licence_1' },
    { id: '2', name: 'GL_Licence_2' }
  ];

  const ues = [
    { id: '101', code: 'UE101', name: 'Mathématiques fondamentales' },
    { id: '102', code: 'UE102', name: 'Physique générale' }
  ];

  const ecues = [
    { id: '101', code: 'EC101', name: 'Algèbre Linéaire' },
    { id: '102', code: 'EC102', name: 'Analyse' }
  ];

  // Fetch all notes
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await noteService.fetchNotes();
      
      const formattedNotes = response.map((noteArray) => {
        return {
          id: noteArray[0],
          ecue_id: noteArray[1],
          parcours_etudiant_id: noteArray[2],
          matricule: noteArray[7] || 'N/A', // Le matricule est à l'index 7
          note: noteArray[3],
          created_at: noteArray[4],
          updated_at: noteArray[5]
        };
      });
      
      setNotes(formattedNotes);
      setError(null);
    } catch (error) {
      setError("Erreur lors du chargement des notes");
      console.error("Erreur fetchNotes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  // Handlers pour l'ajout
  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setAddFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddFileChange = (e) => {
    setAddFormData(prev => ({
      ...prev,
      images: e.target.files
    }));
  };

  const processImagesWithTesseract = async () => {
    if (!addFormData.images || addFormData.images.length === 0) {
      setError("Veuillez sélectionner au moins une image");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setExtractedData(null);

    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('fra');

      const processingResults = [];
      for (let i = 0; i < addFormData.images.length; i++) {
        try {
          const { data: { text } } = await worker.recognize(addFormData.images[i]);
          processingResults.push(text);
        } catch (err) {
          console.error(`Erreur sur l'image ${i + 1}:`, err);
          processingResults.push(`[ERREUR: Impossible de traiter l'image ${i + 1}]`);
        }
      }

      const combinedText = processingResults.join('\n\n---\n\n');
      setExtractedData(combinedText);
      
      await worker.terminate();
    } catch (error) {
      console.error("Erreur Tesseract:", error);
      setError("Erreur lors du traitement OCR. Vérifiez que l'image est claire et réessayez.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction pour parser le texte extrait
  const parseNotesFromText = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const notes = [];
    
    // Détection automatique du format
    const isTableFormat = lines.some(line => line.includes('|') && line.split('|').length > 3);
    const hasHeader = lines.some(line => 
      line.includes('Matricule') && 
      line.includes('Nom') && 
      line.includes('Prénom') && 
      line.includes('Note')
    );

    lines.forEach(line => {
      try {
        // Ignorer les lignes d'en-tête et séparateurs
        if (line.includes('Matricule') || line.includes('---') || line.includes('===')) {
          return;
        }

        // Format tableau avec |
        if (isTableFormat && line.includes('|')) {
          const parts = line.split('|').map(part => part.trim()).filter(part => part);
          if (parts.length >= 4) {
            const noteValue = parseFloat(parts[3].replace(',', '.'));
            if (!isNaN(noteValue)) {
              notes.push({
                matricule: parts[0],
                nom: parts[1],
                prenom: parts[2],
                note: noteValue
              });
            }
          }
        } 
        // Format ligne simple
        else {
          const cleanLine = line.replace(/\s+/g, ' ').trim();
          const parts = cleanLine.split(' ');
          
          if (parts.length >= 4) {
            const lastPart = parts[parts.length-1];
            const noteValue = parseFloat(lastPart.replace(',', '.'));
            
            if (!isNaN(noteValue)) {
              notes.push({
                matricule: parts[0],
                nom: parts[1],
                prenom: parts.slice(2, -1).join(' '), // Gère les prénoms composés
                note: noteValue
              });
            }
          }
        }
      } catch (e) {
        console.error("Erreur parsing ligne:", line, e);
      }
    });

    return notes;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    await processImagesWithTesseract();
  };

  const saveExtractedNotes = async () => {
    if (!extractedData) return;
  
    try {
      const parsedNotes = parseNotesFromText(extractedData);
      
      if (parsedNotes.length === 0) {
        throw new Error("Aucune note valide trouvée dans le document scanné.");
      }
  
      // Naviguer vers la page de résultats avec les données extraites
      navigate('/result', { 
        state: { 
          extractedNotes: parsedNotes,
          ecueId: addFormData.ecue,
          academicYear: addFormData.annee_academique,
          studyYear: addFormData.annee_etude,
          ue: addFormData.ue
        } 
      });
  
    } catch (err) {
      console.error("Erreur lors de l'extraction:", err);
      setError(err.message || "Erreur lors de l'extraction des notes");
    }
  };

  // Fonctions pour l'édition (inchangées)
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await noteService.updateNote(currentNote.id, editFormData);
      fetchNotes();
      setIsModalOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (note) => {
    setCurrentNote(note);
    setEditFormData({
      ecue_id: note.ecue_id,
      parcours_etudiant_id: note.parcours_etudiant_id,
      note: note.note
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) {
      try {
        await noteService.deleteNote(id);
        fetchNotes();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Fonction de test pour le développement
  const testOCR = () => {
    setExtractedData(`Matricule
12345678
23456789
34567890
Note
15.5
12.0
18.5`);
  };

  // Le reste du code (JSX) reste inchangé...
  // [Insérez ici tout le JSX de votre composant tel qu'il était dans la nouvelle version]

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Sidebar */}
      <Sidebar user={user} activeItem="notes" />
      
      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', marginLeft: '16rem' }}>
        {/* Content Container */}
        <div style={{ padding: '1.5rem', minHeight: '100%' }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '1.5rem', 
            backgroundColor: 'white', 
            padding: '1rem', 
            borderRadius: '0.5rem', 
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)' 
          }}>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 700, 
              color: '#1e293b', 
              display: 'flex', 
              alignItems: 'center' 
            }}>
              <i className="fas fa-pencil-alt" style={{ color: '#0d9488', marginRight: '0.5rem' }}></i>
              Gestion des Notes
            </h1>
            <div style={{ color: '#64748b' }}>
              <span style={{ marginRight: '1rem' }}>Utilisateur: <strong>{user.email}</strong></span>
              <button 
                onClick={() => {
                  authService.logout();
                  navigate("/login"); }}
                style={{
                  color: '#dc2626',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  padding: 0
                }}
              >
                Déconnexion
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: error.includes('succès') ? '#d1fae5' : '#fee2e2',
              borderLeft: `4px solid ${error.includes('succès') ? '#10b981' : '#dc2626'}`,
              color: error.includes('succès') ? '#065f46' : '#b91c1c',
              padding: '1rem',
              marginBottom: '1.5rem',
              borderRadius: '0.375rem'
            }}>
              <p>{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '1.5rem'
          }}>
            <button
              onClick={() => {
                setCurrentNote(null);
                setIsModalOpen(true);
              }}
              style={{
                backgroundColor: '#4f46e5',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <i className="fas fa-plus" style={{ marginRight: '0.5rem' }}></i>
              Ajouter une Note
            </button>
          </div>

          {/* Notes Table */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
            overflowX: 'auto'
          }}>
            {loading ? (
              <div style={{
                padding: '2rem',
                textAlign: 'center',
                color: '#64748b'
              }}>
                <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                Chargement des notes...
              </div>
            ) : (
              <table style={{
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{
                      padding: '0.75rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid #e5e7eb'
                    }}>ID</th>
                    <th style={{
                      padding: '0.75rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid #e5e7eb'
                    }}>Matricule</th>
                    <th style={{
                      padding: '0.75rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid #e5e7eb'
                    }}>ECUE</th>
                    <th style={{
                      padding: '0.75rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid #e5e7eb'
                    }}>Note</th>
                    <th style={{
                      padding: '0.75rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid #e5e7eb'
                    }}>Date</th>
                    <th style={{
                      padding: '0.75rem 1.5rem',
                      textAlign: 'left',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid #e5e7eb'
                    }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.length > 0 ? (
                    notes.map((note) => (
                      <tr key={note.id} style={{
                        borderBottom: '1px solid #e5e7eb',
                        backgroundColor: 'white',
                        ':hover': {
                          backgroundColor: '#f9fafb'
                        }
                      }}>
                        <td style={{
                          padding: '1rem 1.5rem',
                          fontSize: '0.875rem',
                          color: '#374151'
                        }}>{note.id}</td>
                         <td style={{
                          padding: '1rem 1.5rem',
                          fontSize: '0.875rem',
                          color: '#374151'
                        }}>{note.matricule}</td>
                        <td style={{
                          padding: '1rem 1.5rem',
                          fontSize: '0.875rem',
                          color: '#374151'
                        }}>{note.ecue_id}</td>
                        <td style={{
                          padding: '1rem 1.5rem',
                          fontSize: '0.875rem',
                          color: '#374151'
                        }}>{note.note}</td>
                        <td style={{
                          padding: '1rem 1.5rem',
                          fontSize: '0.875rem',
                          color: '#374151'
                        }}>{new Date(note.created_at).toLocaleDateString()}</td>
                        <td style={{
                          padding: '1rem 1.5rem',
                          fontSize: '0.875rem',
                          color: '#374151',
                          display: 'flex',
                          gap: '0.5rem'
                        }}>
                          <button
                            onClick={() => handleEdit(note)}
                            style={{
                              color: 'white',
                              backgroundColor: '#3b82f6',
                              border: 'none',
                              borderRadius: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <i className="fas fa-edit" style={{ fontSize: '0.75rem' }}></i>
                            <span>Modifier</span>
                          </button>
                          <button
                            onClick={() => handleDelete(note.id)}
                            style={{
                              color: 'white',
                              backgroundColor: '#ef4444',
                              border: 'none',
                              borderRadius: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <i className="fas fa-trash-alt" style={{ fontSize: '0.75rem' }}></i>
                            <span>Supprimer</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{
                        padding: '1.5rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        color: '#64748b',
                        fontStyle: 'italic'
                      }}>
                        Aucune note disponible
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal d'ajout */}
      {isModalOpen && !currentNote && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '100%',
            maxWidth: '32rem',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ padding: '1.5rem' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                Enregistrer une note
              </h2>
              
              <form onSubmit={handleAddSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Année académique
                  </label>
                  <select
                    name="annee_academique"
                    value={addFormData.annee_academique}
                    onChange={handleAddInputChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    required
                  >
                    <option value="">Sélectionner une année</option>
                    {academicYears.map(year => (
                      <option key={year.id} value={year.id}>{year.name}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Année Etude
                  </label>
                  <select
                    name="annee_etude"
                    value={addFormData.annee_etude}
                    onChange={handleAddInputChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    required
                  >
                    <option value="">Sélectionner une année d'étude</option>
                    {studyYears.map(year => (
                      <option key={year.id} value={year.id}>{year.name}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    UE
                  </label>
                  <select
                    name="ue"
                    value={addFormData.ue}
                    onChange={handleAddInputChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    required
                  >
                    <option value="">Sélectionner une UE</option>
                    {ues.map(ue => (
                      <option key={ue.id} value={ue.id}>{ue.code} - {ue.name}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    ECUE
                  </label>
                  <select
                    name="ecue"
                    value={addFormData.ecue}
                    onChange={handleAddInputChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    required
                  >
                    <option value="">Sélectionner un ECUE</option>
                    {ecues.map(ecue => (
                      <option key={ecue.id} value={ecue.id}>{ecue.code} - {ecue.name}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Choisir des images :
                  </label>
                  <input
                    type="file"
                    name="images"
                    onChange={handleAddFileChange}
                    multiple
                    ref={fileInputRef}
                    accept="image/*"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {addFormData.images ? `${addFormData.images.length} fichier(s) sélectionné(s)` : 'Aucun fichier choisi'}
                  </div>
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setCurrentNote(null);
                    }}
                    style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      fontWeight: 600,
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    style={{
                      backgroundColor: isProcessing ? '#9ca3af' : '#4f46e5',
                      color: 'white',
                      fontWeight: 600,
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    {isProcessing ? (
                      <>
                        <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                        Traitement...
                      </>
                    ) : 'Scanner et extraire'}
                  </button>
                </div>

                {/* Debug en développement */}
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.375rem' }}>
                    <h4 style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Debug (développement seulement)</h4>
                    <button 
                      onClick={testOCR}
                      style={{
                        backgroundColor: '#6b7280',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.75rem'
                      }}
                    >
                      Charger des données de test
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {isModalOpen && currentNote && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '100%',
            maxWidth: '32rem',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ padding: '1.5rem' }}>
              <h2 style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '1rem'
              }}>
                Modifier la note
              </h2>
              
              <form onSubmit={handleEditSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    ID ECUE
                  </label>
                  <input
                    type="number"
                    name="ecue_id"
                    value={editFormData.ecue_id}
                    onChange={handleEditInputChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    required
                  />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    ID Parcours Étudiant
                  </label>
                  <input
                    type="number"
                    name="parcours_etudiant_id"
                    value={editFormData.parcours_etudiant_id}
                    onChange={handleEditInputChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    required
                  />
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Note
                  </label>
                  <input
                    type="number"
                    name="note"
                    min="0"
                    max="20"
                    step="0.1"
                    value={editFormData.note}
                    onChange={handleEditInputChange}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #d1d5db',
                      fontSize: '0.875rem',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                    required
                  />
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.5rem'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setCurrentNote(null);
                    }}
                    style={{
                      backgroundColor: '#6b7280',
                      color: 'white',
                      fontWeight: 600,
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    style={{
                      backgroundColor: '#4f46e5',
                      color: 'white',
                      fontWeight: 600,
                      padding: '0.5rem 1rem',
                      borderRadius: '0.375rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.875rem'
                    }}
                  >
                    Mettre à jour
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'affichage des données extraites */}
      {extractedData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '1rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            width: '100%',
            maxWidth: '48rem',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ padding: '2rem' }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#10b981',
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                Données extraites
              </h2>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <pre style={{ 
                  backgroundColor: '#f8fafc', 
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  border: '1px solid #e2e8f0'
                }}>
                  {extractedData}
                </pre>
              </div>

              <div style={{ 
                backgroundColor: '#f8fafc',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Notes détectées:</h3>
                {(() => {
                  const parsedNotes = parseNotesFromText(extractedData);
                  return parsedNotes.length > 0 ? (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#e2e8f0' }}>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Matricule</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Nom</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Prénom</th>
                          <th style={{ padding: '0.5rem', textAlign: 'left' }}>Note</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedNotes.map((note, index) => (
                          <tr key={index}>
                            <td style={{ padding: '0.5rem' }}>{note.matricule}</td>
                            <td style={{ padding: '0.5rem' }}>{note.nom}</td>
                            <td style={{ padding: '0.5rem' }}>{note.prenom}</td>
                            <td style={{ padding: '0.5rem' }}>{note.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                      Aucune note valide détectée dans le texte extrait
                    </p>
                  );
                })()}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '1.5rem'
              }}>
                <button
                  onClick={() => {
                    setExtractedData(null);
                    setIsModalOpen(true);
                  }}
                  style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={saveExtractedNotes}
                  disabled={isProcessing}
                  style={{
                    backgroundColor: isProcessing ? '#9ca3af' : '#10b981',
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}
                >
                  {isProcessing ? (
                    <>
                      <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                      Enregistrement...
                    </>
                  ) : 'Enregistrer les notes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notes;