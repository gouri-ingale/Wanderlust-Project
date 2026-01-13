if(process.env.NODE_ENV != "production"){
  require('dotenv').config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require('./models/user.js');

const dbUrl = process.env.ATLASDB_URL;
// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const store = MongoStore.create({
  mongoUrl : dbUrl,
  crypto : {
    secret : process.env.SECRET,
  },
  touchAfter : 24 * 3600,
});

store.on("error",(err)=>{
  console.log("ERROR IN MONGO SESSION STORE",err);
});

const sesstionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};



app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

main()
  .then((res) => {
    console.log("connected");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.use(session(sesstionOptions));
app.use(flash());

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

// app.use("/demouser",async(req,res)=>{  
//   let fakeUser = new User({
//     email : "student@gmail.com",
//     username : "delta-student",
//   });

//  let registeredUser =  await User.register(fakeUser , "helloworld"); 
//  res.send(registeredUser);
// });

// redirect root ("/") to "/listings"
app.get("/", (req, res) => {
  res.redirect("/listings");
});

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/",userRouter);


// app.get("/testListing", async(req,res)=>{
//     let listing = new Listing({
//         title : "My New Villa",
//         description : "By the beach",
//         price : 1200,
//         location : "Calengute, Goa",
//         country : "India",
//     });
//     await listing.save();
//     res.send("Suuessful");
// });
app.all("/*catchall", (req, res, next) => {
  console.log("404 triggered by URL:", req.url); // 👈 Add this
  next(new ExpressError(404, "Page Not Found!"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  //res.status(statusCode).send(message);
  res.status(statusCode).render("err.ejs", { message });
});
app.listen(8080, () => {
  console.log("Server is listening to port 8080");
});
