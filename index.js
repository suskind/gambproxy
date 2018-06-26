const http = require('http');
const request = require('request');

const argv = require('minimist')(process.argv.slice(2));

const config = {
    port: argv.port || 1337,
    host: argv.host || '0.0.0.0',
    cors: argv.cors || false,
    debug: argv.debug || false,
    url: ('url' in argv) ? argv.url : null
};


function howToUse(err) {
    const str = `
        Use: 
        ${process.argv[0]} ${process.argv[1]} --url='https://example.com' (without slash in the end)

        Other options:
        --cors - force CORS (Access-Control-Allow-Origin: '*') or use if it cames from the server
        --port - port where the proxy should run (default: 1337)
        --host - host where the proxy should run (default: 0.0.0.0)
        --debug - print what is being asked and response body
        -h/--help - print this message
    `;
    console.log(str);
    if (err) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

const proxy = http.createServer((req, res) => {
    const method = req.method;
    req.pipe(request[method.toLowerCase()](`${argv.url}${req.url}`, (error, resGet, body) => {
        if (error) {
            console.log('Error on get :: ', error);
            res.writeHeader(500, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'});
            res.end('{"error":true,"status":500}');
            return;
        }

        const headers = Object.assign({}, resGet.headers);
        if (config.cors) {
            headers['Access-Control-Allow-Origin'] = '*';
        }
        if (config.debug) {
            console.log(`Asking for: ${method.toUpperCase()} ${config.url}${req.url}`);
            console.log(`Response: \n ${body}`);
        }
        res.writeHead(resGet.statusCode, headers);
        res.end(body);
    }));
});


if (!config.url) {
   howToUse(true); 
}

if ('h' in argv || 'help' in argv) {
    howToUse(false);
}
proxy.listen(config.port, config.host, () => {
    console.log(`Running at ${config.host}:${config.port}... `);
});

