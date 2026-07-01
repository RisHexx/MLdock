import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import Setup from './pages/Setup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Models from './pages/Models';
import Upload from './pages/Upload';
import ModelDetail from './pages/ModelDetail';
import ApiKeys from './pages/ApiKeys';
import Playground from './pages/Playground';
import Logs from './pages/Logs';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<Setup />} />
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/models" element={<Models />} />
            <Route path="/models/upload" element={<Upload />} />
            <Route path="/models/:id" element={<ModelDetail />} />
            <Route path="/api-keys" element={<ApiKeys />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="/logs" element={<Logs />} />
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
