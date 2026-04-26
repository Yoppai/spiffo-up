import React from 'react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router';
import { DashboardScreen } from '../screens/index.js';


// Re-export router hooks for convenience
export { useNavigate, useLocation, useParams } from 'react-router';

export const AppRouter: React.FC = () => {
  return (
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/*" element={<DashboardScreen />} />
      </Routes>
    </MemoryRouter>
  );
};
