import fp from 'fastify-plugin'
import type { FastifyPluginAsync } from 'fastify'
import { createClient} from '@clickhouse/client'


// Extend Fastify's types so TypeScript knows about 'ch'
declare module 'fastify' {
  interface FastifyInstance {
    ch: ReturnType<typeof createClient>
  }
}

const clickhousePlugin: FastifyPluginAsync = async (fastify) => {
  const ch = createClient({
    url: process.env.CLICKHOUSE_URL || 'https://clickhouse.cloud',
    username: process.env.CLICKHOUSE_USERNAME || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
  })

  // Expose client globally via fastify.ch
  fastify.decorate('ch', ch)

  // Gracefully sever connections on server teardown
  fastify.addHook('onClose', async () => {
    await ch.close()
  })
}

export default fp(clickhousePlugin)
