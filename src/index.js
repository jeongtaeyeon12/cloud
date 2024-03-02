const express = require("express");
const bcrypt = require("bcryptjs");
const passport = require("./passport");
const collection = require("./config");
const session = require("express-session");
const Post = require("./board.js");
const flash = require("connect-flash");
const User = require("./config.js");
const Container = require("./container.js");
const { NodeSSH } = require("node-ssh");
const ssh = new NodeSSH();
const SSHClient = require("ssh2").Client;

const app = express();

// 미들웨어
// express-session 설정
app.use(
  session({
    secret: "asdfasdfkjlasdfhasdkfhkj123", // 세션 암호화에 사용되는 임의의 문자열
    resave: false,
    saveUninitialized: false,
  })
);
app.use(flash());
// Passport 초기화 및 세션 설정
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
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

app.get("/make", (req, res) => {
  res.render("make");
});

app.get("/admin", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  res.render("admin", { user: req.user });
});

// 게시판 목록 조회 관련
app.get("/board", async (req, res) => {
  try {
    // 게시글 목록을 데이터베이스에서 가져와서 게시판 페이지에 전달
    const posts = await Post.find().populate("author", "name");
    res.render("board", { posts, user: req.user });
  } catch (error) {
    console.error("게시글 목록을 불러오는 중 오류 발생:", error);
    res.status(500).send("게시글 목록을 불러오는 중 오류가 발생했습니다.");
  }
});

// 게시글 생성 렌더링
app.get("/createPost", (req, res) => {
  res.render("createPost");
});

// 게시글 삭제 렌더링(get 요청)
app.get("/deletePost/:postId", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("로그인이 필요합니다.");
    }

    const postId = req.params.postId;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).send("게시글을 찾을 수 없습니다.");
    }

    // 게시글의 작성자와 현재 로그인한 사용자가 일치하는지 확인
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).send("권한이 없습니다.");
    }

    // post.remove() 대신에 deleteOne() 메서드를 사용하여 삭제합니다.
    await Post.deleteOne({ _id: postId });

    res.redirect("/board");
  } catch (error) {
    console.error("게시글 삭제 중 오류 발생:", error);
    res.status(500).send("게시글을 삭제하는 중 오류가 발생했습니다.");
  }
});

// 게시글 수정 페이지 렌더링
app.get("/editPost/:postId", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.redirect("/login");
    }

    const postId = req.params.postId;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).send("게시글을 찾을 수 없습니다.");
    }

    // 게시글의 작성자와 현재 로그인한 사용자가 일치하는지 확인
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).send("권한이 없습니다.");
    }

    res.render("editPost", { post });
  } catch (error) {
    console.error("게시글 수정 페이지 렌더링 중 오류 발생:", error);
    res
      .status(500)
      .send("게시글 수정 페이지를 렌더링하는 중 오류가 발생했습니다.");
  }
});

app.post("/editPost/:postId", async (req, res) => {
  try {
    // POST 요청으로 전송된 데이터 가져오기
    const postId = req.params.postId;
    const newData = req.body; // 예를 들어, 수정된 데이터가 이 부분에 담겨올 것입니다.

    // 여기에서 데이터베이스 업데이트 또는 다른 작업을 수행할 수 있습니다.
    // 예시:
    // await Post.findByIdAndUpdate(postId, newData);

    // 수정이 완료되면 사용자를 다른 페이지로 리디렉션 또는 응답을 보냅니다.
    res.redirect("/board"); // 수정이 완료된 후 사용자를 다른 페이지로 리디렉션할 수 있습니다.
  } catch (error) {
    console.error("게시글 수정 중 오류 발생:", error);
    res.status(500).send("게시글 수정 중 오류가 발생했습니다.");
  }
});

// 회원가입 관련 로직 처리
app.post("/signup", async (req, res) => {
  const data = {
    name: req.body.username,
    password: req.body.password,
  };
  const existingUser = await collection.findOne({ name: data.name });
  if (existingUser) {
    return res.render("signup", { error: "이미 아이디가 존재합니다." });
  } else {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    data.password = hashedPassword;
    const userdata = await collection.insertMany(data);
    console.log(userdata);
    res.redirect("/");
  }
});

