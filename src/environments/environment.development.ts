// Desarrollo (ng serve): backend local levantado con `venv\Scripts\python -m uvicorn main:app`.
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000/api',
  // Tienda pública (header X-Empresa) para visitantes sin sesión; se cambia con ?tienda=<slug>.
  tiendaPorDefecto: 'estilo-urbano',
};
