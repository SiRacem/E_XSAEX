const mongoose = require('mongoose');
// import mongoose

const config = require('config');
// import config

// create function to connect to database
const db = config.get('db');
const connectDB = async () => {
    try {
        await mongoose.connect(db)
        console.log('Database is Connected...');
    } catch (error) {
        console.log(error);
    }
}

module.exports = connectDB;