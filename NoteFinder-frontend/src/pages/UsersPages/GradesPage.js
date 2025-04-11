import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import noteService from '../../services/noteService';
import parcourService from '../../services/parcourService';
import { fetchAnneesAcademiques } from '../../services/anneeService';

function GradesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);
  const [filteredGrades, setFilteredGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchMatricule, setSearchMatricule] = useState('');
  const [studentInfo, setStudentInfo] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  
  const [apiStatus, setApiStatus] = useState({
    notes: { loading: false, error: null },
    parcours: { loading: false, error: null },
    annees: { loading: false, error: null }
  });

  // Configuration du timeout
  const API_TIMEOUT = 10000; // 10 secondes

  const fetchDataWithRetry = async (serviceCall, resourceName, maxRetries = 3) => {
    let lastError = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

        const response = await serviceCall({ signal: controller.signal });
        clearTimeout(timeoutId);
        return response;

      } catch (error) {
        lastError = error;
        console.warn(`Tentative ${attempt + 1} échouée pour ${resourceName}:`, error.message);
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Récupération des années académiques
        const anneesData = await fetchDataWithRetry(
          () => fetchAnneesAcademiques(),
          'années académiques'
        );

        // Vérification du format des données
        if (!Array.isArray(anneesData)) {
          throw new Error('Format de données invalide pour les années académiques');
        }

        // 2. Récupération des parcours
        const parcoursData = await fetchDataWithRetry(
          () => parcourService.getParcours(),
          'parcours étudiants'
        );

        // 3. Récupération des notes
        const notesData = await fetchDataWithRetry(
          () => noteService.fetchNotes(),
          'notes'
        );

        // Création des mappings
        const anneesMap = new Map(anneesData.map(item => [item[0], item[1]]));
        
        const parcoursMap = new Map(
          parcoursData.map(item => [
            item[0], {
              matricule: item[1],
              annee_academique_id: item[3],
              nom: item[9],
              prenom: item[10]
            }
          ])
        );

        // Formatage des notes
        const formattedGrades = notesData.map(note => {
          const parcour = parcoursMap.get(note[2]) || {};
          const anneeAcademique = parcour.annee_academique_id 
            ? anneesMap.get(parcour.annee_academique_id) 
            : 'N/A';

          return {
            id: note[0],
            ecue_id: note[1],
            matricule: parcour.matricule || 'N/A',
            nom: parcour.nom || 'N/A',
            prenom: parcour.prenom || 'N/A',
            note: parseFloat(note[3]) || 0,
            date: new Date(note[4]).toLocaleDateString('fr-FR'),
            annee_academique: anneeAcademique
          };
        });

        setGrades(formattedGrades);
        setFilteredGrades(formattedGrades);

      } catch (error) {
        console.error('Erreur fatale:', {
          message: error.message,
          stack: error.stack
        });

        setError(`Erreur: ${error.message}. ${retryCount < 2 ? 'Nouvelle tentative dans 5 secondes...' : ''}`);

        if (retryCount < 2) {
          setTimeout(() => setRetryCount(c => c + 1), 5000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [location.state, retryCount]);

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

  function ApiStatusIndicator() {
    return (
      <div style={{
        marginTop: '20px',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <h4>Statut des APIs:</h4>
        <div>
          <span style={{ fontWeight: 'bold' }}>Notes:</span>
          {apiStatus.notes.loading ? ' ⏳' : apiStatus.notes.error ? ' ❌' : ' ✅'}
        </div>
        <div>
          <span style={{ fontWeight: 'bold' }}>Parcours:</span>
          {apiStatus.parcours.loading ? ' ⏳' : apiStatus.parcours.error ? ' ❌' : ' ✅'}
        </div>
        <div>
          <span style={{ fontWeight: 'bold' }}>Années:</span>
          {apiStatus.annees.loading ? ' ⏳' : apiStatus.annees.error ? ' ❌' : ' ✅'}
        </div>
        {retryCount > 0 && (
          <div style={{ marginTop: '10px', color: '#6c757d' }}>
            Tentative de rechargement #{retryCount + 1}
          </div>
        )}
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
        <>
          <div style={{ 
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
          <ApiStatusIndicator />
        </>
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