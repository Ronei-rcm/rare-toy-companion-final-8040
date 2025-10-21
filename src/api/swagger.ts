/**
 * Configuração Swagger/OpenAPI para documentação da API
 */

export const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'MuhlStore API',
    description: 'API completa para sistema de e-commerce de brinquedos raros',
    version: '2.0.0',
    contact: {
      name: 'Equipe MuhlStore',
      email: 'dev@muhlstore.com',
      url: 'https://muhlstore.re9suainternet.com.br'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'https://muhlstore.re9suainternet.com.br/api',
      description: 'Servidor de Produção'
    },
    {
      url: 'http://localhost:3000/api',
      description: 'Servidor de Desenvolvimento'
    }
  ],
  tags: [
    {
      name: 'Produtos',
      description: 'Operações relacionadas a produtos'
    },
    {
      name: 'Clientes',
      description: 'Gerenciamento de clientes'
    },
    {
      name: 'Pedidos',
      description: 'Operações de pedidos e vendas'
    },
    {
      name: 'Carrinho',
      description: 'Gerenciamento do carrinho de compras'
    },
    {
      name: 'Pagamentos',
      description: 'Processamento de pagamentos'
    },
    {
      name: 'Fidelidade',
      description: 'Programa de fidelidade e pontos'
    },
    {
      name: 'Marketing',
      description: 'Automação de marketing'
    },
    {
      name: 'Chat',
      description: 'Sistema de chat de suporte'
    },
    {
      name: 'Analytics',
      description: 'Métricas e analytics'
    },
    {
      name: 'Upload',
      description: 'Upload de arquivos e imagens'
    }
  ],
  paths: {
    '/produtos': {
      get: {
        tags: ['Produtos'],
        summary: 'Listar produtos',
        description: 'Retorna uma lista paginada de produtos com filtros opcionais',
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: 'Número da página',
            schema: { type: 'integer', default: 1, minimum: 1 }
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Itens por página',
            schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 }
          },
          {
            name: 'categoria',
            in: 'query',
            description: 'Filtrar por categoria',
            schema: { type: 'string' }
          },
          {
            name: 'preco_min',
            in: 'query',
            description: 'Preço mínimo',
            schema: { type: 'number', minimum: 0 }
          },
          {
            name: 'preco_max',
            in: 'query',
            description: 'Preço máximo',
            schema: { type: 'number', minimum: 0 }
          },
          {
            name: 'busca',
            in: 'query',
            description: 'Termo de busca',
            schema: { type: 'string' }
          },
          {
            name: 'ordenar',
            in: 'query',
            description: 'Campo para ordenação',
            schema: { 
              type: 'string', 
              enum: ['nome', 'preco', 'data_criacao', 'avaliacao', 'vendas'],
              default: 'data_criacao'
            }
          },
          {
            name: 'direcao',
            in: 'query',
            description: 'Direção da ordenação',
            schema: { 
              type: 'string', 
              enum: ['asc', 'desc'],
              default: 'desc'
            }
          }
        ],
        responses: {
          '200': {
            description: 'Lista de produtos retornada com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Produto' }
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                    filters: { $ref: '#/components/schemas/ProductFilters' }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      },
      post: {
        tags: ['Produtos'],
        summary: 'Criar produto',
        description: 'Cria um novo produto no sistema',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProductRequest' }
            }
          }
        },
        responses: {
          '201': {
            description: 'Produto criado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Produto' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    },
    '/produtos/{id}': {
      get: {
        tags: ['Produtos'],
        summary: 'Obter produto por ID',
        description: 'Retorna os detalhes de um produto específico',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID do produto',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Produto encontrado',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Produto' }
                  }
                }
              }
            }
          },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      },
      put: {
        tags: ['Produtos'],
        summary: 'Atualizar produto',
        description: 'Atualiza um produto existente',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID do produto',
            schema: { type: 'string' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProductRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Produto atualizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/Produto' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      },
      delete: {
        tags: ['Produtos'],
        summary: 'Excluir produto',
        description: 'Remove um produto do sistema',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'ID do produto',
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Produto excluído com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    },
    '/upload': {
      post: {
        tags: ['Upload'],
        summary: 'Upload de imagem',
        description: 'Faz upload de uma imagem para o servidor',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Arquivo de imagem'
                  }
                },
                required: ['image']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Upload realizado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    imageUrl: { type: 'string' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '413': {
            description: 'Arquivo muito grande',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    },
    '/pagamentos/processar': {
      post: {
        tags: ['Pagamentos'],
        summary: 'Processar pagamento',
        description: 'Processa um pagamento para um pedido',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PaymentRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Pagamento processado com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/PaymentResponse' }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    },
    '/fidelidade/pontos': {
      post: {
        tags: ['Fidelidade'],
        summary: 'Adicionar pontos',
        description: 'Adiciona pontos a um cliente',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  customerId: { type: 'string' },
                  amount: { type: 'number' },
                  reason: { type: 'string' },
                  description: { type: 'string' },
                  orderId: { type: 'string' }
                },
                required: ['customerId', 'amount', 'reason']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Pontos adicionados com sucesso',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' }
                  }
                }
              }
            }
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    },
    '/chat/conversas': {
      get: {
        tags: ['Chat'],
        summary: 'Listar conversas',
        description: 'Retorna as conversas de um usuário',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'query',
            required: true,
            description: 'ID do usuário',
            schema: { type: 'string' }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filtrar por status',
            schema: { 
              type: 'string',
              enum: ['waiting', 'active', 'resolved', 'closed']
            }
          }
        ],
        responses: {
          '200': {
            description: 'Lista de conversas',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Conversation' }
                    }
                  }
                }
              }
            }
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '500': { $ref: '#/components/responses/InternalServerError' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    },
    schemas: {
      Produto: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          nome: { type: 'string' },
          descricao: { type: 'string' },
          preco: { type: 'number' },
          imagemUrl: { type: 'string' },
          categoria: { type: 'string' },
          estoque: { type: 'integer' },
          status: { 
            type: 'string',
            enum: ['ativo', 'inativo', 'esgotado']
          },
          destaque: { type: 'boolean' },
          promocao: { type: 'boolean' },
          lancamento: { type: 'boolean' },
          avaliacao: { type: 'number' },
          totalAvaliacoes: { type: 'integer' },
          faixaEtaria: { type: 'string' },
          peso: { type: 'string' },
          dimensoes: { type: 'string' },
          material: { type: 'string' },
          marca: { type: 'string' },
          origem: { type: 'string' },
          fornecedor: { type: 'string' },
          codigoBarras: { type: 'string' },
          dataLancamento: { type: 'string', format: 'date' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      CreateProductRequest: {
        type: 'object',
        required: ['nome', 'preco', 'categoria'],
        properties: {
          nome: { type: 'string', minLength: 1, maxLength: 255 },
          descricao: { type: 'string', maxLength: 2000 },
          preco: { type: 'number', minimum: 0 },
          imagemUrl: { type: 'string', format: 'uri' },
          categoria: { type: 'string' },
          estoque: { type: 'integer', minimum: 0, default: 0 },
          status: { 
            type: 'string',
            enum: ['ativo', 'inativo', 'esgotado'],
            default: 'ativo'
          },
          destaque: { type: 'boolean', default: false },
          promocao: { type: 'boolean', default: false },
          lancamento: { type: 'boolean', default: false },
          faixaEtaria: { type: 'string' },
          peso: { type: 'string' },
          dimensoes: { type: 'string' },
          material: { type: 'string' },
          marca: { type: 'string' },
          origem: { type: 'string' },
          fornecedor: { type: 'string' },
          codigoBarras: { type: 'string' },
          dataLancamento: { type: 'string', format: 'date' }
        }
      },
      UpdateProductRequest: {
        type: 'object',
        properties: {
          nome: { type: 'string', minLength: 1, maxLength: 255 },
          descricao: { type: 'string', maxLength: 2000 },
          preco: { type: 'number', minimum: 0 },
          imagemUrl: { type: 'string', format: 'uri' },
          categoria: { type: 'string' },
          estoque: { type: 'integer', minimum: 0 },
          status: { 
            type: 'string',
            enum: ['ativo', 'inativo', 'esgotado']
          },
          destaque: { type: 'boolean' },
          promocao: { type: 'boolean' },
          lancamento: { type: 'boolean' },
          faixaEtaria: { type: 'string' },
          peso: { type: 'string' },
          dimensoes: { type: 'string' },
          material: { type: 'string' },
          marca: { type: 'string' },
          origem: { type: 'string' },
          fornecedor: { type: 'string' },
          codigoBarras: { type: 'string' },
          dataLancamento: { type: 'string', format: 'date' }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          pages: { type: 'integer' },
          hasNext: { type: 'boolean' },
          hasPrev: { type: 'boolean' }
        }
      },
      ProductFilters: {
        type: 'object',
        properties: {
          categories: {
            type: 'array',
            items: { type: 'string' }
          },
          priceRange: {
            type: 'object',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' }
            }
          },
          inStock: { type: 'boolean' },
          onSale: { type: 'boolean' },
          featured: { type: 'boolean' }
        }
      },
      PaymentRequest: {
        type: 'object',
        required: ['amount', 'currency', 'orderId', 'customer', 'paymentMethod'],
        properties: {
          amount: { type: 'number', minimum: 0.01 },
          currency: { type: 'string', default: 'BRL' },
          orderId: { type: 'string' },
          customer: {
            type: 'object',
            required: ['id', 'name', 'email'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              document: { type: 'string' },
              phone: { type: 'string' }
            }
          },
          paymentMethod: { 
            type: 'string',
            enum: ['pix', 'credit_card', 'debit_card', 'boleto']
          },
          billingAddress: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              number: { type: 'string' },
              complement: { type: 'string' },
              neighborhood: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              zipCode: { type: 'string' },
              country: { type: 'string', default: 'BR' }
            }
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                description: { type: 'string' },
                quantity: { type: 'integer', minimum: 1 },
                price: { type: 'number', minimum: 0 },
                category: { type: 'string' }
              }
            }
          }
        }
      },
      PaymentResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          transactionId: { type: 'string' },
          status: { 
            type: 'string',
            enum: ['pending', 'approved', 'rejected', 'cancelled', 'refunded']
          },
          paymentMethod: { type: 'string' },
          amount: { type: 'number' },
          currency: { type: 'string' },
          processingTime: { type: 'number' },
          qrCode: { type: 'string' },
          barcode: { type: 'string' },
          pixKey: { type: 'string' },
          pixCopyPaste: { type: 'string' },
          boletoUrl: { type: 'string' },
          expiresAt: { type: 'string', format: 'date-time' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' }
            }
          }
        }
      },
      Conversation: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          customerId: { type: 'string' },
          agentId: { type: 'string' },
          status: { 
            type: 'string',
            enum: ['waiting', 'active', 'resolved', 'closed']
          },
          priority: { 
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent']
          },
          subject: { type: 'string' },
          category: { 
            type: 'string',
            enum: ['general', 'technical', 'billing', 'sales', 'complaint', 'suggestion']
          },
          tags: {
            type: 'array',
            items: { type: 'string' }
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
          lastMessageAt: { type: 'string', format: 'date-time' },
          messages: {
            type: 'array',
            items: { $ref: '#/components/schemas/Message' }
          },
          satisfaction: {
            type: 'object',
            properties: {
              rating: { type: 'number', minimum: 1, maximum: 5 },
              feedback: { type: 'string' },
              ratedAt: { type: 'string', format: 'date-time' }
            }
          }
        }
      },
      Message: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          conversationId: { type: 'string' },
          senderId: { type: 'string' },
          senderName: { type: 'string' },
          content: { type: 'string' },
          type: { 
            type: 'string',
            enum: ['text', 'image', 'file', 'system', 'ai_suggestion']
          },
          timestamp: { type: 'string', format: 'date-time' },
          isRead: { type: 'boolean' },
          metadata: { type: 'object' }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', default: false },
          error: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'object' },
          code: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      }
    },
    responses: {
      BadRequest: {
        description: 'Requisição inválida',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Unauthorized: {
        description: 'Não autorizado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      Forbidden: {
        description: 'Acesso negado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      NotFound: {
        description: 'Recurso não encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      },
      InternalServerError: {
        description: 'Erro interno do servidor',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' }
          }
        }
      }
    }
  }
};

export default swaggerConfig;
