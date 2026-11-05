# E-Drive Cloud

A production-style encrypted document vault inspired by the **E Drive** Figma design. The application pairs a Laravel 13 API with a React 19 single-page frontend and stores every document, credential, activity and notification in MySQL.

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS 4, React Router 7, Axios, Lucide icons, Inter variable font
- **Backend:** Laravel 13, PHP 8.3+, MySQL 8 or MariaDB 10.4+, Eloquent, Laravel session-cookie authentication
- **Design:** Premium blue palette (`#2563EB`, `#172554`, `#3B82F6`, `#EFF6FF`, `#F8FAFC`, `#FFFFFF`, `#1E293B`, `#64748B`, `#E2E8F0`) with green, amber and red status accents
- **Data:** Real MySQL/MariaDB records and private local file storage — no mock data or `localStorage` persistence

---

## Features

### Authentication and account
- Sign in, sign up, demo sign-in, forgot password, reset password
- HttpOnly session-cookie authentication with CSRF protection; sessions are destroyed on sign-out
- Password changes revoke every other active session
- Account deletion requires the account password and the word `DELETE`
- Public legal pages (Terms, Privacy) and a branded 404 page

### Document vault
- Dashboard with storage usage, category breakdown, expiring documents, recent activity and security score
- Document explorer in three modes: **All documents**, **Certificates**, **Personal files**
- Search, category/sub-category tabs, favorites, shared and expiring filters
- Sorting by name, size, expiry, created or last-modified date, ascending/descending
- Upload with drag and drop, metadata (issuer, number, dates, tags, description) and checksum calculation
- Edit, download, authenticated preview, favorite, verify, share and trash
- Bulk trash and empty-trash actions
- Private file previews and downloads behind authentication
- Public share links with optional expiry, invalid-link and expired-link states

### Credentials vault
- Password, passkey, SSH key and API key records
- Encrypted secrets at rest (`encrypted` cast); the API never returns a secret in list responses
- Reveal, rotate, edit, delete, favorite, search, filter and bulk import
- Health indicators and rotation reminders

### Activity, notifications and settings
- Activity timeline grouped by documents, sharing, security, credentials and account
- Notification centre with unread counts, category filters, mark-read, mark-all-read, delete and clear-read
- Profile editing, avatar upload/removal, password change, data export and account deletion
- Settings for security, notification preferences, privacy, devices and storage plans
- Device management with current-device protection and bulk sign-out of other devices
- Three DB-backed plans (Starter, Professional, Business) with immediate storage-limit updates

### UX
- Responsive sidebar, mobile navigation, top bar and user menu
- Accessible dialogs, focus handling, action menus and confirmation prompts
- Skeleton loaders, empty states, retry states, optimistic favorite toggles and toast feedback

---

## Repository layout

```
.
├── backend/                 Laravel API
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Http/Requests/
│   │   ├── Http/Resources/
│   │   ├── Models/
│   │   ├── Policies/
│   │   └── Services/
│   ├── config/edrive.php
│   ├── database/
│   │   ├── factories/
│   │   ├── migrations/
│   │   └── seeders/
│   ├── routes/api.php
│   ├── routes/web.php
│   └── tests/Feature/Api/
└── frontend/                React SPA
    ├── src/components/
    ├── src/context/
    ├── src/lib/
    ├── src/pages/
    └── src/types/
```

---

## Requirements

| Tool | Version |
| --- | --- |
| PHP | 8.3 or newer (tested on 8.4) |
| Composer | 2.x |
| MySQL / MariaDB | MySQL 8.0+ or MariaDB 10.4+ (XAMPP works) |
| Node.js | 20 or newer |
| npm | 10 or newer |

---

## Installation

### 1. Database

The application runs on XAMPP's MariaDB by default. Start **MySQL** in the XAMPP Control Panel, then create the database and user with phpMyAdmin or the MariaDB client:

