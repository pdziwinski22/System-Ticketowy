'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import UserProfileModal from './UserProfileModal';
import { getUserFromToken } from '@/decoder/useUser';

const ADMIN_EMAIL = 'patryk.dziwinski@yahoo.com';

export default function UserMenu() {
  const [showMenu, setShowMenu] = useState(false);
  const user = getUserFromToken() ?? { first_name: '', last_name: '', email: '' };
  const [showProfileModal, setShowProfileModal] = useState(false);
  const router = useRouter();
  const menuRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch {
        console.warn('Invalid token format');
      }
    }

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    // czyścimy cookie (frontowo)
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push('/');
  };

  const openProfileModal = () => {
    setShowMenu(false);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
  };

  // Admin tylko dla przypisanego e-maila
  const canSeeAdmin = (user?.email || '').toLowerCase() === ADMIN_EMAIL;

  const goToAdmin = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    // Możesz ustawić cookie lżejszym sposobem; API i tak broni się JWT
    document.cookie = `token=${token}; path=/; samesite=lax`;
    router.push('/dashboard/admin');
  };

  return (
    <div className="top-menu-container" ref={menuRef}>
      <button
        onClick={() => setShowMenu((prev) => !prev)}
        className="top-menu-button"
      >
        <span className="user-name-display">{user.first_name || 'Użytkownik'}</span>{' '}
        <span className="menu-icon">⌄</span>
      </button>

      {showMenu && (
        <div className="top-menu-dropdown">
          <div className="dropdown-header">
            <div className="dropdown-user-initials">
              {user.first_name ? user.first_name.charAt(0) : ''}
              {user.last_name ? user.last_name.charAt(0) : ''}
            </div>
            <div>
              <div className="dropdown-user-name">
                {user.first_name} {user.last_name}
              </div>
              <div className="dropdown-user-email">{user.email}</div>
            </div>
          </div>
          <ul className="dropdown-list">
            <li onClick={openProfileModal}>
              <span>👤</span> Mój profil
            </li>
            <li>
              <span>⚙️</span> Ustawienia
            </li>

            {canSeeAdmin && (
              <li onClick={goToAdmin}>
                <span>🔑</span> Admin Panel
              </li>
            )}

            <li onClick={logout} className="logout-item">
              <span>🚪</span> Wyloguj się
            </li>
          </ul>
        </div>
      )}

      {showProfileModal && (
        <UserProfileModal user={user} onClose={closeProfileModal} />
      )}
    </div>
  );
}
