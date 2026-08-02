# S2R2 Inventory Management System

## Cost Analysis & Commercial Proposal

**Prepared by:** Civitas Atlas Technologies Pvt. Ltd., Pune
**Prepared for:** S2R2 Technologies
**Document version:** 1.0 · August 2026
**Validity:** 90 days from issue date

> This document follows industry-standard software pricing practices applicable in India and complies with applicable laws including the Information Technology Act, 2000 (IT Act), IT (Amendment) Act, 2008, and GST Act, 2017.

---

## 1. Executive Summary

The S2R2 Inventory Management System is a custom full-stack enterprise web application covering IoT device management, multi-module inventory control, client relationship management, access governance, and exportable reporting. This document provides a transparent breakdown of development costs, licensing, maintenance obligations, and regulatory compliance obligations.

---

## 2. Regulatory & Legal Framework

### 2.1 Applicable Indian Laws

| Law / Regulation | Relevance |
|---|---|
| Information Technology Act, 2000 | Data processing, electronic records, digital signatures |
| IT (Amendment) Act, 2008 | Data protection obligations for sensitive personal data |
| Information Technology (Reasonable Security Practices) Rules, 2011 | Password hashing, encrypted storage, access control |
| Personal Data Protection Bill (DPDPB), 2023 | Data minimisation, consent, retention policies for client PII |
| GST Act, 2017 | 18% GST applicable on software services (SAC 998313) |
| Companies Act, 2013 | Software as intangible asset (amortisation over 3–5 years) |
| MSME Development Act, 2006 | Payment terms — max 45 days for MSME vendors |

### 2.2 Compliance Built into the System

| Compliance Requirement | Implementation |
|---|---|
| Password security (IT Rules 2011) | bcrypt (cost 10) hashing — no plain-text storage |
| Access control (IT Act) | JWT tokens, role-based middleware, ADMIN/EDITOR/VIEWER |
| Audit trail (IT Act, s.7) | Full activity log — who changed what and when |
| Data export / portability | CSV, Excel, PDF export on all modules |
| Session management | 8-hour JWT expiry, auto-logout on token failure |

---

## 3. Feature-wise Development Cost Breakdown

Rates based on Pune market — Senior Full-Stack Developer: ₹1,200–₹1,800/hr.
All prices exclude GST (18% applicable).

### 3.1 Core Modules

| Module / Feature | Est. Hours | Rate (₹/hr) | Cost (₹) |
|---|:---:|:---:|---:|
| **Authentication** — JWT login, roles, session | 12 | 1,500 | 18,000 |
| **User Management** — CRUD, role assignment, admin panel | 16 | 1,500 | 24,000 |
| **Editable Permission Matrix** (live toggle grid) | 10 | 1,500 | 15,000 |
| **Dashboard** — live stats, stock values, activity feed | 18 | 1,500 | 27,000 |
| **Raw Materials** — CRUD, price, stock value, sort, filter | 20 | 1,500 | 30,000 |
| **Finished Products** — CRUD, price, stock value per item | 18 | 1,500 | 27,000 |
| **Clients** — CRUD, cards + table, search | 16 | 1,500 | 24,000 |
| **Clients — Excel Import** (preview + bulk create) | 12 | 1,500 | 18,000 |
| **IoT Devices** — CRUD, ping, status tracking | 14 | 1,500 | 21,000 |
| **Reports** — 4 tabs, date filter, CSV/Excel/PDF | 20 | 1,500 | 30,000 |
| **PDF Export** (PDFKit, A4, branded) — 3 modules | 14 | 1,500 | 21,000 |
| **Activity Log** — paginated, username attribution | 10 | 1,500 | 15,000 |
| **Dark / Light Mode** — persistent, flash-free | 6 | 1,500 | 9,000 |
| **Responsive UI** — mobile sidebar, grid/table toggle | 14 | 1,500 | 21,000 |
| **Footer** — global, branded, Civitas attribution | 3 | 1,500 | 4,500 |
| **Database Schema + Migrations** (Neon PostgreSQL) | 8 | 1,500 | 12,000 |
| **Seed data + password management** | 4 | 1,500 | 6,000 |
| **Backend API** (Express, Prisma, 7 route modules) | 24 | 1,500 | 36,000 |
| **Deployment configuration** (.env, PostCSS, tsconfig) | 6 | 1,500 | 9,000 |
| **Code review, testing, QA** | 16 | 1,500 | 24,000 |
| **Documentation** (README + Cost Analysis) | 8 | 1,500 | 12,000 |
| **Sub-total — Development** | **257 hrs** | | **₹4,13,500** |

### 3.2 Infrastructure & Third-Party (Annual)

| Service | Plan | Annual Cost (₹) |
|---|---|---:|
| Neon PostgreSQL | Free tier (0–5 GB) | ₹0 |
| Neon PostgreSQL | Pro (up to 20 GB, autoscale) | ₹14,400/yr |
| Vercel (Frontend hosting) | Hobby | ₹0 |
| Vercel Pro | Team features, custom domain | ₹16,800/yr |
| Railway / Render (Backend) | Starter | ₹0 |
| Railway Pro | Always-on, custom domain | ₹12,000/yr |
| Domain name (.in) | Annual renewal | ₹800/yr |
| SSL Certificate | Auto via Vercel/Railway | ₹0 |

---

## 4. Pricing Summary

### 4.1 One-Time Development Fee

