// src/app/dashboard/new-ticket/page.jsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import { getUserFromToken } from "@/decoder/useUser"; // ⬅️ UTF-8 safe
import "@/styles/new-ticket.css";

export default function NewTicketPage() {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    department: "it",
    title: "",
    description: "",
    attachment: null,
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [toast, setToast] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // ⬇️ Autofill z JWT (UTF-8 safe)
  useEffect(() => {
    const u = getUserFromToken();
    if (!u) return;
    setForm((p) => ({
      ...p,
      first_name: u.first_name || "",
      last_name:  u.last_name  || "",
      email:      u.email      || "",
    }));
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "attachment") {
      const file = files?.[0] || null;
      setForm((prev) => ({ ...prev, attachment: file }));
      if (file && file.type?.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, attachment: file }));
    if (file.type?.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const token = localStorage.getItem("token");
    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== null && v !== "") data.append(k, v);
    });

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });

      if (res.ok) {
        showToast("Zgłoszenie wysłane!");
        setTimeout(() => router.push("/dashboard"), 1200);
      } else {
        const txt = await res.text().catch(() => "");
        showToast(`Błąd przy zapisie zgłoszenia${txt ? `: ${txt}` : ""}`, "error");
      }
    } catch {
      showToast("Sieć padła albo API śpi. Spróbuj ponownie.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const accept = ".jpg,.jpeg,.png,.pdf";

  return (
    <>
      <BackButton to="/dashboard" />

      <div className="nt-wrap">
        <div className="nt-bg" />
        <div className="nt-card" aria-busy={isSubmitting}>
          <header className="nt-cardHeader">
            <div className="nt-titleRow">
              <span className="nt-badge">NOWE</span>
              <h2>Utwórz zgłoszenie</h2>
            </div>
            <p className="nt-subtitle">Wypełnij pola, dorzuć plik i leci do zespołu. ✨</p>
          </header>

          <form onSubmit={handleSubmit} className="nt-formGrid">
            <div className="nt-leftCol">
              <div className="nt-gridTwo">
                <Field readOnly label="Imię" name="first_name" value={form.first_name} onChange={handleChange} required />
                <Field readOnly label="Nazwisko" name="last_name" value={form.last_name} onChange={handleChange} required />
              </div>
              <Field readOnly label="E-mail" name="email" type="email" value={form.email} onChange={handleChange} required />

              <div className="nt-row">
                <label className="nt-label">Wybierz dział do którego ma trafić zgłoszenie</label>
                <div className="nt-selectWrap">
                  <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className="nt-select"
                    disabled={isSubmitting}
                  >
                    <option value="it">IT</option>
                    <option value="flota">Flota</option>
                    <option value="kadry">Kadry</option>
                    <option value="księgowość">Księgowość</option>
                    <option value="rozliczenia">Rozliczenia</option>
                  </select>
                  <svg width="20" height="20" viewBox="0 0 24 24" className="nt-chev" aria-hidden>
                    <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <Field disabled={isSubmitting} label="Temat zgłoszenia" name="title" value={form.title} onChange={handleChange} required />
            </div>

            <div className="nt-rightCol">
              <Field
                disabled={isSubmitting}
                label="Opis zgłoszenia"
                name="description"
                as="textarea"
                value={form.description}
                onChange={handleChange}
                required
                rows={10}
              />

              <div
                className={`nt-dropzone ${isDragging ? "dragging" : ""} ${isSubmitting ? "disabled" : ""}`}
                onDragOver={(e) => { e.preventDefault(); if (!isSubmitting) setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={isSubmitting ? undefined : handleDrop}
                aria-disabled={isSubmitting}
              >
                <div className="nt-dzInner">
                  <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
                    <path d="M12 16V4m0 0l-3.5 3.5M12 4l3.5 3.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    <path d="M20 16.5a4.5 4.5 0 10-2.9 4.2H7a4 4 0 110-8h1" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                  </svg>
                  <div>
                    <strong>Przeciągnij i upuść</strong> albo
                    <label className="nt-fileBtn">
                      wybierz plik
                      <input type="file" name="attachment" accept={accept} onChange={handleChange} hidden disabled={isSubmitting} />
                    </label>
                    <span className="nt-hint">(jpg, png, pdf)</span>
                  </div>
                </div>

                {form.attachment && (
                  <div className="nt-fileRow">
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
                      <path d="M14.5 6.5l-7 7a3 3 0 104.2 4.2l7-7a4 4 0 10-5.6-5.6l-7.8 7.8" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round"/>
                    </svg>
                    <span className="nt-fileName">{form.attachment.name}</span>
                    <button
                      type="button"
                      className="nt-clearBtn"
                      onClick={() => { setForm((p) => ({ ...p, attachment: null })); setPreviewUrl(null); }}
                      disabled={isSubmitting}
                    >
                      Usuń
                    </button>
                  </div>
                )}
              </div>

              {previewUrl && (
                <div className="nt-preview">
                  <img src={previewUrl} alt="Podgląd załącznika" />
                </div>
              )}
            </div>

            <button type="submit" className="nt-submit nt-fullRow" disabled={isSubmitting}>
              {isSubmitting ? (<><span className="nt-spinner" aria-hidden /> Wysyłanie…</>) : (<>Wyślij zgłoszenie</>)}
            </button>
          </form>
        </div>

        {toast && (
          <div className={`nt-toast ${toast.type === "error" ? "err" : "ok"}`} role="status" aria-live="polite">
            {toast.msg}
          </div>
        )}
      </div>
    </>
  );
}

// Field – bez zmian, tylko korzysta z klas nt-*
function Field({ label, name, as = "input", onChange, value, required, type = "text", rows, disabled, readOnly }) {
  return (
    <label className="nt-field">
      <span className="nt-fLabel">{label}{required && <em>*</em>}</span>
      {as === "textarea" ? (
        <textarea
          name={name}
          required={required}
          value={value}
          onChange={onChange}
          rows={rows}
          className="nt-fControl nt-fArea"
          placeholder={label}
          disabled={disabled}
          readOnly={readOnly}
        />
      ) : (
        <input
          name={name}
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          className="nt-fControl"
          placeholder={label}
          disabled={disabled}
          readOnly={readOnly}
        />
      )}
    </label>
  );
}
