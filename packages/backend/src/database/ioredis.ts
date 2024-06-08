import ioredis from 'ioredis'

export default new ioredis(process.env.APP_REDIS_URL!, {
    enableAutoPipelining: true,
}).on('error', () => {
    console.error('Could not connect to in-memory data store, reconnecting...')
})
