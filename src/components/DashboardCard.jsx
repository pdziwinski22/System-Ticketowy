// src/components/DashboardCard.jsx
'use client';

import { useRouter } from 'next/navigation';

export default function DashboardCard({ icon, title, description, href }) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    }
  };

  return (
    <div className="dashboard-card" onClick={handleClick}>
      <span className="card-icon">{icon}</span>
      <h2 className="card-title">{title}</h2>
      <p className="card-description">{description}</p>
    </div>
  );
}
