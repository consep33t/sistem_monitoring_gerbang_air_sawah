import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Consep33t",
  database: "sistem_monitoring_gerbang_air",
});
