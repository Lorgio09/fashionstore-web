// Producción (ng build). En desarrollo Angular lo reemplaza por environment.development.ts (angular.json → fileReplacements).
export const environment = {
  production: true,
  apiUrl: 'https://fashionstore-api-kedu.onrender.com/api',
  // Tienda pública (header X-Empresa) para visitantes sin sesión; se cambia con ?tienda=<slug>.
  tiendaPorDefecto: 'estilo-urbano',
};
