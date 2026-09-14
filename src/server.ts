import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');
const app = express();

// 1. Servir los archivos estáticos (js, css, imágenes)
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

// 2. Para TODAS las rutas, devolver directamente el index.html (Bypass total de SSR)
app.get('*', (req, res) => {
  res.sendFile(join(browserDistFolder, 'index.html'));
});

// 3. Levantar el servidor
const port = process.env['PORT'] || 4000;
app.listen(port, () => {
  console.log(`Frontend en vivo en el puerto ${port}`);
});