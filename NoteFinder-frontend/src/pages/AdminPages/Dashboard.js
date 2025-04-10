import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import authService from "../../services/authService";
import Card from "../../components/Card";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          navigate("/login");
        } else {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur :", error);
        navigate("/login");
      }
    };
    fetchUser();
  }, [navigate]);

  const menuItems = [
    { 
      title: "Années & Grades", 
      icon: "fa-calendar-alt", 
      link: "/annees", 
      color: "#16a34a",
      description: "Gérez les années académiques et les grades"
    },
    { 
      title: "Filières", 
      icon: "fa-book", 
      link: "/filieres", 
      color: "#e53e3e",
      description: "Gérez les filières disponibles"
    },
    { 
      title: "Étudiants", 
      icon: "fa-user-graduate", 
      link: "/etudiants", 
      color: "#9333ea",
      description: "Gérez les informations des étudiants"
    },
    { 
      title: "Notes", 
      icon: "fa-pencil-alt", 
      link: "/notes", 
      color: "#0d9488",
      description: "Gérez les notes des étudiants"
    },
    { 
      title: "Enseignants", 
      icon: "fa-user", 
      link: "/enseignants", 
      color: "#854d0e",
      description: "Gérez les informations des enseignants"
    },
    { 
      title: "Utilisateurs", 
      icon: "fa-users", 
      link: "/users", 
      color: "#4f46e5",
      description: "Gérez les utilisateurs du système"
    }
  ];

  return (
    <div style={{ 
      display: "flex", 
      backgroundColor: "#f8fafc", 
      minHeight: "100vh",
      fontFamily: "'Inter', sans-serif"
    }}>
      <Sidebar user={user} />
      
      <div style={{ 
        flex: 1, 
        padding: "32px",
        marginLeft: "280px" // Correspond à la largeur de la sidebar
      }}>
        {/* Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "32px", 
          backgroundColor: "#ffffff", 
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)", 
          padding: "20px 24px", 
          borderRadius: "12px",
          border: "1px solid #e2e8f0"
        }}>
          <div>
            <h1 style={{ 
              fontSize: "24px", 
              fontWeight: 600, 
              color: "#1e293b",
              margin: 0
            }}>
              Tableau de Bord
            </h1>
            <p style={{ 
              fontSize: "14px", 
              color: "#64748b", 
              margin: "4px 0 0 0"
            }}>
              Bienvenue sur votre espace d'administration
            </p>
          </div>
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "16px"
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              backgroundColor: "#f1f5f9", 
              padding: "8px 12px", 
              borderRadius: "8px"
            }}>
              <i className="fas fa-user-circle" style={{ 
                fontSize: "20px", 
                color: "#475569", 
                marginRight: "8px"
              }}></i>
              <span style={{ 
                fontSize: "14px", 
                color: "#334155"
              }}>
                {user ? user.email : "Chargement..."}
              </span>
            </div>
            
            <button
              onClick={() => {
                authService.logout();
                navigate("/login");
              }}
              style={{ 
                backgroundColor: "#fef2f2", 
                color: "#dc2626", 
                padding: "8px 16px", 
                borderRadius: "8px", 
                border: "none", 
                cursor: "pointer", 
                fontSize: "14px",
                fontWeight: 500,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)"
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#fee2e2";
                e.currentTarget.style.color = "#b91c1c";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#fef2f2";
                e.currentTarget.style.color = "#dc2626";
              }}
            >
              <i className="fas fa-sign-out-alt"></i>
              Déconnexion
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
          gap: "24px"
        }}>
          {menuItems.map((item, index) => (
            <Card 
              key={index}
              title={item.title}
              icon={item.icon}
              link={item.link}
              color={item.color}
              description={item.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;