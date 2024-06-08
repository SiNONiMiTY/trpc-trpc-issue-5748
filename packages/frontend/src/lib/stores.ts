import type { AppRouter } from '@trpc-subscription/backend/trpc/v1/router'
import {
    createTRPCClient,
    createWSClient,
    httpBatchLink,
    httpLink,
    splitLink,
    wsLink,
} from '@trpc/client'
import superjson from 'superjson'
import { readable } from 'svelte/store'

import { PUBLIC_API_ENDPOINT, PUBLIC_WS_ENDPOINT } from '$env/static/public'

// tRPC Client
export const trpcClientStore = readable<TTrpcClient>(
    createTRPCClient<AppRouter>({
        links: [
            splitLink({
                condition: (op) => op.type === 'subscription',
                true: wsLink({
                    // WebSocket
                    client: createWSClient({
                        url: PUBLIC_WS_ENDPOINT,
                    }),
                    transformer: superjson,
                }),
                false: [
                    // HTTP
                    splitLink({
                        condition: (op) => {
                            const skipBatchPaths: string[] = [
                                'user.signIn',
                                'user.signOut',
                                'user.signUp',
                            ]

                            return (
                                skipBatchPaths.includes(op.path) ||
                                op.context.skipBatch === true
                            )
                        },
                        true: httpLink({
                            url: PUBLIC_API_ENDPOINT,
                            transformer: superjson,
                        }),
                        false: httpBatchLink({
                            url: PUBLIC_API_ENDPOINT,
                            transformer: superjson,
                        }),
                    }),
                ],
            }),
        ],
    }),
)
