const express = require('express');
const app = express();

const cors = require('cors');

const knex = require('knex');

const bcrypt = require('bcrypt');

const register = require('./controllers/register.js');
const signin = require('./controllers/signin.js');

const Clarifai = require('clarifai');

const db = knex({
	client: 'pg',
	connection: {
		connectionString: process.env.DATABASE_URL,
		ssl: {
			rejectUnauthorized: false,
		},
	},
});

const apiApp = new Clarifai.App({
	apiKey: '2afd7870a1534f04ac114fb047c7aac6',
});

const handleApiCall = (req, res) => {
	apiApp.models
		.predict(
			'c0c0ac362b03416da06ab3fa36fb58e3',
			// THE JPG
			req.body.input
		)
		.then(data => res.json(data))
		.catch(err => res.status(400).json('unable to work with api'));
};

const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

app.use(express.json()); //instead of bodyparses
app.use(cors());

app.get('/', (req, res) => {
	res.send('it is working');
});
app.post('/signin', (req, res) => {
	signin.handleSignin(req, res, db, bcrypt);
});

app.post('/register', (req, res) => {
	register.handleRegister(req, res, db, bcrypt, salt);
});

app.get('/profile/:id', (req, res) => {
	const { id } = req.params;
	db.select('*')
		.from('users')
		.where({
			id,
		})
		.then(user => {
			if (user.length) {
				res.json(user[0]);
			} else {
				res.status(400).json('not found');
			}
		});
});

app.put('/image', (req, res) => {
	const { id } = req.body;
	db('users')
		.where('id', '=', id)
		.increment('entries', 1)
		.returning('entries')
		.then(entries => {
			res.json(entries[0]);
		})
		.catch(err => res.status(400).json('unable to get entries'));
});

app.post('/imageurl', (req, res) => {
	handleApiCall(req, res);
});

app.listen(process.env.PORT || 3000, () => {
	console.log('App is running on port 3000');
});

/*
/ -> res= this is working
/signin -> POST = success/fail
/register -> POST = user
/profile/:userId -> GET = user
/image -> PUT -> user
*/
