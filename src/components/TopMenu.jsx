'use client';
import { useState } from 'react';

export default function TopMenu({ user }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'absolute', top: '10px', right: '20px' }}>
      <div onClick={() => setOpen(!open)} style={{ cursor: 'pointer', fontWeight: 'bold', background: '#3b82f6', color: '#fff', padding: '8px 12px', borderRadius: '8px' }}>
        ☰ {user.first_name} {user.last_name}
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '40px', right: 0,
          background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden'
        }}>
          <a href="#" style={menuItem}>👤 Mój profil</a>
          <a href="#" style={menuItem}>⚙️ Ustawienia</a>
          <a href="/api/logout" style={{ ...menuItem, color: 'red' }}>🚪 Wyloguj się</a>
        </div>
      )}
    </div>
  );
}

const menuItem = {
  display: 'block',
  padding: '10px 20px',
  textDecoration: 'none',
  color: '#333',
  borderBottom: '1px solid #eee'
};
