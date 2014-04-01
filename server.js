var http = require('http');
var fs = require('fs');

http.createServer(function (req, res) {

    fs.readFile('index.html', 'utf8', function (err, data) {
        if (err) {
            res.write('unable to load the requested file');
        }
        else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write(data);
        }
        res.end();
    });
}).listen(process.env.PORT || 8080);
console.log('Server running at http://localhost:8080/');