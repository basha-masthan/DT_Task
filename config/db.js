require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'event_management';

let client;
let db;

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log('MongoDB connected successfully');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const getDB = () => {
  return db;
};

const getClient = () => {
  return client;
};

const closeDB = async () => {
  try {
    if (client) {
      await client.close();
    }
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};

module.exports = {
  connectDB,
  getDB,
  getClient,
  closeDB
};
