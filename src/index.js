const express = require("express");
const pasth = require("path");
const bcrypt = require("bcryptjs");
const collection = require("./config");

const app = express();
//변환
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
// EJS
app.set("view engine", "ejs");
// static file
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

// Register User
app.post("/signup", async (req, res) => {
  const data = {
    name: req.body.username,
    password: req.body.password,
  };
  // 중복제거
  const existingUser = await collection.findOne({ name: data.name });

  if (existingUser) {
    res.send("유저가 이미 존재합니다.");
  } else {
    // hash the password using bcrypt
    const saltRounds = 10; // Number of salt round for bcrypt
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    data.password = hashedPassword; //

    const userdata = await collection.insertMany(data);
    console.log(userdata);
  }
});

// 로그인 유저
app.post("/login", async (req, res) => {
  try {
    const check = await collection.findOne({ name: req.body.username });
    if (!check) {
      return res.send("잘못된 아이디입니다.");
    }
    const isPasswordMatch = await bcrypt.compare(
      req.body.password,
      check.password
    );
    if (isPasswordMatch) {
      res.render("home");
    } else {
      res.send("wrong password");
    }
  } catch (error) {
    console.error(error);
    res.send("wrong Details");
  }
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server running on Port: ${port}`);
});
