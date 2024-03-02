const mongoose = require("mongoose");

const containerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  operatingSystem: {
    type: String,
    required: true,
  },
  containername: {
    type: String,
    required: true,
  },
  containerDuration: {
    type: String,
    required: true,
  },
  containerPort: {
    type: Number,
    required: true,
  },
});

const Container = mongoose.model("Container", containerSchema);

module.exports = Container;
