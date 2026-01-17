import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// NOTE:
// - In production (your server): base should be '/'
// - For GitHub Pages demo: base should match the repo name (e.g. '/calc-origin/')
//
// Build GH Pages with:  npm run build:gh
export default defineConfig(({ mode }) => {
  const isGhPages = mode === 'gh';

  return {
    plugins: [react()],
    base: isGhPages ? '/calc-demo/' : '/',
  };
});
