import pg from "pg"; import dotenv from "dotenv"; dotenv.config();
const {Pool}=pg; export const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL&&!process.env.DATABASE_URL.includes("localhost")?{rejectUnauthorized:false}:false});
export const q=(t,p=[])=>pool.query(t,p);
