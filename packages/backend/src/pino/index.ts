import { existsSync, mkdirSync } from 'node:fs'
import pino from 'pino'

const logFilePath = `./logs/${process.env.APP_PINO_LOG_FILE_NAME!}`

try {
    // Create the log file directory if it does not exist
    if (!existsSync('./logs')) {
        mkdirSync('./logs', { recursive: true })
    }
} catch (err) {
    console.error(
        'Unable to create log file directory, check user permissions.',
    )
    process.exit(1)
}

const consoleTransport = {
    target: 'pino-pretty',
}

const fileTransport = {
    target: 'pino/file',
    options: {
        destination: logFilePath,
    },
}

export const pinoLogger = pino({
    transport: {
        ...(process.env.NODE_ENV === 'production' || process.env.TEST
            ? fileTransport
            : consoleTransport),
    },
    level: 'info',
    formatters: {
        bindings: () => {
            // Remove PID & Hostname
            return {}
        },
    },
})

export default pinoLogger
