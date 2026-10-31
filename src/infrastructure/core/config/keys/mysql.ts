import dontenv from 'dotenv'

dontenv.config()

const MYSQL_KEYS = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "gptBot",
    port: parseInt(process.env.DB_PORT || "3306"),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
}

export default MYSQL_KEYS;