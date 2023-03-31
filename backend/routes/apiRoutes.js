const express = require("express");
const mongoose = require("mongoose");
const jwtAuth = require("../lib/jwtAuth");

const User = require("../db/User");
const JobApplicant = require("../db/JobApplicant");
const Recruiter = require("../db/Recruiter");
const Job = require("../db/Job");
const Application = require("../db/Application");
const Rating = require("../db/Rating");
const { Op } = require("sequelize");

const router = express.Router();

// To add new job
router.post("/jobs", jwtAuth, (req, res) => {
  const user = req.user;

  if (user.type !== "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to add jobs",
    });
    return;
  }

  const data = req.body;

  Job.create({
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
  })
    .then(() => {
      res.json({ message: "Job added successfully to the database" });
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

// to get all the jobs [pagination] [for recruiter personal and for everyone]

router.get("/jobs", jwtAuth, async (req, res) => {
  const user = req.user;
  const findParams = {};
  const sortParams = [];
  // to list down jobs posted by a particular recruiter
  if (user.type === "recruiter" && req.query.myjobs) {
    findParams.userId = user.id;
  }
  if (req.query.q) {
    findParams.title = {
      [Op.iLike]: `%${req.query.q}%`,
    };
  }

  if (req.query.jobType) {
    const jobTypes = Array.isArray(req.query.jobType)
      ? req.query.jobType
      : [req.query.jobType];
    findParams.jobType = {
      [Op.in]: jobTypes,
    };
  }

  if (req.query.salaryMin && req.query.salaryMax) {
    findParams.salary = {
      [Op.and]: [
        {
          [Op.gte]: parseInt(req.query.salaryMin),
        },
        {
          [Op.lte]: parseInt(req.query.salaryMax),
        },
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
    const sortKeys = Array.isArray(req.query.asc)
      ? req.query.asc
      : [req.query.asc];
    sortKeys.forEach((key) => {
      sortParams.push([key, "ASC"]);
    });
  }

  if (req.query.desc) {
    const sortKeys = Array.isArray(req.query.desc)
      ? req.query.desc
      : [req.query.desc];
    sortKeys.forEach((key) => {
      sortParams.push([key, "DESC"]);
    });
  }

  try {
    const posts = await Job.findAll({
      where: findParams,
      include: [
        {
          model: RecruiterInfo,
          as: "recruiter",
        },
      ],
      order: sortParams,
    });
    if (posts.length === 0) {
      res.status(404).json({
        message: "No job found",
      });
    } else {
      res.json(posts);
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});

// to get info about a particular job
router.get("/jobs/:id", jwtAuth, (req, res) => {
  Job.findOne({
    where: {
      id: req.params.id,
    },
    include: [
      {
        model: RecruiterInfo,
        as: "recruiter",
      },
    ],
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

// to update info of a particular job
router.put("/jobs/:id", jwtAuth, (req, res) => {
  const user = req.user;
  if (user.type !== "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to change the job details",
    });
    return;
  }
  Job.findOne({
    id: req.params.id,
    userId: user.id,
  })
    .then((job) => {
      if (!job) {
        res.status(404).json({
          message: "Job not found",
        });
        return;
      }
      if (req.body.maxApplicants) {
        job.maxApplicants = req.body.maxApplicants;
      }
      if (req.body.maxPositions) {
        job.maxPositions = req.body.maxPositions;
      }
      if (req.body.deadline) {
        job.deadline = req.body.deadline;
      }
      job
        .save()
        .then(() => {
          res.json({
            message: "Job details updated successfully",
          });
        })
        .catch((err) => {
          res.status(400).json({
            message: "Error updating job details",
            error: err,
          });
        });
    })
    .catch((err) => {
      res.status(400).json({
        message: "Error finding job",
        error: err,
      });
    });
});

// to delete a job
router.delete("/jobs/:id", jwtAuth, (req, res) => {
  const user = req.user;
  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You don't have permissions to delete the job",
    });
    return;
  }
  Job.findOneAndDelete({
    id: req.params.id,
    userId: user.id,
  })
    .then((job) => {
      if (job === null) {
        res.status(401).json({
          message: "You don't have permissions to delete the job",
        });
        return;
      }
      res.json({
        message: "Job deleted successfully",
      });
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

// Get user's personal details
router.get("/user", jwtAuth, async (req, res) => {
  const user = req.user;
  try {
    if (user.type === "recruiter") {
      const recruiter = await Recruiter.findOne({
        where: { userId: user.id },
      });
      if (!recruiter) {
        return res.status(404).json({
          message: "User does not exist",
        });
      }
      return res.json(recruiter);
    } else {
      const jobApplicant = await JobApplicant.findOne({
        where: { userId: user.id },
      });
      if (!jobApplicant) {
        return res.status(404).json({
          message: "User does not exist",
        });
      }
      return res.json(jobApplicant);
    }
  } catch (err) {
    return res.status(400).json(err);
  }
});

// get user details from id
router.get("/user/:id", jwtAuth, async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findOne({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }
    let userData;
    if (user.type === "recruiter") {
      userData = await Recruiter.findOne({ where: { userId: userId } });
    } else {
      userData = await JobApplicant.findOne({ where: { userId: userId } });
    }
    if (!userData) {
      return res.status(404).json({ message: "User does not exist" });
    }
    return res.json(userData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// update user details
router.put("/user", jwtAuth, (req, res) => {
  const user = req.user;
  const data = req.body;

  if (user.type === "recruiter") {
    Recruiter.findOne({ where: { userId: user.id } })
      .then((recruiter) => {
        if (recruiter === null) {
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }

        const updatedFields = {};

        if (data.name) {
          updatedFields.name = data.name;
        }
        if (data.contactNumber) {
          updatedFields.contactNumber = data.contactNumber;
        }
        if (data.bio) {
          updatedFields.bio = data.bio;
        }

        recruiter
          .update(updatedFields)
          .then(() => {
            res.json({
              message: "User information updated successfully",
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
    JobApplicant.findOne({ where: { userId: user.id } })
      .then((jobApplicant) => {
        if (jobApplicant === null) {
          res.status(404).json({
            message: "User does not exist",
          });
          return;
        }

        const updatedFields = {};

        if (data.name) {
          updatedFields.name = data.name;
        }
        if (data.education) {
          updatedFields.education = data.education;
        }
        if (data.skills) {
          updatedFields.skills = data.skills;
        }
        if (data.resume) {
          updatedFields.resume = data.resume;
        }
        if (data.profile) {
          updatedFields.profile = data.profile;
        }

        jobApplicant
          .update(updatedFields)
          .then(() => {
            res.json({
              message: "User information updated successfully",
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
});

// apply for a job [todo: test: done]

// apply for a job
router.post("/jobs/:id/applications", jwtAuth, (req, res) => {
  const user = req.user;
  if (user.type != "applicant") {
    res.status(401).json({
      message: "You don't have permissions to apply for a job",
    });
    return;
  }

  const data = req.body;
  const jobId = req.params.id;

  // check whether applied previously
  // find job
  // check count of active applications < limit
  // check user had < 10 active applications && check if user is not having any accepted jobs (user id)
  // store the data in applications

  Application.findOne({
    where: {
      userId: user.id,
      jobId: jobId,
      status: {
        [Op.notIn]: ["deleted", "accepted", "cancelled"],
      },
    },
  })
    .then((appliedApplication) => {
      console.log(appliedApplication);
      if (appliedApplication !== null) {
        res.status(400).json({
          message: "You have already applied for this job",
        });
        return;
      }

      Job.findOne({ where: { id: jobId } })
        .then((job) => {
          if (job === null) {
            res.status(404).json({
              message: "Job does not exist",
            });
            return;
          }
          Application.count({
            where: {
              jobId: jobId,
              status: {
                [Op.notIn]: ["rejected", "deleted", "cancelled", "finished"],
              },
            },
          })
            .then((activeApplicationCount) => {
              if (activeApplicationCount < job.maxApplicants) {
                Application.count({
                  where: {
                    userId: user.id,
                    status: {
                      [Op.notIn]: [
                        "rejected",
                        "deleted",
                        "cancelled",
                        "finished",
                      ],
                    },
                  },
                })
                  .then((myActiveApplicationCount) => {
                    if (myActiveApplicationCount < 10) {
                      Application.count({
                        where: {
                          userId: user.id,
                          status: "accepted",
                        },
                      }).then((acceptedJobs) => {
                        if (acceptedJobs === 0) {
                          const application = Application.build({
                            userId: user.id,
                            recruiterId: job.userId,
                            jobId: job.id,
                            status: "applied",
                            sop: data.sop,
                          });
                          application
                            .save()
                            .then(() => {
                              res.json({
                                message: "Job application successful",
                              });
                            })
                            .catch((err) => {
                              res.status(400).json(err);
                            });
                        } else {
                          res.status(400).json({
                            message:
                              "You already have an accepted job. Hence you cannot apply.",
                          });
                        }
                      });
                    } else {
                      res.status(400).json({
                        message:
                          "You have 10 active applications. Hence you cannot apply.",
                      });
                    }
                  })
                  .catch((err) => {
                    res.status(400).json(err);
                  });
              } else {
                res.status(400).json({
                  message: "Application limit reached",
                });
              }
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
      res.json(400).json(err);
    });
});

// recruiter gets applications for a particular job [pagination] [todo: test: done]
router.get("/jobs/:id/applications", jwtAuth, async (req, res) => {
  const user = req.user;
  console.log(user);
  if (user.type != "recruiter") {
    res.status(401).json({
      message: "You do not have permissions to view job applications",
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
    const job = await Job.findOne({ where: { id: jobId, userId: user.id } });
    if (!job) {
      res.status(404).json({
        message: "Job does not exist",
      });
      return;
    }

    const applications = await Application.findAll({
      where: findParams,
      order: sortParams,
      attributes: ["id", "userId", "jobId", "status", "createdAt", "updatedAt"],
      include: [
        {
          model: User,
          as: "applicant",
          attributes: ["id", "name", "email", "type"],
        },
      ],
    });

    res.json(applications);
  } catch (err) {
    res.status(400).json(err);
  }
});

// recruiter/applicant gets all his applications [pagination]
router.get("/applications", jwtAuth, (req, res) => {
  const user = req.user;

  // const page = parseInt(req.query.page) ? parseInt(req.query.page) : 1;
  // const limit = parseInt(req.query.limit) ? parseInt(req.query.limit) : 10;
  // const skip = page - 1 >= 0 ? (page - 1) * limit : 0;

  Application.aggregate([
    {
      $lookup: {
        from: "jobapplicantinfos",
        localField: "userId",
        foreignField: "userId",
        as: "jobApplicant",
      },
    },
    { $unwind: "$jobApplicant" },
    {
      $lookup: {
        from: "jobs",
        localField: "jobId",
        foreignField: "id",
        as: "job",
      },
    },
    { $unwind: "$job" },
    {
      $lookup: {
        from: "recruiterinfos",
        localField: "recruiterId",
        foreignField: "userId",
        as: "recruiter",
      },
    },
    { $unwind: "$recruiter" },
    {
      $match: {
        [user.type === "recruiter" ? "recruiterId" : "userId"]: user.id,
      },
    },
    {
      $sort: {
        dateOfApplication: -1,
      },
    },
  ])
    .then((applications) => {
      res.json(applications);
    })
    .catch((err) => {
      res.status(400).json(err);
    });
});

// update status of application: [Applicant: Can cancel, Recruiter: Can do everything] [todo: test: done]
router.put("/applications/:id", jwtAuth, (req, res) => {
  const user = req.user;
  const id = req.params.id;
  const status = req.body.status;

  // "applied", // when a applicant is applied
  // "shortlisted", // when a applicant is shortlisted
  // "accepted", // when a applicant is accepted
  // "rejected", // when a applicant is rejected
  // "deleted", // when any job is deleted
  // "cancelled", // an application is cancelled by its author or when other application is accepted
  // "finished", // when job is over

  if (user.type === "recruiter") {
    if (status === "accepted") {
      // get job id from application
      // get job info for maxPositions count
      // count applications that are already accepted
      // compare and if condition is satisfied, then save

      Application.findOne({
        id: id,
        recruiterId: user.id,
      })
        .then((application) => {
          if (application === null) {
            res.status(404).json({
              message: "Application not found",
            });
            return;
          }

          Job.findOne({
            id: application.jobId,
            userId: user.id,
          }).then((job) => {
            if (job === null) {
              res.status(404).json({
                message: "Job does not exist",
              });
              return;
            }

            Application.countDocuments({
              recruiterId: user.id,
              jobId: job.id,
              status: "accepted",
            }).then((activeApplicationCount) => {
              if (activeApplicationCount < job.maxPositions) {
                // accepted
                application.status = status;
                application.dateOfJoining = req.body.dateOfJoining;
                application
                  .save()
                  .then(() => {
                    Application.updateMany(
                      {
                        id: {
                          $ne: application.id,
                        },
                        userId: application.userId,
                        status: {
                          $nin: [
                            "rejected",
                            "deleted",
                            "cancelled",
                            "accepted",
                            "finished",
                          ],
                        },
                      },
                      {
                        $set: {
                          status: "cancelled",
                        },
                      },
                      { multi: true }
                    )
                      .then(() => {
                        if (status === "accepted") {
                          Job.findOneAndUpdate(
                            {
                              id: job.id,
                              userId: user.id,
                            },
                            {
                              $set: {
                                acceptedCandidates: activeApplicationCount + 1,
                              },
                            }
                          )
                            .then(() => {
                              res.json({
                                message: `Application ${status} successfully`,
                              });
                            })
                            .catch((err) => {
                              res.status(400).json(err);
                            });
                        } else {
                          res.json({
                            message: `Application ${status} successfully`,
                          });
                        }
                      })
                      .catch((err) => {
                        res.status(400).json(err);
                      });
                  })
                  .catch((err) => {
                    res.status(400).json(err);
                  });
              } else {
                res.status(400).json({
                  message: "All positions for this job are already filled",
                });
              }
            });
          });
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    } else {
      Application.findOneAndUpdate(
        {
          id: id,
          recruiterId: user.id,
          status: {
            $nin: ["rejected", "deleted", "cancelled"],
          },
        },
        {
          $set: {
            status: status,
          },
        }
      )
        .then((application) => {
          if (application === null) {
            res.status(400).json({
              message: "Application status cannot be updated",
            });
            return;
          }
          if (status === "finished") {
            res.json({
              message: `Job ${status} successfully`,
            });
          } else {
            res.json({
              message: `Application ${status} successfully`,
            });
          }
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    }
  } else {
    if (status === "cancelled") {
      console.log(id);
      console.log(user.id);
      Application.findOneAndUpdate(
        {
          id: id,
          userId: user.id,
        },
        {
          $set: {
            status: status,
          },
        }
      )
        .then((tmp) => {
          console.log(tmp);
          res.json({
            message: `Application ${status} successfully`,
          });
        })
        .catch((err) => {
          res.status(400).json(err);
        });
    } else {
      res.status(401).json({
        message: "You don't have permissions to update job status",
      });
    }
  }
});

// get a list of final applicants for all his jobs : recuiter
router.get("/applicants", jwtAuth, async (req, res) => {
  const user = req.user;
  if (user.type === "recruiter") {
    const findParams = {
      recruiterId: user.id,
    };
    if (req.query.jobId) {
      findParams.jobId = req.query.jobId;
    }
    if (req.query.status) {
      findParams.status = Array.isArray(req.query.status)
        ? { [Op.in]: req.query.status }
        : req.query.status;
    }

    let sortParams = ["id", "ASC"];
    if (req.query.asc) {
      if (Array.isArray(req.query.asc)) {
        sortParams = req.query.asc.map((key) => [key, "ASC"]);
      } else {
        sortParams = [[req.query.asc, "ASC"]];
      }
    }

    if (req.query.desc) {
      if (Array.isArray(req.query.desc)) {
        sortParams = req.query.desc.map((key) => [key, "DESC"]);
      } else {
        sortParams = [[req.query.desc, "DESC"]];
      }
    }

    try {
      const applications = await Application.findAll({
        where: findParams,
        order: sortParams,
        include: [
          {
            model: JobApplicantInfo,
            as: "jobApplicant",
          },
          {
            model: Job,
            as: "job",
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
      console.error(err);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  } else {
    res.status(400).json({
      message: "You are not allowed to access applicants list",
    });
  }
});

// to add or update a rating [todo: test]
router.put("/rating", jwtAuth, (req, res) => {
  const user = req.user;
  const data = req.body;
  if (user.type === "recruiter") {
    // can rate applicant
    Rating.findOne({
      senderId: user.id,
      receiverId: data.applicantId,
      category: "applicant",
    })
      .then((rating) => {
        if (rating === null) {
          console.log("new rating");
          Application.countDocuments({
            userId: data.applicantId,
            recruiterId: user.id,
            status: {
              $in: ["accepted", "finished"],
            },
          })
            .then((acceptedApplicant) => {
              if (acceptedApplicant > 0) {
                // add a new rating

                rating = new Rating({
                  category: "applicant",
                  receiverId: data.applicantId,
                  senderId: user.id,
                  rating: data.rating,
                });

                rating
                  .save()
                  .then(() => {
                    // get the average of ratings
                    Rating.aggregate([
                      {
                        $match: {
                          receiverId: mongoose.Types.ObjectId(data.applicantId),
                          category: "applicant",
                        },
                      },
                      {
                        $group: {
                          id: {},
                          average: { $avg: "$rating" },
                        },
                      },
                    ])
                      .then((result) => {
                        // update the user's rating
                        if (result === null) {
                          res.status(400).json({
                            message: "Error while calculating rating",
                          });
                          return;
                        }
                        const avg = result[0].average;

                        JobApplicant.findOneAndUpdate(
                          {
                            userId: data.applicantId,
                          },
                          {
                            $set: {
                              rating: avg,
                            },
                          }
                        )
                          .then((applicant) => {
                            if (applicant === null) {
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
              Rating.aggregate([
                {
                  $match: {
                    receiverId: mongoose.Types.ObjectId(data.applicantId),
                    category: "applicant",
                  },
                },
                {
                  $group: {
                    id: {},
                    average: { $avg: "$rating" },
                  },
                },
              ])
                .then((result) => {
                  // update the user's rating
                  if (result === null) {
                    res.status(400).json({
                      message: "Error while calculating rating",
                    });
                    return;
                  }
                  const avg = result[0].average;
                  JobApplicant.findOneAndUpdate(
                    {
                      userId: data.applicantId,
                    },
                    {
                      $set: {
                        rating: avg,
                      },
                    }
                  )
                    .then((applicant) => {
                      if (applicant === null) {
                        res.status(400).json({
                          message:
                            "Error while updating applicant's average rating",
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
  } else {
    // applicant can rate job
    Rating.findOne({
      senderId: user.id,
      receiverId: data.jobId,
      category: "job",
    })
      .then((rating) => {
        console.log(user.id);
        console.log(data.jobId);
        console.log(rating);
        if (rating === null) {
          console.log(rating);
          Application.countDocuments({
            userId: user.id,
            jobId: data.jobId,
            status: {
              $in: ["accepted", "finished"],
            },
          })
            .then((acceptedApplicant) => {
              if (acceptedApplicant > 0) {
                // add a new rating

                rating = new Rating({
                  category: "job",
                  receiverId: data.jobId,
                  senderId: user.id,
                  rating: data.rating,
                });

                rating
                  .save()
                  .then(() => {
                    // get the average of ratings
                    Rating.aggregate([
                      {
                        $match: {
                          receiverId: mongoose.Types.ObjectId(data.jobId),
                          category: "job",
                        },
                      },
                      {
                        $group: {
                          id: {},
                          average: { $avg: "$rating" },
                        },
                      },
                    ])
                      .then((result) => {
                        if (result === null) {
                          res.status(400).json({
                            message: "Error while calculating rating",
                          });
                          return;
                        }
                        const avg = result[0].average;
                        Job.findOneAndUpdate(
                          {
                            id: data.jobId,
                          },
                          {
                            $set: {
                              rating: avg,
                            },
                          }
                        )
                          .then((foundJob) => {
                            if (foundJob === null) {
                              res.status(400).json({
                                message:
                                  "Error while updating job's average rating",
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
                    "You haven't worked for this job. Hence you cannot give a rating.",
                });
              }
            })
            .catch((err) => {
              res.status(400).json(err);
            });
        } else {
          // update the rating
          rating.rating = data.rating;
          rating
            .save()
            .then(() => {
              // get the average of ratings
              Rating.aggregate([
                {
                  $match: {
                    receiverId: mongoose.Types.ObjectId(data.jobId),
                    category: "job",
                  },
                },
                {
                  $group: {
                    id: {},
                    average: { $avg: "$rating" },
                  },
                },
              ])
                .then((result) => {
                  if (result === null) {
                    res.status(400).json({
                      message: "Error while calculating rating",
                    });
                    return;
                  }
                  const avg = result[0].average;
                  console.log(avg);

                  Job.findOneAndUpdate(
                    {
                      id: data.jobId,
                    },
                    {
                      $set: {
                        rating: avg,
                      },
                    }
                  )
                    .then((foundJob) => {
                      if (foundJob === null) {
                        res.status(400).json({
                          message: "Error while updating job's average rating",
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
        }
      })
      .catch((err) => {
        res.status(400).json(err);
      });
  }
});

// get personal rating
router.get("/rating", jwtAuth, async (req, res) => {
  try {
    const user = req.user;
    const rating = await Rating.findOne({
      where: {
        senderId: user.id,
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
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Application.findOne({
//   id: id,
//   userId: user.id,
// })
//   .then((application) => {
//     application.status = status;
//     application
//       .save()
//       .then(() => {
//         res.json({
//           message: `Application ${status} successfully`,
//         });
//       })
//       .catch((err) => {
//         res.status(400).json(err);
//       });
//   })
//   .catch((err) => {
//     res.status(400).json(err);
//   });

// router.get("/jobs", (req, res, next) => {
//   passport.authenticate("jwt", { session: false }, function (err, user, info) {
//     if (err) {
//       return next(err);
//     }
//     if (!user) {
//       res.status(401).json(info);
//       return;
//     }
//   })(req, res, next);
// });

module.exports = router;
