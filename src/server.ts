import express from 'express';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const app = express();

// 1. Detección dinámica e infalible de la carpeta de Angular
const rutaBase = process.cwd(); 
let browserDistFolder = join(rutaBase, 'dist/fashionstore-web/browser');

// Si por alguna razón Angular no creó la carpeta 'browser', apunta a la raíz del dist
if (!existsSync(browserDistFolder)) {
  browserDistFolder = join(rutaBase, 'dist/fashionstore-web');
}

// 2. Servir los archivos estáticos (js, css, imágenes)
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  })
);

// 3. Fallback seguro (Devolver siempre el index.html)
app.use((req, res) => {
  res.sendFile(join(browserDistFolder, 'index.html'));
});

// 4. Levantar el servidor
const port = process.env['PORT'] || 4000;
app.listen(port, () => {
  console.log(`Frontend en vivo en el puerto ${port}`);
  console.log(`Sirviendo archivos desde: ${browserDistFolder}`);
});