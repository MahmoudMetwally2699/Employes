const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize("employee", "root", "", {
    host: "localhost",
    dialect: "mysql",
});

const Rating = sequelize.define(
    "ratings", {
        category: {
            type: DataTypes.ENUM("job", "applicant"),
            allowNull: false,
        },
        receiverId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        rating: {
            type: DataTypes.DOUBLE,
            allowNull: false,
            defaultValue: -1.0,
            validate: {
                min: -1.0,
                max: 5.0,
            },
        },
    }, {
        indexes: [{
            unique: true,
            fields: ["category", "receiver_id", "sender_id"],
        }, ],
        underscored: true,
    }
);

sequelize.sync();

module.exports = Rating;