```sql
CREATE DATABASE edrive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'edrive'@'localhost' IDENTIFIED BY 'change-me';
CREATE USER 'edrive'@'127.0.0.1' IDENTIFIED BY 'change-me';
GRANT ALL PRIVILEGES ON edrive.* TO 'edrive'@'localhost';
GRANT ALL PRIVILEGES ON edrive.* TO 'edrive'@'127.0.0.1';
FLUSH PRIVILEGES;
```

A standalone MySQL 8 server works the same way, but it cannot share port `3306` with XAMPP's MariaDB — stop one before starting the other.

### 2. Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Set the database and session values in `backend/.env`:

```dotenv
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=edrive
DB_USERNAME=edrive
DB_PASSWORD=change-me

APP_URL=http://127.0.0.1:8000
FRONTEND_URL=http://127.0.0.1:5173
SESSION_DRIVER=database
```

`SESSION_DRIVER=database` stores sessions in the `sessions` table so sign-out, password changes and device revocation can end sessions server-side.

Then migrate, seed and start the API:

```bash
php artisan migrate --seed
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8000
```

`storage:link` is required for profile avatars; document files remain on the private `local` disk and are streamed through authenticated endpoints.

### 3. Frontend

In a second terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app runs at **http://127.0.0.1:5173** and calls **http://127.0.0.1:8000/api** on the same hostname by default. Session cookies are first-party, so always open the frontend and API through the same host (`127.0.0.1` with `127.0.0.1`, or `localhost` with `localhost`).

For a production bundle:

```bash
npm run build
npm run preview
```

---

## Demo account

The database seeder creates a complete demo vault:

| Field | Value |
| --- | --- |
| Email | `sarah.j@example.com` |
| Password | `Password123!` |
| Name | Sarah Jenkins |

The sign-in screen also has a **Continue as Sarah Jenkins** button that calls `POST /api/auth/demo-login`.

Seeded data: **42 documents**, **15 credentials**, **4 devices**, **12 activities**, **8 notifications**, **3 plans**. Storage usage is approximately **22.2%** of the Starter plan.

---

## Configuration

Key backend variables:

| Variable | Purpose |
| --- | --- |
| `APP_URL` | Backend origin used by generated URLs |
| `FRONTEND_URL` | Frontend origin used by CORS, share links and reset emails |
| `DB_*` | MySQL/MariaDB connection |
| `SESSION_DRIVER=database` | Server-side session storage used by cookie authentication |
| `MAIL_MAILER=log` | Password-reset messages are written to `storage/logs/laravel.log` locally |
| `FILESYSTEM_DISK=local` | Private document storage |

Key frontend variables:

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Optional. Defaults to `http://<current-hostname>:8000/api`; set it only when the API runs elsewhere |
| `VITE_APP_URL` | Public frontend origin used for absolute links |

Upload limits, allowed extensions, share expiry and the demo account are defined in `backend/config/edrive.php`.

---

## API

