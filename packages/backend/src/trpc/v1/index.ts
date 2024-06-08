import { initTRPC } from '@trpc/server'
import type { FastifyReply, FastifyRequest } from 'fastify'
import superjson from 'superjson'

/**
 * Context
 * https://trpc.io/docs/server/context
 *
 * Your context holds data that all of your tRPC procedures will have access to,
 * and is a great place to put things like database connections or authentication information.
 */

type CustomFastifyContextOptions = {
    req: FastifyRequest<{ Params: Record<string, string> }>
    res: FastifyReply
}

export function createContext({ req, res }: CustomFastifyContextOptions) {
    return { req, res }
}

export type Context = Awaited<ReturnType<typeof createContext>>

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */

const t = initTRPC.context<Context>().create({
    transformer: superjson,
})

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */

export const router = t.router
export const baseProcedure = t.procedure
export const middleware = t.middleware
