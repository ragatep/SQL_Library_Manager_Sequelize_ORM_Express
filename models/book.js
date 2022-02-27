'use strict';

// Requires the 'sequelize' module
const {
  Model
} = require('sequelize');
// Exports the initialized Movie model
module.exports = (sequelize, DataTypes) => {
  class Book extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Book.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {notEmpty: { msg: '"Title" is required' }},
      },
      author: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {notEmpty: { msg: '"Author" is required' }},
      },
      genre: {type: DataTypes.STRING,},
      year: {type: DataTypes.INTEGER}
    }, {
      sequelize,
      modelName: 'Book',
      // timestamps: false, // disable timestamps
    }
  );
  return Book;
};