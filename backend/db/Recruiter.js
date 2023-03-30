const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize("employee", "root", "", {
    host: "localhost",
    dialect: "mysql",
});

const RecruiterInfo = sequelize.define("RecruiterInfo", {
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
    contactNumber: {
        type: DataTypes.STRING,
        validate: {
            isValidPhoneNumber(value) {
                if (value !== "") {
                    if (!/\+\d{1,3}\d{10}/.test(value)) {
                        throw new Error("Phone number is invalid!");
                    }
                }
            },
        },
    },
    bio: {
        type: DataTypes.STRING,
    },
});

sequelize.sync();

module.exports = RecruiterInfo;