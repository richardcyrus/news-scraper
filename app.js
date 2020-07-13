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
const mongoose = require('mongoose');

const appConfig = require('./config/app-config');

const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');

const app = express();

// Set up mongoose connection
const mongoDB = appConfig.mongodb.uri;
mongoose.connect(mongoDB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
});
// Tell Mongoose to use the global promise library
mongoose.Promise = global.Promise;
// Get the connection
const db = mongoose.connection;

// Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

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
app.use(
    csrf({
        cookie: {
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
        },
    })
);
app.use(
    sassMiddleware({
        src: path.join(__dirname, 'public'),
        dest: path.join(__dirname, 'public'),
        indentedSyntax: false,
        sourceMap: true,
    })
);

// Register the location of static files.
app.use('/', express.static(path.join(__dirname, 'public')));

// Register library paths for front end modules installed with node.
app.use(
    '/js/lib',
    express.static(path.join(__dirname, 'node_modules/jquery/dist'))
);
app.use(
    '/js/lib',
    express.static(path.join(__dirname, 'node_modules/popper.js/dist/umd'))
);
app.use(
    '/js/lib',
    express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js'))
);
app.use(
    '/js/lib/fontawesome',
    express.static(
        path.join(__dirname, 'node_modules/@fortawesome/fontawesome-free/js')
    )
);

app.use('/', indexRouter);
app.use('/api', apiRouter);

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
