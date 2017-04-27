const express = require('express');  
const request = require('superagent');  
const redis = require('redis');  

const PORT = process.env.PORT || 1729;
const REDIS_PORT = process.env.REDIS_PORT || 32768;

const app = express();
const client = redis.createClient(REDIS_PORT);

function respond(org, numberOfRepos) {  
    return `Organization "${org}" has ${numberOfRepos} public repositories.`;
}

function getNumberOfRepos(req, res, next) {  
    const org = req.query.org;
   request.get(`https://api.github.com/orgs/${org}/repos`, function (err, response) {
        if (err) throw err;

        // response.body contains an array of public repositories
        var repoNumber = response.body.length;
        client.setex(org, 50, repoNumber);  
        res.send(respond(org, repoNumber));
    });
};

function cache(req, res, next) {  
    const org = req.query.org;
    client.get(org, function (err, data) {
        if (err) throw err;

        if (data != null) {
        	console.log("cached");
            res.send(respond(org, data));
        } else {
            next();
        }
    });
}

app.get('/repos', cache ,getNumberOfRepos);

app.listen(PORT, function () {  
    console.log('app listening on port', PORT);
});