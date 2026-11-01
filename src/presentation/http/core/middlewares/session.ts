import session from "express-session";
import MySQLStoreFactory from "express-mysql-session";
import dotenv from "dotenv";
import MYSQL_KEYS from "@/infrastructure/core/config/keys/mysql";

dotenv.config();

const MySQLStore = MySQLStoreFactory(session);

const sessionStore = new MySQLStore(MYSQL_KEYS);

export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  rolling: true,
  cookie: process.env.ENV === "development"
    ? { 
        sameSite: "lax", 
        maxAge: 1000 * 60 * 60 * 24 * 7 
      }
    : {
        sameSite: "none",
        secure: true,
        domain: process.env.COOKIE_DOMAIN,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      }
});
