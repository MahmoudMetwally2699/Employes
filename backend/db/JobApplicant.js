const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize("employee", "root", "", {
    host: "localhost",
    dialect: "mysql",
});
const JobApplicantInfo = sequelize.define(
    "JobApplicantInfo", {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        education: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        skills: {
            type: DataTypes.JSON,
            allowNull: false,
        },
        rating: {
            type: DataTypes.FLOAT,
            allowNull: false,
            defaultValue: -1.0,
            validate: {
                min: -1.0,
                max: 5.0,
            },
        },
        resume: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        profile: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: "JobApplicantInfo",
    }
);
sequelize.sync();

module.exports = JobApplicantInfo;