let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
let ejs = require('ejs');
let expressValidator = require('express-validator');
let expressSession = require('express-session');
let flash = require('connect-flash');
const bodyParser = require('body-parser');
let indexRouter = require('./routes/index');
let userRouter = require('./routes/users');
const mongoose = require('mongoose');
const config = require('./config/database');
const passport = require('passport');
const MongoStore = require('connect-mongo')(expressSession);



mongoose.connect(config.database, { useNewUrlParser: true });
mongoose.connection
    .once('open',() => { console.log('working'); })
    .on('error', (error) => {
        console.warn('WARNING: ', error);
    });

let app = express();

/*------<View Engine Setup>-----*/
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.locals.rmWhitespace = true;

// Express Messages Middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});
app.use(expressSession({secret:'max', saveUninitialized: true, resave: true,
    store: new MongoStore({
        url: config.database,
        collection: 'sessions'
    })
}));

// Express Validator Middleware
app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.'),
            root = namespace.shift(),
            formParam = root;
        while (namespace.length){
            formParam += '[' + namespace.shift() + ']';
        }
        return {
            param : formParam,
            msg: msg,
            value: value
        };
    }
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// Passport Config
require('./config/passport')(passport);

// app.get('*', function (req, res, next) {
//     res.locals.user = req.user || null;
//     next();
// });

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


// Init passport authentication
app.use(passport.initialize());
// persistent login sessions
app.use(passport.session());
// app.all('*', ensureSecure); // at top of routing calls
//
// function ensureSecure(req, res, next){
//     if(req.secure){
//         // OK, continue
//         return next();
//     }
//     // handle port numbers if you need non defaults
//     else {
//     res.redirect('https://' + req.hostname + req.url); // express 4.x
//         }
// }

app.use('/', indexRouter);
app.use('/admin', userRouter);

/*------<Catch 404 And Forward To Error Handler>-----*/
app.use(function(req, res, next) {
    next(createError(404));
});
/*------<Error Handler>-----*/
app.use(function(err, req, res, next) {
    /*------<Set Locals, Only Providing Error In Development>-----*/
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    /*------<Render The Error Page>-----*/
    res.status(err.status || 500);
    res.render('error');
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) { // eslint-disable-line no-unused-vars
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
