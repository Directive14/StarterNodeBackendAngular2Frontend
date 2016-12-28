let encryption = require('../utilities/encryption'),
    jwt = require('jwt-simple'),
    users = require('../data/users'),
    User = require('mongoose').model('User'),
    config = require('../config/database');

let CONTROLLER_NAME = 'users';

function postRegister(req, res) {
    let newUserData = req.body;

    newUserData.salt = encryption.generateSalt();
    newUserData.hashPass = encryption.generateHashedPassword(newUserData.salt, newUserData.password);
    users.create(newUserData, function(err, user) {
        if (err) {
            return res.status(409).json({ success: false, msg: { code: err.code, message: err.message } });
        } else {
            return postAuthenticate(req, res);
        }
    });
}

function postAuthenticate(req, res) {
    User.findOne({
        username: req.body.username
    }, function(err, user) {
        if (err) {
            throw err;
        }

        if (!user) {
            res.status(401).send({ err: 'Authentication failed. User not found.' });
        } else {
            // check if password matches
            if (user.authenticate(req.body.password)) {
                // if user is found and password is right create a token
                let token = jwt.encode(user, config.secret);
                // return the information including token as JSON
                return res.json({ success: true, user: user, token: 'JWT ' + token });
            } else {
                res.status(401).send({ err: 'Authentication failed. Wrong password.' });
            }
        }
    });
}

function getAll(req, res) {
    User.find({}, function(err, users) {
        if (err) {
            throw err;
        }

        if (!users.length) {
            res.status(401).send({ err: 'No users.' });
        } else {
            res.status(200).json(users);
        }
    });
}

function getSingleUserData(req, res) {
    let id = req.params.id;
    User.findById(id, (err, user) => {
        if (err) console.log(err);
        if (!user) return res.json({ success: false, message: "User not found." });
        return res.json({
            success: true,
            result: {
                username: user.username,
                firstName: user.firstName,
                lastName: user.lastName,
                _id: user._id,
                //age: user.age,
                //gender: user.gender,
                //email: user.email,
                //about: user.about,
                //image: user.image,
                //rating: user.rating,
            }
        });
    });
}

function updateUserData(req, res) {
    User.findById(req.body._id, function(err, u) {
        if (!u)
            throw Error('Could not load Document');
        else {
            u.firstName = req.body.firstName;
            u.lastName = req.body.lastName;
            u.image = req.body.image;
            u.about = req.body.about;
            u.email = req.body.email;
            u.save().then(res.send(u));
        }
    });
}

module.exports = {
    postRegister,
    postAuthenticate,
    getAll,
    getSingleUserData,
    updateUserData
};