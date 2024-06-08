// Drizzle Configuration
// https://orm.drizzle.team/kit-docs/config-reference

import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { defineConfig } from 'drizzle-kit'

// Load Environment Variables
dotenvExpand.expand(dotenv.config())

export default defineConfig({
    dbCredentials: {
        host: process.env.APP_DB_HOST!,
        port: Number(process.env.APP_DB_PORT),
        database: process.env.APP_DB_NAME!,
        user: process.env.APP_DB_USER,
        password: process.env.APP_DB_PASS,
    },
    dialect: 'postgresql',
    out: './src/database/drizzle/migrations',
    schema: './src/database/drizzle/schema.ts',
    strict: true,
    verbose: true,
})
