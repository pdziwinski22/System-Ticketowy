// ticket-system/src/components/UserProfileModal.jsx
import React from 'react';

export default function UserProfileModal({ user, onClose }) {
  if (!user) return null;

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <button onClick={onClose} style={closeButtonStyle}>X</button>
        <h2>Mój Profil</h2>
        <p><strong>Imię:</strong> {user.first_name}</p>
        <p><strong>Nazwisko:</strong> {user.last_name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Dział:</strong> {user.department}</p>
        <p><strong>Data dołączenia:</strong> {user.created_at}</p>
        <p><strong>Numer Telefonu:</strong> {user.phone}</p>
      </div>
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '10px',
  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
  position: 'relative',
  width: '90%',
  maxWidth: '500px',
  textAlign: 'center',
  animation: 'scaleIn 0.2s ease-out'
};

const closeButtonStyle = {
  position: 'absolute',
  top: '15px',
  right: '15px',
  background: 'none',
  border: 'none',
  fontSize: '20px',
  cursor: 'pointer',
  color: '#333'
};
