const mongoose = require("mongoose");
const connect = mongoose.connect(
  "mongodb+srv://wjdxodus6224:jhj*970521@cluster0.kzflcvj.mongodb.net/?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

//check
connect
  .then(() => {
    console.log("Datebase connected Successfully");
  })
  .catch(() => {
    console.log("Database cannot be connected");
  });

// Create a schema
const LoginSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  level: {
    type: Number,
    default: 1, // 기본 사용자는 1, 컨테이너를 만들 수 있는 권한은 2, 관리자 권한은 3
  },
});

// collection part

const User = mongoose.model("User", LoginSchema);

module.exports = User;
