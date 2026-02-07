const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/financial/transactions',
    method: 'GET',
    headers: {
        'x-admin-user-id': 'admin-debug' // Mock auth if needed, or rely on server implementation
    }
};

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        try {
            const parsed = JSON.parse(data);
            console.log('Total Transactions:', parsed.total);
            if (parsed.transactions && parsed.transactions.length > 0) {
                console.log('First 3 Transactions Types & Values:');
                parsed.transactions.slice(0, 3).forEach(t => {
                    console.log(`- ID: ${t.id}, Tipo: '${t.tipo}', Valor: ${t.valor} (Type: ${typeof t.valor})`);
                });

                // Analyze unique types
                const types = [...new Set(parsed.transactions.map(t => t.tipo))];
                console.log('Unique Types found:', types);
            } else {
                console.log('No transactions found.');
            }
        } catch (e) {
            console.error('Error parsing JSON:', e.message);
            console.log('Raw Data:', data.substring(0, 500));
        }
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.end();
