// src/app/dashboard/layout.jsx
import './bg.css';

export default function DashboardLayout({ children }) {
  return (
    <div className="authed-bg">
      {children}
    </div>
  );
}
