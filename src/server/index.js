import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Serve static files from the src/client directory
app.use(express.static(path.join(__dirname, '../../src/client')));

// Serve node_modules directory
app.use('/node_modules', express.static(path.join(__dirname, '../../node_modules')));

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
