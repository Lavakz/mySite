"use strict";

var createError = require('http-errors');

var express = require('express');

var path = require('path');

var cookieParser = require('cookie-parser');

var logger = require('morgan');

var pug = require('pug');

var app = express(); // view engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express["static"](path.join(__dirname, 'public')));
app.get('/', function (req, res) {
  res.render('index');
});
app.get('/cube', function (req, res) {
  res.render('cube');
});
app.get('/SpaceRace', function (req, res) {
  res.render('SpaceRace');
});
app.get('/compositions', function (req, res) {
  res.render('compositions');
});
app.get('/visualizer', function (req, res) {
  res.render('visualizer');
}); // catch 404 and forward to error handler

app.use(function (req, res, next) {
  next(createError(404));
}); // error handler

app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {}; // render the error page

  res.status(err.status || 500);
  res.render('error');
});
module.exports = app;