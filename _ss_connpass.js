'use strict'

const fs = require('fs');
const readline = require('readline');
const moment = require('moment');
const google = require('googleapis');
const googleAuth = require('google-auth-library');
const sheets = google.sheets('v4');
// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/sheets.googleapis.com-nodejs-quickstart.json
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-nodejs-quickstart.json';

// Load client secrets from a local file.

module.exports = (ssid, range) => {
    return new Promise((resolve, reject) => {
        const content = fs.readFileSync('client_secret.json');
        authorize(JSON.parse(content))
        .then((auth) => {
            return listMajors(auth, ssid, range);
        }).then((text) => {
            resolve(text);
        }).catch((err)=>{
            reject(err);
        })
    });
}

 
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials) {
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const auth = new googleAuth();
  const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  return new Promise((resolve, reject) => {
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            getNewToken(oauth2Client, callback);
            reject();
        } else {
            oauth2Client.credentials = JSON.parse(token);
            resolve(oauth2Client);
        }
    });
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({access_type: 'offline', scope: SCOPES});
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Print the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * https://docs.google.com/spreadsheets/d/1GMCx9FcfKk2njOZ7CYjqael0_Uu2-X_7kBFnHcTVoRA/edit#gid=0
 */
function listMajors(auth, ssid, range) {
    const sheets = google.sheets('v4');
    const options = {auth:auth, spreadsheetId:ssid, range:range};
    
    return new Promise((resolve, reject) => {
        sheets.spreadsheets.values.get(options, (err, res) => {
            if (err) {
                reject('The API returned an error: ' + err);
            }
            const rows = res.values;
            //||LT: 未定	|未定 |
            //||LT: 未定	|未定 |
            let text = '';
            for(let i = 0,len=rows.length; i<len; i++){
                const head = (i===0) ? '**スポンサーLT**' : 'LT';
                const newline = (i<len-1) ? '\n' : '\n|21:00	|交流会	|'; 
                rows[i][1] = rows[i][1] ? rows[i][1] : '未定';
                rows[i][2] = rows[i][2] ? rows[i][2] : '未定';
                text += `||${head}: ${rows[i][1]} | ${rows[i][2]} ${newline}`;
            }
            resolve(text);
        });
    });
}