- **Base URL:** `http://127.0.0.1:8000/api`
- **Authentication:** Laravel session cookie (`e-drive-cloud-session`) with an `X-XSRF-TOKEN` header on state-changing requests
- **CSRF bootstrap:** call `GET /api/auth/csrf-cookie` first, then send the `XSRF-TOKEN` cookie value back in the `X-XSRF-TOKEN` header
- **Credentials:** browser requests must use `withCredentials`; CORS allows the configured frontend origins
- **Content type:** `application/json`, except document uploads and avatar uploads (`multipart/form-data`)
- **Validation failures:** `422` with `{ "message": "...", "errors": { "field": ["..."] } }`
- **Unauthenticated:** `401`
- **Forbidden:** `403`
- **Missing record:** `404`
- **Expired share link:** `410`

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/auth/csrf-cookie` | Issue the `XSRF-TOKEN` cookie |
| `POST` | `/auth/register` | Create an account and start a session |
| `POST` | `/auth/login` | Sign in and start a session |
| `POST` | `/auth/demo-login` | Sign in to the seeded demo account |
| `POST` | `/auth/forgot-password` | Request a reset link |
| `POST` | `/auth/reset-password` | Reset a password with a token |
| `GET` | `/auth/me` | Current user and unread notification count |
| `POST` | `/auth/logout` | Destroy the current session |

### Documents

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/documents` | Paginated list, stats and filters (`q`, `category`, `subcategory`, `status`, `favorites`, `shared`, `expiring`, `tag`, `trashed=only`, `sort`, `direction`, `per_page`, `page`) |
| `POST` | `/documents` | Upload a document |
| `POST` | `/documents/bulk` | Bulk `trash`, `restore` or `delete` by IDs |
| `POST` | `/documents/verify-all` | Verify all certificates |
| `GET` | `/documents/{id}` | Document details |
| `POST`/`PUT` | `/documents/{id}` | Update metadata or replace the file |
| `DELETE` | `/documents/{id}` | Move to trash |
| `PATCH` | `/documents/{id}/favorite` | Toggle favorite |
| `GET` | `/documents/{id}/file` | Authenticated inline preview |
| `GET` | `/documents/{id}/download` | Authenticated download |
| `POST` | `/documents/{id}/share` | Create a public share link |
| `DELETE` | `/documents/{id}/share` | Revoke the share link |
| `POST` | `/documents/{id}/verify` | Mark as verified |
| `POST` | `/documents/{id}/restore` | Restore from trash |
| `DELETE` | `/documents/{id}/force` | Permanently delete |
| `DELETE` | `/trash/empty` | Permanently delete all trashed documents |

List responses include `data`, `meta` (`current_page`, `from`, `last_page`, `per_page`, `to`, `total`) and `stats` (category counts, status counts, total size, shared, favorites, expiring).

### Credentials

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/credentials` | Paginated list and vault statistics |
| `POST` | `/credentials` | Create a credential |
| `POST` | `/credentials/import` | Import up to 100 credentials |
| `GET` | `/credentials/{id}` | Credential metadata |
| `PUT` | `/credentials/{id}` | Update a credential |
| `DELETE` | `/credentials/{id}` | Delete a credential |
| `GET` | `/credentials/{id}/reveal` | Decrypt and return the secret |
| `POST` | `/credentials/{id}/rotate` | Rotate the secret and mark it strong |

### Dashboard, activity and notifications

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/dashboard` | Statistics, storage breakdown, recent items, security score |
| `GET` | `/activity` | Timeline with `group`, `action`, `q`, `per_page` and `page` |
| `GET` | `/notifications` | Paginated notifications with `filter=unread`, `category` |
| `POST` | `/notifications/{id}/read` | Mark one as read |
| `POST` | `/notifications/read-all` | Mark all as read |
| `DELETE` | `/notifications/{id}` | Delete one |
| `DELETE` | `/notifications/read` | Clear all read notifications |

### Profile, settings, devices and plans

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/profile` | Profile and profile statistics |
| `POST`/`PUT` | `/profile` | Update profile (`multipart/form-data` for avatars) |
| `POST` | `/profile/password` | Change password and revoke other sessions |
| `GET` | `/profile/export` | Download a JSON data export |
| `DELETE` | `/profile` | Delete the account |
| `GET` | `/settings` | User, device count and plans |
| `PUT` | `/settings/security` | Security toggles and auto-lock timeout |
| `PUT` | `/settings/notifications` | Notification preferences |
| `PUT` | `/settings/privacy` | Privacy preferences |
| `GET` | `/devices` | List devices, current first |
| `DELETE` | `/devices/{id}` | Revoke a device (current device is protected) |
| `DELETE` | `/devices` | Revoke all other devices |
| `GET` | `/plans` | Active plans and current plan |
| `POST` | `/plans/upgrade` | Change plan and storage limit |

### Public share links

These routes do **not** require a session:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/share/{token}` | Public document metadata |
| `GET` | `/share/{token}/file` | Inline preview |
| `GET` | `/share/{token}/download` | Download |

