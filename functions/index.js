const functions = require('firebase-functions');
exports.api = functions.https.onRequest((req, res) => { res.send('Hello from Firebase Function!'); });
