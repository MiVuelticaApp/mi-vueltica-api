import dontenv from 'dotenv'

dontenv.config()

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set')
}

// Single source of truth shared with the Prisma CLI (prisma.config.ts)
const databaseUrl = new URL(process.env.DATABASE_URL)

const MYSQL_KEYS = {
    host: databaseUrl.hostname,
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: decodeURIComponent(databaseUrl.pathname.slice(1)),
    port: parseInt(databaseUrl.port || "3306"),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
}

export default MYSQL_KEYS;
