var express = require("express");
var router  = express.Router({mergeParams: true});
var Feedback = require("../models/feedback");
var middleware = require("../middleware");


   router.get("/", function(req, res){
    // Get all feedbacks from database
    Feedback.find({}, function(err, allFeedbacks){
       if(err){
           console.log(err);
       } else {
          res.render("feedbacks/index",{feedbacks:allFeedbacks});
       }
    });
});

// //Feedbacks New
router.get("/new",middleware.isLoggedIn, function(err, res){
        
             res.render("feedbacks/new");
    });

// //Feedbacks Create
router.post("/",middleware.isLoggedIn,function(req, res){
   //lookup blog using ID
        Feedback.create(req.body.feedback, function(err, feedback){
           if(err){
               req.flash("error", "Something went wrong");
               console.log(err);
           } else {
               //add username and id to comment
               feedback.author.id = req.user._id;
               feedback.author.username = req.user.username;
               //save comment
               feedback.save();
               
               req.flash("success", "Thank you! for your valuable feedback");
               res.redirect("/feedbacks");
           }
        });
   });

// FEEDBACK EDIT ROUTE
router.get("/:feedback_id/edit", middleware.checkFeedbackOwnership, function(req, res){
   Feedback.findById(req.params.feedback_id, function(err, foundFeedback){
      if(err){
          res.redirect("back");
      } else {
        res.render("feedbacks/edit", {feedback: foundFeedback});
      }
   });
});

// FEEDBACK UPDATE
router.put("/:feedback_id", middleware.checkFeedbackOwnership, function(req, res){
   Feedback.findByIdAndUpdate(req.params.feedback_id, req.body.feedback, function(err, updatedFeedback){
      if(err){
          res.redirect("back");
      } else {
		   req.flash("success", "Your feedback is succesfully updated");
          res.redirect("/feedbacks");
      }
   });
});

// // FEEDBACK DESTROY ROUTE
router.delete("/:feedback_id", middleware.checkFeedbackOwnership, function(req, res){
    //findByIdAndRemove
    Feedback.findByIdAndRemove(req.params.feedback_id, function(err){
       if(err){
           res.redirect("back");
       } else {
           req.flash("success", "Your feedback is succesfully deleted");
           res.redirect("/feedbacks");
       }
    });
});

module.exports = router;