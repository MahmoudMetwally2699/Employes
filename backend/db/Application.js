const {Sequelize, DataTypes} = require("sequelize");

const sequelize = new Sequelize("employee", "root", "", {
  host: "localhost",
  dialect: "mysql",
});

const Application = sequelize.define(
  "application",
  {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    recruiter_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    job_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    date_of_application: {
      type: DataTypes.DATE,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    date_of_joining: {
      type: DataTypes.DATE,
    },
    sop: {
      type: DataTypes.STRING(255),
    },
  },
  {
    tableName: "applications",
    timestamps: false,
  }
);
sequelize.sync();

module.exports = Application;
