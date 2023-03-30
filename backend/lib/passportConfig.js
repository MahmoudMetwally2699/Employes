const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

const User = require("../db/User"); // assuming you have created a models directory with User model inside
const authKeys = require("./authKeys");

const filterJson = (obj, unwantedKeys) => {
    const filteredObj = {};
    Object.keys(obj).forEach((key) => {
        if (unwantedKeys.indexOf(key) === -1) {
            filteredObj[key] = obj[key];
        }
    });
    return filteredObj;
};

passport.use(
    new LocalStrategy({
            usernameField: "email",
            passReqToCallback: true,
        },
        (req, email, password, done, res) => {
            User.findOne({ where: { email: email } })
                .then((user) => {
                    if (!user) {
                        return done(null, false, {
                            message: "User does not exist",
                        });
                    }
                    user.login(password).then((valid) => {
                        if (!valid) {
                            return done(null, false, {
                                message: "Password is incorrect.",
                            });
                        }
                        user = user.get({ plain: true });
                        user = filterJson(user, ["password", "createdAt", "updatedAt"]);
                        return done(null, user);
                    });
                })
                .catch((err) => {
                    return done(err);
                });
        }
    )
);

passport.use(
    new JWTStrategy({
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
            secretOrKey: authKeys.jwtSecretKey,
        },
        (jwt_payload, done) => {
            console.log(jwt_payload._id);
            User.findByPk(jwt_payload._id)
                .then((user) => {
                    if (!user) {
                        return done(null, false, {
                            message: "JWT Token does not exist",
                        });
                    }
                    user = user.get({ plain: true });
                    user = filterJson(user, ["password", "createdAt", "updatedAt"]);
                    return done(null, user);
                })
                .catch((err) => {
                    return done(err);
                });
        }
    )
);

module.exports = passport;