import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import noteService from '../../services/noteService';
import offreService from '../../services/offreService';
import parcourService from '../../services/parcourService';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [notes, setNotes] = useState([]);
  const [ecues, setEcues] = useState([]);
  const [parcours, setParcours] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [failedSubmissions, setFailedSubmissions] = useState([]);

  // Transforme les données brutes des ECUEs en format utilisable
  const transformEcuesData = (ecuesArray) => {
    if (!Array.isArray(ecuesArray)) {
      console.error("Données ECUEs invalides:", ecuesArray);
      return [];
    }
    return ecuesArray.map(ecue => ({
      id: ecue[0] || '',        // ecue_id
      code: ecue[1] || '',      // code ECUE
      name: ecue[2] || ''       // nom ECUE
    })).filter(ecue => ecue.id && ecue.code);
  };
  
  // Transforme les données brutes des parcours en format utilisable
  const transformParcoursData = (parcoursArray) => {
    if (!Array.isArray(parcoursArray)) {
      console.error("Données Parcours invalides:", parcoursArray);
      return [];
    }
    return parcoursArray.map(parcour => ({
      id: parcour[0] || '',     // parcours_etudiant_id
      matricule: parcour[1] || '',
      nom: parcour[9] || '',    // nom étudiant
      prenom: parcour[10] || '' // prénom étudiant
    })).filter(parcour => parcour.id && parcour.matricule);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Charge les ECUEs et parcours avec une meilleure gestion d'erreur
        const [ecuesResponse, parcoursResponse] = await Promise.all([
          offreService.getEcues().catch(err => {
            console.error("Erreur chargement ECUEs:", err);
            throw new Error("Impossible de charger les ECUEs");
          }),
          parcourService.getParcours().catch(err => {
            console.error("Erreur chargement Parcours:", err);
            throw new Error("Impossible de charger les parcours étudiants");
          })
        ]);
  
        setEcues(transformEcuesData(ecuesResponse));
        setParcours(transformParcoursData(parcoursResponse));
  
        // Initialise les notes avec les données OCR extraites
        if (location.state?.extractedNotes) {
          const initialNotes = location.state.extractedNotes.map(note => ({
            ecue_id: '',
            parcours_etudiant_id: note.matricule || '',
            note: parseFloat(note.note) || 0,
            originalData: note 
          }));
          setNotes(initialNotes);
        }
        
      } catch (err) {
        console.error("Erreur lors du chargement:", err);
        setError(err.message || "Erreur lors du chargement des données nécessaires");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [location.state]);

  const handleNoteChange = (index, field, value) => {
    const updatedNotes = [...notes];
    // Convertit en nombre si c'est le champ note
    updatedNotes[index][field] = field === 'note' ? parseFloat(value) || 0 : value;
    setNotes(updatedNotes);
  };

  const handleDelete = (index) => {
    const updatedNotes = notes.filter((_, i) => i !== index);
    setNotes(updatedNotes);
    setSelectedRows(selectedRows.filter(i => i !== index));
  };

  const addNewRow = () => {
    setNotes([...notes, {
      ecue_id: '',
      parcours_etudiant_id: '',
      note: 0
    }]);
  };

  const saveNotes = async () => {
    // Validation des données
    const invalidNotes = notes.filter(note => 
      !note.ecue_id || 
      !note.parcours_etudiant_id || 
      isNaN(note.note) ||
      note.note < 0 || 
      note.note > 20
    );
  
    if (invalidNotes.length > 0) {
      setError("Certaines notes ont des valeurs invalides. Veuillez vérifier.");
      return;
    }
  
    setIsSaving(true);
    setError(null);
    setSuccess(null);
    setFailedSubmissions([]);
  
    const totalNotes = notes.length;
    let successCount = 0;
    const failedNotes = [];
  
    for (let i = 0; i < totalNotes; i++) {
      try {
        const note = notes[i];
        
        // Petit délai entre les requêtes
        if (i > 0) await new Promise(resolve => setTimeout(resolve, 100));
        
        await noteService.addNote({
          ecue_id: parseInt(note.ecue_id, 10),
          parcours_etudiant_id: parseInt(note.parcours_etudiant_id, 10),
          note: parseFloat(note.note)
        });
        
        successCount++;
      } catch (err) {
        console.error(`Échec enregistrement note ${i + 1}:`, err);
        failedNotes.push(notes[i]);
      }
    }
  
    setIsSaving(false);
  
    if (failedNotes.length > 0) {
      setFailedSubmissions(failedNotes);
      setError(`${failedNotes.length} notes n'ont pas pu être enregistrées sur ${totalNotes}.`);
    }
  
    if (successCount > 0) {
      setSuccess(`${successCount} notes enregistrées avec succès!`);
      if (failedNotes.length === 0) {
        setTimeout(() => navigate('/notes'), 2000);
      }
    }
  };

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Chargement en cours...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '24px'
      }}>
        <h1 style={{ 
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '24px',
          color: '#1e293b'
        }}>
          Validation des notes
        </h1>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#dcfce7',
            color: '#166534',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            {success}
          </div>
        )}

        <div style={{ marginBottom: '16px', textAlign: 'right' }}>
          <button
            onClick={addNewRow}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Ajouter une note
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%',
            borderCollapse: 'collapse',
            marginBottom: '24px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>ECUE</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Étudiant</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #e5e7eb' }}>Note</th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #e5e7eb' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {notes.map((note, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                    <select
                      value={note.ecue_id}
                      onChange={(e) => handleNoteChange(index, 'ecue_id', e.target.value)}
                      style={{ width: '100%', padding: '8px' }}
                      required
                    >
                      <option value="">Sélectionner un ECUE</option>
                      {ecues.map(ecue => (
                        <option key={ecue.id} value={ecue.id}>
                          {ecue.code} - {ecue.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                    <select
                      value={note.parcours_etudiant_id}
                      onChange={(e) => handleNoteChange(index, 'parcours_etudiant_id', e.target.value)}
                      style={{ width: '100%', padding: '8px' }}
                      required
                    >
                      <option value="">Sélectionner un étudiant</option>
                      {parcours.map(parcour => (
                        <option key={parcour.id} value={parcour.id}>
                          {parcour.matricule} - {parcour.nom} {parcour.prenom}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb' }}>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.1"
                      value={note.note}
                      onChange={(e) => handleNoteChange(index, 'note', e.target.value)}
                      style={{ width: '100%', padding: '8px' }}
                      required
                    />
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                    <button
                      onClick={() => handleDelete(index)}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        padding: '8px 12px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {failedSubmissions.length > 0 && (
          <div style={{ 
            backgroundColor: '#ffedd5',
            padding: '16px',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            <h3 style={{ color: '#9a3412', marginBottom: '8px' }}>Échecs d'enregistrement :</h3>
            <ul>
              {failedSubmissions.map((note, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>
                  {note.originalData?.nom || 'Étudiant inconnu'} - Note: {note.note}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={() => navigate('/notes')}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Annuler
          </button>
          <button
            onClick={saveNotes}
            disabled={isSaving || notes.length === 0}
            style={{
              backgroundColor: isSaving ? '#9ca3af' : '#10b981',
              color: 'white',
              padding: '12px 24px',
              border: 'none',
              borderRadius: '4px',
              cursor: isSaving ? 'not-allowed' : 'pointer'
            }}
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer les notes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;