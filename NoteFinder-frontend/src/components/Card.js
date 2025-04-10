import React from "react";
import { Link } from "react-router-dom";

const Card = ({ title, icon, link, color, description }) => {
  return (
    <Link to={link} style={{ textDecoration: "none" }}>
      <div style={{ 
        backgroundColor: "#ffffff",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        height: "100%",
        border: "1px solid #e2e8f0",
        position: "relative",
        overflow: "hidden",
        ':hover': {
          transform: "translateY(-4px)",
          boxShadow: `0 10px 20px -5px rgba(${hexToRgb(color)}, 0.15)`,
          borderColor: `${color}20`
        }
      }}>
        {/* Icône avec fond coloré */}
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          backgroundColor: `${color}15`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
          color: color,
          fontSize: "20px"
        }}>
          <i className={`fas ${icon}`}></i>
        </div>
        
        {/* Titre */}
        <h3 style={{ 
          fontSize: "16px",
          fontWeight: 600,
          color: "#1e293b",
          margin: "0 0 8px 0"
        }}>
          {title}
        </h3>
        
        {/* Description */}
        <p style={{ 
          fontSize: "14px",
          color: "#64748b",
          margin: 0,
          lineHeight: "1.5"
        }}>
          {description}
        </p>
        
        {/* Lien discret */}
        <div style={{
          position: "absolute",
          bottom: "16px",
          right: "16px",
          color: color,
          fontSize: "14px",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          opacity: 0,
          transition: "opacity 0.2s ease",
          ':hover': {
            opacity: 1
          }
        }}>
          Accéder
          <i className="fas fa-chevron-right" style={{ fontSize: "12px" }}></i>
        </div>
        
        {/* Effet de bordure colorée au hover */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "4px",
          height: "100%",
          backgroundColor: color,
          transform: "translateX(-100%)",
          transition: "transform 0.3s ease",
          ':hover': {
            transform: "translateX(0)"
          }
        }}></div>
      </div>
    </Link>
  );
};

// Fonction utilitaire pour convertir les couleurs hex en rgb
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export default Card;