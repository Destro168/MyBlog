'use strict';

/**
 * Server.js tutorial:
 * http://www.passportjs.org/docs/authenticate/
 * https://scotch.io/tutorials/easy-node-authentication-setup-and-local
 */

// Begin to initialize middleware.
const express = require('express');
const app = express();
const port = 3000;

// Load bcrypt
const bcrypt = require('bcrypt');

// Load cookieparser.
const cookieparser = require('cookie-parser');
app.use(cookieparser("cats"));

// User cors.
const cors = require('cors');
app.use(cors());

// Load .env file using dotenv node module.
const dotenv = require('dotenv');
dotenv.config();

// Use bodyparser to process form data.
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

// Setup mongoose.
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

/** ALL OF THE FOLLOWING IS FOR PASSPORT */

const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Create user template object.
var userTemplateObj = {
	username: {
		type: String,
		unique: true,
		required: true
	},
	password: {
		type: String,
		required: true
	},
	userGroup: {
		type: String,
		default: 'user'
	}
}

// Create schema and model.
var userSchema = new mongoose.Schema(userTemplateObj);
var User = mongoose.model('User', userSchema);

var cookieSession = require('cookie-session');

app.use(express.static("public"));
app.use(cookieSession({
	name: 'dontechcookie',
	secret: 'cats'
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
	done(null, user.id);
});

passport.deserializeUser(function (id, done) {
	User.findById(id, function (err, user) {
		done(err, user);
	});
});

passport.use(new LocalStrategy(
	function (username, password, done) {
		User.findOne({
			username: username
		}, function (err, user) {
			if (err) {
				return done(err);
			}
			if (!user) {
				return done(null, false, {
					message: 'Incorrect username.'
				});
			}

			if (!bcrypt.compareSync(password, user.password)) {
				return done(null, false, {
					message: 'Incorrect password.'
				});
			}

			return done(null, user, {
				message: 'successfully authenticated'
			});
		});
	}
));

// Passport login route.
app.post('/login', function (req, res, next) {
	passport.authenticate('local', function (err, user, info) {
		if (err) {
			return res.status(400).json(err);
		}
		if (!user) {
			return res.status(400).json(err);
		}
		req.logIn(user, function (err) {			
			if (err) {
				return res.status(400).json(err);
			}

			return res.status(200).json(user);
		});
	})(req, res, next);
});

// Passport logout route.
app.get('/logout', function (req, res) {
	req.logout();
	res.status(200).json({message: "Successfully logged you out."});
});

app.post('/register', (req, res) => {
	var username = req.body.username;
	var password = bcrypt.hashSync(req.body.password, 12);

	var user = new User({
		username: username,
		password: password
	});

	user.save((err, data) => {
		if (err) {
			res.status(400).send(err);
			return;
		}

		res.status(200).json(data);
		return;
	});
});

// Special route to check if user is authenticated
app.get('/authCheck', function(req, res) {
	if (req.isAuthenticated() == true) {
		res.status(200).send({message: "true"});
	}
	else {
		res.status(200).send({message: "false"});
	}
});

/** ALL OF THE FOLLOWING IS FOR THE REST OF THE APP */

// Default get used just to test service.
app.get('/', (req, res) => {
	// If we're on glitch, then respond wtih index.html page from view.
	if (__dirname == '/app') {
		res.sendFile(__dirname + '/views/index.html');
	} else {
		res.send('Service is alive. Hello World!');
	}
});

// Used on glitch to get resources from the public folder.
app.get('/:resource', function (req, res) {
	if (__dirname == '/app') {
		res.sendFile(__dirname + '/public/' + req.params.resource);
	}
});

/**
 * Main logic used for posts.
 */

// Create schema template obj. (Admin post property currently unused.)
var postTemplateObj = {
	author: String,
	content: String,
	category: String,
	created_on: {
		type: Date,
		default: Date.now
	},
	hidden: {
		type: Boolean,
		default: false
	},
	adminPost: {
		type: Boolean,
		default: false
	}
}

// (Guest group currently unused.)
const viewCategories = {
	guest: ['General']
}

viewCategories["user"] = viewCategories["guest"].concat('Work', 'Programming');
viewCategories["admin"] = viewCategories["user"].concat('Roleplaying', 'Personal', 'Admin');

// Create schema and model.
var postSchema = new mongoose.Schema(postTemplateObj);
var postModel = mongoose.model('Thread', postSchema);

// Routing

// Make sure user is authenticated.
function ensureAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}

	res.status(200).json([]);
	return;
}


// Get Posts route.
app.route('/api/posts')

	.get(ensureAuthenticated, (req, res) => {
		let date_start = req.query.date_start;
		let date_end = req.query.date_end;
		let query;
		let queryObj = {};

		if (!date_start) {
			date_start = new Date(0);
		} else {
			date_start = new Date(date_start);
		}

		if (!date_end) {
			date_end = new Date();
		} else {
			date_end = new Date(date_end);
		}

		queryObj = {
			$and: [{
				created_on: {
					$gte: date_start
				}
			}, {
				created_on: {
					$lte: date_end
				}
			}]
		};

		var userGroup = req.user.userGroup;
		
		if (userGroup == "user") {
			queryObj["category"] = {
				$in: viewCategories.user
			}
		}
		else if (userGroup === 'admin') {
			queryObj["category"] = {
				$in: viewCategories.admin
			}
		}
		else {
			console.log("Failed to find user group.");
			return;
		}

		query = postModel.find(queryObj);

		// Execute the query. Send error on error, otherwise send data.
		query.exec((err, data) => {
			err ? res.status(400).send(err) : res.status(200).json(data);
		});
	});

app.route('/api/posts')
	// Posts some content.
	.post(ensureAuthenticated, function (req, res) {
		var post = new postModel({
			content: req.body.content,
			category: req.body.category,
			author: req.user.username
		});

		post.save((err, post) => {
			err ? res.status(400).send(err) : res.status(200).json({
				message: "Successfully saved post.",
				post: post
			});
		});

		return;
	})

app.route('/api/posts/:id')
	// Delete some content by using it's id.
	// (TODO: Make it so that no category is necessary. Honestly, probably category should not be passed via the url...)
	.delete(ensureAuthenticated, function (req, res) {
		if (!req.params.id) {
			res.status(400).send("Bad id.");
		}

		postModel.findByIdAndDelete(req.params.id, (err) => err ? res.status(400).send(err) : res.status(200).json({
			message: "Successfully deleted post."
		}));
	})

	/**
	 * Updates a posts fields with sent data.
	 */
	.put(ensureAuthenticated, function (req, res) {
		let id = req.params.id;
		let postObject = req.body.postObject;

		if (!id || !postObject) {
			res.status(400).send("Bad id or post data object transmitted.");
			return;
		}

		postModel.findByIdAndUpdate(id, postObject, (err) => err ? res.status(400).send(err) : res.status(200).json({
			message: "Successfully updated post."
		}));
	})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))