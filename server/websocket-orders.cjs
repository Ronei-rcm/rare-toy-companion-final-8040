// WebSocket para sincronização de pedidos em tempo real
const { Server } = require('socket.io');
const http = require('http');

let io = null;

const setupOrderWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    path: '/ws/orders'
  });

  io.on('connection', (socket) => {
    console.log('🔌 Cliente conectado ao sistema de pedidos:', socket.id);
    
    // Cliente se junta à sala do seu email
    socket.on('join_customer_room', (email) => {
      socket.join(`customer_${email}`);
      console.log(`👤 Cliente ${email} entrou na sala`);
      
      // Enviar confirmação
      socket.emit('joined_room', { room: `customer_${email}` });
    });
    
    // Admin se junta à sala de admin
    socket.on('join_admin_room', () => {
      socket.join('admin_room');
      console.log('👨‍💼 Admin entrou na sala');
      
      // Enviar confirmação
      socket.emit('joined_room', { room: 'admin_room' });
    });
    
    // Escutar atualizações de status
    socket.on('order_status_update', (data) => {
      console.log('📦 Atualização de status recebida:', data);
      
      // Broadcast para todos os admins
      socket.to('admin_room').emit('order_status_updated', data);
      
      // Notificar cliente específico se logado
      if (data.customer_email) {
        socket.to(`customer_${data.customer_email}`).emit('order_updated', {
          order_id: data.order_id,
          status: data.new_status,
          message: `Seu pedido #${data.order_id.substring(0, 8)} foi atualizado para: ${data.new_status}`
        });
      }
    });
    
    // Escutar comentários
    socket.on('order_comment_added', (data) => {
      console.log('💬 Comentário adicionado:', data);
      
      // Broadcast para admins
      socket.to('admin_room').emit('order_comment_added', data);
    });
    
    // Ping/Pong para manter conexão
    socket.on('ping', () => {
      socket.emit('pong');
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 Cliente desconectado:', socket.id, 'Motivo:', reason);
    });
    
    // Tratamento de erros
    socket.on('error', (error) => {
      console.error('❌ Erro WebSocket:', error);
    });
  });

  // Middleware para autenticação (opcional)
  io.use((socket, next) => {
    // Aqui você pode implementar autenticação JWT ou similar
    // Por enquanto, permitir todas as conexões
    next();
  });

  console.log('🚀 WebSocket de pedidos configurado');
  return io;
};

// Função para emitir eventos de pedidos
const emitOrderUpdate = (orderId, status, customerEmail, notes = null) => {
  if (io) {
    const data = {
      order_id: orderId,
      old_status: null, // Será preenchido pelo backend
      new_status: status,
      customer_email: customerEmail,
      notes: notes,
      timestamp: new Date().toISOString()
    };
    
    // Notificar admins
    io.to('admin_room').emit('order_status_updated', data);
    
    // Notificar cliente específico
    if (customerEmail) {
      io.to(`customer_${customerEmail}`).emit('order_updated', {
        order_id: orderId,
        status: status,
        message: `Seu pedido #${orderId.substring(0, 8)} foi atualizado para: ${status}`
      });
    }
    
    console.log('📡 Evento de pedido emitido:', data);
  }
};

const emitOrderComment = (orderId, comment, isInternal = false) => {
  if (io) {
    const data = {
      order_id: orderId,
      comment: comment,
      is_internal: isInternal,
      timestamp: new Date().toISOString()
    };
    
    // Notificar admins
    io.to('admin_room').emit('order_comment_added', data);
    
    console.log('💬 Evento de comentário emitido:', data);
  }
};

// Função para obter estatísticas de conexões
const getConnectionStats = () => {
  if (!io) return null;
  
  const adminSockets = io.sockets.adapter.rooms.get('admin_room')?.size || 0;
  const customerSockets = io.sockets.sockets.size - adminSockets;
  
  return {
    total_connections: io.sockets.sockets.size,
    admin_connections: adminSockets,
    customer_connections: customerSockets,
    rooms: Array.from(io.sockets.adapter.rooms.keys())
  };
};

module.exports = {
  setupOrderWebSocket,
  emitOrderUpdate,
  emitOrderComment,
  getConnectionStats
};

