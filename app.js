/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

const logger = require('./config/logger');
var fileLog = logger.fileLogger;
var tokenLog = logger.tokenLogger;
var playlistLog = logger.playlistLogger;

// var client_id = 'CLIENT_ID'; // Your client id
// var client_secret = 'CLIENT_SECRET'; // Your secret
// var redirect_uri = 'REDIRECT_URI'; // Your redirect uri

var client_id = '21a627a1ba0548e8a03eb8fc73f9a976';
var client_secret = '7495937c5cd74da9b1482541982bd0c5';
var redirect_uri = 'http://localhost:8888/callback';

var user_href;
var user_id;
var access_token;
var refresh_token;
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public')).use(cors()).use(cookieParser());

app.get('/login', function (req, res) {

  var state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  var scope = 'user-read-private user-read-email';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', function (req, res) {

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    fileLog.error('state_mismatch');
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  }

  else {
    res.clearCookie(stateKey);

    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };//JSON object for below POST request

    // POST request to receive access_token
    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        // received access_token JSON from user
        fileLog.info('Received tokens');
        tokenLog.info(body);


        access_token = body.access_token;
        refresh_token = body.refresh_token;

        getUserDetails(access_token);

        // we pass the token to the browser to make requests from there
        res.redirect('/#' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token
          }));
      }
      else {
        fileLog.error('invalid_token');
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

function getUserDetails(token) {

  var options = {
    url: 'https://api.spotify.com/v1/me',
    headers: { 'Authorization': 'Bearer ' + token },
    json: true
  };
  request.get(options, function (error, response, body) {
    fileLog.info(body);
    user_href = body.href;
    user_id = body.id;
  });
};

app.get('/refresh_token', function (req, res) {

  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

app.get('/playlists', function (req, res) {
  fileLog.info('Accessing Playlists');
  var options = {
    url: user_href + '/playlists',
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  };
  request.get(options, function (error, response, body) {
    playlistLog.info(body);
    res.send(body);
  });
});

console.log('Listening on 8888');
app.listen(8888);

