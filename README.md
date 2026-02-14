# EcoTrack: Industrial Decarbonization Platform

EcoTrack is a high-performance, enterprise-grade platform for monitoring, calculating, and strategizing industrial carbon emissions. Designed for mines, factories, and industrial hubs to achieve Net-Zero targets using data-driven insights and AI-powered strategy generation.

## 🚀 Key Features

*   **Real-time Dashboard**: Centralized KPI monitoring with live Net-Zero path forecasting and dynamic strategy toggles.
*   **Unit Intelligence**: Register and manage industrial nodes (mines/factories) with geographical context (Grid Regions & Climate Zones) for hyper-accurate calculations.
*   **Precision Emissions Calculator**: Comprehensive Scope 1 & 2 calculations based on real operational inputs (Diesel, Electricity, Explosives) with location-based emission factors (CEA Baseline 2023).
*   **AI Strategic Reports**: Integration with **Google Gemini 2.0 Flash** to generate professional decarbonization strategy documents based on live operational data.
*   **Scenario Lab**: Advanced decarbonization pathway modeling with persistent interventions, Capex intensity tracking, and interactive Net-Zero forecasting.
*   **Value Chain (Scope 3) Tracking**: Dedicated module for indirect emissions with supplier ranking, spend-based calculation, and logistics impact analysis.
*   **Bulk Ingestion & Explorer**: 
    *   **Enterprise Template**: High-performance multi-sheet Excel ingestion covering Units, Scope 1, 2, and 3.
    *   **Database Explorer**: Instant real-time visibility into the Postgres/CockroachDB layer directly from the UI.
*   **Mathematical Visualizations**: Interactive donut breakdowns, horizontal protocol analysis, and monthly trend analysis with smooth HSL dynamic coloring.

---

## 🛠️ Tech Stack

### Frontend (UI/UX)
*   **React 18/19** with **TypeScript**
*   **Vite** (Next-gen build tooling)
*   **Tailwind CSS** (Modern glassmorphic design)
*   **Recharts** (Data visualization)
*   **Lucide React** (Icon system)

### Backend (Engine)
*   **Node.js & Express**
*   **Google Generative AI SDK** (Gemini 2.0 Flash)
*   **PostgreSQL/CockroachDB (pg)**
*   **SheetJS (XLSX)** (Complex file parsing)

### Database
*   **CockroachDB Cloud**: Distributed SQL database for global resilience and scalability.

---

## 🏗️ Installation Guide

Follow these steps to set up the project locally.

### 1. Prerequisites
*   **Node.js** (v18+)
*   **PostgreSQL** or **CockroachDB Cluster**
*   **Gemini API Key** (for AI reports)

### 2. Clone the Repository
```bash
git clone https://github.com/AkineHime/industrial-decarbonization-platform.git
cd industrial-decarbonization-platform
```

### 3. Backend Setup
```bash
cd server
npm install
```
Create a `.env` file in the `server` folder. **Do not commit this file.**
```env
PORT=3000
DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database>?sslmode=verify-full
GEMINI_API_KEY=your_google_ai_key
```

### 🔑 Getting your Database URL (CockroachDB)
1. Sign up/Log in to [CockroachDB Cloud](https://cockroachlabs.cloud/).
2. Create a standardized **Serverless Cluster**.
3. Create a SQL User and save the password.
4. Click **Connect** and copy the "General Connection String".
5. Paste it into your `.env` file as `DATABASE_URL`.

Run the server:
```bash
npm run dev
```

### 4. Frontend Setup
```bash
# In the root directory
npm install
npm run dev
```

---

## 🌍 Sustainability Glossary
*   **Scope 1**: Direct emissions from company-owned sources (e.g., mine-site diesel combustion).
*   **Scope 2**: Indirect emissions from purchased energy (e.g., grid electricity).
*   **Scope 3**: Value chain emissions (Purchased goods, vendor logistics, business travel).
*   **CAF (Climate Adjustment Factor)**: Adjustments for energy efficiency based on regional climate zones (Arid, Tropical, Montane).

---

## 🏛️ Database Schema
The platform uses a relational schema optimized for time-series carbon data:
*   `mines`: Industrial unit registry with geographical metadata.
*   `emissions`: Scope 1 & 2 operational data.
*   `scope3_entries`: Value chain and supplier data.
*   `scenarios`: Decarbonization intervention plans.
*   `budget_items`: Capex/Opex tracking for decarbonization projects.
*   `renewable_energy`: Renewable asset registry and generation logs.

> 📝 **Developer Note**: A complete SQL schema reference is available in [`SCHEMA_REFERENCE.sql`](./SCHEMA_REFERENCE.sql) for manual setup or reference.
