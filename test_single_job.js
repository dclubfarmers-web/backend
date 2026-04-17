const http = require('http');

const id = '0438186a-b64e-4106-82f2-688889a1ec55';
http.get(`http://localhost:5000/api/jobs/${id}`, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        console.log('Status code:', res.statusCode);
        console.log('Response:', data);
    });
}).on('error', (err) => {
    console.error('Error connecting to local server:', err.message);
});
