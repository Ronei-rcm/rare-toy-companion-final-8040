// ==========================================
// 🏷️ ENDPOINTS DE BADGES DE PRODUTOS
// ==========================================

// GET /api/badges - Listar todos os badges disponíveis
app.get('/api/badges', async (req, res) => {
  try {
    console.log('🏷️ Buscando badges...');
    
    const [rows] = await pool.execute(
      'SELECT * FROM product_badges WHERE ativo = 1 ORDER BY ordem ASC'
    );
    
    console.log(`✅ ${rows.length} badges encontrados`);
    res.json(rows);
  } catch (error) {
    console.error('❌ Erro ao buscar badges:', error);
    res.status(500).json({ error: 'Erro ao buscar badges' });
  }
});

// GET /api/produtos/:id/badges - Listar badges de um produto específico
app.get('/api/produtos/:id/badges', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🏷️ Buscando badges do produto ${id}...`);
    
    const [rows] = await pool.execute(
      `SELECT pb.* 
       FROM product_badges pb
       INNER JOIN produto_badge ppb ON pb.id = ppb.badge_id
       WHERE ppb.produto_id = ? AND pb.ativo = 1
       ORDER BY pb.ordem ASC`,
      [id]
    );
    
    console.log(`✅ ${rows.length} badges encontrados para o produto ${id}`);
    res.json(rows);
  } catch (error) {
    console.error(`❌ Erro ao buscar badges do produto:`, error);
    res.status(500).json({ error: 'Erro ao buscar badges do produto' });
  }
});

// POST /api/produtos/:id/badges - Adicionar badge a um produto
app.post('/api/produtos/:id/badges', async (req, res) => {
  try {
    const { id } = req.params;
    const { badge_id } = req.body;
    
    if (!badge_id) {
      return res.status(400).json({ error: 'badge_id é obrigatório' });
    }
    
    console.log(`🏷️ Adicionando badge ${badge_id} ao produto ${id}...`);
    
    await pool.execute(
      'INSERT IGNORE INTO produto_badge (produto_id, badge_id) VALUES (?, ?)',
      [id, badge_id]
    );
    
    console.log(`✅ Badge adicionado ao produto ${id}`);
    res.json({ success: true, message: 'Badge adicionado' });
  } catch (error) {
    console.error(`❌ Erro ao adicionar badge ao produto:`, error);
    res.status(500).json({ error: 'Erro ao adicionar badge' });
  }
});

// DELETE /api/produtos/:id/badges/:badge_id - Remover badge de um produto
app.delete('/api/produtos/:id/badges/:badge_id', async (req, res) => {
  try {
    const { id, badge_id } = req.params;
    
    console.log(`🏷️ Removendo badge ${badge_id} do produto ${id}...`);
    
    await pool.execute(
      'DELETE FROM produto_badge WHERE produto_id = ? AND badge_id = ?',
      [id, badge_id]
    );
    
    console.log(`✅ Badge removido do produto ${id}`);
    res.json({ success: true, message: 'Badge removido' });
  } catch (error) {
    console.error(`❌ Erro ao remover badge do produto:`, error);
    res.status(500).json({ error: 'Erro ao remover badge' });
  }
});

// PUT /api/produtos/:id/condicao - Atualizar condição do produto
app.put('/api/produtos/:id/condicao', async (req, res) => {
  try {
    const { id } = req.params;
    const { condicao } = req.body;
    
    const condicoesValidas = ['novo', 'seminovo', 'colecionavel', 'usado'];
    if (!condicao || !condicoesValidas.includes(condicao)) {
      return res.status(400).json({ 
        error: 'Condição inválida. Use: novo, seminovo, colecionavel ou usado' 
      });
    }
    
    console.log(`🏷️ Atualizando condição do produto ${id} para: ${condicao}...`);
    
    await pool.execute(
      'UPDATE produtos SET condicao = ? WHERE id = ?',
      [condicao, id]
    );
    
    console.log(`✅ Condição do produto ${id} atualizada`);
    res.json({ success: true, message: 'Condição atualizada', condicao });
  } catch (error) {
    console.error(`❌ Erro ao atualizar condição do produto:`, error);
    res.status(500).json({ error: 'Erro ao atualizar condição' });
  }
});

module.exports = app;
