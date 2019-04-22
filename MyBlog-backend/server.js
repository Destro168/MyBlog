'use strict';

// Store middleware into vars for initialization. Then, initialize them all.
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

dotenv.config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(cors());

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);

// Create schema template obj.
var postTemplateObj = {
	author: {
		type: String,
		default: "Donald Abdullah-Robinson"
	},
	content: String,
	category: String,
	created_on: {
		type: Date,
		default: Date.now
	}
}

// Create schema and model.
var postSchema = new mongoose.Schema(postTemplateObj);
var postModel = mongoose.model('Thread', postSchema);

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

app.route('/api/posts')
	// Get a post's data object.
	.get(function (req, res) {
		const G_ALL_CATEGORY_STR = 'All';
		let categoryParam = req.query.category;
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

		if (categoryParam && categoryParam !== G_ALL_CATEGORY_STR) {
			queryObj["category"] = categoryParam;
		}

		query = postModel.find(queryObj);

		// Execute the query. Send error on error, otherwise send data.
		query.exec((err, data) => {
			err ? res.status(400).send(err) : res.status(200).json(data);
		});
	})

	// Posts some content.
	.post(function (req, res) {
		var post = new postModel({
			content: req.body.content,
			category: req.body.category
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
	.delete(function (req, res) {
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
	.put(function (req, res) {
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