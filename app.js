require('dotenv').config()

const mongoose = require("mongoose");
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

//my routes
const categoryRoutes = require("./routes/category");
const wallpaperRoutes = require("./routes/wallpaper");
const bannerRoutes = require("./routes/banner");
const keyRoutes = require("./routes/key");




//Middlewear
 app.use(bodyParser.json());
 app.use(cookieParser());
 app.use(cors());

//My Router
app.use("/api", categoryRoutes);
app.use("/api", wallpaperRoutes);
app.use("/api", bannerRoutes);
app.use("/api", keyRoutes);

//Port
const port = process.env.PORT || 5000;

//Starting server
app.listen(port, () => {
    console.log(`app is running at ${port}`);
} );

// DB connection
mongoose.connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("DB connected");
}).catch(
    console.log("DB not connected")
);
