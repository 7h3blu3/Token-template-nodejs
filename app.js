const path = require('path')
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/auth")

require('dotenv').config()

const MONGODB_URI = 'mongodb+srv://' + process.env.mongoDb +'@cluster0.dm69koz.mongodb.net/assessment?retryWrites=true&w=majority'

const app = express();

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to database: ");
    console.log(MONGODB_URI);
  })
  .catch((err) => {
    console.log(err + " Connection to database failed!");
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});

app.use("/", authRoutes, userRoutes)

module.exports = app;
