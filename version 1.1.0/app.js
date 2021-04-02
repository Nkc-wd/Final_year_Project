
var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    flash       = require("connect-flash"),
    passport    = require("passport"),
	cookieParser = require("cookie-parser"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    Blog  =       require("./models/blog"),
    Comment     = require("./models/comment"),
	Feedback     = require("./models/feedback"),
    User        = require("./models/user")
    
    
//requiring routes
var commentRoutes    = require("./routes/comments"),
	feedbackRoutes    = require("./routes/feedbacks"),
    blogRoutes = require("./routes/blogs"),
    indexRoutes      = require("./routes/index");
    
require('dotenv').config(); 
mongoose.connect("mongodb://localhost:27017/project_v1", {useNewUrlParser: true, useUnifiedTopology: true});
// var url = process.env.MONGO_DBS || process.env.LOCAL_DBS ;
// mongoose.connect(url);
// mongoose.connect("mongodb+srv://nkwebd:3663999@cluster0-lq9xv.mongodb.net/test?retryWrites=true&w=majority");
// mongoose.connect("mongodb://localhost/nk_blog_final", {useNewUrlParser: true, useUnifiedTopology: true});
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.use(cookieParser('secret'));
app.locals.moment = require('moment');


// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Once again Rusty wins cutest dog!",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});

app.use("/", indexRoutes);
app.use("/blogs", blogRoutes);
app.use("/blogs/:id/comments", commentRoutes);
app.use("/feedbacks", feedbackRoutes);

// var port = process.env.PORT || 3000;
// app.listen(port, function () {
//   console.log("Server Has Started!");
// });


app.listen("3000", () =>{
console.log("Server has started!");
});