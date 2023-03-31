const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize("employee", "root", "", {
    host: "localhost",
    dialect: "mysql",
});

const Job = sequelize.define(
    "jobs", {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        maxApplicants: {
            type: DataTypes.INTEGER,
            validate: {
                isInt: true,
                min: 1,
            },
        },
        maxPositions: {
            type: DataTypes.INTEGER,
            validate: {
                isInt: true,
                min: 1,
            },
        },
        activeApplications: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                isInt: true,
                min: 0,
            },
        },
        acceptedCandidates: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            validate: {
                isInt: true,
                min: 0,
            },
        },
        dateOfPosting: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        deadline: {
            type: DataTypes.DATE,
        },
        skillsets: {
            type: DataTypes.JSON,
        },
        jobType: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        duration: {
            type: DataTypes.INTEGER,
            validate: {
                isInt: true,
                min: 0,
            },
        },
        salary: {
            type: DataTypes.INTEGER,
            validate: {
                isInt: true,
                min: 0,
            },
        },
        rating: {
            type: DataTypes.FLOAT,
            defaultValue: -1.0,
            validate: {
                isFloat: true,
                min: -1.0,
                max: 5.0,
            },
        },
    }, { underscored: true }
);
sequelize.sync();

module.exports = Job;