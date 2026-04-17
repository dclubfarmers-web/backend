const http = require('http');

http.get('http://localhost:5000/api/jobs', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Status code:', res.statusCode);
        console.log('Response:', data);
    });
}).on('error', (err) => {
    console.error('Error connecting to local server:', err.message);
});
