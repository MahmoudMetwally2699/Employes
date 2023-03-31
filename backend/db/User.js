const { Sequelize, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");

const sequelize = new Sequelize("employee", "root", "", {
    host: "localhost",
    dialect: "mysql",
});

const User = sequelize.define(
    "UserAuth", {
        email: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM("recruiter", "applicant"),
            allowNull: false,
        },
    }, {
        timestamps: false,
        hooks: {
            beforeCreate: async(user) => {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(user.password, salt);
                user.password = hashedPassword;
            },
        },
    }
);

User.prototype.login = async function(password) {
    const isMatch = await bcrypt.compare(password, this.password);
    if (isMatch) {
        return true;
    }
    return false;
};

sequelize
    .authenticate()
    .then(() => {
        console.log("Connection has been established successfully.");
    })
    .catch((error) => {
        console.error("Unable to connect to the database:", error);
    });

sequelize
    .sync()
    .then(() => {
        console.log("All models were synchronized successfully.");
    })
    .catch((error) => {
        console.error("Unable to synchronize the database:", error);
    });

module.exports = User;