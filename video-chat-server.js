require('dotenv').config();
var express = require('express');
var cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app = express();
const { Auth } = require('@vonage/auth');
const { Video } = require('@vonage/video');
app.set('view engine', 'ejs'); 
app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use('/', express.static(path.join(__dirname, 'views')));
app.use('/node_modules', express.static(path.join(__dirname, '/node_modules/')));
app.enable('trust proxy');

//initiate videoClient
const appId = process.env.APP_ID;
const port = process.env.PORT;

const credentials = new Auth({
  applicationId: appId,
  privateKey: "private.key",
});

const options = {};
const videoClient = new Video(credentials, options);
var sessionId = null;

async function new_session(res, req) {
	const session = await videoClient.createSession({ mediaMode: 'routed' })
	console.log(session)
	sessionId = session.sessionId;
	console.log(sessionId)
	token = videoClient.generateClientToken(sessionId)
	res.render('index.ejs', {
		sessionId: sessionId,
		token: token,
		appId: appId
	});
}

app.get('/', function (req, res) {
	new_session(res, req);
});

app.get('/:sessionId', function (req, res) {
	token = videoClient.generateClientToken(sessionId);
	res.render('index.ejs', {
		sessionId: sessionId,
		token: token,
		appId: appId
	});
});

app.get('/:sessionId/join', function (req, res) {
	console.log(req.params);
	sessionId = req.params['sessionId'];
	token = videoClient.generateClientToken(sessionId);
	res.render('index.ejs', {
		sessionId: sessionId,
		token: token,
		appId: appId, 
	});
});

app.get('/:sessionId/token', function (req, res) {
	sessionId = req.params['sessionId'];
	role = req.query['role'] || 'publisher';	
	token = videoClient.generateClientToken(sessionId,{role:role});
	params = `${appId} ${sessionId} ${token} true`
	return res.json({session_id:sessionId, token:token, appId:appId, role:role, commandParams: params})
});


// `server` is a vanilla Node.js HTTP server, so use
// the same ws upgrade process described here:
// https://www.npmjs.com/package/ws#multiple-servers-sharing-a-single-https-server
const server = app.listen(port);
console.log("Running on port",port)