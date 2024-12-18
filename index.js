require('dotenv').config();
const app = require('./app'); 
const connectDB = require('./config/databaseConfig'); 

// Connect to the database
connectDB();
// nodemon.connectDB = connectDB();
// Start the server
const PORT = 8080;
app.listen(PORT, async() => {
    console.log(`Server is running on port ${PORT}`);
});


