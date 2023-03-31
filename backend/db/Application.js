const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize("employee", "root", "", {
    host: "localhost",
    dialect: "mysql",
});

const Application = sequelize.define(
    "application", {
        userid: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        recruiterId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        jobId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        dateOfApplication: {
            type: DataTypes.DATE,
            defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        dateOfJoining: {
            type: DataTypes.DATE,
        },
        sop: {
            type: DataTypes.STRING(255),
        },
    }, {
        tableName: "applications",
        timestamps: false,
    }
);
sequelize.sync();

module.exports = Application;