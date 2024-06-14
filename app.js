require("dotenv").config();
require('express-async-errors');
const path = require('path');
const connectDB = require("./db/connect");
const express = require("express");
const cors = require('cors')
const app = express();
const mainRouter = require("./routes/user");


app.use(cors());
app.use(express.json());

app.use("/api/v1", mainRouter);
app.use(express.static(path.join(__dirname, 'client', 'dist')));

// Fallback route to serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});
app.use('/uploads', express.static('uploads'));

const port = 3000;

const start = async () => {

    try {        
        await connectDB(process.env.VITE_REACT_APP_MANGO_URI);
        console.log('MongoDB connected successfully');
        app.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        })

    } catch (error) {
       console.log(error); 
    }
}

start();

