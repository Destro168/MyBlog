'use strict';

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

// Returns whether some content is a valid type of content.
const g_IsValidContent = (content) => ['technical', 'personal'].indexOf(content) != -1

// Default get used just to test service.
app.get('/', (req, res) => {
	res.send('Service is alive. Hello World!')
})

app.route('/api/posts/:category')
	// Get a post's data object.
	.get(function (req, res) {
		let categoryParam = req.params.category;
		let date_start = req.query.date_start;
		let date_end = req.query.date_end;

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

		if (!g_IsValidContent(categoryParam)) {
			res.status(400).send("Error, bad category data.");
			return;
		}

		var query = postModel.find({
			category: categoryParam,
			$and: [{
				created_on: {
					$gte: date_start
				}
			}, {
				created_on: {
					$lte: date_end
				}
			}]
		});

		// Execute the query. Send error on error, otherwise send data.
		query.exec((err, data) => {
			err ? res.status(400).send(err) : res.status(200).json(data);
		});
	})

	// Posts some content.
	.post(function (req, res) {
		if (!g_IsValidContent(req.params.category)) {
			res.status(400).send("Error, bad category data.");
			return;
		}

		var post = new postModel({
			content: req.body.content,
			category: req.params.category
		});

		post.save((err, post) => {
			err ? res.status(400).send(err) : res.status(200).json({
				message: "Successfully saved post.",
				post: post
			});
		});

		return;
	})

app.route('/api/posts/:category/:id')
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

/*
app.get('/post/:id', (req, res) => {
	
})

// Create a new post.
app.post('/post', (req, res) => {
	res.send('Service is alive. Hello World!')
})

// Update a post's data.
app.put('/post/:id', (req, res) => {
	res.send('Service is alive. Hello World!')
})

// Delete a post.
app.delete('/post/:id', (req, res) => {
	res.send('Service is alive. Hello World!')
})
*/

app.listen(port, () => console.log(`Example app listening on port ${port}!`))