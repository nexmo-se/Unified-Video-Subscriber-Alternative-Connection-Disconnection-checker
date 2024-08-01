require('dotenv').config();
var express = require('express');
var cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app = express();
app.set('view engine', 'ejs'); 
app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/', express.static(path.join(__dirname, 'views')));
app.use('/node_modules', express.static(path.join(__dirname, '/node_modules/')));
app.enable('trust proxy');

//initiate opentok
const apiKey = process.env.API_KEY;
const apiSecret = process.env.SECRET;
const port = process.env.PORT;

var OpenTok = require('opentok');
var opentok = new OpenTok(apiKey, apiSecret);
var sessionId = null;

function new_session(res, req) {
	opentok.createSession({ mediaMode: 'routed' }, function (err, session) {
		if(err){
			console.log(err)
		}
		console.log(session)
		sessionId = session.sessionId;
		console.log(sessionId)
		token = opentok.generateToken(sessionId);
		res.render('index.ejs', {
			sessionId: sessionId,
			token: token,
			apiKey: apiKey
		});
	});
}

app.get('/', function (req, res) {
	new_session(res, req);
});

app.get('/:sessionId', function (req, res) {
	token = opentok.generateToken(sessionId);
	res.render('index.ejs', {
		sessionId: sessionId,
		token: token,
		apiKey: apiKey
	});
});

app.get('/:sessionId/join', function (req, res) {
	console.log(req.params);
	sessionId = req.params['sessionId'];
	token = opentok.generateToken(sessionId);
	res.render('index.ejs', {
		sessionId: sessionId,
		token: token,
		apiKey: apiKey, 
	});
});

app.get('/:sessionId/token', function (req, res) {
	sessionId = req.params['sessionId'];
	role = req.query['role'] || 'publisher';	
	token = opentok.generateToken(sessionId,{role:role});
	params = `${apiKey} ${sessionId} ${token} true`
	return res.json({session_id:sessionId, token:token, apiKey:apiKey, role:role, commandParams: params})
});


// `server` is a vanilla Node.js HTTP server, so use
// the same ws upgrade process described here:
// https://www.npmjs.com/package/ws#multiple-servers-sharing-a-single-https-server
const server = app.listen(port);
console.log("Running on port",port)