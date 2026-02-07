import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react'; // ou o plugin que você estiver usando
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      // Adicione a configuração 'external' aqui
      external: [
        // Expressão regular para externalizar todos os pacotes do Firebase
        /^firebase\/.*/,
      ],
    },
  },
});
