# Industrial Decarbonization Platform

A comprehensive platform for monitoring, calculating, and strategizing industrial carbon emissions. Designed for mines, factories, and industrial hubs to achieve Net-Zero targets.

## 🚀 Key Features

*   **Real-time Dashboard**: KPI monitoring and Net-Zero path forecasting.
*   **Unit Management**: Register and manage industrial nodes (mines/factories).
*   **Emissions Calculator**: Scope 1 & 2 calculations based on operational data.
*   **Bulk Data Import**: Upload Excel/CSV files for high-volume operational updates.
*   **Deep Analytics**: Multi-dimensional breakdown of emissions by source and scope.
*   **Strategy Reports**: Generate and download Net-Zero Transition Plans and BRSR Disclosures.

---

## 🛠️ Installation Guide

Follow these steps to set up the project on your local machine.

### 1. Prerequisites
Ensure you have the following installed:
*   **Node.js** (v18 or higher)
*   **npm** (comes with Node.js)
*   **PostgreSQL** (Active database server)

### 2. Clone the Repository
```bash
git clone https://github.com/AkineHime/industrial-decarbonization-platform.git
cd industrial-decarbonization-platform
```

### 3. Setup Frontend
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```
The frontend will run at `http://localhost:5173`.

### 4. Setup Backend
Open a new terminal window:
```bash
cd server

# Install dependencies
npm install

# Create .env file for database connection
# Set DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/DATABASE_NAME
```

### 5. Database Configuration
1.  Create a new PostgreSQL database.
2.  In the `server` directory, ensure your `.env` file points to this database.
3.  The tables will be automatically created on the first run.

### 6. Start Backend
```bash
npm run dev
```
The backend API handles requests at `http://localhost:3000`.

---

## 🏗️ Tech Stack

*   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Recharts, Lucide Icons.
*   **Backend**: Node.js, Express.js, PostgreSQL (pg).
*   **Utilities**: jsPDF (Reports), XLSX (Data Management).

---

## 📈 Strategy Modes
*   **Aggressive**: Target 50% reduction in emissions.
*   **Standard**: Target 20% reduction in emissions.
*   Toggle these modes on the dashboard to see different forecasting models.
