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

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/myinfo", (req, res) => {
  res.render("myinfo");
});

app.get("/make", (req, res) => {
  res.render("make");
});

app.get("/manage", (req, res) => {
  res.render("manage");
});

app.get("/admin", (req, res) => {
  res.render("admin");
});

// 회원가입
app.post("/signup", async (req, res) => {
  const data = {
    name: req.body.username,
    password: req.body.password,
  };
  // 중복제거
  const existingUser = await collection.findOne({ name: data.name });

  if (existingUser) {
    return res.render("signup", { error: "이미 아이디가 존재합니다." });
  } else {
    // hash the password using bcrypt
    const saltRounds = 10; // Number of salt round for bcrypt
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);

    data.password = hashedPassword; //

    const userdata = await collection.insertMany(data);
    console.log(userdata);
    res.redirect("/");
  }
});

// 로그인 유저
app.post("/login", async (req, res) => {
  try {
    const check = await collection.findOne({ name: req.body.username });
    if (!check) {
      return res.render("login", { error: "잘못된 아이디입니다." });
    }
    const isPasswordMatch = await bcrypt.compare(
      req.body.password,
      check.password
    );
    if (isPasswordMatch) {
      // 로그인 성공 시 사용자의 Level에 따라 적절한 페이지로 리디렉션
      if (check.level === 1 || check.level === 2) {
        return res.render("home"); // Level 1 또는 Level 2 사용자는 '/home' 페이지로 리디렉션
      } else if (check.level === 3) {
        return res.render("admin"); // Level 3 사용자는 '/admin' 페이지로 리디렉션
      } else {
        // 사용자의 Level이 올바르지 않은 경우 기본적으로 홈페이지로 리디렉션
        return res.render("home");
      }
    } else {
      return res.render("login", { error: "잘못된 비밀번호입니다." });
    }
  } catch (error) {
    console.error(error);
    res.render("login", { error: "로그인에 실패했습니다. 다시 시도해주세요." });
  }
});

// 내정보
// 내정보
app.get("/myinfo", async (req, res) => {
  try {
    // 사용자가 로그인되어 있는지 확인
    if (!req.user) {
      return res.redirect("/login"); // 로그인되어 있지 않으면 로그인 페이지로 리디렉션
    }

    // 로그인 사용자 이름과 레벨을 가져옵니다.
    const user = await collection.findOne({ name: req.user.name });
    // 사용자 정보를 템플릿에 전달하여 렌더링
    res.render("myinfo", { user: user });
  } catch (error) {
    console.error(error);
    res.render("myinfo", {
      error: "사용자 정보를 가져오는 도중 에러가 발생했습니다.",
    });
  }
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server running on Port: ${port}`);
});
