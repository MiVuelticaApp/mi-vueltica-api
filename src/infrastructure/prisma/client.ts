import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from './generated/prisma/client';
import MYSQL_KEYS from '../core/config/keys/mysql';


const adapter = new PrismaMariaDb(MYSQL_KEYS);
const prisma = new PrismaClient({ adapter });

export { prisma }