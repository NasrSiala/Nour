import mysql from 'mysql2/promise';

async function createDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306,
    });
    
    await connection.query('CREATE DATABASE IF NOT EXISTS nour;');
    console.log('Successfully created database "nour"!');
    await connection.end();
  } catch (error) {
    console.error('Failed to create database:', error);
    process.exit(1);
  }
}

createDatabase();
