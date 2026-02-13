# Industrial Decarbonization Platform

A comprehensive platform for monitoring, calculating, and strategizing industrial carbon emissions. Designed for mines, factories, and industrial hubs to achieve Net-Zero targets using data-driven insights.

## 🚀 Key Features

*   **Real-time Dashboard**: KPI monitoring and Net-Zero path forecasting with dynamic strategy toggles.
*   **Unit Management**: Register and manage industrial nodes (mines/factories) across multiple locations.
*   **Emissions Calculator**: Comprehensive Scope 1 & 2 calculations based on real operational inputs (Diesel, Electricity, Explosives).
*   **Scenario Planning**: Model decarbonization pathways with persistent interventions. Save and update custom strategies including CAPEX intensity and Net-Zero target forecasting.
*   **Bulk Data Management**: High-performance Excel/CSV ingestion for large-scale operational data.
*   **Professional Reporting**:
    *   **Strategic PDF Generator**: Detailed Net-Zero Transition Plans including methodology and emission factors.
    *   **Advanced Excel Export**: Regulatory-ready multi-sheet workbooks with Scope 1, 2, and 3 breakdowns.
*   **Environmental Intelligence (Deep Analytics)**: Premium dashboard for carbon intensity analysis, automated hotspot identification, and unit performance benchmarking across multiple industrial sites.

---

## 🛠️ Installation Guide

Follow these steps to set up the project on your local machine.

### 1. Prerequisites
Ensure you have the following installed:
*   **Node.js** (v18 or higher)
*   **npm**
*   **PostgreSQL** (Active database server)

### 2. Clone the Repository
```bash
git clone https://github.com/AkineHime/industrial-decarbonization-platform.git
cd industrial-decarbonization-platform
```

### 3. Setup Backend
Open a terminal in the `server` directory:
```bash
cd server
npm install

# Create/Configure .env
# Set DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/DATABASE_NAME
```

### 4. Setup Frontend
Open a new terminal in the root directory:
```bash
npm install
npm run dev
```
The frontend will run at `http://localhost:5173`.

---

## 🏗️ Tech Stack

*   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Recharts, Lucide Icons.
*   **Backend**: Node.js, Express.js, PostgreSQL (pg).
*   **Reporting**: 
    *   `jspdf`: Professional PDF strategy document generation.
    *   `xlsx`: Multi-sheet carbon inventory workbooks.

---

## 🌍 Sustainability Glossary
*   **Scope 1**: Direct emissions from company-owned sources (e.g., mine-site diesel combustion).
*   **Scope 2**: Indirect emissions from the generation of purchased energy (e.g., grid electricity).
*   **Scope 3**: Value chain emissions (e.g., downstream logistics).

---

## 📈 Strategy Modes
*   **Aggressive**: High Capex, rapid transition targeting 50%+ reduction.
*   **Standard**: Steady integration targeting 20% reduction.
