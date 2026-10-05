import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { exec } from 'child_process'

const shutdownPlugin = () => {
  return {
    name: 'shutdown-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/shutdown' && req.method === 'POST') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'shutting down' }));
          
          console.log('Initiating total system shutdown from web UI...');
          
          // 1. Kill Ollama Backend
          exec('taskkill /IM ollama.exe /F', () => console.log('Ollama stopped.'));
          
          // 2. Kill Docker Desktop Engine
          exec('taskkill /IM "Docker Desktop.exe" /F', () => {
            console.log('Docker Engine stopped.');
            // 3. Terminate Vite Server
            setTimeout(() => {
              console.log('Vite server terminating...');
              process.exit(0);
            }, 1000);
          });
          
          return;
        }
        next();
      });
    }
  }
}

export default defineConfig({
  plugins: [react(), shutdownPlugin()],
})
