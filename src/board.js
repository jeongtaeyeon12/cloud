const mongoose = require("mongoose");
const User = require("./config.js");

// 게시글 스키마
const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // 참조할 사용자 스키마
  },
});

module.exports = mongoose.model("Post", PostSchema);
