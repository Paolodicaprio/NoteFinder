import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import noteService from '../../services/noteService';
import parcourService from '../../services/parcourService';

function GradesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchMatricule, setSearchMatricule] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [error, setError] = useState(null);

  // Fonction pour récupérer les données avec gestion d'erreur
  const fetchDataWithRetry = async (fetchFunction, maxRetries = 3) => {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const response = await fetchFunction();
        return response;
      } catch (err) {
        retries++;
        if (retries === maxRetries) {
          throw err;
        }
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
  };

  // Transforme les données brutes des parcours en format utilisable (identique à ResultPage)
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
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (location.state?.extractedNotes) {
          const convertedGrades = location.state.extractedNotes.map((note, index) => ({
            id: index + 1,
            matricule: note.matricule,
            nom: note.nom,
            prenom: note.prenom,
            note: note.note,
            ecue_id: note.ecue_id || 'N/A',
            annee_academique: note.annee_academique || 'N/A',
            date: note.date || new Date().toLocaleDateString('fr-FR')
          }));
          setGrades(convertedGrades);
          setFilteredGrades(convertedGrades);
          return;
        }

        // Récupération des données depuis les APIs avec retry
        const [notesData, parcoursData] = await Promise.all([
          fetchDataWithRetry(() => noteService.fetchNotes()),
          fetchDataWithRetry(() => parcourService.getParcours())
        ]);

        // Vérification des données reçues
        if (!Array.isArray(notesData)) throw new Error("Format de données notes invalide");
        if (!Array.isArray(parcoursData)) throw new Error("Format de données parcours invalide");

        // Transformation des données des parcours
        const transformedParcours = transformParcoursData(parcoursData);

        // Création du mapping des parcours
        const parcoursMap = new Map();
        transformedParcours.forEach(parcour => {
          parcoursMap.set(parcour.id, parcour);
        });

        // Construction des notes formatées
        const formattedGrades = notesData.map(note => {
          try {
            const parcoursId = note[2]; // parcours_etudiant_id
            const parcour = parcoursMap.get(parcoursId) || { 
              matricule: 'N/A', 
              nom: 'N/A', 
              prenom: 'N/A' 
            };

            return {
              id: note[0],
              ecue_id: note[1],
              parcours_etudiant_id: parcoursId,
              note: parseFloat(note[3]) || 0,
              date: new Date(note[4]).toLocaleDateString('fr-FR'),
              matricule: parcour.matricule,
              nom: parcour.nom,
              prenom: parcour.prenom,
              annee_etude: note[19] || 'N/A',
              annee_academique: note[25] || 'N/A'
            };
          } catch (err) {
            console.error("Erreur de formatage d'une note:", err, note);
            return null;
          }
        }).filter(grade => grade !== null);

        setGrades(formattedGrades);
        setFilteredGrades(formattedGrades);

        // Gestion du matricule spécifique si présent
        if (location.state?.studentMatricule) {
          const matricule = location.state.studentMatricule;
          setSearchMatricule(matricule);
          // Trouver l'étudiant dans les parcours transformés
          const etudiant = transformedParcours.find(p => p.matricule === matricule) || {};
          setStudentInfo({
            matricule,
            nom: location.state.studentNom || etudiant.nom || 'N/A',
            prenom: location.state.studentPrenom || etudiant.prenom || 'N/A'
          });
        }
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        setError(err.message || "Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [location.state]);

  useEffect(() => {
    if (searchMatricule) {
      const filtered = grades
        .filter(grade => {
          const matricule = grade.matricule?.toString() || '';
          return matricule.includes(searchMatricule);
        })
        .sort((a, b) => {
          const aYear = a.annee_academique || '';
          const bYear = b.annee_academique || '';
          return aYear.localeCompare(bYear);
        });
      setFilteredGrades(filtered);
    } else {
      setFilteredGrades([...grades].sort((a, b) => {
        const aYear = a.annee_academique || '';
        const bYear = b.annee_academique || '';
        return aYear.localeCompare(bYear);
      }));
    }
  }, [searchMatricule, grades]);

  const handleBackToDashboard = () => {
    navigate('/dash');
  };

  if (loading) {
    return (
      <div style={{ 
        margin: '20px', 
        padding: '20px', 
        textAlign: 'center',
        color: '#64748b'
      }}>
        <i className="fas fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
        Chargement des notes...
      </div>
    );
  }

  return (
    <div style={{ 
      margin: '20px', 
      padding: '20px', 
      backgroundColor: 'white',
      borderRadius: '10px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
      position: 'relative'
    }}>
      {/* Bouton de retour */}
      <button
        onClick={handleBackToDashboard}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: '#4f46e5',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <i className="fas fa-arrow-left"></i>
        Retour au dashboard
      </button>

      <h1 style={{ 
        fontSize: '24px',
        fontWeight: 600,
        color: '#4f46e5',
        textAlign: 'center',
        marginBottom: '20px',
        marginTop: '10px'
      }}>
        {studentInfo ? `Notes de l'étudiant ${studentInfo.prenom} ${studentInfo.nom}` : 'Notes des étudiants'}
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

      {!studentInfo && (
        <div style={{ marginBottom: '20px', marginTop: '40px' }}>
          <label style={{ 
            display: 'block',
            marginBottom: '8px',
            fontWeight: 500,
            color: '#334155'
          }}>
            Rechercher par matricule:
          </label>
          <input
            type="text"
            value={searchMatricule}
            onChange={(e) => setSearchMatricule(e.target.value)}
            placeholder="Entrez un matricule..."
            style={{
              width: '100%',
              maxWidth: '300px',
              padding: '8px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
      )}

      {filteredGrades.length > 0 ? (
        <div style={{ 
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          overflow: 'hidden',
          marginTop: '20px'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: '#f8fafc' }}>
              <tr>
                {!studentInfo && (
                  <>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      color: '#64748b',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      Matricule
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      color: '#64748b',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      Nom
                    </th>
                    <th style={{ 
                      padding: '12px 16px', 
                      textAlign: 'left', 
                      fontSize: '14px', 
                      fontWeight: 500, 
                      color: '#64748b',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      Prénom
                    </th>
                  </>
                )}
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#64748b',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  ECUE
                </th>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'right', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#64748b',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  Note
                </th>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#64748b',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  Année Acad.
                </th>
                <th style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#64748b',
                  borderBottom: '1px solid #e2e8f0'
                }}>
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGrades.map((grade) => (
                <tr key={grade.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  {!studentInfo && (
                    <>
                      <td style={{ 
                        padding: '12px 16px', 
                        fontSize: '14px', 
                        color: '#334155'
                      }}>
                        {grade.matricule}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        fontSize: '14px', 
                        color: '#334155'
                      }}>
                        {grade.nom}
                      </td>
                      <td style={{ 
                        padding: '12px 16px', 
                        fontSize: '14px', 
                        color: '#334155'
                      }}>
                        {grade.prenom}
                      </td>
                    </>
                  )}
                  <td style={{ 
                    padding: '12px 16px', 
                    fontSize: '14px', 
                    color: '#334155'
                  }}>
                    {grade.ecue_id}
                  </td>
                  <td style={{ 
                    padding: '12px 16px', 
                    fontSize: '14px', 
                    fontWeight: 600,
                    color: grade.note >= 10 ? '#10b981' : '#ef4444',
                    textAlign: 'right'
                  }}>
                    {grade.note}
                  </td>
                  <td style={{ 
                    padding: '12px 16px', 
                    fontSize: '14px', 
                    color: '#334155'
                  }}>
                    {grade.annee_academique}
                  </td>
                  <td style={{ 
                    padding: '12px 16px', 
                    fontSize: '14px', 
                    color: '#334155'
                  }}>
                    {grade.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ 
          padding: '24px', 
          textAlign: 'center', 
          color: '#64748b',
          fontStyle: 'italic',
          marginTop: '20px'
        }}>
          Aucune note disponible {searchMatricule && `pour le matricule ${searchMatricule}`}
        </div>
      )}
    </div>
  );
}

export default GradesPage;