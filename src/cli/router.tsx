import React from 'react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router';


// Re-export router hooks for convenience
export { useNavigate, useLocation, useParams } from 'react-router';

const PlaceholderScreen: React.FC = () => {
  return null;
};

export const AppRouter: React.FC = () => {
  return (
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/*" element={<PlaceholderScreen />} />
      </Routes>
    </MemoryRouter>
  );
};
