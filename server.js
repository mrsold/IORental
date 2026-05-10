import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'dist' directory
// Note: You must run 'npm run build' before this will work
const distPath = path.join(__dirname, 'dist');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

// Serve static files from the 'dist' directory
if (fs.existsSync(distPath)) {
  console.log(`Found "dist" folder at ${distPath}. Serving static files.`);
  app.use(express.static(distPath));

  // Handle SPA routing: forward all requests to index.html
  app.get('*', (req, res) => {
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      console.error(`ERROR: "dist/index.html" missing at ${indexPath}`);
      res.status(404).send('<h1>Site Configuration Error</h1><p>The "dist" folder exists, but "index.html" is missing. Did the build finish successfully?</p>');
    }
  });
} else {
  console.warn(`WARNING: "dist" folder NOT found at ${distPath}`);
  app.get('*', (req, res) => {
    res.status(404).send('<h1>Site Not Built</h1><p>The "dist" folder was not found. You must run <code>npm run build</code> on the server to generate the production files.</p>');
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving assets from: ${distPath}`);
});