// 로그인 관련 로직 처리
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    // 에러 발생 시 에러 처리
    if (err) {
      console.error("Passport 에러:", err);
      return res.status(500).send("로그인 과정에서 오류가 발생했습니다.");
    }
    // 사용자가 없는 경우 에러 메시지 설정
    if (!user) {
      const errorMessage = "아이디나 비밀번호가 올바르지 않습니다.";
      return res.render("login", { error: errorMessage });
    }
    // 로그인 성공 시 다음 로직 실행
    req.logIn(user, (err) => {
      if (err) {
        console.error("로그인 오류:", err);
        return res.status(500).send("로그인 과정에서 오류가 발생했습니다.");
      }
      return res.redirect("/redirectUser");
    });
  })(req, res, next);
});

// 사용자 레벨에 따라 적절한 페이지로 리디렉션하는 미들웨어
app.get("/redirectUser", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  const userLevel = req.user.level;
  if (userLevel === 1 || userLevel === 2) {
    return res.redirect("/home");
  } else if (userLevel === 3) {
    return res.redirect("/admin");
  } else {
    return res.redirect("/home");
  }
});

// 홈 페이지
app.get("/home", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  res.render("home", { user: req.user });
});

// 어드민 페이지
app.get("/admin", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  res.render("admin", { user: req.user });
});

// 내 정보 페이지
app.get("/myinfo", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }
  res.render("myinfo", { user: req.user });
});

// 게시판 구현
app.post("/createPost", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("로그인이 필요합니다.");
    }

    // 현재 로그인한 사용자의 ID를 가져옴
    const authorId = req.user._id;

    // 게시글 생성 요청에서 제목과 내용을 가져옴
    const { title, content } = req.body;

    // 게시글을 생성하고 작성자는 현재 로그인한 사용자로 설정
    const newPost = new Post({
      title,
      content,
      author: authorId,
    });

    // 데이터베이스에 저장
    await newPost.save();

    res.redirect("/board");
  } catch (error) {
    console.error("게시글 생성 중 오류 발생:", error);
    res.status(500).send("게시글을 생성하는 중 오류가 발생했습니다.");
  }
});

// 게시글 삭제
app.post("/deletePost/:postId", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("로그인이 필요합니다.");
    }

    const postId = req.params.postId;
    if (!postId) {
      return res.status(400).send("게시글 ID가 전달되지 않았습니다.");
    }

    // 현재 로그인한 사용자가 관리자인지 확인
    if (req.user.level !== 3) {
      // 일반 사용자인 경우
      const post = await Post.findById(postId);

      if (!post) {
        return res.status(404).send("게시글을 찾을 수 없습니다.");
      }

      // 게시글의 작성자와 현재 로그인한 사용자가 일치하는지 확인
      if (post.author.toString() !== req.user._id.toString()) {
        return res.status(403).send("권한이 없습니다.");
      }
    }

    // 게시글 삭제
    await Post.deleteOne({ _id: postId });

    res.redirect("/board");
  } catch (error) {
    console.error("게시글 삭제 중 오류 발생:", error);
    res.status(500).send("게시글을 삭제하는 중 오류가 발생했습니다.");
  }
});

