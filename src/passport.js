// passport.js

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const collection = require("./config");

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await collection.findOne({ name: username });
      if (!user) {
        return done(null, false, { message: "잘못된 아이디입니다." });
      }
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (!isPasswordMatch) {
        return done(null, false, { message: "잘못된 비밀번호입니다." });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await collection.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
