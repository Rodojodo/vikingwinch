import express from 'express';
import {createProxyMiddleware} from 'http-proxy-middleware';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

let backendTarget = process.env.BACKEND_URL || 'preview.railway.internal:8000';
// Strip surrounding quotes if entered in UI
backendTarget = backendTarget.replace(/^["']|["']$/g, '').trim();

if (!backendTarget.startsWith('http://') && !backendTarget.startsWith('https://')) {
  backendTarget = `http://${backendTarget}`;
}

console.log(`[Proxy] Routing /api/* requests to: ${backendTarget}`);

app.use(
  '/api',
  createProxyMiddleware({
    target: backendTarget,
    changeOrigin: true,
    pathRewrite: {
      '^/api': '',
    },
    on: {
      proxyReq: (proxyReq, req) => {
        console.log(`[Proxy Request] ${req.method} ${req.url} -> ${backendTarget}${proxyReq.path}`);
      },
      error: (err, req, res) => {
        console.error(`[Proxy Error] ${req.method} ${req.url} -> ${err.message}`);
          if (!res.headersSent && 'writeHead' in res && typeof res.writeHead === 'function') {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ detail: `Backend proxy error: ${err.message}` }));
        }
      },
    },
  })
);

// Serve static assets from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback all other routes to index.html for SPA client-side routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '::', () => {
  console.log(`[Server] vikingwinch-frontend running on port ${PORT} (dual-stack ::)`);
});
