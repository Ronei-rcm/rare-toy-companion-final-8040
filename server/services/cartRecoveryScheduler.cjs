const cron = require('node-cron');
const emailService = require('./emailService.cjs');

class CartRecoveryScheduler {
  constructor() {
    this.isRunning = false;
    this.scheduledTasks = new Map();
  }

  // Iniciar o agendador
  start() {
    if (this.isRunning) {
      console.log('⚠️ Cart Recovery Scheduler já está rodando');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Cart Recovery Scheduler iniciado');

    // Executar a cada 30 minutos
    const task = cron.schedule('*/30 * * * *', async () => {
      await this.processAbandonedCarts();
    }, {
      scheduled: false
    });

    this.scheduledTasks.set('abandonedCarts', task);
    task.start();

    // Executar imediatamente na inicialização
    this.processAbandonedCarts();
  }

  // Parar o agendador
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Cart Recovery Scheduler não está rodando');
      return;
    }

    this.scheduledTasks.forEach((task, name) => {
      task.stop();
      console.log(`🛑 Tarefa ${name} parada`);
    });

    this.scheduledTasks.clear();
    this.isRunning = false;
    console.log('🛑 Cart Recovery Scheduler parado');
  }

  // Processar carrinhos abandonados
  async processAbandonedCarts() {
    try {
      console.log('🔍 Verificando carrinhos abandonados...');
      
      // Simular busca de carrinhos abandonados
      // Em produção, isso viria do banco de dados
      const abandonedCarts = await this.getAbandonedCarts();
      
      if (abandonedCarts.length === 0) {
        console.log('✅ Nenhum carrinho abandonado encontrado');
        return;
      }

      console.log(`📧 Processando ${abandonedCarts.length} carrinhos abandonados`);

      for (const cart of abandonedCarts) {
        await this.sendRecoveryEmail(cart);
        
        // Pequena pausa entre e-mails para evitar spam
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('✅ Processamento de carrinhos abandonados concluído');
    } catch (error) {
      console.error('❌ Erro ao processar carrinhos abandonados:', error);
    }
  }

  // Buscar carrinhos abandonados (simulado)
  async getAbandonedCarts() {
    // Em produção, isso seria uma query no banco de dados
    // Por enquanto, retornamos dados simulados
    return [
      {
        id: 'cart_1',
        customerEmail: 'cliente1@email.com',
        customerName: 'João Silva',
        items: [
          {
            id: 'prod_1',
            nome: 'Carrinho de Controle',
            preco: 35.00,
            quantidade: 1,
            imagemUrl: 'https://exemplo.com/produto1.jpg'
          }
        ],
        totalValue: 35.00,
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        recoveryEmailsSent: 0
      },
      {
        id: 'cart_2',
        customerEmail: 'cliente2@email.com',
        customerName: 'Maria Santos',
        items: [
          {
            id: 'prod_2',
            nome: 'Livro Rei Leão',
            preco: 34.00,
            quantidade: 2,
            imagemUrl: 'https://exemplo.com/produto2.jpg'
          }
        ],
        totalValue: 68.00,
        lastActivity: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 horas atrás
        recoveryEmailsSent: 0
      }
    ];
  }

  // Enviar e-mail de recuperação
  async sendRecoveryEmail(cart) {
    try {
      // Verificar se já foi enviado e-mail de recuperação
      if (cart.recoveryEmailsSent > 0) {
        console.log(`⏭️ E-mail de recuperação já enviado para carrinho ${cart.id}`);
        return;
      }

      // Verificar tempo de abandono (mínimo 1 hora)
      const hoursAbandoned = (Date.now() - cart.lastActivity.getTime()) / (1000 * 60 * 60);
      if (hoursAbandoned < 1) {
        console.log(`⏰ Carrinho ${cart.id} abandonado há ${hoursAbandoned.toFixed(1)}h - muito recente`);
        return;
      }

      // Gerar código de desconto
      const discountCode = this.generateDiscountCode();

      // Enviar e-mail
      const result = await emailService.sendCartRecovery({
        to: cart.customerEmail,
        customerName: cart.customerName,
        cartItems: cart.items,
        totalValue: cart.totalValue,
        discountCode
      });

      if (result.success) {
        console.log(`✅ E-mail de recuperação enviado para ${cart.customerEmail}`);
        
        // Marcar como enviado (em produção, salvar no banco)
        cart.recoveryEmailsSent = 1;
        
        // Log da ação
        console.log(`📊 Carrinho ${cart.id}: ${cart.items.length} itens, R$ ${cart.totalValue}, código: ${discountCode}`);
      } else {
        console.error(`❌ Erro ao enviar e-mail para ${cart.customerEmail}:`, result.error);
      }
    } catch (error) {
      console.error(`❌ Erro ao processar carrinho ${cart.id}:`, error);
    }
  }

  // Gerar código de desconto
  generateDiscountCode() {
    const prefix = 'RECUPERA';
    const suffix = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}${suffix}`;
  }

  // Estatísticas do agendador
  getStats() {
    return {
      isRunning: this.isRunning,
      activeTasks: this.scheduledTasks.size,
      tasks: Array.from(this.scheduledTasks.keys())
    };
  }
}

module.exports = new CartRecoveryScheduler();
