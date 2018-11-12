const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const app = require('../app');
const User = require('../model/user');
const passport = require('passport');
let path = require('path');
let mailgun_api_key = 'key-e3375ef5b386b9c24e5349f6de243c85';
let domain_name = 'beta.appstersinc.com';
let mailgun = require('mailgun-js')({apiKey: mailgun_api_key, domain: domain_name});
const clientEmailAddress = 'hassaan@appstersinc.com';
let async = require("async");
let crypto = require('crypto-browserify');
let multer  = require('multer');
const resetPasswordRoute = '/reset-password/';
const forgotPasswordRouteAddress = '/forgot-password';
const loginRouteAddress = '/login';
const profileRouteAddress = '/profile';
const changePasswordRouteAddress = '/change-password';
let passwordMatched = false;
let passwordMatchedInLastTerm = null;

//Storage Engine For Upload Image
const storage = multer.diskStorage({
    destination: './public/profile-images/',
    filename: function (req, file, callback) {
        callback(null,file.fieldname + '-' + Date.now()+ path.extname(file.originalname));
    }
});


// Check File Type
const checkFileType = (req,file, callback) => {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if(mimetype && extname){
        return callback(null,true);
    } else {
        callback(req.flash('error','Error: Images Only!'));
    }
};
//Initialize Upload
const upload = multer({
    storage: storage,
    limits:{fileSize: 1000000},
    fileFilter: checkFileType
});
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/login');
}
function isLoggedOut(req, res, next) {

    // if user is authenticated in the session, carry on
    if (!req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('back');
}
// Login Form
router.get('/login' ,isLoggedOut,  (req,res,next) => {
    res.render('login', {
        title:'Admin login form',
    });
});
// Login Process
router.post('/login', isLoggedOut, (req,res,next) => {
    console.log('is empty '+req.user);
    passport.authenticate('local', {
        successRedirect: profileRouteAddress,
        failureRedirect: loginRouteAddress,
        failureFlash: true
    })(req, res, next);
});
router.get('/register', isLoggedOut, (req, res) => {
    res.render('register', {
        title:'Admin registration form',
    });
});
router.post('/register',isLoggedOut, upload.single('profilePicture') , (req,res,next) => {
    const body = req.body;
    const firstName = body.firstName;
    const lastName = body.lastName;
    const email = body.email;
    const password = body.password;
    const profilePicture = req.file.path;
    const contactNumber = body.contactNumber;
    req.checkBody('firstName', 'First Name is required').notEmpty();
    req.checkBody('lastName', 'Last Name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('email', 'Email is not valid').isEmail();
    req.checkBody('password', 'Password is required').notEmpty();
    req.checkBody('password2', 'Passwords do not match').equals(password);
    req.checkBody('contactNumber', 'Please enter a correct contact number').isNumeric();
    req.checkBody('profilePicture', 'Please upload a correct picture').equals(password);
    // req.checkBody('password2', 'Passwords do not match').equals(password);
    console.log('validated data');
    let errors = req.validationErrors();
    if (errors) {
        res.render('register', {
            errors: errors
        });
    }

    console.log('setting new user values');
    let newUser = new User({
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: password,
        profilePicture: profilePicture,
        contactNumber: contactNumber,
        createdAt: Date.now()
    });

    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(newUser.password, salt,function (err, hash) {
            console.log('executed');
            if (err){
                console.log('in error');
                console.log(err);
            } else {
                newUser.password = hash;
                newUser.save(function (err) {
                    if(err){
                        console.log(err);
                    }
                    else {
                        console.log('saving new user');
                        req.flash('success', 'your are successfully registered');
                        res.redirect(loginRouteAddress);
                    }
                });
            }
        });

    });

});

