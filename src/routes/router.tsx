import React, { Suspense, lazy } from 'react';
import {
  createBrowserRouter,
  createHashRouter,
  Navigate,
} from 'react-router-dom';

import RootLayout from '../App';
import Navigation from '../components/navigation/Navigation';

// Lazy-load calculators to reduce initial bundle size
const PipesHeatLossCalculator = lazy(
  () => import('../components/calculators/pipes/HeatLossCalculator')
);
const PipesCondensationCalculator = lazy(
  () => import('../components/calculators/pipes/CondensationCalculator')
);
const SheetsHeatLossCalculator = lazy(
  () => import('../components/calculators/sheets/HeatLossCalculator')
);
const SheetsCondensationCalculator = lazy(
  () => import('../components/calculators/sheets/CondensationCalculator')
);

const withSuspense = (node: React.ReactNode) => (
  <Suspense fallback={null}>{node}</Suspense>
);

const routes = [
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigation /> },
      { path: 'pipes/heat-loss', element: withSuspense(<PipesHeatLossCalculator />) },
      { path: 'pipes/condensation', element: withSuspense(<PipesCondensationCalculator />) },
      { path: 'sheets/heat-loss', element: withSuspense(<SheetsHeatLossCalculator />) },
      { path: 'sheets/condensation', element: withSuspense(<SheetsCondensationCalculator />) },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
];

// Router mode:
// - "browser" (default): for real production server with proper SPA fallback
// - "hash": for GitHub Pages demo (no server-side routing)
// Set via env: VITE_ROUTER_MODE=hash
const routerMode = (import.meta.env.VITE_ROUTER_MODE ?? 'browser') as
  | 'browser'
  | 'hash';

const router =
  routerMode === 'hash'
    ? createHashRouter(routes)
    : createBrowserRouter(routes, {
        // Works both for '/' (prod) and '/calc-origin/' (GH build)
        basename: import.meta.env.BASE_URL,
      });

export default router;
