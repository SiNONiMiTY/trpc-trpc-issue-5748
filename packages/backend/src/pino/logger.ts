import type { TRPC_ERROR_CODE_KEY } from '@trpc/server/unstable-core-do-not-import'
import { nanoid } from 'nanoid'

import pinoLogger from './index.js'

export const errorLogger = (
    errorInstance: Error,
    procedure: string,
    logId = nanoid(),
) => {
    let responseCode: TRPC_ERROR_CODE_KEY = 'INTERNAL_SERVER_ERROR'
    let responseMessage = 'An unknown error has occurred.'

    if (errorInstance instanceof AggregateError) {
        errorInstance.errors.forEach((error) =>
            pinoLogger.error(`${logId} | ${procedure} | ${error.message}`),
        )
    } else {
        // Insert cases ALPHABETICALLY
        switch (errorInstance.message) {
            case 'E_ACCESS_DENIED': {
                responseCode = 'FORBIDDEN'
                responseMessage = 'You cannot access this resource.'
                break
            }
            case 'E_ACCOUNT_CREDENTIALS_INVALID': {
                responseCode = 'UNAUTHORIZED'
                responseMessage = 'Invalid account credentials provided.'
                break
            }
            case 'E_ACCOUNT_LOCKED': {
                responseCode = 'FORBIDDEN'
                responseMessage = 'Your account is currently locked.'
                break
            }
            case 'E_INVALID_SESSION_ID': {
                responseCode = 'BAD_REQUEST'
                responseMessage = 'Session ID is either malformed or invalid.'
                break
            }
        }

        pinoLogger.error(`${logId} | ${procedure} | ${errorInstance.message}`)
    }

    return {
        logId,
        responseCode,
        responseMessage,
    }
}

export const infoLogger = (procedure: string, info: string) => {
    //
}
