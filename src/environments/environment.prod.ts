export const environment = {
  production: true,
  // Backend desplegado en Render (postulare-backend, ver render.yaml del
  // repo del backend). Va compilado dentro del bundle: si cambia la URL hay
  // que actualizarla aquí y volver a desplegar en Vercel.
  apiUrl: 'https://postulare-backend.onrender.com',
};
