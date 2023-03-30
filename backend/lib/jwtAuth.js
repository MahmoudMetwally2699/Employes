const passport = require("passport");

const jwtAuth = (req, res, next) => {
    passport.authenticate(
      "jwt",
      {session: false},
      async function (err, user, info) {
        try {
          if (err) {
            return next(err);
          }
          if (!user) {
            res.status(401).json(info);
            return;
          }
          req.user = user;
          next();
        } catch (error) {
          next(error);
        }
      }
    )(req, res, next);
};

module.exports = jwtAuth;