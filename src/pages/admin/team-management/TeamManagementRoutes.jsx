import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TeamManagement from './TeamManagement';
import TeamDetails from './TeamDetails';

const TeamManagementRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<TeamManagement />} />
      <Route path=":teamId" element={<TeamDetails />} />
    </Routes>
  );
};

export default TeamManagementRoutes;
