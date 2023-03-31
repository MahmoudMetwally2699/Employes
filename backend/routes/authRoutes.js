const express = require("express");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const authKeys = require("../lib/authKeys");

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");

const router = express.Router();

router.post("/signup", async (req, res) => {
  const data = req.body;

  try {
    const user = await User.create({
      email: data.email,
      password: data.password,
      type: data.type,
    });

    let userDetails;

    if (user.type === "applicant") {
      userDetails = await JobApplicant.create({
        userId: user.id,
        name: data.name,
        education: data.education,
        skills: data.skills,
        rating: data.rating,
        resume: data.resume,
        profile: data.profile,
      });
    } else {
      userDetails = await Recruiter.create({
        userId: user.id,
        name: data.name,
        contactNumber: data.contactNumber,
        bio: data.bio,
      });
    }

    const token = jwt.sign({ id: user.id }, authKeys.jwtSecretKey);

    res.json({
      token: token,
      type: user.type,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate(
    "local",
    { session: false },
    async function (err, user, info) {
      try {
        if (err) {
          return next(err);
        }
        if (!user) {
          res.status(401).json(info);
          return;
        }

        const token = jwt.sign({ id: user.id }, authKeys.jwtSecretKey);

        res.json({
          token: token,
          type: user.type,
        });
      } catch (err) {
        console.log(err);
        res.status(400).json(err);
      }
    }
  )(req, res, next);
});

module.exports = router;
