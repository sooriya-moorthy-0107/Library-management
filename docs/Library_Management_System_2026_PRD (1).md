# Library Management System 2026
## Product Requirements Document
**Version:** 1.0 | **Date:** June 2026 | **Edition:** Enterprise  
**Prepared for:** College Administration & IT Department  
**Classification:** Confidential — Internal Use Only  
**Tech Stack:** React · React Native · NestJS · PostgreSQL

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Stakeholders & Role Definitions](#2-stakeholders--role-definitions)
3. [User Stories](#3-user-stories)
4. [Functional Flows](#4-functional-flows)
5. [Database Schema](#5-database-schema-postgresql)
6. [API Specification](#6-api-specification)
7. [Admin-Configurable System Settings](#7-admin-configurable-system-settings)
8. [Notification Specification](#8-notification-specification)
9. [Security Requirements](#9-security-requirements)
10. [Non-Functional Requirements](#10-non-functional-requirements)
11. [Technology Stack Details](#11-technology-stack-details)
12. [Open Questions & Future Scope](#12-open-questions--future-scope)
13. [Glossary](#13-glossary)

---

## 1. Executive Summary

The Library Management System (LMS) 2026 is a comprehensive, enterprise-grade platform designed for a single college institution. It unifies physical book management, digital resource delivery, financial operations, and stakeholder communication under one roof — replacing fragmented, manual processes with an automated, role-driven workflow.

This document defines all functional requirements, user stories, data models, API specifications, and non-functional constraints for the system.

### Project Scope at a Glance

| Item | Detail |
|------|--------|
| Platform | Web (React), Mobile (React Native), Backend (NestJS), Database (PostgreSQL) |
| Roles | Super Admin, Admin, Librarian, Department Coordinator, Student |
| Primary Users | ~5,000 students, ~200 staff, ~10 librarians, 1 admin, 1 super admin |
| Deployment | Single-college, on-premise or cloud-hosted |
| Integrations | Email, SMS, WhatsApp, Push Notifications, Payment Gateways |

### 1.1 Project Objectives

- Digitise the end-to-end lifecycle of physical and digital library resources.
- Enforce role-based access with multi-factor authentication and audit trails.
- Automate fine calculation, payment collection, and PDF receipt generation.
- Enable real-time QR/barcode tracking of individual book copies.
- Provide executive-level dashboards and enterprise reports for decision-making.
- Support multi-language UI and accessibility standards.

### 1.2 Success Metrics

| Metric | Target |
|--------|--------|
| Book check-out time | < 30 seconds with QR scan |
| System uptime | 99.9% (< 8.7 hrs downtime/year) |
| Fine collection rate | 95% of dues collected within 30 days |
| Notification delivery | < 5 minutes for all channels |
| Report generation | < 10 seconds for standard reports |
| Mobile app adoption | > 80% of active students within 6 months |
| Audit log retention | 5 years, tamper-proof |
| Backup recovery time | < 4 hours (RTO) |

---

## 2. Stakeholders & Role Definitions

The system supports five distinct roles, each with a dedicated permission boundary enforced at the API and UI layers.

### 2.1 Role Matrix

| Role | Primary Responsibilities | Key Permissions | Access Scope |
|------|--------------------------|-----------------|--------------|
| Super Admin | System configuration, tenant management, security policy | Full system access, MFA policy, backup management, feature flags | All modules, all data |
| Admin | Day-to-day operations management, user management, reports | User CRUD, book catalog, fine settings, report generation | All modules excluding system config |
| Librarian | Issue/return books, manage physical inventory, handle fines | Issue/return, QR scanning, fine collection, no-due cert issuance | Circulation, inventory, fines |
| Department Coordinator | Approve or reject book requests from students in their dept. | View student requests, approve/reject, view dept. reports | Own department only |
| Student | Search catalog, request books, view dues, make payments | Catalog search, request, renew, pay fines, download certificates | Own records only |

### 2.2 Authentication Requirements per Role

| Role | Authentication Requirements |
|------|-----------------------------|
| Super Admin | College email + password + TOTP MFA (mandatory) |
| Admin | College email + password + TOTP or SMS OTP MFA (mandatory) |
| Librarian | College email + password + OTP MFA (mandatory) |
| Department Coordinator | College email + password + OTP (first login mandatory) |
| Student | College email + password; MFA optional, configurable by admin |

---

## 3. User Stories

### 3.1 Authentication & Onboarding

#### US-AUTH-01: College Email Login
**As a user**, I want to log in using my college-issued email and password so that only authorised members can access the system.

**Acceptance Criteria:**
- System accepts only emails matching the college domain (configurable by Super Admin).
- Password must be minimum 10 characters with uppercase, digit, and special character.
- Failed login attempts lock the account after 5 tries; admin can unlock.
- Session token expires after 8 hours of inactivity.

#### US-AUTH-02: Multi-Factor Authentication
**As an Admin or Librarian**, I must complete MFA after password verification so that compromised passwords alone cannot grant access.

**Acceptance Criteria:**
- System supports TOTP (Google Authenticator / Authy) and SMS OTP.
- MFA can be enforced globally by Super Admin via system settings.
- Backup codes generated on MFA setup (8 single-use codes).

#### US-AUTH-03: Password Reset
**As any user**, I want to reset my password via college email OTP so I can regain access without contacting support.

**Acceptance Criteria:**
- OTP is valid for 10 minutes and single-use.
- New password cannot match last 5 passwords.

---

### 3.2 Book Catalog & Discovery

#### US-CAT-01: Search & Filter Catalog
**As a Student or Librarian**, I want to search the catalog by title, author, ISBN, subject, or department so I can quickly find relevant books.

**Acceptance Criteria:**
- Full-text search with autocomplete (debounced, 300 ms).
- Filters: department, language, format (physical/digital), availability status.
- Results show real-time availability: copies available out of total.
- Digital books show DRM access status (immediate, request-required, restricted).

#### US-CAT-02: Book Detail View
**As a Student**, I want to see complete book details including copy locations so I can decide whether to request it.

**Acceptance Criteria:**
- Shows: ISBN, author(s), publisher, edition, language, tags, subject, department, physical location (shelf/rack), availability count, digital access link.
- Displays recent reviews (if enabled by admin).

#### US-CAT-03: Add Book to Catalog
**As a Librarian or Admin**, I want to add a new book to the catalog so the inventory stays current.

**Acceptance Criteria:**
- ISBN lookup auto-fills metadata from OpenLibrary/Google Books API (fallback to manual).
- Upload cover image (JPEG/PNG, max 2 MB).
- Assign number of physical copies; each copy gets a unique copy ID + QR code.
- Set DRM policy per book: open-access, borrow-only, restricted.

---

### 3.3 Circulation — Issue & Return

#### US-CIRC-01: Issue Book (Physical)
**As a Librarian**, I want to issue a physical book to a student by scanning QR/barcode so the transaction is logged instantly.

**Acceptance Criteria:**
- Scan student ID card QR and book copy QR.
- System checks: student has no overdue items, fine balance is zero (or within allowed limit), daily issue limit not exceeded, book is available.
- Issue period configurable per book category (default 14 days, admin-configurable).
- Confirmation screen shows due date; SMS/email/WhatsApp notification sent to student.

#### US-CIRC-02: Return Book
**As a Librarian**, I want to process a book return by scanning the QR code so the system automatically calculates fines.

**Acceptance Criteria:**
- Scan book copy QR; system identifies the borrower and due date.
- If returned late, fine auto-calculated at configured daily rate.
- If book is damaged, librarian marks damage level; additional fine applied.
- PDF receipt generated and emailed to student.

#### US-CIRC-03: Renewal
**As a Student**, I want to renew my borrowed book online so I don't have to visit the library for an extension.

**Acceptance Criteria:**
- Renewal allowed if: no reservation queue, within admin-configured renewal window.
- Max renewals per book configurable (default 2).
- Renewal resets due date from today (not from original due date).

#### US-CIRC-04: Book Request & Approval Workflow
**As a Student**, I want to request a book that is currently unavailable so I am placed in a queue.

**Acceptance Criteria:**
- Student submits request; request enters approval workflow.
- Department Coordinator reviews and approves/rejects with optional comment.
- On approval, request queued; when copy becomes available, student is notified.
- Request expires if student does not collect within 48 hours of notification.

#### US-CIRC-05: Digital Book Access
**As a Student**, I want to read a digital book within the system so I can access library resources remotely.

**Acceptance Criteria:**
- Digital books open in browser-based PDF/ePub viewer with DRM enforcement.
- DRM limits: configurable simultaneous readers, download restriction (on/off), print restriction.
- Session time-limited; reading progress saved per user.

---

### 3.4 Fine Management

#### US-FINE-01: Fine Calculation
**As the system**, I should automatically calculate overdue fines so manual intervention is not required.

**Acceptance Criteria:**
- Fine rates configurable per book category (e.g., ₹5/day for general, ₹10/day for reference).
- Grace period configurable (default 0 days).
- Fines capped at replacement cost of book (configurable).

#### US-FINE-02: Online Fine Payment
**As a Student**, I want to pay my library fine online so I can clear dues without visiting the library.

**Acceptance Criteria:**
- Payment via UPI, Credit/Debit Card, Net Banking, Wallet (Razorpay / PayU integration).
- Payment reference number stored; PDF receipt auto-generated and emailed.
- Partial payment not allowed; full outstanding balance must be paid.

#### US-FINE-03: Offline Fine Payment
**As a Librarian**, I want to record cash fine payments at the counter so all payment modes are tracked.

**Acceptance Criteria:**
- Librarian enters payment amount; system validates it matches outstanding fine.
- Manual receipt number entered; PDF receipt generated.
- Audit log records librarian ID, timestamp, and payment details.

#### US-FINE-04: Fine Waiver
**As an Admin**, I want to waive or reduce a fine in exceptional circumstances with a justification note.

**Acceptance Criteria:**
- Waiver requires admin-level role; Super Admin can waive any amount.
- Justification mandatory (min 20 characters).
- Waiver recorded in audit log and student ledger.

---

### 3.5 No Due Certificate

#### US-NDC-01: Generate No Due Certificate
**As a Student**, I want to download a No Due Certificate once all books are returned and fines cleared so I can use it for exams, graduation, or placements.

**Acceptance Criteria:**
- System verifies: zero active issues, zero outstanding fines.
- Certificate is a PDF with college letterhead, student details, date, and digital signature/seal.
- Certificate has a unique verification QR code; external parties can verify authenticity.
- Admin can revoke a certificate if a late return is discovered after issuance.

---

### 3.6 Notifications

#### US-NOTIF-01: Multi-Channel Notification Preferences
**As a Student**, I want to choose which notification channels I receive alerts on so I am not overwhelmed.

**Acceptance Criteria:**
- Channels: Email, SMS, WhatsApp, Push Notification (mobile app), In-App.
- Events: due-date reminder (3 days before, 1 day before, due day), overdue alert, fine applied, payment received, request status update, book available.
- Admin can force-enable certain notifications (e.g., overdue) regardless of student preference.

---

### 3.7 Executive Dashboard & Reports

#### US-DASH-01: Real-Time Dashboard
**As an Admin or Super Admin**, I want to see a live dashboard so I can monitor key library metrics at a glance.

**Acceptance Criteria:**
- KPI cards: Total books, Books issued today, Books overdue, Fines collected this month, Active users.
- Charts: Issue trend (last 30 days), Top borrowed books, Fine collection trend.
- Refreshes every 60 seconds; configurable by admin.

#### US-DASH-02: Enterprise Reports
**As an Admin**, I want to generate and export reports in multiple formats so I can share data with college management.

**Acceptance Criteria:**
- Report types: Circulation report, Inventory report, Fine report, Student dues report, Vendor procurement report, Audit report.
- Filters: date range, department, book category, role.
- Export formats: PDF, Excel (XLSX), CSV.
- Scheduled reports: admin can schedule weekly/monthly auto-email delivery.

---

## 4. Functional Flows

### 4.1 Book Issue Flow

1. Librarian opens the Issue screen on web or mobile.
2. Scans Student ID card (QR/barcode). System fetches student profile and validates eligibility.
3. Eligibility checks: (a) no outstanding fines above threshold, (b) current issued count < per-student limit, (c) student account is active.
4. Scans Book Copy QR/barcode. System fetches copy details and validates availability.
5. System displays issue summary: student name, book title, copy ID, due date.
6. Librarian confirms. Transaction is written to the database with a unique transaction ID.
7. System triggers notifications: in-app, email, and WhatsApp/SMS (per student preferences).
8. Audit log entry created.

### 4.2 Fine Payment Flow (Online)

1. Student logs in and navigates to **My Fines**.
2. System displays outstanding fine breakdown (per book, per day, total).
3. Student clicks **Pay Now**. System invokes payment gateway (Razorpay/PayU) with order details.
4. Student completes payment on gateway-hosted page.
5. Payment gateway posts webhook to backend `/payments/webhook`.
6. Backend validates webhook signature, marks fine as `PAID`, updates student ledger.
7. PDF receipt generated and emailed within 60 seconds.
8. In-app notification: _Fine paid successfully_.

### 4.3 Book Request & Approval Workflow

1. Student searches catalog; book is unavailable (all copies issued).
2. Student clicks **Request Book**; submits optional purpose note.
3. System creates a request record with status `PENDING_COORDINATOR`.
4. Department Coordinator receives in-app + email notification.
5. Coordinator approves or rejects. Rejection requires a reason.
6. On Approval: status moves to `QUEUED`. Request joins copy-availability queue.
7. When a copy is returned, system detects oldest pending approved request for that book.
8. Student notified (all channels): _Book available — collect within 48 hours_.
9. If collected: request closed, issue transaction created.
10. If not collected within 48 hours: request expires; next in queue is notified.

### 4.4 No Due Certificate Flow

1. Student navigates to **Certificates** section and clicks **Request No Due Certificate**.
2. System checks: zero active issues, zero outstanding fines.
3. If checks pass: PDF generated with unique cert ID, student details, date, and QR verification code.
4. PDF stored in object storage; download link emailed and available in-app.
5. Verification URL (`/verify/cert/{cert_id}`) is publicly accessible without login.

### 4.5 Vendor & Procurement Flow

1. Admin creates a Procurement Request with vendor details, book list, and budget.
2. Super Admin reviews and approves/rejects with comments.
3. On approval, Purchase Order PDF generated and emailed to vendor.
4. Admin records delivery: marks items received, flags damaged items.
5. Received books auto-added to catalog as new copies with unique QR codes.
6. Invoice uploaded and linked to procurement record for audit.

---

## 5. Database Schema (PostgreSQL)

> All tables include `created_at`, `updated_at` (auto-managed via triggers) and `deleted_at` (soft delete where noted). UUIDs (`uuid_generate_v4()`) used as primary keys unless otherwise noted.

### 5.1 Core Tables Overview

| Table | Purpose |
|-------|---------|
| `users` | All system users across all roles |
| `roles` | Role definitions and permission sets |
| `user_roles` | Many-to-many: user ↔ role assignment |
| `books` | Book catalog (one row per title/edition) |
| `book_copies` | Individual physical copies with unique QR/barcode |
| `digital_books` | Digital assets linked to a book, with DRM settings |
| `transactions` | Issue and return records |
| `book_requests` | Student requests + coordinator approval workflow |
| `fines` | Fine records per transaction |
| `payments` | Payment records (online + offline) |
| `notifications` | Notification log per user per event |
| `no_due_certificates` | Issued certificates with verification tokens |
| `vendors` | Vendor master records |
| `procurement_orders` | Procurement request and PO records |
| `procurement_items` | Line items within a procurement order |
| `audit_logs` | Immutable audit trail for all sensitive operations |
| `system_settings` | Admin-configurable key-value settings |
| `languages` | Supported UI languages |
| `departments` | College departments |
| `book_categories` | Book classification (fiction, reference, etc.) |

---

### 5.2 Key Table Definitions

#### `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, NOT NULL | Primary key |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | College email address |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt hashed password |
| `full_name` | VARCHAR(255) | NOT NULL | Display name |
| `student_id` | VARCHAR(50) | UNIQUE, NULLABLE | For student role |
| `department_id` | UUID | FK → departments | Assigned department |
| `phone` | VARCHAR(20) | NULLABLE | For SMS/WhatsApp |
| `preferred_language` | VARCHAR(10) | DEFAULT 'en' | UI language code |
| `is_active` | BOOLEAN | DEFAULT TRUE | Account active flag |
| `mfa_enabled` | BOOLEAN | DEFAULT FALSE | MFA status |
| `mfa_secret` | TEXT | NULLABLE, ENCRYPTED | TOTP secret |
| `failed_login_count` | INT | DEFAULT 0 | Lockout counter |
| `locked_until` | TIMESTAMPTZ | NULLABLE | Account lock expiry |
| `last_login_at` | TIMESTAMPTZ | NULLABLE | Last successful login |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete timestamp |

#### `books`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `isbn` | VARCHAR(20) | UNIQUE, NOT NULL | ISBN-10 or ISBN-13 |
| `title` | VARCHAR(500) | NOT NULL | Full title |
| `authors` | TEXT[] | NOT NULL | Array of author names |
| `publisher` | VARCHAR(255) | | Publisher name |
| `edition` | VARCHAR(50) | | Edition information |
| `publication_year` | SMALLINT | | Year of publication |
| `language_code` | VARCHAR(10) | FK → languages | Book language |
| `category_id` | UUID | FK → book_categories | Classification |
| `department_id` | UUID | FK → departments, NULLABLE | Dept restriction |
| `cover_image_url` | TEXT | NULLABLE | Object storage URL |
| `description` | TEXT | NULLABLE | Book summary |
| `fine_per_day` | NUMERIC(10,2) | NOT NULL | Daily fine rate |
| `max_issue_days` | SMALLINT | NOT NULL DEFAULT 14 | Loan period |
| `max_renewals` | SMALLINT | NOT NULL DEFAULT 2 | Renewal limit |
| `replacement_cost` | NUMERIC(10,2) | NULLABLE | Fine cap value |
| `is_digital_available` | BOOLEAN | DEFAULT FALSE | Has digital copy |
| `drm_policy` | VARCHAR(20) | DEFAULT 'BORROW_ONLY' | OPEN / BORROW_ONLY / RESTRICTED |

#### `book_copies`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `book_id` | UUID | FK → books, NOT NULL | Parent book |
| `copy_number` | VARCHAR(20) | NOT NULL | Human-readable copy no. |
| `barcode` | VARCHAR(100) | UNIQUE, NOT NULL | Physical barcode/QR value |
| `condition` | VARCHAR(20) | DEFAULT 'GOOD' | GOOD / FAIR / POOR / DAMAGED |
| `location_shelf` | VARCHAR(50) | NULLABLE | Physical shelf code |
| `location_rack` | VARCHAR(50) | NULLABLE | Physical rack code |
| `status` | VARCHAR(20) | DEFAULT 'AVAILABLE' | AVAILABLE / ISSUED / RESERVED / LOST |
| `acquired_date` | DATE | NULLABLE | Date added to inventory |
| `procurement_order_id` | UUID | FK → procurement_orders, NULLABLE | Source PO |
| `deleted_at` | TIMESTAMPTZ | NULLABLE | Soft delete (lost/retired) |

#### `transactions`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `copy_id` | UUID | FK → book_copies | Which copy |
| `user_id` | UUID | FK → users | Borrowing student |
| `issued_by` | UUID | FK → users | Librarian who issued |
| `returned_to` | UUID | FK → users, NULLABLE | Librarian who accepted return |
| `issued_at` | TIMESTAMPTZ | NOT NULL | Issue timestamp |
| `due_at` | TIMESTAMPTZ | NOT NULL | Due date/time |
| `returned_at` | TIMESTAMPTZ | NULLABLE | Actual return timestamp |
| `renewed_count` | SMALLINT | DEFAULT 0 | No. of renewals |
| `status` | VARCHAR(20) | DEFAULT 'ACTIVE' | ACTIVE / RETURNED / OVERDUE / LOST |
| `notes` | TEXT | NULLABLE | Librarian notes on return |

#### `fines`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `transaction_id` | UUID | FK → transactions, UNIQUE | Source transaction |
| `user_id` | UUID | FK → users | Student owing fine |
| `fine_type` | VARCHAR(20) | NOT NULL | OVERDUE / DAMAGE / LOSS |
| `amount` | NUMERIC(10,2) | NOT NULL | Calculated fine |
| `waived_amount` | NUMERIC(10,2) | DEFAULT 0.00 | Amount waived |
| `waived_by` | UUID | FK → users, NULLABLE | Admin who waived |
| `waiver_reason` | TEXT | NULLABLE | Mandatory justification |
| `status` | VARCHAR(20) | DEFAULT 'UNPAID' | UNPAID / PAID / PARTIALLY_WAIVED / FULLY_WAIVED |

#### `payments`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Primary key |
| `fine_id` | UUID | FK → fines | Fine being paid |
| `user_id` | UUID | FK → users | Payer |
| `collected_by` | UUID | FK → users, NULLABLE | Librarian (offline only) |
| `mode` | VARCHAR(20) | NOT NULL | ONLINE / OFFLINE |
| `gateway` | VARCHAR(50) | NULLABLE | RAZORPAY / PAYU (online) |
| `gateway_order_id` | TEXT | NULLABLE | Gateway order reference |
| `gateway_payment_id` | TEXT | NULLABLE | Gateway payment reference |
| `amount` | NUMERIC(10,2) | NOT NULL | Amount paid |
| `currency` | CHAR(3) | DEFAULT 'INR' | Currency code |
| `status` | VARCHAR(20) | DEFAULT 'PENDING' | PENDING / SUCCESS / FAILED / REFUNDED |
| `receipt_url` | TEXT | NULLABLE | PDF receipt object-storage URL |
| `paid_at` | TIMESTAMPTZ | NULLABLE | Payment completion time |

#### `audit_logs`

> **Integrity Note:** The `audit_logs` table is append-only. No `UPDATE` or `DELETE` permissions are granted to the application role. A separate read-only role (`lms_audit_reader`) is used for report queries. Logs older than 5 years are archived to cold storage, not deleted.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | BIGSERIAL | PK | Auto-increment (not UUID, for insert performance) |
| `actor_id` | UUID | FK → users, NOT NULL | Who performed the action |
| `action` | VARCHAR(100) | NOT NULL | e.g. `BOOK_ISSUED`, `FINE_WAIVED` |
| `entity_type` | VARCHAR(50) | NOT NULL | e.g. `Transaction`, `Fine` |
| `entity_id` | UUID | NOT NULL | ID of the affected record |
| `old_value` | JSONB | NULLABLE | Previous state snapshot |
| `new_value` | JSONB | NULLABLE | New state snapshot |
| `ip_address` | INET | NULLABLE | Requester IP |
| `user_agent` | TEXT | NULLABLE | Browser/device info |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT NOW() | Immutable timestamp |

---

## 6. API Specification

All APIs are RESTful over HTTPS, versioned under `/api/v1`. Authentication via JWT Bearer tokens. Rate limiting applied globally.

**Base URL:** `https://<college-domain>/api/v1`  
**Auth Header:** `Authorization: Bearer <access_token>`  
**Content-Type:** `application/json`  
**Dates:** ISO 8601 UTC (`2026-06-15T10:30:00Z`)  
**Pagination:** `?page=1&limit=20` → `{ data, meta: { page, limit, total } }`  
**Errors:** `{ statusCode, message, errors[] }`

---

### 6.1 Authentication Endpoints

| Method + Path | Description | Auth Required |
|---------------|-------------|---------------|
| `POST /auth/login` | Email + password login; returns access token + MFA challenge if enabled | None |
| `POST /auth/mfa/verify` | Submit TOTP or SMS OTP to complete login; returns JWT | Partial (post-password) |
| `POST /auth/refresh` | Refresh access token using refresh token | Refresh token |
| `POST /auth/logout` | Invalidate refresh token | Bearer JWT |
| `POST /auth/password/reset-request` | Send password-reset OTP to college email | None |
| `POST /auth/password/reset` | Submit OTP + new password to complete reset | None |
| `GET /auth/me` | Return current authenticated user's profile | Bearer JWT |

### 6.2 Book Catalog Endpoints

| Method + Path | Description | Min Role |
|---------------|-------------|----------|
| `GET /books` | List books with search + filters (`?q=`, `?category=`, `?available=true`) | Student |
| `GET /books/:id` | Get full book detail with availability count | Student |
| `POST /books` | Add new book to catalog | Librarian |
| `PATCH /books/:id` | Update book metadata | Librarian |
| `DELETE /books/:id` | Soft-delete book (marks all copies RETIRED) | Admin |
| `GET /books/:id/copies` | List all individual copies with status + location | Librarian |
| `POST /books/:id/copies` | Add new physical copies (generates QR codes) | Librarian |
| `PATCH /books/:id/copies/:copyId` | Update copy condition or location | Librarian |
| `GET /books/scan/:barcode` | Lookup book/copy by QR/barcode scan | Librarian |

### 6.3 Circulation Endpoints

| Method + Path | Description | Min Role |
|---------------|-------------|----------|
| `POST /circulation/issue` | Issue book copy to student | Librarian |
| `POST /circulation/return` | Process book return; triggers fine calculation | Librarian |
| `POST /circulation/renew/:txnId` | Student self-renewal | Student |
| `GET /circulation/active` | List all currently issued books | Librarian |
| `GET /circulation/overdue` | List overdue transactions | Librarian |
| `GET /circulation/history` | My borrow history (student) or all (admin) | Student |

### 6.4 Request & Approval Endpoints

| Method + Path | Description | Min Role |
|---------------|-------------|----------|
| `POST /requests` | Student submits a book request | Student |
| `GET /requests` | List requests (scoped by role) | Student |
| `GET /requests/:id` | Get request detail | Student |
| `PATCH /requests/:id/approve` | Coordinator approves request | Dept. Coordinator |
| `PATCH /requests/:id/reject` | Coordinator rejects with reason | Dept. Coordinator |
| `DELETE /requests/:id` | Student cancels own pending request | Student |

### 6.5 Fine & Payment Endpoints

| Method + Path | Description | Min Role |
|---------------|-------------|----------|
| `GET /fines` | List my fines (student) or all (admin/librarian) | Student |
| `GET /fines/:id` | Get fine detail with breakdown | Student |
| `POST /fines/:id/waive` | Admin: waive or reduce fine with reason | Admin |
| `POST /payments/initiate` | Initiate online payment; returns gateway URL | Student |
| `POST /payments/webhook` | Razorpay/PayU payment status webhook (internal) | System |
| `POST /payments/offline` | Librarian records offline cash payment | Librarian |
| `GET /payments/:id/receipt` | Download PDF receipt | Student |

### 6.6 Certificate Endpoints

| Method + Path | Description | Min Role |
|---------------|-------------|----------|
| `POST /certificates/no-due` | Generate No Due Certificate (checks eligibility) | Student |
| `GET /certificates/no-due` | List my certificates | Student |
| `GET /certificates/no-due/:id/download` | Download certificate PDF | Student |
| `GET /verify/cert/:certId` | Public verification endpoint (no auth required) | Public |
| `DELETE /certificates/no-due/:id` | Admin revokes certificate | Admin |

### 6.7 Dashboard & Reports Endpoints

| Method + Path | Description | Min Role |
|---------------|-------------|----------|
| `GET /dashboard/summary` | KPI cards: total books, issued today, overdue count, fines this month | Admin |
| `GET /dashboard/charts/issue-trend` | Daily issue counts for last N days (`?days=30`) | Admin |
| `GET /dashboard/charts/top-books` | Top N most borrowed books (`?limit=10`) | Admin |
| `POST /reports/generate` | Generate a report with filters; returns download URL | Admin |
| `GET /reports/:id/download` | Download generated report (PDF/XLSX/CSV) | Admin |
| `GET /reports/scheduled` | List scheduled reports | Admin |
| `POST /reports/scheduled` | Create a new scheduled report | Admin |

### 6.8 Admin & System Endpoints

| Method + Path | Description | Min Role |
|---------------|-------------|----------|
| `GET /users` | List users with filters (`?role=`, `?dept=`) | Admin |
| `POST /users` | Create new user | Admin |
| `PATCH /users/:id` | Update user profile or status | Admin |
| `DELETE /users/:id` | Soft-delete user (deactivate) | Admin |
| `GET /settings` | List all system settings | Admin |
| `PATCH /settings/:key` | Update a configurable setting | Super Admin |
| `GET /audit-logs` | Paginated audit log with filters | Admin |
| `GET /vendors` | List vendors | Admin |
| `POST /vendors` | Add vendor | Admin |
| `GET /procurement` | List procurement orders | Admin |
| `POST /procurement` | Create procurement request | Admin |
| `PATCH /procurement/:id/approve` | Super Admin approves PO | Super Admin |
| `POST /procurement/:id/receive` | Record delivery; adds book copies to catalog | Librarian |

---

## 7. Admin-Configurable System Settings

All settings are stored in the `system_settings` table as key-value pairs. Super Admin manages global settings; Admin manages operational settings.

| Setting Key | Default Value | Type | Description |
|-------------|---------------|------|-------------|
| `college_email_domain` | `college.edu.in` | STRING | Allowed email domain for signup |
| `max_books_per_student` | `3` | INTEGER | Max books a student can hold simultaneously |
| `default_loan_days` | `14` | INTEGER | Default issue period in days |
| `default_fine_per_day` | `5.00` | DECIMAL | Fine per overdue day (INR) |
| `grace_period_days` | `0` | INTEGER | Days after due date before fine starts |
| `max_renewals` | `2` | INTEGER | Max renewals per book per student |
| `renewal_window_days` | `3` | INTEGER | Days before due date renewal is allowed |
| `request_collection_hours` | `48` | INTEGER | Hours student has to collect after notification |
| `mfa_required_roles` | `SUPER_ADMIN,ADMIN,LIBRARIAN` | CSV | Roles that must use MFA |
| `session_timeout_minutes` | `480` | INTEGER | Idle session expiry in minutes |
| `password_min_length` | `10` | INTEGER | Minimum password length |
| `max_failed_logins` | `5` | INTEGER | Lockout threshold |
| `fine_payment_gateway` | `RAZORPAY` | STRING | Active payment gateway |
| `notification_whatsapp_enabled` | `true` | BOOLEAN | Global WhatsApp notification toggle |
| `notification_sms_enabled` | `true` | BOOLEAN | Global SMS notification toggle |
| `report_schedule_enabled` | `true` | BOOLEAN | Allow scheduled report emails |
| `backup_retention_days` | `90` | INTEGER | How long daily backups are kept |
| `audit_log_retention_years` | `5` | INTEGER | Audit log archival trigger |
| `dashboard_refresh_seconds` | `60` | INTEGER | Dashboard auto-refresh interval |
| `drm_max_simultaneous_readers` | `5` | INTEGER | Default for digital books |

---

## 8. Notification Specification

### 8.1 Notification Events & Channels

| Event | Email | SMS | WhatsApp | Push | In-App |
|-------|-------|-----|----------|------|--------|
| Book issued to student | ✅ | ✅ | ✅ | ✅ | ✅ |
| Due date reminder (3 days) | ✅ | ❌ | ✅ | ✅ | ✅ |
| Due date reminder (1 day) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Book overdue | ✅ | ✅ | ✅ | ✅ | ✅ |
| Fine applied | ✅ | ✅ | ✅ | ❌ | ✅ |
| Fine payment received | ✅ (receipt) | ❌ | ❌ | ✅ | ✅ |
| Request submitted | ✅ | ❌ | ❌ | ❌ | ✅ |
| Request approved | ✅ | ✅ | ✅ | ✅ | ✅ |
| Request rejected | ✅ | ❌ | ❌ | ✅ | ✅ |
| Book now available (queue) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Renewal confirmed | ✅ | ❌ | ❌ | ✅ | ✅ |
| No Due Certificate ready | ✅ (with PDF) | ❌ | ❌ | ✅ | ✅ |
| Account locked | ✅ | ✅ | ❌ | ❌ | ✅ |
| New procurement order (admin) | ✅ | ❌ | ❌ | ❌ | ✅ |

### 8.2 Notification Template Variables

Templates support the following dynamic variables wrapped in `{{ }}`:

| Variable | Description |
|----------|-------------|
| `{{student_name}}` | Full name of student |
| `{{book_title}}` | Title of the book |
| `{{copy_id}}` | Copy identifier |
| `{{due_date}}` | Formatted due date |
| `{{fine_amount}}` | Current fine total in INR |
| `{{collection_deadline}}` | Request collection deadline |
| `{{cert_id}}` | Certificate unique ID |
| `{{payment_reference}}` | Gateway payment reference |
| `{{librarian_name}}` | Issuing or receiving librarian name |

### 8.3 Notification Delivery Architecture

Notifications are processed asynchronously via a message queue (Bull/Redis) to prevent blocking API response times.

1. API creates notification record in DB with status `QUEUED`.
2. Notification worker picks up job from queue; attempts delivery via respective provider.
3. On success: status updated to `DELIVERED`, timestamp recorded.
4. On failure: retry up to 3 times with exponential backoff; then status set to `FAILED`.
5. Failed notifications surfaced in admin dashboard for manual review.

---

## 9. Security Requirements

### 9.1 Authentication & Session Security

- JWT access tokens: 15-minute expiry; signed with RS256.
- Refresh tokens: 7-day expiry; stored in `httpOnly` secure cookie.
- Token rotation on each refresh; old refresh token invalidated.
- MFA mandatory for Admin+ roles (TOTP via Authenticator app or SMS OTP).
- Brute force protection: account locked after 5 consecutive failures.
- IP-based rate limiting: 100 requests/minute per IP globally; 10 login attempts/minute.

### 9.2 Data Security

- All data in transit: TLS 1.2 minimum (TLS 1.3 preferred).
- Passwords: bcrypt with cost factor 12.
- MFA secrets: AES-256 encrypted at rest in database.
- PII fields (phone, email): encrypted at rest using column-level encryption.
- Database access: application uses least-privilege role (`lms_app`) with no DDL rights.
- Audit log table: separate role (`lms_audit_reader`) for read-only access.

### 9.3 API Security

- All API endpoints protected by JWT middleware except `/auth/login`, `/auth/password/*`, `/verify/cert/*`.
- Role-based guards at controller level enforce minimum role per endpoint.
- Input validation via `class-validator` on all DTOs; malformed requests rejected with 400.
- SQL injection prevention: parameterised queries via TypeORM exclusively.
- CORS: restricted to approved origins (web app domain + mobile app deep link).
- Content Security Policy headers on web frontend.

### 9.4 Digital Rights Management

| DRM Setting | Behaviour |
|-------------|-----------|
| `OPEN` | Anyone can read without login; no download restriction. |
| `BORROW_ONLY` | Student must have an active issue transaction to access. Session-locked. |
| `RESTRICTED` | Admin explicitly grants access per student. Manual approval flow. |
| Download enabled/disabled | Controls whether students can download the PDF/ePub. |
| Print enabled/disabled | Controls browser-level print API access. |
| Max simultaneous readers | Enforced via Redis counter; (n+1)th request is queued. |

---

## 10. Non-Functional Requirements

### 10.1 Performance

| Requirement | Target |
|-------------|--------|
| API response time (p95) | < 300 ms under 500 concurrent users |
| QR scan to confirmation | < 2 seconds |
| Search results | < 500 ms for full-text search |
| Report generation (standard) | < 10 seconds |
| Report generation (large, >10k rows) | < 60 seconds; async with download link |
| Dashboard load time | < 2 seconds initial; < 500 ms refresh |
| PDF generation (receipt/cert) | < 5 seconds |

### 10.2 Scalability

- Horizontal scaling of NestJS API via Docker containers + Nginx reverse proxy.
- PostgreSQL read replicas for dashboard and report queries.
- Redis for session cache, rate limit counters, and notification job queue.
- Object storage (S3-compatible: MinIO or AWS S3) for PDFs, cover images, procurement invoices.

### 10.3 Availability & Backup

| Requirement | Specification |
|-------------|---------------|
| Target uptime | 99.9% (< 8.7 hours downtime per year) |
| Daily backup | Full DB snapshot at 02:00 AM; retained 90 days |
| Weekly backup | Stored separately; retained 1 year |
| Monthly backup | Archived to cold storage; retained 5 years |
| Recovery Time Objective (RTO) | < 4 hours |
| Recovery Point Objective (RPO) | < 24 hours (daily backup window) |
| Backup verification | Automated restore-test weekly to staging environment |

### 10.4 Accessibility & Internationalisation

- WCAG 2.1 AA compliance for web application.
- Screen-reader compatible components (ARIA labels on all interactive elements).
- Multi-language support: UI strings externalised to i18n JSON files per language.
- Initial languages: English, Tamil, Hindi (configurable by Super Admin; new locales addable).
- Date, time, and currency formatting respects locale.

### 10.5 Mobile Application (React Native)

- iOS 15+ and Android 10+ support.
- Offline mode: students can view their current issues and due dates offline (cached).
- QR scanner built into mobile app for librarians (native camera permission required).
- Push notifications via FCM (Android) and APNs (iOS).
- Biometric authentication option (Face ID / Fingerprint) after first login.

---

## 11. Technology Stack Details

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend Web | React | 18.x | Admin, Librarian, Student web portal |
| Frontend Web | React Router | 6.x | Client-side routing |
| Frontend Web | TanStack Query | 5.x | Server state management + caching |
| Frontend Web | Zustand | 4.x | Client-side UI state |
| Frontend Web | Tailwind CSS | 3.x | Utility-first styling |
| Frontend Web | shadcn/ui | Latest | Accessible component library |
| Frontend Web | React-PDF | Latest | In-browser PDF viewer for digital books |
| Frontend Web | Recharts | Latest | Dashboard charts |
| Mobile | React Native | 0.73+ | iOS + Android apps |
| Mobile | Expo | 50+ | Build toolchain + OTA updates |
| Mobile | React Native Camera | Latest | QR/barcode scanner |
| Mobile | Notifee | Latest | Local + push notifications |
| Backend | NestJS | 10.x | API framework (TypeScript) |
| Backend | TypeORM | 0.3.x | ORM + migrations |
| Backend | Passport.js | 0.7.x | Auth strategies (JWT + TOTP) |
| Backend | Bull | 4.x | Job queue for notifications + reports |
| Backend | Puppeteer / PDFKit | Latest | PDF generation for receipts + certs |
| Database | PostgreSQL | 16.x | Primary data store |
| Cache / Queue | Redis | 7.x | Sessions, rate limits, Bull queue |
| Object Storage | MinIO / AWS S3 | Latest | PDFs, images, documents |
| Notifications | SendGrid / AWS SES | Latest | Email delivery |
| Notifications | Twilio | Latest | SMS + WhatsApp Business |
| Notifications | Firebase FCM | Latest | Android push notifications |
| Payments | Razorpay / PayU | Latest | Online payment gateway |
| DevOps | Docker + Docker Compose | Latest | Containerisation |
| DevOps | GitHub Actions | Latest | CI/CD pipelines |
| DevOps | Nginx | Latest | Reverse proxy + SSL termination |



Node.js and react.js 
---

## 12. Open Questions & Future Scope

### 12.1 Open Questions (Require Stakeholder Decision)

| Question | Options / Notes |
|----------|----------------|
| Payment gateway selection | Razorpay vs PayU — decision affects webhook schema and SDK. Confirm before Sprint 6. |
| Cloud vs On-Premise deployment | Affects infrastructure architecture; S3 vs MinIO choice depends on this. |
| Email service provider | SendGrid vs AWS SES — pricing and deliverability comparison needed. |
| WhatsApp Business API provider | Twilio vs WATI vs direct Meta API — depends on volume and budget. |
| Book metadata API | OpenLibrary (free) vs Google Books API (quota limits) vs manual entry only. |
| Digital book hosting | Self-hosted PDF files vs integration with a third-party ebook platform (e.g. OverDrive). |
| College ERP integration | Should student data sync from existing ERP? If yes, which ERP system and API? |
| Student photo on ID | Require profile photo for visual verification at counter? Storage and privacy implications. |
| Internship/alumni no-due policy | Should graduating students auto-trigger no-due check workflow? |

### 12.2 Deferred to Phase 2

- Inter-library loan (sharing books between multiple institutions).
- RFID integration (for large-scale inventory scanning without manual QR).
- Machine-learning-based book recommendation engine.
- Plagiarism checker integration for student submissions (via Turnitin/iThenticate).
- Public OPAC (Online Public Access Catalog) for non-authenticated catalog browsing.
- Mobile self-checkout kiosk mode (student scans their own books at kiosk).
- Analytics module with cohort analysis and reading trend forecasting.

---

## 13. Glossary

| Term | Definition |
|------|-----------|
| Copy | One physical book item (one barcode, one QR code). A title can have many copies. |
| Transaction | One issue-and-return record linking a student, a copy, an issue date, and a due date. |
| Fine | A monetary penalty attached to a transaction for overdue return or damage. |
| DRM | Digital Rights Management — controls how digital books are accessed and distributed. |
| QR Code | Quick Response matrix barcode printed on each book copy for fast scanning. |
| No Due Certificate | A signed document confirming a student has no outstanding books or fines. |
| Renewal | An extension of the due date for a currently issued book without physical return. |
| Procurement Order | A formal purchase order sent to a vendor for acquiring new books. |
| Audit Log | An immutable record of every sensitive operation in the system. |
| MFA | Multi-Factor Authentication — second factor (TOTP or OTP) beyond password. |
| TOTP | Time-based One-Time Password (e.g., Google Authenticator, Authy). |
| JWT | JSON Web Token — stateless bearer token used for API authentication. |
| RPO | Recovery Point Objective — max data loss tolerable in case of failure. |
| RTO | Recovery Time Objective — max downtime tolerable before system is restored. |
| OPAC | Online Public Access Catalog — public-facing catalog search. |
| PO | Purchase Order — formal vendor document authorising procurement. |
| Bull | Node.js job queue library backed by Redis for async background tasks. |

---

*— End of Document —*