---

## Database model

| Table | Purpose |
| --- | --- |
| `plans` | Starter, Professional and Business storage tiers |
| `users` | Account, profile, security, notification and privacy settings |
| `documents` | Document metadata, soft deletes and share tokens |
| `credentials` | Encrypted credential records |
| `activities` | Audit trail |
| `devices` | Signed-in device records |
| `notifications` | Laravel database notifications |
| `sessions` | Server-side authenticated sessions |

Documents, credentials, activities, devices and notifications all belong to a user. Document and credential policies enforce ownership on every read and write.

---

## Testing

The backend suite uses PHPUnit with an in-memory SQLite database, Laravel factories and fake local storage.

```bash
cd backend
php artisan test
```

Current suite: **88 tests, 419 assertions** covering session authentication, registration, password reset, session revocation, document upload/search/update/trash/share/verify/download, credentials, profile, settings, devices, plans, notifications, activity, dashboard and public sharing.

Run the frontend type-check and production build:

```bash
cd frontend
npm run build
```

Format PHP files before committing:

```bash
cd backend
vendor/bin/pint
```

---

## Tested workflows

The following flows were exercised end-to-end against the running XAMPP MariaDB database, the Laravel API and the Vite frontend:

1. Demo login, cookie-session authentication, reload persistence and logout
2. Registration, duplicate-email validation, sign-in and password reset
3. Dashboard statistics, storage breakdown, security score and notification badge
4. Document search, filters, sorting, pagination and category/sub-category views
5. Document upload, edit, favorite, preview, download, verify and delete
6. Bulk trash, restore, permanent delete and empty trash
7. Share-link creation, public metadata, inline preview, download, revocation and expiry
8. Credential create, reveal, rotate, import, edit, favorite, filter and delete
9. Trash, notifications (mark read, mark all, delete, clear read), activity groups
10. Profile update, avatar upload/removal, password change, export and account deletion
11. Settings: general, security, notifications, privacy, devices and storage
12. Plan upgrade and immediate storage-limit update
13. Public share page, legal pages, 404 and unauthenticated redirects
14. Responsive layouts at desktop, tablet and mobile widths

---

## Security notes

- Passwords are hashed with Laravel's `hashed` cast (bcrypt).
- Credential secrets use Laravel's `encrypted` cast and are never serialized in list responses.
- Document files live on the private `local` disk; both previews and downloads pass through ownership policies.
- Share tokens are random 48-character strings; revoked, missing and expired links do not reveal the document.
- API routes use the Laravel `web` session guard with CSRF protection, rate-limited authentication endpoints and Form Request validation.
- Account deletion removes documents, stored files, sessions, notifications and avatar files.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `SQLSTATE[HY000] [1045]` | Check `DB_USERNAME`/`DB_PASSWORD` and grant privileges on `edrive.*` |
| XAMPP MySQL will not start / `10048` | Another MySQL server owns port `3306`; stop it before starting XAMPP MariaDB |
| `Route [login] not defined` | Run `php artisan route:clear`; API guests must receive JSON `401`, not a redirect |
| `419 Page Expired` | Call `GET /api/auth/csrf-cookie` and send the `XSRF-TOKEN` value in `X-XSRF-TOKEN` |
| Signed out after every reload | Open the frontend and API on the same hostname (`127.0.0.1` or `localhost`) |
| `Route [password.reset] not defined` | Run `php artisan route:clear` and confirm `routes/web.php` is current |
| Avatars do not load | Run `php artisan storage:link` |
| CORS error in the browser | Make sure `FRONTEND_URL` matches the exact frontend origin and credentials are enabled |
| Frontend shows stale API URL | Update `frontend/.env` and restart `npm run dev` |
| Reset links go to the wrong host | Set `FRONTEND_URL` to the public frontend origin |
