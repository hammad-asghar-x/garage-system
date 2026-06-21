# 🚗 GMS Pro - Garage Management System

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)

**GMS Pro** is a comprehensive, enterprise-grade web application designed to digitize and streamline the daily operations of an automotive garage. It replaces manual paperwork with a seamless, multi-role digital workflow, connecting customers, technicians, managers, and accountants in one unified platform.

🔗 **Live Demo:** [https://your-project-name.vercel.app](https://your-project-name.vercel.app) *(Replace with your actual Vercel URL)*

---

## 🌟 Key Features

###  Multi-Role Access Control
The system features 9 distinct user roles, each with a customized dashboard and specific permissions:

1. **Customer Portal:** 
   - Secure login via Mobile Number or CNIC.
   - Real-time vehicle service tracking (Timeline view).
   - View detailed invoices and service history.
   - Submit ratings and feedback.
2. **Receptionist:** Create work orders, manage customer profiles, and schedule appointments.
3. **Inspection Technician:** Perform initial vehicle checks, upload photos, and log defects.
4. **Manager:** Oversee operations, approve jobs, manage staff, and view revenue analytics.
5. **Mechanic/Technician:** View assigned jobs, track labor hours, and request parts from inventory.
6. **QA Technician:** Perform final quality checks and approve jobs for billing.
7. **Inventory Clerk:** Manage parts stock, set reorder levels, and approve technician part requests.
8. **Accountant:** Generate automated invoices, calculate taxes, and process Cash/Online payments.
9. **Super Admin:** Full system access and configuration.

### ️ Core Functionalities
- **Automated Invoicing:** Auto-calculates parts, labor (based on tracked hours), and 17% tax.
- **Inventory Management:** Real-time stock deduction, low-stock alerts, and duplicate SKU handling.
- **Secure Staff Onboarding:** API-based user creation with secure temporary passwords.
- **Dynamic Sidebar:** Role-based navigation with hidden scrollbars for a clean UI.
- **Profile Management:** Users can update personal details (CNIC, Address) and change passwords securely.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI (Radix UI primitives)
- **Icons:** Lucide React
- **State Management:** React Hooks & Context API

### Backend & Database
- **BaaS:** Supabase
- **Database:** PostgreSQL (with Row Level Security)
- **Authentication:** Supabase Auth (Email/Password & Anonymous sessions)
- **Storage:** Supabase Storage (for inspection photos)

### Deployment
- **Hosting:** Vercel (Edge Network)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- A Supabase account and project
- npm or yarn package manager

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/hammad-asghar-x/garage-management-system.git
   cd garage-management-system
