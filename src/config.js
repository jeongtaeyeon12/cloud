const mongoose = require("mongoose");
const connect = mongoose.connect(
  "mongodb+srv://wjdxodus6224:jhj*970521@cluster0.kzflcvj.mongodb.net/?retryWrites=true&w=majority"
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
});

// collection part
const collection = new mongoose.model("users", LoginSchema);

module.exports = collection;