// profile
router.get('/profile',isLoggedIn, (req,res,next) => {
    const user = req.user;
    const firstName = user.firstName;
    const lastName = user.lastName;
    const email = user.email;
    const profilePicture = user.profilePicture;
    console.log(user);
    res.render('profile',{
        firstName: firstName,
        lastName: lastName,
        email: email,
        profilePicture: profilePicture,
        title: 'Profile'
    });
});
// dashboard
router.get('/',isLoggedIn, (req,res,next) => {

    res.render('dashboard',{
        title: 'Dashboard',
    });
});
// logout
router.get('/logout',isLoggedIn, (req,res,next) => {
    req.logout();
    req.flash('success', 'You are logged out');
    res.redirect(loginRouteAddress);
});
// change password Form
router.get('/change-password',isLoggedIn,  (req,res,next) => {
    res.render('change-password', {
        title:'Admin change password form',
        success: passwordMatched
    });
    passwordMatched = false;
});
router.post('/change-password', isLoggedIn, (req,res,next) => {
    console.log('new password ',req.body.new_password);
    console.log('passwordMatchedInLastTerm ', passwordMatchedInLastTerm);
    const body = req.body;
    if (req.body.new_password && passwordMatchedInLastTerm){
        const new_password = body.new_password;
        // req.checkBody('new_password', 'New password is required').notEmpty();
        // req.checkBody('confirm_password', 'Passwords do not match').equals(new_password);
        // console.log('validated data');
        // let errors = req.validationErrors();
        // if (errors) {
        //     res.render('change-password', {
        //         title:'Admin change password form',
        //         errors: errors
        //     });
        // }
        console.log('update password is working');
        User.findById(req.user._id)
            .then((user) => {
                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(new_password, salt,function (err, hash) {
                        console.log('executed');
                        if (err){
                            console.log('in error');
                            console.log(err);
                        } else {
                            user.password = hash;
                            user.updatedAt = Date.now();
                            user.save(function (err) {
                                if(err){
                                    console.log(err);
                                }
                                else {
                                    console.log('saving new password');
                                    req.flash('success', 'your password has been successfully changed.');
                                    res.redirect(profileRouteAddress);
                                }
                            });
                        }
                    });

                });
            });

    }
    else {
        let result = bcrypt.compareSync(req.body.password, req.user.password);
        if (result) {
            console.log("Password correct");
            req.flash('success', 'Password matched');
            passwordMatched = true;
            passwordMatchedInLastTerm = true;
            res.redirect(changePasswordRouteAddress);
        } else {
            console.log("Password wrong");
            req.flash('error', 'Password do not match. Enter correct password');
            passwordMatched = false;
            passwordMatchedInLastTerm = false;
            res.redirect(changePasswordRouteAddress);

        }
    }


});
router.get('/forgot-password' , isLoggedOut, (req,res,next) => {
    res.render('forgot-password',{
        title:'Reset password',
    });
});
router.post('/forgot-password' , isLoggedOut, (req,res,next) => {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                let token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({ email: req.body.email }, function(err, user) {
                console.log('runs find user');
                if (!user) {
                    console.log('gets in error');
                    req.flash('error', 'No account with that email address exists.');
                    req.session.emailSuccess = "You've entered a wrong email address";
                    return res.redirect(forgotPasswordRouteAddress);
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            const output = `
                            <!DOCTYPE html>
                            <html xmlns="http://www.w3.org/1999/xhtml">
                             <head>
                              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                              <title>GPA4 Password Reset</title>
                              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                              <link rel="stylesheet" href="/stylesheets/customStyle.css" type="text/css">
                            </head>

                            <body style="margin: 0; padding: 0;">
                                    <p>You are receiving this because you (or someone else) have requested the reset of the password for your account.<br><br>
                                Please click on the following link, or paste this into your browser to complete the process: <br><br>
                                http://${req.headers.host+resetPasswordRoute+token} <br><br>
                                If you did not request this, please ignore this email and your password will remain unchanged <br></p> 
                                    <span>
                                    --      
                                    <p>This is an auto generated email.</p>
                                    </span>

                            </body>
                            </html>
                    `;
            /*------Credentials for Interacting User-----*/
            /*------<Start>-----*/
            let userMailData = {
                from: clientEmailAddress,
                to: 'GPA4 '+ user.email,
                subject: 'GPA4 Password Reset',
                text: 'Have a great day!',
                html: output
            };
            mailgun.messages().send(userMailData, function (error, body) {
                if (error) {
                    console.log(error);
                    return next(error);
                }
                req.session.emailSuccess = 'Password re-set link sent at your e-mail address.';
                done();
                /*------<Initializing Mail Gun Mail Service End>-----*/

            });

        }], function(err) {
        if (err) return next(err);
        res.redirect(forgotPasswordRouteAddress);
    });
});

router.get('/reset-password/:token' , isLoggedOut, (req,res,next) => {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
            return res.redirect(forgotPasswordRouteAddress);
        }
        res.render('reset-password', {
            user: req.user,
            title:'Reset password',
            resetToken:req.params.token,
            success: req.session.emailSuccess,
        });
        req.session.emailSuccess = null;
    });
});
router.post('/reset-password/:token', isLoggedOut, (req,res,next) => {
    let hashedPassword;
    async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }

                bcrypt.genSalt(10, function (err, salt) {
                    bcrypt.hash(req.body.password, salt, function (err, hash) {
                        if (err) {
                            console.log(err);
                        } else {
                            hashedPassword = hash;
                        }
                    });
                });
                function resolveAfter2MiliSeconds() {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            resolve('resolved');
                        }, 200);
                    });
                }

                async function asyncCall() {
                    await resolveAfter2MiliSeconds();
                    user.password = hashedPassword;
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;
                    user.save(function(err) {
                        req.logIn(user, function(err) {
                            done(err, user);
                        });
                    });
                }

                asyncCall();

            });
        },
        function(user, done) {
            const output = `
                            <!DOCTYPE html>
                            <html xmlns="http://www.w3.org/1999/xhtml">
                             <head>
                              <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                              <title>GPA4 Password Changed</title>
                              <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                              <link rel="stylesheet" href="/stylesheets/customStyle.css" type="text/css">
                            </head>

                            <body style="margin: 0; padding: 0;">
                                    <p'Hello,<br><br>
                                    This is a confirmation that the password for your account ${user.email} has just been changed. <br></p> 
                                    <span>
                                    --      
                                    <p>This is an auto generated email.</p>
                                    </span>

                            </body>
                            </html>
                    `;
            /*------Credentials for Interacting User-----*/
            /*------<Start>-----*/
            let userMailData = {
                from: clientEmailAddress,
                to: 'GPA4 '+ user.email,
                subject: 'GPA4 Password Changed',
                text: 'Have a great day!',
                html: output
            };
            mailgun.messages().send(userMailData, function (error, body) {
                if (error) {
                    console.log(error);
                    return next(error);
                }
                req.session.emailSuccess = 'Success! Your password has been changed.';
                done();
                /*------<Initializing Mail Gun Mail Service End>-----*/

            });
        }
    ], function(err) {
        if (err) return next(err);
        res.redirect(profileRouteAddress);
    });
});
module.exports = router;
