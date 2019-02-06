/**
 * news-scraper
 *
 * The Coding Boot Camp at UNC Charlotte.
 * (c) 2019 Richard Cyrus <hello@rcyrus.com>
 */

const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const sassMiddleware = require('node-sass-middleware');
const helmet = require('helmet');
const exphbs = require('express-handlebars');
const cors = require('cors');
const csrf = require('csurf');

const appConfig = require('./config/app-config');

const indexRouter = require('./routes/index');

const app = express();

// view engine setup
const hbs = exphbs.create({
    defaultLayout: 'main',
    extname: '.hbs',
});
app.engine('hbs', hbs.engine);
if (app.get('env') === 'production') {
    app.set('view cache', true);
}
app.set('view engine', 'hbs');

app.use(helmet());
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(appConfig.session.secret));
app.use(csrf({ cookie: true }));
app.use(
    sassMiddleware({
        src: path.join(__dirname, 'public'),
        dest: path.join(__dirname, 'public'),
        indentedSyntax: false,
        sourceMap: true,
    })
);
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
