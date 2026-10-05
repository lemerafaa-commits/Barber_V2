import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

function whatsappDevApiPlugin(): Plugin {
  return {
    name: 'whatsapp-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/whatsapp/confirmation', async (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Método não permitido. Utilize POST.' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const { handleNotificationRequest } = await import('./src/services/notifications/serverHandler.ts');
            const result = await handleNotificationRequest(parsed);
            res.statusCode = result.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(result.body));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err?.message || 'Internal server error' }));
          }
        });
      });
    },
  };
}

function bookingsDevApiPlugin(): Plugin {
  return {
    name: 'bookings-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/bookings/create', async (req: any, res: any) => {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            let parsedBody: any = body;
            if (body && typeof body === 'string') {
              try {
                parsedBody = JSON.parse(body);
              } catch {
                parsedBody = body;
              }
            }
            req.body = parsedBody;

            // Polyfill compatível com Vercel Serverless Function no ambiente local
            if (typeof res.status !== 'function') {
              res.status = function (statusCode: number) {
                res.statusCode = statusCode;
                return res;
              };
            }
            if (typeof res.json !== 'function') {
              res.json = function (data: any) {
                if (!res.headersSent) {
                  res.setHeader('Content-Type', 'application/json');
                }
                res.end(JSON.stringify(data));
                return res;
              };
            }

            const { default: handler } = await import('./api/bookings/create.ts');
            await handler(req, res);
          } catch (err: any) {
            if (!res.writableEnded) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(
                JSON.stringify({
                  success: false,
                  error: {
                    code: 'INTERNAL_ERROR',
                    message: err?.message || 'Erro interno no middleware local do Vite',
                  },
                })
              );
            }
          }
        });
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), whatsappDevApiPlugin(), bookingsDevApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
