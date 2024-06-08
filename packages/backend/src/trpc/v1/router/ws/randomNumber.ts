import { observable } from '@trpc/server/observable'

import { baseProcedure } from '../../index.js'

export default baseProcedure.subscription(() => {
    return observable<{ randomNumber: number }>((emit) => {
        const timer = setInterval(() => {
            // emits a number every second
            emit.next({ randomNumber: Math.random() })
        }, 200)

        return () => {
            clearInterval(timer)
        }
    })
})
