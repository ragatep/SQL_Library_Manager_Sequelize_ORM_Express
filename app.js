
/* Imports the instance of sequelize. */
const { sequelize } = require("./models");

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var booksRouter = require('./routes/books');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/books', booksRouter);

/**
 * async IIFE
 * Asynchronously connects to the database.
 */ 
 (async () => {
  try {
      // Returns a promise that resolves to a successful, authenticated connection to the database
      const result = await sequelize.authenticate();
      console.log('Connection to the database successful!');
  } catch (error) {
      console.error('Error connecting to the database: ', error);
  }
})();

(async () => {
  try {
    // Syncs the model with the database.
    await sequelize.sync();
    console.log('Sync all models at once to the database successful!');
  } catch (error) {
    console.error('Error syncing all models to the database: ', error);
}
})();

/* 404 handler to catch undefined or non-existent route requests */
app.use(function(req, res, next) {
  console.log('404 error handler called');
  /**
   * Sets the response status code to 404.
   * Renders the 'page-not-found' view.
   */
  res.status(404).render('page-not-found');
});

/* Global error handler */
app.use(function(err, req, res, next) {
  if (err) {
    console.log('Global error handler called', err);
  }
  /**
   * if error status is 404, renders the 'page-not-found' view
   * else sets the error message to the given message.
   * Sets the response status to the given error status or,
   * sets it to 500 by default if no error status is set.
   * Renders the 'error' view, passing it the error object.
   */
  if (err.status === 404) {
    res.status(404).render('page-not-found', { err });
  } else {
    err.message = err.message || `Oops!  It looks like something went wrong on the server.`;
    res.status(err.status || 500).render('error', { err });
  }
});

module.exports = app;
