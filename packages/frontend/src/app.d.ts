import type { AppRouter } from '@trpc-subscription/backend/trpc/v1/router'
import type { createTRPCClient } from '@trpc/client'
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
    namespace App {
        // interface Error {}
        // interface Locals {}
        // interface PageData {}
        // interface Platform {}
    }

    // Make *.svelte imports recognizable by Typescript
    module '*.svelte'

    type TRouterInput = inferRouterInputs<AppRouter>
    type TRouterOutput = inferRouterOutputs<AppRouter>
    type TSessionData = TRouterOutput['user']['signIn'] | undefined
    type TTrpcClient = ReturnType<typeof createTRPCClient<AppRouter>>
}

export {}
