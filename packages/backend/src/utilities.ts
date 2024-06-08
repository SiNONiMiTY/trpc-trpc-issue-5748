import type { DatabaseSession } from 'lucia'
import { customAlphabet } from 'nanoid'

import ioredisClient from './database/ioredis.js'

/**
 * Used on Lucia Custom Adapter & Integration tests
 */
export const writeSessionData = async (session: DatabaseSession) => {
    const transaction = ioredisClient.multi()
    transaction.zadd(
        `user_sessions:${session.userId}`,
        'GT',
        ...[
            Math.floor(Number(session.expiresAt) / 1000),
            session.id,
        ],
    )
    transaction.set(
        `session:${session.id}`,
        JSON.stringify(session),
        'EXAT',
        Math.floor(Number(session.expiresAt) / 1000),
    )
    await transaction.exec()
}

/**
 * Generate NanoIDs with custom alphabet & length fit for use as identifiers
 * https://zelark.github.io/nano-id-cc/
 */
export const nanoidCustom = customAlphabet(
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    12,
)
