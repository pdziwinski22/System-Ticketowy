// src/app/dashboard/page.jsx
'use client';

import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import './styles.css';
import { getUserFromToken } from '@/decoder/useUser';
export default function DashboardPage() {
  // bez useEffect — czytamy usera z JWT (UTF-8 safe)
  const user = getUserFromToken() ?? { first_name: '', last_name: '', email: '' };

  return (
    <div className="dashboard-page-container">
      <UserMenu />

      <div className="dashboard-welcome-box">
        <h2 className="dashboard-welcome-title">
          Witaj, {user.first_name} {user.last_name}
        </h2>
        <p className="dashboard-welcome-subtitle">{user.email}</p>
      </div>

      <div className="dashboard-cards-grid">
        <Tile
          href="/dashboard/new-ticket"
          icon="📝"
          title="Utwórz Ticket"
          description="Szybko stwórz nowy ticket."
        />
        <Tile
          href="/dashboard/tickets"
          icon="📋"
          title="Przeglądaj Tickety"
        />
        <Tile
          href="/dashboard/archived-tickets"
          icon="📦"
          title="Tickety Archiwalne"
          description="Dostęp do starych, zarchiwizowanych ticketów."
        />
      </div>
    </div>
  );
}

function Tile({ href, icon, title, description }) {
  return (
    <Link href={href} aria-label={title}>
      <div className="dashboard-card">
        <div className="card-icon" aria-hidden>{icon}</div>
        <div className="card-title">{title}</div>
        {description && <div className="card-description">{description}</div>}
      </div>
    </Link>
  );
}
