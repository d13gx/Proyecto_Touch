import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
 
// Plugin para capturar errores de "URI malformed" antes de que Vite los propague.
// Ocurre cuando el servidor recibe peticiones con caracteres inválidos en la URL.
const uriSafeMiddleware = {
  name: 'uri-safe-middleware',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      try {
        if (req.url) decodeURI(req.url)
      } catch {
        req.url = '/'
      }
      next()
    })
  }
}
 
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), uriSafeMiddleware],
  server: {
    host: '0.0.0.0',
    port: 80,
    strictPort: true,
    cors: true,
    allowedHosts: ['totem.cmf.cl'],
    hmr: {
      // Evita que la pantalla de error rompa la vista del tótem
      overlay: false
    }
  }
})