const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();


const dbUrl = process.env.DB_URL;

const databaseConnection = async () => {
    try {
      await mongoose.connect(dbUrl);
      console.log("Database connected successfully");
    } catch (error) {
      console.log("Database connection failed", error);
    }
  }

  module.exports = databaseConnection;