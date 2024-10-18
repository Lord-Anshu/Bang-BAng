if (process.env.NODE_ENV != "production") {
    require("dotenv").config();

}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const method_override = require("method-override");
const ejs_mate = require("ejs-mate");
const express_error = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");


const  listing_router = require("./routes/listing.js");
const  review_router = require("./routes/review.js");
const  user_router = require("./routes/user.js");


main()
    .then(()=>{
        console.log("SUCCESS");
    })
    .catch((err) =>{
        console.log(err)
    });
   
async function main() {
  await mongoose.connect(process.env.ATLAS_DBURL);

}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.use(method_override("_method"));
app.engine("ejs",ejs_mate);
app.use(express.static(path.join(__dirname,"/public")));

const store = MongoStore.create({
    mongoUrl : process.env.ATLAS_DBURL,
    crypto : {
        secret : process.env.SECRET,
    },
    touchAfter : 24 * 3600,

});

store.on("error" , () =>{
    console.log("error in mongo db store",err);
})

const sessionOptions = {
    store,
    secret : process.env.SECRET,
    resave : false,
    saveUninitialize : true,
    cookie : {
        expires : Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge :  7 * 24 * 60 * 60 * 1000,
        httpOnly : true,
    },
};



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currentUser = req.user;
    next();
});

app.use("/listings",listing_router);
app.use("/listings/:id/reviews",review_router);
app.use("/",user_router);

app.all("*",(req,res,next)=>{
    next(new express_error(404,"PAGE  NOT FOUND"));
});

app.use((err,req,res,next)=>{
    let {statusCode = 500, message = "Something went wrong !!"} = err;
    res.status(statusCode).render("error.ejs",{message});
    // res.status(statusCode).send(message);
});

const port = 8081;
app.listen(port,()=>{
    console.log("App is listening on port : ",port)
});