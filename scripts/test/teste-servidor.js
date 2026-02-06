const express = require('express');
const app = express();

app.use(express.json());

app.post('/api/teste', (req, res) => {
  console.log('🚨 TESTE: Endpoint chamado!');
  console.log('🚨 Body:', req.body);
  res.json({ success: true, message: 'Teste funcionando!' });
});

app.listen(3002, () => {
  console.log('🚨 Servidor de teste rodando na porta 3002');
});
