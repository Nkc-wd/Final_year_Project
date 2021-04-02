require('dotenv').config(); 
var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Blog = require("../models/blog");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

//root route
router.get("/", function(req, res){
    res.render("landing");
});

// show register form
router.get("/register", function(req, res){
   res.render("register"); 
});


//handle sign up logic
router.post("/register", function(req, res){
    var smtpTrans,mailOptions;
    var newUser = new User({
        username: req.body.username,
        email: req.body.email
      });
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register", {error: err.message});
        }
        passport.authenticate("local")(req, res, function(){
           req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
           res.redirect("/blogs");  
        },
       smtpTrans = nodemailer.createTransport({
            service: 'Gmail',
           
            auth: {
          user: 'nkcwebdev@gmail.com',
          pass: process.env.GMAILPW
        }
        })),

        mailOptions = {
        to: newUser.email,
        from: 'nkcwebdev@gmail.com',
        subject: 'Welcome to Nblogs',
        text: 'Hi there,\n\n'+'Thanks for signing up in touch with Nblogs, Now can ready for blogging use the all features of Nblogs\n\n'+'Leave your valuable feedback on feedback that what you liked and what is need to improvement\n\n'+'Start your Journey with Nblogs nblogs.herokuapp.com'+'\n'+
			'if you have any query please inform us by that sending email or on feedback\n\n'+'If you were not signing up then contact us at nkcwebdev@gmail.com'+'\n\n'
         
      },
smtpTrans.sendMail(mailOptions, function (error, res) {
            if (error) {
                return console.log(error);
            }
        })
    });
});
//show admin form

router.get("/admin", function(req, res){
   res.render("admin"); 
});

// handle admin logic
router.post("/admin", function(req, res){
    var newUser = new User({
        username: req.body.username,
        email: req.body.email
      });
    if(req.body.adminCode === process.env.ADMIN_SEC) {
      newUser.isAdmin = true;
		 User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            req.flash("error", "False Credentials Information or Email Already Registered");
		res.redirect("/admin"); 
        }
        passport.authenticate("local")(req, res, function(){
           req.flash("success", "Successfully Signed Up! Nice to meet you " + req.body.username);
           res.redirect("/blogs"); 
        });
    });
    }  
	else{
		req.flash("error", "I know you are not an admin..Go away " + req.body.username);
		res.redirect("/admin"); 
	}
	});
	
//show login form
router.get("/login", function(req, res){
   res.render("login"); 
});

//handling login logic
router.post("/login", passport.authenticate("local", 
    {
        successRedirect: "/blogs",
        failureRedirect: "/login",
	    failureFlash : true,
	    successFlash: 'Welcome to N blogs!'
    }), function(err, res){
});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "Logged you out!");
   res.redirect("/blogs");
});

// forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 600000; // 10 min

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'nkcwebdev@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'nkcwebdev@gmail.com',
        subject: 'Nblogs Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'nkcwebdev@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'nkcwebdev@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
		     'Your username (Nblogs) : '+user.username+"\n\n"+
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/blogs');
  });
});

router.get("/tools", function(req, res){
  res.render("partials/tools");
});


module.exports = router;