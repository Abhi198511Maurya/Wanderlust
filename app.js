if (process.env.NODE_ENV != "production") {
    require('dotenv').config()
}

const express = require('express');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const path = require('path');
const methodOverride = require('method-override');
const ExpressError = require('./utils/ExpressError.js');
const session = require('express-session');
const MongoStore = require("connect-mongo");
const flash = require('connect-flash');
const listings = require('./routes/listing.js');
const reviews = require('./routes/review.js');
const user = require('./routes/user.js');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/User.js');

const app = express();

const dbURL = process.env.ATLASDB_URL;

main().then(() => {
    console.log('connected to DB');
}).catch((err) => {
    console.log(err);
});

async function main() {
    await mongoose.connect(dbURL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
app.engine('ejs', ejsMate);

app.use(express.static(path.join(__dirname, "public")));

const store = MongoStore.create({
    mongoUrl: dbURL,
    crypto: {
        secret: process.env.SECRET
    },
    touchAfter: 24 * 3600
});

store.on("error",()=>{
    console.log("ERROR IN MONGO SESSION STORE", err);
    
})

const secretOption = {
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,  //for one week 
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
    }
}

// app.get("/", (req, res) => {
//     res.send('Hi i am a root user');
// });


app.use(session(secretOption));
app.use(flash());

//after session middleware
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.use("/listings", listings);

app.use("/listings/:id/reviews", reviews);
app.use("/listings/:id/reviews", reviews);
app.use("/", user);

// app.get("/testlisting", async (req, res) => {
//     let sampleListing = new Listing({
//         title: "My new Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Goa",
//         country: "India"
//     });
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful testing");

// });

app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page not found"));
});

// CUSTOM ERROR HANDLER
app.use((err, req, res, next) => {
    let { status = 500, message = "some error occured" } = err;
    // res.status(status).send(message);
    res.status(status).render("error.ejs", { message });
});

app.listen(8080, () => {
    console.log('server is listening to port 8080');
});