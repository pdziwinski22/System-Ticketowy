'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import BackButton from '@/components/BackButton'; // ⬅️ NOWE

export default function TicketsSplitPage() {
  const [meTickets, setMeTickets] = useState([]);
  const [deptTickets, setDeptTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchMe, setSearchMe] = useState('');
  const [searchDept, setSearchDept] = useState('');
  const [toast, setToast] = useState(null);

  const [openTicket, setOpenTicket] = useState(null);
  const [openContext, setOpenContext] = useState(null); // 'mine' | 'dept'
  const [msgs, setMsgs] = useState([]);
  const [msgText, setMsgText] = useState('');
  const pollRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const user = useMemo(() => {
    if (!token) return null;
    try { return JSON.parse(atob(token.split('.')[1])); } catch { return null; }
  }, [token]);

  const getDeptColor = (dept) => {
    if (!dept) return '#6b7280';
    switch (String(dept).toLowerCase()) {
      case 'it': return '#3b82f6';
      case 'flota': return '#10b981';
      case 'kadry': return '#f59e0b';
      case 'księgowość': return '#8b5cf6';
      case 'rozliczenia': return '#ef4444';
      default: return '#6b7280';
    }
  };
  const getStatusColor = (s) => {
    const v = (s || '').toLowerCase();
    if (v === 'nowy') return '#0ea5e9';
    if (v === 'rozpatrywany' || v === 'w realizacji') return '#f59e0b';
    if (v === 'zamknięty' || v === 'zamkniety') return '#22c55e';
    return '#64748b';
  };
  const prioLabelPL = (v) => {
    const s = (v || '').toLowerCase();
    if (s === 'high' || s === 'wysoki') return 'Wysoki';
    if (s === 'urgent' || s === 'krytyczny') return 'Krytyczny';
    if (s === 'low' || s === 'niski') return 'Niski';
    return 'Standard';
  };

  useEffect(() => { loadAll(); }, []);
  async function loadAll() {
    try {
      const [mineRes, deptRes] = await Promise.all([
        fetch('/api/tickets', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/tickets/assigned', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const mine = mineRes.ok ? await mineRes.json() : [];
      const dep  = deptRes.ok ? await deptRes.json() : [];
      setMeTickets(Array.isArray(mine) ? mine : []);
      setDeptTickets(Array.isArray(dep) ? dep : []);
    } finally { setLoading(false); }
  }

  async function loadMessages(ticketId) {
    const res = await fetch(`/api/tickets/${ticketId}/messages`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setMsgs(await res.json());
  }
  function startPolling(ticketId) {
    stopPolling();
    pollRef.current = setInterval(() => loadMessages(ticketId), 5000);
  }
  function stopPolling() {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = null;
  }
  async function openModal(t, ctx) {
    setOpenTicket(t);
    setOpenContext(ctx);
    await loadMessages(t.id);
    startPolling(t.id);
  }
  function closeModal() {
    setOpenTicket(null);
    setOpenContext(null);
    setMsgs([]);
    setMsgText('');
    stopPolling();
  }
  async function sendMessage() {
    const body = msgText.trim();
    if (!body) return;
    const res = await fetch(`/api/tickets/${openTicket.id}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    if (res.ok) {
      setMsgText('');
      loadMessages(openTicket.id);
    } else showToast('Nie udało się wysłać wiadomości.', 'error');
  }

  // status – tylko w kolumnie działu
  async function updateStatus(id, newStatus) {
    const res = await fetch('/api/tickets', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    });
    if (res.ok) {
      showToast('Status zaktualizowany.');
      await loadAll();
      const refreshed = [...meTickets, ...deptTickets].find(t => t.id === id);
      setOpenTicket(refreshed || null);
    } else showToast('Nie udało się zaktualizować statusu.', 'error');
  }
  // priorytet – tylko w kolumnie działu (wartości DB: standard|high|urgent)
  async function updatePriority(id, newPriority) {
    const res = await fetch('/api/tickets', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, priority: newPriority }),
    });
    if (res.ok) {
      showToast('Priorytet zaktualizowany.');
      await loadAll();
      const refreshed = [...meTickets, ...deptTickets].find(t => t.id === id);
      setOpenTicket(refreshed || null);
    } else showToast('Nie udało się zaktualizować priorytetu.', 'error');
  }

  const filteredMine = useMemo(() => {
    const q = searchMe.toLowerCase().trim();
    return meTickets
      .filter(t =>
        !q ||
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.department?.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [meTickets, searchMe]);

  const filteredDept = useMemo(() => {
    const q = searchDept.toLowerCase().trim();
    return deptTickets
      .filter(t =>
        !q ||
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.full_name?.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [deptTickets, searchDept]);

  const Card = ({ t, ctx }) => (
    <div
      className="tix-card"
      onClick={() => openModal(t, ctx)}
      style={{ borderLeft: `8px solid ${getDeptColor(t.department)}` }}
    >
      <div className="tix-card-title">{t.title || '(bez tytułu)'}</div>
      <div className="tix-badges" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge" style={{ background: getStatusColor(t.status) }}>
            {String(t.status || 'nowy').toUpperCase()}
          </span>
          <span className="badge" style={{ background: getDeptColor(t.department) }}>
            {t.department?.toUpperCase() || 'N/A'}
          </span>
          <span className="tix-card-sub">{new Date(t.created_at).toLocaleDateString()}</span>
        </div>
        <span className="badge" style={{ background: '#64748b' }}>
          PRIORYTET: {prioLabelPL(t.priority)}
        </span>
      </div>
      {t.description && <p>{t.description}</p>}
    </div>
  );

  const canChange = openContext === 'dept';

  return (
    <>
      {/* ⬅️ Powrót do dashboardu */}
      <div style={{ padding: '24px 24px 0' }}>
        <BackButton to="/dashboard" label="Powrót" />
      </div>

      <div className="two-cols-tickets" style={{ paddingTop: 16 }}>
        <div className="tix-col">
          <h2 className="tix-section-title">Moje zgłoszenia</h2>
          <input
            className="tix-filter"
            placeholder="Filtruj moje zgłoszenia…"
            value={searchMe}
            onChange={e => setSearchMe(e.target.value)}
          />
          {loading ? <p className="muted">Wczytywanie…</p> :
            (filteredMine.length
              ? filteredMine.map(t => <Card key={t.id} t={t} ctx="mine" />)
              : <p className="muted">Brak zgłoszeń.</p>)}
        </div>

        <div className="tix-col">
          <h2 className="tix-section-title">
            Przypisane do działu {user?.department ? `(${user.department})` : ''}
          </h2>
          {!user?.department && (
            <p className="muted" style={{ marginTop: -6, marginBottom: 8 }}>
              (Brak działu na koncie – poproś admina o przypisanie)
            </p>
          )}
          <input
            className="tix-filter"
            placeholder="Filtruj zgłoszenia działu…"
            value={searchDept}
            onChange={e => setSearchDept(e.target.value)}
          />
          {loading ? <p className="muted">Wczytywanie…</p> :
            (filteredDept.length
              ? filteredDept.map(t => <Card key={t.id} t={t} ctx="dept" />)
              : <p className="muted">Brak zgłoszeń.</p>)}
        </div>

        {/* MODAL */}
        {openTicket && (
          <div className="ticket-overlay">
            <div className="ticket-modal">
              <div className="ticket-modal__head">
                <div>
                  <h3 className="ticket-modal__title">{openTicket.title}</h3>
                  <div className="ticket-modal__sub">
                    <span className="badge" style={{ background: getDeptColor(openTicket.department) }}>
                      {openTicket.department?.toUpperCase()}
                    </span>
                    <span>Autor: {openTicket.full_name} ({openTicket.email})</span>
                  </div>
                </div>
                <span className="badge" style={{ background: getStatusColor(openTicket.status) }}>
                  {String(openTicket.status || 'nowy').toUpperCase()}
                </span>
              </div>

              <div className="ticket-modal__body">
                <div>
                  <div className="tix-field">
                    <div className="tix-label">Opis</div>
                    <div className="tix-textarea" style={{ whiteSpace: 'pre-wrap' }}>
                      {openTicket.description || '—'}
                    </div>
                  </div>

                  {/* Status i priorytet */}
                  <div className="tix-field">
                    <div className="tix-label">Status</div>
                    {canChange ? (
                      <select
                        className="tix-input"
                        value={openTicket.status}
                        onChange={(e) => updateStatus(openTicket.id, e.target.value)}
                      >
                        <option value="nowy">Nowy</option>
                        <option value="rozpatrywany">Rozpatrywany</option>
                        <option value="w realizacji">W realizacji</option>
                        <option value="zamknięty">Zamknięty</option>
                      </select>
                    ) : (
                      <div className="badge" style={{ background: getStatusColor(openTicket.status) }}>
                        {String(openTicket.status || 'nowy').toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="tix-field">
                    <div className="tix-label">Priorytet</div>
                    {canChange ? (
                      <select
                        className="tix-input"
                        value={openTicket.priority || 'standard'}
                        onChange={(e) => updatePriority(openTicket.id, e.target.value)}
                      >
                        <option value="standard">Standard</option>
                        <option value="high">Wysoki</option>
                        <option value="urgent">Krytyczny</option>
                      </select>
                    ) : (
                      <div className="badge" style={{ background: '#64748b' }}>
                        {prioLabelPL(openTicket.priority)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat */}
                <div className="chat-wrap">
                  <div className="tix-label">Wewnętrzny chat</div>
                  <div className="chat-log">
                    {msgs?.length ? msgs.map(m => (
                      <div key={m.id} className="chat-msg" style={{ marginBottom: 8 }}>
                        <div className="chat-msg__meta">
                          <b>{m.author_name}</b>
                          <span>{new Date(m.created_at).toLocaleString()}</span>
                        </div>
                        <div>{m.body}</div>
                      </div>
                    )) : <div className="muted">Brak wiadomości.</div>}
                  </div>
                  <div className="chat-input-row">
                    <textarea
                      className="chat-input"
                      rows={2}
                      placeholder="Napisz wiadomość…"
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                    />
                    <button className="chat-send" onClick={sendMessage}>Wyślij</button>
                  </div>
                </div>
              </div>

              <div className="ticket-modal__foot">
                <button className="btn-grey" onClick={closeModal}>Zamknij</button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div style={{
            position: 'fixed', bottom: 20, right: 20,
            backgroundColor: toast.type === 'error' ? '#dc2626' : '#22c55e', color: '#fff',
            padding: '12px 20px', borderRadius: 12, boxShadow: '0 6px 20px rgba(0,0,0,.25)', zIndex: 1200
          }}>
            {toast.msg}
          </div>
        )}
      </div>
    </>
  );
}
