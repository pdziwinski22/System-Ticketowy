'use client';
import { useEffect, useState } from 'react';
import BackButton from '@/components/BackButton'; // ⬅️ NOWE

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [query, setQuery] = useState('');

  const showToast = (msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(()=>({}));
        throw new Error(data.message || 'Błąd pobierania');
      }
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      showToast(e.message || 'Błąd pobierania', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const act = async (id, action, payload={}) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, action, ...payload }),
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data.message || 'Operacja nieudana');
      showToast(data.message || 'OK');
      fetchUsers();
    } catch (e) {
      showToast(e.message || 'Błąd operacji', 'error');
    }
  };

  const changePassword = async (u) => {
    const pwd = prompt(`Nowe hasło dla ${u.email} (min. 6 znaków):`);
    if (!pwd) return;
    if (pwd.length < 6) return showToast('Hasło za krótkie', 'error');
    await act(u.id, 'password', { newPassword: pwd });
  };

  const changeRole = async (u) => {
    const role = prompt(`Rola dla ${u.email} (user|manager|admin):`, u.role || 'user');
    if (!role) return;
    await act(u.id, 'role', { role: role.trim() });
  };

  const changeDepartment = async (u) => {
    const dep = prompt(`Dział dla ${u.email} (it|flota|kadry|księgowość|rozliczenia|null):`, u.department || '');
    if (dep === null) return;
    const payload = { department: dep.trim() === 'null' ? null : dep.trim() };
    await act(u.id, 'department', payload);
  };

  const filtered = users.filter(u =>
    (u.email||'').toLowerCase().includes(query.toLowerCase()) ||
    `${u.first_name||''} ${u.last_name||''}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="wrap">
      {/* ⬅️ Powrót do dashboardu */}
      <div style={{ marginBottom: 12 }}>
        <BackButton to="/dashboard" label="Powrót" />
      </div>

      <h2 className="title">Panel administratora</h2>

      <input
        className="search"
        placeholder="Szukaj po imieniu/nazwisku/e-mailu"
        value={query}
        onChange={e => setQuery(e.target.value)}
      />

      {loading ? <p className="muted">Wczytywanie...</p> : (
        <div className="table">
          <div className="thead">
            <div>Użytkownik</div>
            <div>E-mail</div>
            <div>Rola</div>
            <div>Dział</div>
            <div>Status</div>
            <div>Akcje</div>
          </div>

          {filtered.map(u => (
            <div key={u.id} className={`row ${u.is_blocked ? 'blocked' : ''}`}>
              <div>
                <div className="name">{u.first_name} {u.last_name}</div>
                <div className="sub">{u.phone || '—'}</div>
              </div>
              <div className="email">{u.email}</div>
              <div>{u.role || 'user'}</div>
              <div>{u.department || '—'}</div>
              <div>{u.is_blocked ? 'Zablokowany' : 'Aktywny'}</div>
              <div className="actions">
                <button onClick={() => changePassword(u)}>Hasło</button>
                <button onClick={() => changeRole(u)}>Rola</button>
                <button onClick={() => changeDepartment(u)}>Dział</button>
                {u.is_blocked
                  ? <button onClick={() => act(u.id, 'unblock')}>Odblokuj</button>
                  : <button onClick={() => act(u.id, 'block')}>Zablokuj</button>}
                <button className="danger" onClick={() => {
                  if (confirm(`Usunąć konto ${u.email}?`)) act(u.id, 'delete');
                }}>Usuń</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>{toast.msg}</div>
      )}

      <style jsx>{`
        .wrap{
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        .title{
          color: #fff;
          text-shadow: 0 1px 0 rgba(0,0,0,.35);
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 16px;
        }
        .search{
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,.25);
          background: rgba(255,255,255,.96);
          color: #0b1020;
          outline: none;
          margin-bottom: 16px;
        }
        .table{
          display: grid;
          gap: 10px;
        }
        .thead, .row{
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr 1fr 2fr;
          gap: 10px;
          align-items: center;
          background: rgba(255,255,255,.95);
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px;
        }
        .thead{
          background: #f8fafc;
          font-weight: 800;
          color: #0f172a;
        }
        .row{ color:#0f172a; }
        .row.blocked{ opacity:.65; }
        .name{ font-weight: 700; }
        .sub{ font-size: 12px; color: #64748b; }
        .email{ word-break: break-all; }
        .actions{ display:flex; flex-wrap:wrap; gap:8px; }
        .actions button{
          border: none; cursor: pointer; padding: 8px 10px; border-radius: 8px;
          background:#eef2ff; color:#1e293b; font-weight:700;
        }
        .actions button:hover{ filter: brightness(0.95); }
        .actions .danger{ background:#fee2e2; color:#991b1b; }

        .toast{
          position: fixed; right: 20px; bottom: 20px;
          background: #22c55e; color: #fff; padding: 12px 18px; border-radius: 10px;
          box-shadow: 0 6px 20px rgba(0,0,0,.2);
        }
        .toast.error{ background:#dc2626; }
      `}</style>
    </div>
  );
}
