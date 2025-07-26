// Test simple du serveur MCP
const http = require('http');

// Test de la route health du MCP
const options = {
  hostname: 'localhost',
  port: 3001, // Port par défaut NestJS
  path: '/mcp/health',
  method: 'GET'
};

console.log('🧪 Test MCP Server Health...');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Status:', res.statusCode);
    console.log('📊 Response:', data);
  });
});

req.on('error', (error) => {
  console.log('❌ Error:', error.message);
});

req.end();