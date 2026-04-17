'use client';
import { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton'; // ⬅️ NOWE

export default function ArchivedTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(null);
  const [historyMap, setHistoryMap] = useState({}); // id -> { loading, error, items }

  const getDepartmentColor = (dept) => {
    if (!dept) return '#6b7280';
    switch (dept.toLowerCase()) {
      case 'it': return '#3b82f6';
      case 'flota': return '#10b981';
      case 'kadry': return '#f59e0b';
      case 'księgowość': return '#8b5cf6';
      case 'rozliczenia': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    if (!status) return '#64748b';
    switch (status.toLowerCase()) {
      case 'nowy': return '#0ea5e9';
      case 'rozpatrywany':
      case 'w realizacji':
        return '#f59e0b';
      case 'zamknięty':
      case 'zamkniety':
        return '#22c55e';
      default: return '#64748b';
    }
  };

  useEffect(() => {
    const fetchTickets = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tickets?archived=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
      setLoading(false);
    };
    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tickets
      .filter(t =>
        !q ||
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.full_name?.toLowerCase().includes(q)
      )
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [tickets, search]);

  const toggleOpen = async (id) => {
    setOpenId(prev => (prev === id ? null : id));
    if (!historyMap[id]) {
      const token = localStorage.getItem('token');
      setHistoryMap(m => ({ ...m, [id]: { loading: true, error: null, items: [] } }));
      try {
        const res = await fetch(`/api/tickets/${id}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const items = await res.json();
        setHistoryMap(m => ({ ...m, [id]: { loading: false, error: null, items: Array.isArray(items) ? items : [] } }));
      } catch (e) {
        setHistoryMap(m => ({ ...m, [id]: { loading: false, error: 'Brak historii lub błąd API', items: [] } }));
      }
    }
  };

  return (
    <div className="arch-wrap">
      {/* ⬅️ Powrót do dashboardu */}
      <BackButton to="/dashboard" label="Powrót" />

      <div className="content">
        <h2 className="title">Zamknięte zgłoszenia</h2>

        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Szukaj po tytule, opisie lub nazwisku"
          className="search"
        />

        {loading ? (
          <p className="muted">Wczytywanie…</p>
        ) : filteredTickets.length === 0 ? (
          <p className="muted">Brak wyników.</p>
        ) : (
          <div className="list">
            {filteredTickets.map(t => {
              const isOpen = openId === t.id;
              const h = historyMap[t.id];
              return (
                <div key={t.id} className={`row ${isOpen ? 'open' : ''}`}>
                  <button className="rowHead" onClick={() => toggleOpen(t.id)} aria-expanded={isOpen}>
                    <div className="left">
                      <div className="titleLine">
                        <strong className="tTitle">{t.title || '(bez tytułu)'}</strong>
                        <span
                          className="dept"
                          style={{ backgroundColor: getDepartmentColor(t.department) }}
                        >
                          {t.department?.toUpperCase() || 'N/A'}
                        </span>
                      </div>
                      <div className="meta">
                        <span>{t.full_name} ({t.email})</span>
                        <span className="dot">•</span>
                        <span>Utworzone: {formatDate(t.created_at)}</span>
                        {t.closed_at && (
                          <>
                            <span className="dot">•</span>
                            <span>Zamknięte: {formatDate(t.closed_at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="right">
                      <StatusChip label={t.status || 'ZAMKNIĘTY'} color={getStatusColor(t.status || 'zamknięty')} />
                      <svg className="chev" width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                        <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </button>

                  <div className="details" style={{ maxHeight: isOpen ? 600 : 0 }}>
                    <div className="detailsInner">
                      <div className="col colLeft">
                        <h4>Opis</h4>
                        <p className="desc">{t.description || '—'}</p>

                        <div className="grid">
                          <Detail label="Imię i nazwisko" value={t.full_name} />
                          <Detail label="E-mail" value={t.email} />
                          <Detail label="Dział" value={t.department?.toUpperCase()} />
                          <Detail label="Data utworzenia" value={formatDate(t.created_at)} />
                          <Detail label="Data zamknięcia" value={formatDate(t.closed_at)} />
                          {t.attachment_url && (
                            <Detail
                              label="Załącznik"
                              value={<a href={t.attachment_url} target="_blank" rel="noreferrer" className="link">Pobierz</a>}
                            />
                          )}
                        </div>
                      </div>

                      <div className="col colRight">
                        <h4>Historia zmian</h4>
                        {h?.loading ? (
                          <p className="muted">Ładowanie historii…</p>
                        ) : (h?.items?.length || 0) > 0 ? (
                          <ul className="timeline">
                            {h.items
                              .slice()
                              .sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at))
                              .map((e, i) => (
                                <li key={i} className="tlItem">
                                  <span className="tlDot" style={{ background: getStatusColor(e.status) }} />
                                  <div className="tlBody">
                                    <div className="tlRow">
                                      <StatusChip small label={e.status} color={getStatusColor(e.status)} />
                                      <span className="tlWhen">{formatDateTime(e.changed_at)}</span>
                                    </div>
                                    <div className="tlWho">przez {e.changed_by || 'system'}</div>
                                    {e.note && <div className="tlNote">{e.note}</div>}
                                  </div>
                                </li>
                              ))}
                          </ul>
                        ) : (
                          <div className="muted">
                            {h?.error ? h.error : 'Brak zarejestrowanej historii dla tego zgłoszenia.'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
  .arch-wrap{
    min-height: 100vh;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 32px 16px 56px;
  }
  .content{ width: min(1100px, 96vw); }

  .title{
    font-size: 32px;
    font-weight: 900;
    color: #e5e7eb;
    margin: 0 0 12px;
    text-shadow: 0 1px 0 rgba(0,0,0,.35);
  }

  .search{
    width: 100%;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,.25);
    background: rgba(255,255,255,.96);
    color: #0b1020;
    outline: none;
    margin-bottom: 14px;
  }

  .list{ display: flex; flex-direction: column; gap: 14px; }

  .row{
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-left: 6px solid #93c5fd;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,.08);
    transition: transform .06s ease, box-shadow .2s ease;
  }
  .row.open{ box-shadow: 0 14px 40px rgba(0,0,0,.16); }

  .rowHead{
    width: 100%;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 12px;
    padding: 16px 18px;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
  }
  .rowHead:hover{ background: rgba(15,23,42,.04); }

  .left{ min-width: 0; }
  .titleLine{ display: flex; align-items: center; gap: 10px; min-width: 0; }
  .tTitle{
    font-weight: 800; font-size: 16px; color: #0f172a;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .dept{
    color: #fff; font-weight: 800; font-size: 12px; line-height: 1;
    padding: 6px 10px; border-radius: 999px; display: inline-block;
    box-shadow: inset 0 -1px 0 rgba(255,255,255,.25);
  }
  .meta{
    color: #334155;
    font-size: 13px; margin-top: 4px;
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .dot{ opacity: .6 }

  .right{ display: flex; align-items: center; gap: 10px; }
  .chev{ opacity: .8; transition: transform .2s ease; color:#475569 }
  .row.open .chev{ transform: rotate(180deg); }

  .details{
    transition: max-height .25s ease;
    overflow: hidden;
  }
  .detailsInner{
    display: grid; grid-template-columns: 7fr 5fr; gap: 18px;
    padding: 14px 18px 18px;
    background: linear-gradient(180deg, #ffffff, #f8fafc);
    border-top: 1px solid #eef2f7;
  }
  .col h4{
    margin: 2px 0 8px;
    font-size: 13px;
    color: #0f172a;
    font-weight: 800;
    letter-spacing: .02em;
    text-transform: uppercase;
  }
  .desc{
    white-space: pre-wrap;
    color: #111827;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    padding: 12px; border-radius: 10px;
  }

  .grid{
    margin-top: 10px;
    display: grid; gap: 10px;
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 900px){
    .detailsInner{ grid-template-columns: 1fr; }
    .grid{ grid-template-columns: 1fr; }
  }

  .detail{ display: grid; grid-template-columns: 170px 1fr; gap: 10px; align-items: center; }
  .label{ color:#334155; font-size: 13px; font-weight: 700; }
  .value{ color:#0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .link{ color:#2563eb; font-weight: 700; text-decoration: underline; }

  .timeline{ list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:12px; max-height: 360px; overflow:auto; } /* niewielki scroll wewnątrz */
  .tlItem{ display:flex; gap:10px; align-items:flex-start; }
  .tlDot{ width:10px; height:10px; border-radius:50%; margin-top:8px; box-shadow:0 0 0 3px rgba(0,0,0,.06) }
  .tlBody{ flex:1; min-width:0 }
  .tlRow{ display:flex; align-items:center; gap:8px; flex-wrap:wrap }
  .tlWhen{ font-size:12px; color:#475569 }
  .tlWho{ font-size:13px; color:#0f172a; font-weight: 600 }
  .tlNote{
    margin-top:4px; font-size:13px; color:#111827;
    background:#f8fafc; border:1px solid #e2e8f0; padding:8px 10px; border-radius:8px
  }

  .muted{ color:#64748b; margin-top:8px }
`}</style>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="detail">
      <div className="label">{label}</div>
      <div className="value">{value ?? '—'}</div>
    </div>
  );
}

function StatusChip({ label, color, small }) {
  return (
    <span
      className="statusChip"
      style={{
        background: color,
        fontSize: small ? 11 : 12,
        padding: small ? '5px 8px' : '6px 10px',
      }}
    >
      {String(label).toUpperCase()}
      <style jsx>{`
        .statusChip{
          display:inline-block; line-height:1; color:#fff; font-weight:800; border-radius:999px;
          box-shadow: inset 0 -1px 0 rgba(255,255,255,.25);
        }
      `}</style>
    </span>
  );
}

function formatDate(v){
  if(!v) return '—';
  try { return new Date(v).toLocaleDateString(); } catch { return '—'; }
}
function formatDateTime(v){
  if(!v) return '—';
  try { return new Date(v).toLocaleString(); } catch { return '—'; }
}
