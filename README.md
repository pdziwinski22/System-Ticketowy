# 🎫 System Ticketowy dla Organizacji



> Kompletna aplikacja webowa do zarządzania zgłoszeniami pracowniczymi. Pozwala tworzyć, przeglądać i zamykać tickety. Zawiera panel użytkownika oraz przygotowanie pod panel administratora.



---



## 🌐 Demo

🔗 https://wrx81843.online



---



## 📦 Technologie



### ✅ Backend & Frontend:

- **Next.js 14** (app router)

- **Node.js** (API routes)

- **MySQL** (baza danych)

- **JWT (JSON Web Token)** – sesja i autoryzacja

- **bcryptjs** – haszowanie haseł

- **CSS Modules / klasyczne style** – brak Tailwinda

- **fs/promises** – obsługa załączników



### ✅ Hosting / Deploy:

- **VPS (Linux)**

- **NGINX reverse proxy**

- **Domena:** wrx81843.online

- **Port 3000** – aplikacja Next.js

- **System pocztowy SMTP** – potwierdzenia rejestracji



---



## 👤 Funkcje użytkownika



- ✅ Rejestracja z imieniem, nazwiskiem, e-mailem, numerem telefonu i hasłem

- ✅ Logowanie z tokenem JWT (trzymanym w localStorage)

- ✅ Aktywacja konta przez link aktywacyjny

- ✅ Tworzenie zgłoszenia:

  - Imię i nazwisko (pobrane z tokena)

  - E-mail (pobrany z tokena)

  - Wybór działu: IT, Flota, Kadry, Księgowość, Rozliczenia

  - Tytuł, opis

  - Dodanie załącznika (obrazek, PDF)

- ✅ Przeglądanie ticketów:

  - Rozwijane paski zgłoszeń (po kliknięciu animowany podgląd)

  - Zmiana statusu: „Nowy”, „Rozpatrywany”, „Zamknięty”

  - Potwierdzenie zamknięcia (modal + odświeżenie)

- ✅ Panel użytkownika w prawym górnym rogu:

  - Mój profil (modal z informacjami)

  - Ustawienia (placeholder)

  - Admin panel (placeholder)

  - Wyloguj się



---



## 🗃️ Panel główny (`/dashboard`)



- Estetyczne kafelki:

  - „Utwórz ticket”

  - „Przeglądaj tickety”

  - „Tickety archiwalne”

- Pełnoekranowe tło

- Minimalistyczne menu użytkownika

- Responsywny layout **tylko desktop** (brak widoku mobilnego)



---



## 📂 Struktura katalogów



/src

├── app

│ ├── page.jsx # Strona logowania/rejestracji

│ ├── layout.js # Layout + menu użytkownika

│ ├── dashboard

│ │ ├── page.jsx # Panel główny

│ │ ├── new-ticket/page.jsx # Formularz nowego zgłoszenia

│ │ ├── tickets/page.jsx # Lista zgłoszeń użytkownika

│ │ └── archived-tickets/ # Zakładka ze zgłoszeniami zamkniętymi

│ │ └── page.jsx

│ └── api

│ ├── register/route.js # Rejestracja użytkownika

│ ├── login/route.js # Logowanie + token

│ ├── activate/route.js # Aktywacja konta przez e-mail

│ ├── tickets/route.js # CRUD ticketów (POST, GET, PATCH)

│ └── admin/tickets.js # (planowane) – dostęp do wszystkich ticketów

├── lib

│ ├── db.js # Połączenie z MySQL

│ └── token.js # Odczyt tokena z requestu

├── public

│ ├── uploads/ # Załączniki do ticketów

│ └── penguin.jpg # Tło aplikacji

└── globals.css # Klasyczne style bez Tailwinda



yaml

Skopiuj kod



---



## 🔐 Baza danych



### `users`:

| Pole        | Typ           | Uwagi                   |

|-------------|----------------|--------------------------|

| id          | INT            | AUTO_INCREMENT, PK       |

| first_name  | VARCHAR(255)   |                          |

| last_name   | VARCHAR(255)   |                          |

| email       | VARCHAR(255)   | UNIQUE                   |

| phone       | VARCHAR(20)    |                          |

| password    | VARCHAR(255)   | hashowane bcrypt         |

| is_active   | TINYINT(1)     | 0/1                      |

| role        | VARCHAR(20)    | `user`, `admin`          |



### `tickets`:

| Pole        | Typ             | Uwagi                 |

|-------------|------------------|------------------------|

| id          | INT              | PK                    |

| user_id     | INT              | FK do `users.id`      |

| full_name   | VARCHAR(255)     | z tokena              |

| email       | VARCHAR(255)     | z tokena              |

| department  | VARCHAR(100)     | dział (IT, Kadry itd.)|

| title       | TEXT             |                       |

| description | TEXT             |                       |

| attachment  | VARCHAR(255)     | nazwa pliku           |

| status      | VARCHAR(50)      | `NOWY`, `ROZPATRYWANY`, `ZAMKNIĘTY` |

| created_at  | TIMESTAMP        | default CURRENT_TIMESTAMP |



---



## 🔒 Bezpieczeństwo



- JWT zawiera `id`, `email`, `first_name`, `last_name`, `role`

- Hasła hashowane `bcrypt`

- Token zapisywany w `localStorage`

- API `/api/tickets` i `/api/admin` chronione przez `getToken()`

- `env.local` ignorowany przez `.gitignore` (bez wycieku danych)



---



## 🔜 Co dalej?



- [ ] Pełny **panel administratora** z zarządzaniem ticketami i użytkownikami

- [ ] Eksport zgłoszeń do PDF / CSV

- [ ] System powiadomień e-mail

- [ ] Statystyki dla admina (dashboard: liczba zgłoszeń, % zamkniętych)

- [ ] Dark mode

- [ ] System komentarzy do zgłoszeń

