import React from 'react';
import { Outlet } from 'react-router-dom';

// Root layout for modern routes using Outlet
const RootLayout: React.FC = () => {
  return (
    <Outlet />
  );
};

export default RootLayout;