// 사용자 권한 관리
app.get("/manage", async (req, res) => {
  try {
    // 모든 사용자 데이터 가져오기
    const users = await User.find();
    // manage.ejs 템플릿을 렌더링하여 사용자 리스트 전송
    res.render("manage", { users });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// manage.ejs 페이지에서 사용자의 권한 변경을 위해 추가된 부분을 처리하는 라우트
app.post("/updateLevel/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const newLevel = parseInt(req.body.level); // 드롭다운 메뉴에서 선택한 새로운 레벨

    // 현재 로그인한 사용자가 Level 3인지 확인
    if (req.user.level !== 3) {
      return res.status(403).send("권한이 없습니다.");
    }

    // 사용자 레벨 업데이트
    await User.findByIdAndUpdate(userId, { $set: { level: newLevel } });

    res.redirect("/manage"); // 사용자 목록 페이지로 리디렉션
  } catch (error) {
    console.error("사용자 레벨 업데이트 중 오류 발생:", error);
    res.status(500).send("사용자 레벨을 업데이트하는 중 오류가 발생했습니다.");
  }
});

// 사용자 제거 라우트 추가
app.post("/removeUser/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    await User.findByIdAndDelete(userId);
    res.redirect("/manage");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// 컨테이너 생성하기
app.post("/createContainer", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).send("로그인이 필요합니다.");
    }

    // 현재 로그인한 사용자의 ID를 가져옴
    const userId = req.user._id;

    // POST 요청으로부터 컨테이너 생성에 필요한 데이터를 가져옴
    const { operatingSystem, containername, containerDuration, containerPort } =
      req.body;

    // 중복된 컨테이너 이름 체크
    const existingContainerName = await Container.findOne({ containername });
    if (existingContainerName) {
      return res.status(400).render("make", {
        errorContainerName: "컨테이너 아이디가 이미 사용중입니다.",
      });
    }

    // 중복된 포트 체크
    const existingContainerPort = await Container.findOne({ containerPort });
    if (existingContainerPort) {
      return res.status(400).render("make", {
        errorContainerPort: "컨테이너 포트가 이미 사용중입니다.",
      });
    }

    // 데이터베이스에 새로운 컨테이너 생성
    const newContainer = new Container({
      userId,
      operatingSystem,
      containername,
      containerDuration,
      containerPort,
    });

    // SSH 연결 설정
    const sshConfig = {
      host: "192.168.56.1",
      port: 60010,
      username: "root",
      password: "vagrant",
    };

    const ssh = new SSHClient();

    ssh.on("ready", function () {
      console.log("SSH 연결 성공");

      // 쉘 스크립트 실행 명령어
      const command = `./create_container.sh ${containername} ${containerPort}`;

      ssh.exec(command, function (err, stream) {
        if (err) throw err;

        stream.on("data", function (data) {
          console.log("쉘 스크립트 실행 결과:", data.toString());
        });

        stream.on("close", function () {
          console.log("쉘 스크립트 실행 완료");
          ssh.end();

          // 데이터베이스에 저장
          newContainer
            .save()
            .then(() => {
              // 성공적으로 컨테이너가 생성되었음을 클라이언트에 응답
              res.redirect("makecontainer");
            })
            .catch((saveError) => {
              console.error("데이터베이스 저장 중 오류 발생:", saveError);
              res.status(500).send("컨테이너 생성 중 오류가 발생했습니다.");
            });
        });
      });
    });

    ssh.on("error", function (err) {
      console.error("SSH 연결 오류:", err);
      ssh.end();
      res.status(500).send("컨테이너 생성 중 오류가 발생했습니다.");
    });

    ssh.connect(sshConfig);
  } catch (error) {
    console.error("오류 발생:", error);
    res.status(500).send("컨테이너 생성 중 오류가 발생했습니다.");
  }
});

// 내 컨테이너 정보 페이지
app.get("/makecontainer", async (req, res) => {
  try {
    // 현재 로그인한 사용자의 ID를 가져옴
    const userId = req.user._id;

    // 사용자의 ID를 기반으로 해당 사용자의 컨테이너 정보를 조회
    const userContainers = await Container.find({ userId });

    // 조회된 컨테이너 정보를 템플릿에 전달하여 웹 페이지에 표시
    res.render("makecontainer", { userContainers });
  } catch (error) {
    console.error("내 컨테이너 정보 조회 중 오류 발생:", error);
    res.status(500).send("내 컨테이너 정보 조회 중 오류가 발생했습니다.");
  }
});

const port = 5000;
app.listen(port, () => {
  console.log(`Server running on Port: ${port}`);
});
