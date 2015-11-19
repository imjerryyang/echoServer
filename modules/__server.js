'use strict';

var child          = require('child_process'),
    os             = require('os'),
    cluster        = require('cluster'),
    domain         = require('domain'),
    express        = require('express'),
    http           = require('http');


function globalInit(){

    var numCPUs = os.cpus().length;

    for ( var i = 0; i < numCPUs; i++ ){
        var worker = cluster.fork(); // Spawn Workers
    }

    cluster.on('exit', function(worker) {
        cluster.fork(); // Respawn Dead Worker
    })

}


function serverStart(){

    var app           = express(),
        router        = express.Router();


    app.use('/', router);        //  Pass express router to app

    app.set('port', 1221);   //  listen on port from appConfig in package.json
    app.disable('etag');         //  Disable etag we dont want caching
    app.get('/', function (req, res) {
        res.status(200).send('Hello World!');
    });


    //  Create instance of http.server and pass in express app as middleware
    var server = http.createServer(app).listen( app.get('port') );

    server.on('error', function (error) {
        console.log( "server.on('error') *→", error.stack || error );
    });

    //  Log worker pid, host and port server is listening on
    console.log( ("pid: " + process.pid), "-", ("localhost:" + app.get('port')) );

}



// Log error + trace then exit
var severDomain = domain.create()
severDomain.on('error', function(error) {
    console.log(("serverDomain *→"), error.stack || error )
    process.exit(1)
})


// Log error + trace *without* exiting
var masterDomain = domain.create()
masterDomain.on('error', function(error) {
    console.log(("masterDomain *→"), error.stack || error )
})


//  If *not* master, start instance of ad-server wrapped with error handling domain
//  otherwise start master wrapped in separate error handling domain
var init = cluster.isMaster ? masterDomain.bind( globalInit )
    : severDomain.bind( serverStart );

init();

