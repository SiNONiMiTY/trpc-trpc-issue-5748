/**
 * Routers
 * https://trpc.io/docs/server/routers
 *
 * To begin building your tRPC-based API, you'll first need to define your router.
 * Once you've mastered the fundamentals, you can customize your routers for more advanced use cases.
 */

import { router } from '../index.js'
import ws from './ws/_index.js'

export const appRouter = router({
    ws,
})

export type AppRouter = typeof appRouter
