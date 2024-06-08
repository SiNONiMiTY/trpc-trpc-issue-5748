import { nanoid } from 'nanoid'

import handler from './handler.js'

// Start the server
try {
    console.log('🚀 tRPC/Fastify is ready to serve API requests 🚀')

    const server = handler({
        bodyLimit: Number(process.env.APP_FASTIFY_BODY_LIMIT) || 1048576,
        genReqId: () => nanoid(),
        maxParamLength: Number(process.env.APP_FASTIFY_MAX_PARAM_LENGTH) || 100,
        requestIdHeader: false,
    })

    await server.listen({
        host: '::',
        port: Number(process.env.APP_FASTIFY_LISTEN_PORT) || 3000,
    })
} catch (err) {
    console.error((err as Error).message)
    process.exit(1)
}
