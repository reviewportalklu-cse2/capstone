import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RubricsManagement from './RubricsManagement';
import RubricBuilder from './RubricBuilder';

const RubricsRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<RubricsManagement />} />
      <Route path="builder/:rubricId" element={<RubricBuilder />} />
    </Routes>
  );
};

export default RubricsRoutes;
