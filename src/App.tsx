import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard } from './pages/Dashboard';
import { DataManagement } from './pages/DataManagement';
import { EmissionsCalculator } from './pages/EmissionsCalculator';
import { Scope3 } from './pages/Scope3';
import { Renewables } from './pages/Renewables';
import { ScenarioPlanning } from './pages/ScenarioPlanning';
import { Analytics } from './pages/Analytics';
import { Units } from './pages/Units';
import { Settings } from './pages/Settings';

function App() {
  return (
    <Router>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/units" element={<Units />} />
          <Route path="/data-management" element={<DataManagement />} />
          <Route path="/calculator" element={<EmissionsCalculator />} />
          <Route path="/scope3" element={<Scope3 />} />
          <Route path="/renewables" element={<Renewables />} />
          <Route path="/scenarios" element={<ScenarioPlanning />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </DashboardLayout>
    </Router>
  );
}

export default App;
