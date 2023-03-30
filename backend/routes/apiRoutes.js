const express = require("express");
const {Op} = require("sequelize");
const jwtAuth = require("../lib/jwtAuth");
const {User} = require("../db/User");
const {JobApplicant} = require("../db/JobApplicant");
const {Recruiter} = require("../db/Recruiter");
const {Job} = require("../db/Job");
const {Application} = require("../db/Application");
const {Rating} = require("../db/Rating");
const router = express.Router();

router.post("/jobs", jwtAuth, async (req, res) => {
  const user = req.user;
  if (user.type !== "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to add jobs",
    });
    return;
  }
  const data = req.body;
  try {
    await Job.create({
      userId: user.id,
      title: data.title,
      maxApplicants: data.maxApplicants,
      maxPositions: data.maxPositions,
      dateOfPosting: data.dateOfPosting,
      deadline: data.deadline,
      skillsets: data.skillsets,
      jobType: data.jobType,
      duration: data.duration,
      salary: data.salary,
      rating: data.rating,
    });
    res.json({message: "Job added successfully to the database"});
  } catch (err) {
    res.status(400).json(err);
  }
});
router.get("/jobs", jwtAuth, async (req, res) => {
  const user = req.user;
  let findParams = {};
  let sortParams = [];
  if (user.type === "recruiter" && req.query.myjobs) {
    findParams.userId = user.id;
  }
  if (req.query.q) {
    findParams.title = {
      [Op.iLike]: `%${req.query.q}%`,
    };
  }
  if (req.query.jobType) {
    let jobTypes = [];
    if (Array.isArray(req.query.jobType)) {
      jobTypes = req.query.jobType;
    } else {
      jobTypes = [req.query.jobType];
    }
    findParams.jobType = {
      [Op.in]: jobTypes,
    };
  }
  if (req.query.salaryMin && req.query.salaryMax) {
    findParams.salary = {
      [Op.between]: [
        parseInt(req.query.salaryMin),
        parseInt(req.query.salaryMax),
      ],
    };
  } else if (req.query.salaryMin) {
    findParams.salary = {
      [Op.gte]: parseInt(req.query.salaryMin),
    };
  } else if (req.query.salaryMax) {
    findParams.salary = {
      [Op.lte]: parseInt(req.query.salaryMax),
    };
  }
  if (req.query.duration) {
    findParams.duration = {
      [Op.lt]: parseInt(req.query.duration),
    };
  }
  if (req.query.asc) {
    if (Array.isArray(req.query.asc)) {
      req.query.asc.forEach((key) => {
        sortParams.push([key, "ASC"]);
      });
    } else {
      sortParams.push([req.query.asc, "ASC"]);
    }
  }
  if (req.query.desc) {
    if (Array.isArray(req.query.desc)) {
      req.query.desc.forEach((key) => {
        sortParams.push([key, "DESC"]);
      });
    } else {
      sortParams.push([req.query.desc, "DESC"]);
    }
  }
  console.log(findParams);
  console.log(sortParams);

  const arr = [
    {
      model: RecruiterInfo,
      as: "recruiter",
      required: true,
      attributes: [],
    },
    {
      where: findParams,
    },
  ];

  if (sortParams.length > 0) {
    arr.push({
      order: sortParams,
    });
  }

  Job.findAll({
    include: arr,
  })
    .then((posts) => {
      if (posts == null || posts.length === 0) {
        res.status(404).json({
          message: "No job found",
        });
        return;
      }
      res.json(posts);
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

router.get("/jobs/:id", jwtAuth, (req, res) => {
  Job.findByPk(req.params.id, {
    include: {
      model: RecruiterInfo,
      as: "recruiter",
      required: true,
      attributes: [],
    },
  })
    .then((job) => {
      if (job == null) {
        res.status(400).json({
          message: "Job does not exist",
        });
        return;
      }
      res.json(job);
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

router.put("/jobs/:id", jwtAuth, async (req, res) => {
  const user = req.user;
  if (user.type !== "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to change the job details",
    });
    return;
  }

  try {
    const job = await Job.findOne({
      where: {
        id: req.params.id,
        userId: user.id,
      },
    });

    if (job === null) {
      res.status(404).json({
        message: "Job does not exist",
      });
      return;
    }

    const data = req.body;
    if (data.maxApplicants) {
      job.maxApplicants = data.maxApplicants;
    }
    if (data.maxPositions) {
      job.maxPositions = data.maxPositions;
    }
    if (data.deadline) {
      job.deadline = data.deadline;
    }

    await job.save();

    res.json({
      message: "Job details updated successfully",
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

router.delete("/jobs/:id", jwtAuth, async (req, res) => {
  const user = req.user;
  if (user.type !== "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to delete the job",
    });
    return;
  }

  try {
    const job = await Job.findOne({
      where: {
        id: req.params.id,
        userId: user.id,
      },
    });

    if (job === null) {
      res.status(401).json({
        message: "You don't have permissions to delete the job",
      });
      return;
    }

    await job.destroy();

    res.json({
      message: "Job deleted successfully",
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

router.get("/user", jwtAuth, (req, res) => {
  const user = req.user;
  if (user.type === "recruiter") {
    Recruiter.findOne({userId: user._id})
      .then((recruiter) => {
        if (recruiter == null) {
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        res.json(recruiter);
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  } else {
    JobApplicant.findOne({userId: user._id})
      .then((jobApplicant) => {
        if (jobApplicant == null) {
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }
        res.json(jobApplicant);
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  }
});
router.get("/user/:id", jwtAuth, (req, res) => {
    User.findOne({
      where: {
        _id: req.params.id,
      },
    })
      .then((userData) => {
        if (userData === null) {
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }

        if (userData.type === "recruiter") {
          Recruiter.findOne({
            where: {
              userId: userData._id,
            },
          })
            .then((recruiter) => {
              if (recruiter === null) {
                res.status(404).json({
                  message: "User does not exist",
                });
                return;
              }
              res.json(recruiter);
            })
            .catch((err) => {
              res.status(400).json(err);
            });
        } else {
          JobApplicant.findOne({
            where: {
              userId: userData._id,
            },
          })
            .then((jobApplicant) => {
              if (jobApplicant === null) {
                res.status(404).json({
                  message: "User does not exist",
                });
                return;
              }
              res.json(jobApplicant);
            })
            .catch((err) => {
              res.status(400).json(err);
            });
        }
      })
      .catch((err) => {
        res.status(400).json(err);
      });
});

router.put("/user", jwtAuth, async (req, res) => {
  const user = req.user;
  const data = req.body;

  try {
    let userObj;
    if (user.type == "recruiter") {
      userObj = await Recruiter.findOne({where: {userId: user._id}});
    } else {
      userObj = await JobApplicant.findOne({where: {userId: user._id}});
    }

    if (!userObj) {
      res.status(404).json({
        message: "User does not exist",
      });
      return;
    }

    if (data.name) {
      userObj.name = data.name;
    }
    if (data.contactNumber) {
      userObj.contactNumber = data.contactNumber;
    }
    if (data.bio) {
      userObj.bio = data.bio;
    }
    if (data.education) {
      userObj.education = data.education;
    }
    if (data.skills) {
      userObj.skills = data.skills;
    }
    if (data.resume) {
      userObj.resume = data.resume;
    }
    if (data.profile) {
      userObj.profile = data.profile;
    }

    await userObj.save();
    res.json({
      message: "User information updated successfully",
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

router.post("/jobs/:id/applications", jwtAuth, async (req, res) => {
  const user = req.user;
  if (user.type !== "applicant") {
    res.status(401).json({
      message: "You do not have permission to apply for a job",
    });
    return;
  }
  const {sop} = req.body;
  const jobId = req.params.id;
  try {
    const appliedApplication = await Application.findOne({
      where: {
        userId: user._id,
        jobId,
        status: {
          [Op.notIn]: ["deleted", "accepted", "cancelled"],
        },
      },
    });
    if (appliedApplication) {
      res.status(400).json({
        message: "You have already applied for this job",
      });
      return;
    }
    const job = await Job.findByPk(jobId);
    if (!job) {
      res.status(404).json({
        message: "Job does not exist",
      });
      return;
    }
    const activeApplicationCount = await Application.count({
      where: {
        jobId,
        status: {
          [Op.notIn]: ["rejected", "deleted", "cancelled", "finished"],
        },
      },
    });
    if (activeApplicationCount >= job.maxApplicants) {
      res.status(400).json({
        message: "Application limit reached",
      });
      return;
    }
    const myActiveApplicationCount = await Application.count({
      where: {
        userId: user._id,
        status: {
          [Op.notIn]: ["rejected", "deleted", "cancelled", "finished"],
        },
      },
    });
    if (myActiveApplicationCount >= 10) {
      res.status(400).json({
        message: "You have 10 active applications. Hence you cannot apply.",
      });
      return;
    }
    const acceptedJobs = await Application.count({
      where: {
        userId: user._id,
        status: "accepted",
      },
    });
    if (acceptedJobs > 0) {
      res.status(400).json({
        message: "You already have an accepted job. Hence you cannot apply.",
      });
      return;
    }
    const application = await Application.create({
      userId: user._id,
      recruiterId: job.userId,
      jobId: job._id,
      status: "applied",
      sop,
    });
    res.json({
      message: "Job application successful",
      application,
    });
  } catch (err) {
    res.status(400).json(err);
  }
});

router.get("/jobs/:id/applications", jwtAuth, async (req, res) => {
  const user = req.user;
  if (user.type !== "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to view job applications",
    });
    return;
  }
  const jobId = req.params.id;
  let findParams = {
    jobId: jobId,
    recruiterId: user.id,
  };
  let sortParams = [];
  if (req.query.status) {
    findParams = {
      ...findParams,
      status: req.query.status,
    };
  }
  try {
    const applications = await Application.findAll({
      where: findParams,
      order: sortParams,
    });
    res.json(applications);
  } catch (err) {
    res.status(400).json(err);
  }
});

router.get("/applications", jwtAuth, async (req, res) => {
  const user = req.user;
  try {
    const applications = await Application.findAll({
      include: [
        {
          model: JobApplicantInfo,
          as: "jobApplicant",
          required: true,
          attributes: ["userId"],
        },
        {
          model: Job,
          as: "job",
          required: true,
          attributes: ["_id"],
        },
        {
          model: RecruiterInfo,
          as: "recruiter",
          required: true,
          attributes: ["userId"],
        },
      ],
      where: {
        [user.type === "recruiter" ? "recruiterId" : "userId"]: user._id,
      },
      order: [["dateOfApplication", "DESC"]],
    });
    res.json(applications);
  } catch (err) {
    res.status(400).json(err);
  }
});

router.put("/applications/:id", jwtAuth, async (req, res) => {
  const user = req.user;
  const id = req.params.id;
  const status = req.body.status;

  if (user.type === "recruiter") {
    if (status === "accepted") {
      try {
        const application = await Application.findOne({
          where: {
            id: id,
            recruiterId: user.id,
          },
        });

        if (!application) {
          res.status(404).json({
            message: "Application not found",
          });
          return;
        }

        const job = await Job.findOne({
          where: {
            id: application.jobId,
            userId: user.id,
          },
        });

        if (!job) {
          res.status(404).json({
            message: "Job does not exist",
          });
          return;
        }

        const activeApplicationCount = await Application.count({
          where: {
            recruiterId: user.id,
            jobId: job.id,
            status: "accepted",
          },
        });

        if (activeApplicationCount < job.maxPositions) {
          // accepted
          application.status = status;
          application.dateOfJoining = req.body.dateOfJoining;

          await application.save();

          await Application.update(
            {
              status: "cancelled",
            },
            {
              where: {
                id: {
                  [Op.ne]: application.id,
                },
                userId: application.userId,
                status: {
                  [Op.notIn]: [
                    "rejected",
                    "deleted",
                    "cancelled",
                    "accepted",
                    "finished",
                  ],
                },
              },
            }
          );

          if (status === "accepted") {
            await Job.update(
              {
                acceptedCandidates: activeApplicationCount + 1,
              },
              {
                where: {
                  id: job.id,
                  userId: user.id,
                },
              }
            );
          }

          res.json({
            message: `Application ${status} successfully`,
          });
        } else {
          res.status(400).json({
            message: "All positions for this job are already filled",
          });
        }
      } catch (err) {
        res.status(400).json(err);
      }
    } else {
      try {
        const application = await Application.findOne({
          where: {
            id: id,
            recruiterId: user.id,
            status: {
              [Op.notIn]: ["rejected", "deleted", "cancelled"],
            },
          },
        });

        if (!application) {
          res.status(400).json({
            message: "Application status cannot be updated",
          });
          return;
        }

        await application.update({
          status: status,
        });

        if (status === "finished") {
          res.json({
            message: `Job ${status} successfully`,
          });
        } else {
          res.json({
            message: `Application ${status} successfully`,
          });
        }
      } catch (err) {
        res.status(400).json(err);
      }
    }
  } else {
    if (status === "cancelled") {
      try {
        await Application.update(
          {
            status: status,
          },
          {
            where: {
              id: id,
              userId: user.id,
            },
          }
        );

        res.json({
          message: `Application ${status} successfully`,
        });
      } catch (err) {
        res.status(400).json(err);
      }
    } else {
      res.status(401).json({
        message: "You don't have permissions to update job status",
      });
    }
  }
});
router.get("/applicants", jwtAuth, async (req, res) => {
  try {
    const user = req.user;
    if (user.type !== "recruiter") {
      res.status(400).json({
        message: "You are not allowed to access applicants list",
      });
      return;
    }

    let findParams = {
      recruiterId: user._id,
    };

    if (req.query.jobId) {
      findParams.jobId = req.query.jobId;
    }

    if (req.query.status) {
      const status = Array.isArray(req.query.status)
        ? {
            [Op.in]: req.query.status,
          }
        : req.query.status;
      findParams.status = status;
    }

    let sortParams = [["id", "ASC"]];

    if (req.query.asc) {
      const asc = Array.isArray(req.query.asc)
        ? req.query.asc
        : [req.query.asc];
      sortParams = asc.map((key) => [key, "ASC"]);
    }

    if (req.query.desc) {
      const desc = Array.isArray(req.query.desc)
        ? req.query.desc
        : [req.query.desc];
      sortParams = desc.map((key) => [key, "DESC"]);
    }

    const applications = await Application.findAll({
      where: findParams,
      order: sortParams,
      include: [
        {
          model: JobApplicantInfo,
          as: "jobApplicant",
          required: true,
        },
        {
          model: Job,
          as: "job",
          required: true,
        },
      ],
    });

    if (applications.length === 0) {
      res.status(404).json({
        message: "No applicants found",
      });
      return;
    }

    res.json(applications);
  } catch (err) {
    res.status(400).json(err);
  }
});

router.put("/rating", jwtAuth, (req, res) => {
  const user = req.user;
  const data = req.body;
  if (user.type === "recruiter") {
    // can rate applicant
    Rating.findOne({
      where: {
        senderId: user.id,
        receiverId: data.applicantId,
        category: "applicant",
      },
    })
      .then((rating) => {
        if (rating === null) {
          console.log("new rating");
          Application.count({
            where: {
              userId: data.applicantId,
              recruiterId: user.id,
              status: {
                [Op.in]: ["accepted", "finished"],
              },
            },
          })
            .then((acceptedApplicant) => {
              if (acceptedApplicant > 0) {
                // add a new rating
                Rating.create({
                  category: "applicant",
                  receiverId: data.applicantId,
                  senderId: user.id,
                  rating: data.rating,
                })
                  .then(() => {
                    // get the average of ratings
                    Rating.findAll({
                      where: {
                        receiverId: data.applicantId,
                        category: "applicant",
                      },
                      attributes: [
                        [
                          sequelize.fn("avg", sequelize.col("rating")),
                          "average",
                        ],
                      ],
                      group: ["receiverId", "category"],
                    })
                      .then((result) => {
                        // update the user's rating
                        if (result === null) {
                          res.status(400).json({
                            message: "Error while calculating rating",
                          });
                          return;
                        }
                        const avg = result[0].dataValues.average;
                        JobApplicant.update(
                          {
                            rating: avg,
                          },
                          {
                            where: {
                              userId: data.applicantId,
                            },
                          }
                        )
                          .then((applicant) => {
                            if (applicant[0] === 0) {
                              res.status(400).json({
                                message:
                                  "Error while updating applicant's average rating",
                              });
                              return;
                            }
                            res.json({
                              message: "Rating added successfully",
                            });
                          })
                          .catch((err) => {
                            res.status(400).json(err);
                          });
                      })
                      .catch((err) => {
                        res.status(400).json(err);
                      });
                  })
                  .catch((err) => {
                    res.status(400).json(err);
                  });
              } else {
                // you cannot rate
                res.status(400).json({
                  message:
                    "Applicant didn't worked under you. Hence you cannot give a rating.",
                });
              }
            })
            .catch((err) => {
              res.status(400).json(err);
            });
        } else {
          rating.rating = data.rating;
          rating
            .save()
            .then(() => {
              // get the average of ratings
              Rating.findAll({
                where: {
                  receiverId: data.applicantId,
                  category: "applicant",
                },
                attributes: [
                  [sequelize.fn("avg", sequelize.col("rating")), "average"],
                ],
                group: ["receiverId", "category"],
              })
                .then((result) => {
                  // update the user's rating
                  if (result === null) {
                    res.status(400).json({
                      message: "Error while calculating rating",
                    });
                    return;
                  }
                  const avg = result[0].dataValues.average;
                  Job.findOneAndUpdate(
                    {
                      _id: data.jobId,
                    },
                    {
                      $set: {
                        rating: avg,
                      },
                    }
                  )
                    .then((job) => {
                      if (job === null) {
                        res.status(400).json({
                          message: "Error while updating job's average rating",
                        });
                        return;
                      }
                      res.json({
                        message: "Rating updated successfully",
                      });
                    })
                    .catch((err) => {
                      res.status(400).json(err);
                    });
                })
                .catch((err) => {
                  res.status(400).json(err);
                });
            })
            .catch((err) => {
              res.status(400).json(err);
            });
        }
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  }
});

router.get("/rating", jwtAuth, async (req, res) => {
  const user = req.user;
  try {
    const rating = await Rating.findOne({
      where: {
        senderId: user._id,
        receiverId: req.query.id,
        category: user.type === "recruiter" ? "applicant" : "job",
      },
    });
    if (rating === null) {
      res.json({
        rating: -1,
      });
      return;
    }
    res.json({
      rating: rating.rating,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

module.exports = router;