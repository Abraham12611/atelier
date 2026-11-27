import type { IncomingMessage, ServerResponse } from "node:http"
import react from "@vitejs/plugin-react"
import { resolve } from "node:path"
import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""))

  return {
    base: "/",
    build: { rollupOptions: { input: { main: resolve(import.meta.dirname, "index.html"), flow: resolve(import.meta.dirname, "flow.html") } } },
    server: { port: 5199, strictPort: true },
    plugins: [
      react(),
      {
        // TEMPORARY with api/llm.js: serves the OpenRouter test proxy during `vite dev`, as Vercel does in production.
        name: "dev-llm-proxy",
        configureServer(server) {
          server.middlewares.use("/api/llm", async (req: IncomingMessage, res: ServerResponse) => {
            const chunks: Buffer[] = []
            for await (const chunk of req) chunks.push(chunk as Buffer)
            const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : undefined
            const shim = Object.assign(res, {
              status(code: number) {
                res.statusCode = code
                return shim
              },
              json(value: unknown) {
                res.setHeader("Content-Type", "application/json")
                res.end(JSON.stringify(value))
              },
            })
            const { default: handler } = await server.ssrLoadModule("/api/llm.js")
            await handler(Object.assign(req, { body }), shim)
          })
        },
      },
    ],
  }
})