| Item | Amount (₹) |
|---|---:|
| Development (257 hrs × ₹1,500) | 4,13,500 |
| UI/UX design premium (10%) | 41,350 |
| Project management (8%) | 33,080 |
| **Sub-total (excl. GST)** | **4,87,930** |
| GST @ 18% (SAC 998313) | 87,827 |
| **Total One-Time (incl. GST)** | **₹5,75,757** |

### 4.2 Payment Schedule (Recommended)

| Milestone | % | Amount (₹ incl. GST) |
|---|:---:|---:|
| Project kickoff / agreement signing | 30% | 1,72,727 |
| Core modules delivered (alpha) | 40% | 2,30,303 |
| Final delivery + deployment | 30% | 1,72,727 |
| **Total** | 100% | **₹5,75,757** |

*As per MSME norms (MSMED Act, 2006), payment must be released within 45 days of invoice.*

---

## 5. Annual Maintenance Contract (AMC)

### 5.1 What is Covered

| Coverage Item | Included |
|---|:---:|
| Bug fixes and patches (critical: 24hr, major: 72hr SLA) | ✅ |
| Security patches (JWT, dependency updates) | ✅ |
| Database performance monitoring | ✅ |
| Up to 10 hrs/yr minor feature enhancements | ✅ |
| Neon DB schema migrations support | ✅ |
| Version compatibility updates (Next.js, Node.js) | ✅ |
| User onboarding support (email / remote) | ✅ |
| Monthly health-check report | ✅ |

### 5.2 What is NOT Covered in AMC

| Item | Status |
|---|---|
| New feature development (beyond 10 hrs) | Billed separately at ₹1,500/hr |
| Hardware / server procurement | Client responsibility |
| Data recovery from client-side deletions | Billed separately |
| Third-party API integration (ERP, WhatsApp etc.) | Separate project |
| Custom mobile app development | Separate project |

### 5.3 AMC Pricing

| AMC Tier | Coverage | Annual (₹ excl. GST) | Annual (₹ incl. GST 18%) |
|---|---|---:|---:|
| **Basic** | Bug fixes + security patches only | 24,000 | 28,320 |
| **Standard** | Basic + 10 hrs enhancements + monthly report | 42,000 | 49,560 |
| **Premium** | Standard + priority SLA + 20 hrs enhancements | 72,000 | 84,960 |

*AMC begins 30 days after final delivery (warranty period).*
*AMC renewal: 30 days advance notice required.*

---

## 6. Licensing & Intellectual Property

| Item | Terms |
|---|---|
| Source code ownership | Transferred to S2R2 Technologies on full payment |
| Third-party libraries | Open-source (MIT / Apache 2.0) — no royalty fees |
| Civitas attribution | Footer credit retained (industry standard) |
| Re-sale restriction | Client may not resell this software to third parties without written consent |
| White-labelling | Available as separate commercial arrangement (₹75,000 one-time) |

---

## 7. Total Cost of Ownership (3-Year TCO)

| Item | Year 1 (₹) | Year 2 (₹) | Year 3 (₹) |
|---|---:|---:|---:|
| Development (one-time) | 5,75,757 | — | — |
| AMC — Standard | 49,560 | 49,560 | 49,560 |
| Infrastructure (Pro tiers) | 46,200 | 46,200 | 46,200 |
| **Annual Total** | **6,71,517** | **95,760** | **95,760** |
| **3-Year TCO** | | | **₹8,63,037** |

*3-Year per-month effective cost: ₹23,973/month*

---

## 8. Comparison with Off-the-Shelf Alternatives

| Solution | Annual Cost | Custom for S2R2 | IoT Module | Excel Import | PDF Branded |
|---|---:|:---:|:---:|:---:|:---:|
| **S2R2 IMS (this system)** | ₹95,760 AMC | ✅ | ✅ | ✅ | ✅ |
| Zoho Inventory (Business) | ₹1,20,000 | ❌ | ❌ | Partial | ❌ |
| Odoo Manufacturing | ₹1,80,000+ | ❌ | Limited | ✅ | ❌ |
| SAP Business One | ₹6,00,000+ | ❌ | ❌ | ✅ | ✅ |
| Tally Prime | ₹54,000 | ❌ | ❌ | ❌ | ❌ |

---

## 9. Payment & Invoice Terms

- All invoices issued under GST registration with SAC code **998313** (Custom Software Development)
- Payment via NEFT / RTGS / UPI to Civitas Atlas Technologies Pvt. Ltd.
- Late payment: 2% per month interest as per Section 16 of MSMED Act, 2006
- Dispute resolution: Pune jurisdiction, arbitration under Arbitration and Conciliation Act, 1996

---

## 10. Contact & Authorisation

| | |
|---|---|
| **Vendor** | Civitas Atlas Technologies Pvt. Ltd. |
| **Address** | Pune, Maharashtra, India |
| **GST No.** | [Vendor GST Number] |
| **PAN** | [Vendor PAN] |
| **Email** | [contact@civitasatlas.com] |
| **Client** | S2R2 Technologies |

*This document is commercially confidential. Sharing with third parties requires written consent from Civitas Atlas Technologies Pvt. Ltd.*

---

*Document prepared in accordance with industry-standard software project costing practices.*
*All prices are indicative and subject to final scope agreement.*
*GST calculations based on 18% rate applicable to IT services (SAC 998313) as of FY 2026–27.*
