import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = ({ user }) => {
  const location = useLocation();

  // Déplacez les menuItems directement dans le composant
  const menuItems = [
    { name: "Tableau de bord", icon: "fa-tachometer-alt", link: "/dashboard" },
    { name: "Gestion des années", icon: "fa-calendar-alt", link: "/annees" },
    { name: "Gestion des filières", icon: "fa-book", link: "/filieres" },
    { name: "Gestion des étudiants", icon: "fa-user-graduate", link: "/etudiants" },
    { name: "Gestion des notes", icon: "fa-pencil-alt", link: "/notes" },
    { name: "Gestion des enseignants", icon: "fa-user", link: "/enseignants" },
    { name: "Gestion des utilisateurs", icon: "fa-users", link: "/users" },
  ];

  return (
    <div style={{
      width: '280px',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.03)',
      padding: '24px 0',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100,
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Logo / Header */}
      <div style={{
        padding: '0 24px 24px',
        borderBottom: '1px solid #f1f5f9',
        marginBottom: '24px'
      }}>
        <h1 style={{
          fontSize: '20px',
          fontWeight: 700,
          color: '#4f46e5',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <i className="fas fa-graduation-cap"></i>
          <span>NoteFinder</span>
        </h1>
        {user && (
          <p style={{
            fontSize: '13px',
            color: '#64748b',
            margin: '8px 0 0 32px'
          }}>
            Connecté en tant que {user.role}
          </p>
        )}
      </div>
      
      {/* Menu Items */}
      <ul style={{ 
        listStyle: 'none', 
        padding: 0,
        flex: 1,
        overflowY: 'auto'
      }}>
        {menuItems.map((item, index) => (
          <li key={index}>
            <Link 
              to={item.link}
              style={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                color: location.pathname === item.link ? '#4f46e5' : '#475569',
                padding: '12px 24px',
                margin: '4px 0',
                borderRadius: '0 8px 8px 0',
                backgroundColor: location.pathname === item.link ? '#eef2ff' : 'transparent',
                transition: 'all 0.2s ease',
                borderLeft: location.pathname === item.link ? '3px solid #4f46e5' : '3px solid transparent',
                fontWeight: location.pathname === item.link ? 500 : 400
              }}
            >
              <i 
                className={`fas ${item.icon}`} 
                style={{
                  width: '24px',
                  textAlign: 'center',
                  marginRight: '12px',
                  color: 'inherit'
                }}
              ></i>
              <span style={{ fontSize: '14px' }}>{item.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      
      {/* User Footer */}
      {user && (
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #f1f5f9',
          marginTop: 'auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#e0e7ff',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 600
            }}>
              {user.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#1e293b',
                margin: 0
              }}>{user.email}</p>
              <p style={{
                fontSize: '12px',
                color: '#64748b',
                margin: '4px 0 0 0'
              }}>{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;