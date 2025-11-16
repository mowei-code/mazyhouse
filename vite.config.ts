import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 部署到 GitHub Pages 需要設定這個 base 路徑
  // 例如：如果你的 repo 名稱是 'ai-property-app'，就設定為 '/ai-property-app/'
  base: '/<YOUR_REPO_NAME>/',
})
