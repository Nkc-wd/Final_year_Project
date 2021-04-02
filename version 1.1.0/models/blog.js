var mongoose = require("mongoose");

var blogSchema = new mongoose.Schema({
   name: String,
   image: String,
   description: String,
   imageId	:String,
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ],
	created: {type: Date, default: Date.now},
	likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    bookmarks: [
      {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
      }
  ]
});

module.exports = mongoose.model("Blog", blogSchema);