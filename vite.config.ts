import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/volcengine': {
        target: 'https://ark.cn-beijing.volces.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/volcengine/, ''),
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('代理错误:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('代理请求:', req.method, req.url);
            
            // 打印请求头
            console.log('请求头:', JSON.stringify(proxyReq.getHeaders(), null, 2));
            
            // 获取请求信息
            console.log('请求方法:', req.method);
            console.log('请求路径:', req.url);
            
            // 注意：在某些情况下，req.body可能不可用
            // 这里我们只记录请求的基本信息
            
            // 打印完整的请求信息
            console.log('完整请求URL:', req.url);
          });
          
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('代理响应:', proxyRes.statusCode, req.url);
            
            // 打印响应头
            console.log('响应头:', JSON.stringify(proxyRes.headers, null, 2));
            
            // 收集响应体数据
            let responseBody = '';
            proxyRes.on('data', function(chunk) {
              responseBody += chunk.toString('utf8');
            });
            
            proxyRes.on('end', function() {
              try {
                // 尝试解析JSON
                const jsonBody = JSON.parse(responseBody);
                console.log('响应体(JSON):', JSON.stringify(jsonBody, null, 2));
              } catch (e) {
                // 如果不是JSON，打印前500个字符
                console.log('响应体(文本):', responseBody.substring(0, 500));
              }
            });
          });
        }
      }
    }
  }
})