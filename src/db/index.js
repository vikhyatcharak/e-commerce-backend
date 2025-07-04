import mysql from 'mysql2/promise'

let connection;

export const connectDB = async () => {
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD
    })

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.MYSQL_DATABASE}\``);
    console.log(`Database "${process.env.MYSQL_DATABASE}" created or already exists`);

    await connection.changeUser({ database: process.env.MYSQL_DATABASE });

    console.log(" Connected to MySQL");
  } catch (err) {
    console.error(" MySQL connection failed:", err);
    throw err;
  }
};

export const db = () => connection;
