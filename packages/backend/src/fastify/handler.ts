import { fastifyWebsocket } from '@fastify/websocket'
import { fastifyRequestHandler } from '@trpc/server/adapters/fastify'
import {
    applyWSSHandler,
    type WSSHandlerOptions,
} from '@trpc/server/adapters/ws'
import {
    default as Fastify,
    type FastifyReply,
    type FastifyRequest,
} from 'fastify'

import { createContext } from '../trpc/v1/index.js'
import { appRouter, type AppRouter } from '../trpc/v1/router/_index.js'

export const handler = (options = {}) => {
    /**
     * Fastify Routing
     * https://www.fastify.io/docs/latest/Reference/Routes/#full-declaration
     *
     * Fastify WebSocket
     * https://github.com/fastify/fastify-websocket
     *
     * MDN HTTP Status Codes
     * https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
     *
     * tRPC Fastify Adapter
     * https://trpc.io/docs/server/adapters/fastify#create-fastify-server
     */

    // CORS Handling
    const corsAllowedHosts = process.env
        .APP_CORS_ALLOWED_HOSTS!.split(',')
        .map((host) => host.trim() || null)

    // Fastify HTTP Server
    const fastify = Fastify(options)

    // Fastify WebSocket Support
    fastify.register(fastifyWebsocket)

    // eslint-disable-next-line require-await
    fastify.register(async (fastifyWsPluginScope) => {
        const wssHandler = applyWSSHandler<AppRouter>({
            ...({
                createContext,
                router: appRouter,
            } as unknown as WSSHandlerOptions<AppRouter>),
            wss: fastifyWsPluginScope.websocketServer,
        })

        process.on('SIGTERM', () => {
            wssHandler.broadcastReconnectNotification()
            process.exit(0)
        })

        process.on('SIGINT', () => {
            wssHandler.broadcastReconnectNotification()
            process.exit(0)
        })

        fastify.route({
            url: '/trpc/v1',
            method: 'GET',
            handler: () => {},
            wsHandler: () => {
                // Handled by applyWSSHandler
            },
        })

        fastify.route({
            url: '/trpc/v1/:procedure',
            method: [
                'GET',
                'OPTIONS',
                'POST',
            ],
            handler: (
                request: FastifyRequest<{ Params: Record<string, string> }>,
                reply: FastifyReply,
            ) => {
                let origin = ''

                try {
                    origin = new URL(request.headers.origin ?? '').hostname
                } catch (err) {
                    /* EMPTY */
                }

                if (
                    process.env.NODE_ENV === 'development' ||
                    corsAllowedHosts.includes(origin)
                ) {
                    reply.header('access-control-allow-origin', '*')
                }

                if (request.method === 'OPTIONS') {
                    reply.header(
                        'access-control-allow-methods',
                        [
                            'GET',
                            'OPTIONS',
                            'POST',
                        ].join(', '),
                    )
                    reply.header(
                        'access-control-allow-headers',
                        [
                            'content-type',
                            'authorization',
                        ].join(', '),
                    )
                    reply.status(204)
                    reply.send()
                    return
                }

                return fastifyRequestHandler({
                    createContext,
                    path: request.params.procedure,
                    req: request,
                    res: reply,
                    router: appRouter,
                })
            },
            onRequest: (_request, reply, done) => {
                // Handle maintenance mode
                switch (process.env.APP_STATUS) {
                    case 'UP': {
                        done()
                        break
                    }
                    default: {
                        reply.hijack()
                        reply.raw.statusCode = 503
                        reply.raw.setHeader('content-type', 'application/json')
                        reply.raw.write(
                            JSON.stringify({
                                status: '🛠 UNDER MAINTENANCE 🛠',
                            }),
                        )
                        reply.raw.end()
                    }
                }
            },
        })

        fastify.route({
            url: '*',
            method: ['OPTIONS'],
            handler: (_request, reply) => {
                reply.status(400)
                reply.send('400 Bad Request')
            },
        })

        fastify.route({
            url: '*',
            method: [
                'GET',
                'HEAD',
            ],
            handler: (_request, reply) => {
                reply.status(404)
                reply.send('404 Not Found')
            },
        })

        fastify.route({
            url: '*',
            method: [
                'DELETE',
                'PATCH',
                'POST',
                'PUT',
                'SEARCH',
                'TRACE',
                'PROPFIND',
                'PROPPATCH',
                'MKCOL',
                'COPY',
                'MOVE',
                'LOCK',
                'UNLOCK',
            ],
            handler: (_request, reply) => {
                reply.status(405)
                reply.header('allow', '')
                reply.send('405 Method Not Allowed')
            },
        })
    })

    return fastify
}

export default handler
