require('dotenv').config(); 
var express = require("express");
var router  = express.Router();
var Blog = require("../models/blog");
var middleware = require("../middleware");
var request = require("request");
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})
var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'nkcloud', 
  api_key: process.env.CLOUD_KEY, 
  api_secret: process.env.CLOUD_SEC
});





// INDEX - show all blogs
router.get("/", function (req, res) {
    var perPage = 12;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
    Blog.find({}).sort({created: -1}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, allBlogs) {
        Blog.countDocuments().exec(function (err, countDocuments) {
            if (err) {
                console.log(err);
            } else {
                res.render("blogs/index", {
                    blogs: allBlogs,
                    current: pageNumber,
                    pages: Math.ceil(countDocuments / perPage)
                });
            }
        });
    });
});


router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    if(req.file){
        //THIS FUNCTION IS AT THE BOTTOM OF THE PAGE
     uploadImage(req,res);
    } else {
         //THIS FUNCTION IS AT THE BOTTOM OF THE PAGE
      uploadURL(req,res);
}});
//===============================================
 

router.put("/:id",middleware.checkBlogOwnership, upload.single('image'), function(req, res){
  if(req.file){
    updateImage(req,res);
  }else{
    updateURL(req,res);
  }});


router.delete("/:id",middleware.checkBlogOwnership, function(req, res) {  
  if(req.file){
    deleteImage(req,res);
  }else{
    deleteURL(req,res);
  }});


//CLOUDINARY FUNCTION
 
function uploadImage(req,res){
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if(err) {
        req.flash('error', err.message);
      }
    
        
            // add cloudinary url for the image to the blog object under image property
         req.body.image = result.secure_url;
     var image = req.body.image;
          // add image's public_id to blog object
         req.body.imageId = result.public_id;
     var imaged=req.body.imageId;
          // add author to blog
          
      var name = req.body.name;
          
          var desc = req.body.description;
          var author = {
              id: req.user._id,
              username: req.user.username
          };
            var newBlog = {name: name, image: image,imageId:imaged, description: desc, author:author};
            // Create a new blog and save to DB
          console.log(req.body.name+"==================");
          Blog.create(newBlog, function(err, blog) {
            if (err) {
              req.flash('error', err.message);
              return res.redirect('back');
            }
            res.redirect('/blogs/' + blog.id);
          });
      });
};
 
 
//UPLOAD IMAGE VIA URL
function uploadURL(req,res){
          var name = req.body.name;
          var image = req.body.image;
          var desc = req.body.description;
          var author = {
              id: req.user._id,
              username: req.user.username
          };
            var newBlog = {name: name, image: image, description: desc, author:author};
            // Create a new blog and save to DB
            Blog.create(newBlog, function(err, newlyCreated){
                if(err){
                    console.log(err);
                } else {
                    //redirect back to blogs page
                    console.log(newlyCreated);
                    res.redirect("/blogs");
                }
            });
};
//NEW - show form to create new blog
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("blogs/new"); 
});

// SHOW - shows more info about one blog
router.get("/:id", function (req, res) {
  Blog.findById(req.params.id).populate("comments likes bookmarks").exec(function (err, foundBlog) {
    if (err) {
      console.log(err);
    } else {
      Blog.find({}, function (err, allBlogs) {
        if (err) {
          console.log(err);
        } else {
          res.render("blogs/show", {blog: foundBlog, blogs: allBlogs});
        }
      }
  );
    }
}
);
});
// EDIT BLOG ROUTE
router.get("/:id/edit", middleware.checkBlogOwnership, function(req, res){
    Blog.findById(req.params.id, function(err, foundBlog){
        res.render("blogs/edit", {blog: foundBlog});
    });
});

// UPDATE BLOG ROUTE BY UPLOAD
    function updateImage(req,res){
    Blog.findById(req.params.id, async function(err, blog){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
             try {
                    // if imageId is default, await the result to be uploaded
                    if (blog.imageId = "DEFAULT_IMAGEID") {
                        var result = await cloudinary.v2.uploader.upload(req.file.path);
                    } else {
                        //  if not default, find the old image using imageId and delete
                        await cloudinary.v2.uploader.destroy(blog.imageId);
                        var result = await cloudinary.v2.uploader.upload(req.file.path);
                    }
                    blog.imageId = result.public_id;
                    blog.image = result.secure_url;
                }  catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            blog.name = req.body.blog.name;
            blog.description = req.body.blog.description;
            blog.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/blogs/" + blog._id);
        }
    });
};
    // UPDATE BLOG ROUTE BY URL
    function updateURL(req,res){
       Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updatedBlog){
       if(err){
           res.redirect("/blogs");
       } else {
           //redirect somewhere(show page)
           res.redirect("/blogs/" + req.params.id);
       }
    });
};
 



   function deleteImage(req,res){
  Blog.findById(req.params.id, async function(err, blog) {
    if(err) {
      req.flash("error", err.message);
      return res.redirect("back");
    }
    try {
        await cloudinary.v2.uploader.destroy(blog.imageId);
        blog.remove();
        req.flash('success', 'Blog deleted successfully!');
        res.redirect('/blogs');
    } catch(err) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
    }
  });
};
  
  function deleteURL(req,res){
    Blog.findByIdAndRemove(req.params.id, function(err){
      if(err){
          res.redirect("/blogs");
      } else {
          res.redirect("/blogs");
      }
   });
};

// Blog Like Route
router.post("/:id/like", middleware.isLoggedIn, function (req, res) {
    Blog.findById(req.params.id, function (err, foundBlog) {
        if (err) {
            console.log(err);
            return res.redirect("/blogs");
        }

        // check if req.user._id exists in foundBlog.likes
        var foundUserLike = foundBlog.likes.some(function (like) {
            return like.equals(req.user._id);
        });

        if (foundUserLike) {
            // user already liked, removing like
            foundBlog.likes.pull(req.user._id);
        } else {
            // adding the new user like
            foundBlog.likes.push(req.user);
        }

        foundBlog.save(function (err) {
            if (err) {
                console.log(err);
                return res.redirect("/blogs");
            }
            return res.redirect("back");
        });
    });
});

// Blog Like Route
router.post("/:id/bookmark", middleware.isLoggedIn, function (req, res) {
  Blog.findById(req.params.id, function (err, foundBlog) {
      if (err) {
          console.log(err);
          return res.redirect("/blogs");
      }

      // check if req.user._id exists in foundBlog.likes
      var foundUserBookmark = foundBlog.bookmarks.some(function (bookmark) {
          return bookmark.equals(req.user._id);
      });

      if (foundUserBookmark) {
          // user already liked, removing like
          foundBlog.bookmarks.pull(req.user._id);
      } else {
          // adding the new user like
          foundBlog.bookmarks.push(req.user);
      }

      foundBlog.save(function (err) {
          if (err) {
              console.log(err);
              return res.redirect("/blogs");
          }
          return res.redirect("back");
      });
  });
});






module.exports = router;



