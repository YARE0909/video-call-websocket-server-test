import mysql from "mysql2/promise";

export const dbConnect = async () => {
  try {
    const connection = await mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "Ferrari@2004",
      database: "orion",
    });
    console.log("Connected to MySQL");
    return connection;
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err;
  }
};
