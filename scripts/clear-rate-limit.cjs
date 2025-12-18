#!/usr/bin/env node
/**
 * Script para limpar rate limits de criação de conta
 * Uso: node scripts/clear-rate-limit.cjs [IP]
 */

require('dotenv').config();
const Redis = require('ioredis');

async function clearRateLimit(ipAddress = null) {
  let redisClient = null;
  
  try {
    // Tentar conectar ao Redis se configurado
    if (process.env.REDIS_HOST) {
      redisClient = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
      });
      
      console.log('✅ Conectado ao Redis');
      
      // O express-rate-limit usa chaves no formato: 
      // "rl:{key}:{identifier}" ou similar
      // Para criar conta, geralmente usa o IP como identificador
      
      if (ipAddress) {
        // Limpar rate limit de um IP específico
        const pattern = `rl:*:${ipAddress}*`;
        const keys = await redisClient.keys(pattern);
        
        if (keys.length > 0) {
          await redisClient.del(...keys);
          console.log(`✅ Limpou ${keys.length} chave(s) de rate limit para IP: ${ipAddress}`);
          keys.forEach(key => console.log(`   - ${key}`));
        } else {
          console.log(`⚠️ Nenhuma chave de rate limit encontrada para IP: ${ipAddress}`);
        }
      } else {
        // Limpar TODAS as chaves de rate limit de criação de conta
        const pattern = `rl:*register*`;
        const allKeys = await redisClient.keys(pattern);
        
        if (allKeys.length > 0) {
          await redisClient.del(...allKeys);
          console.log(`✅ Limpou ${allKeys.length} chave(s) de rate limit de registro`);
        } else {
          console.log('⚠️ Nenhuma chave de rate limit de registro encontrada');
        }
        
        // Também tentar padrões alternativos
        const altPatterns = [
          `rl:*create*account*`,
          `rl:*account*`,
        ];
        
        for (const pattern of altPatterns) {
          const keys = await redisClient.keys(pattern);
          if (keys.length > 0) {
            await redisClient.del(...keys);
            console.log(`✅ Limpou ${keys.length} chave(s) com padrão: ${pattern}`);
          }
        }
      }
      
      await redisClient.quit();
    } else {
      console.log('⚠️ Redis não configurado. Rate limits estão em memória.');
      console.log('   Reinicie o servidor para limpar rate limits em memória:');
      console.log('   pm2 restart api');
    }
  } catch (error) {
    console.error('❌ Erro ao limpar rate limits:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Redis não está rodando ou não está configurado.');
      console.log('   O rate limit está sendo armazenado em memória.');
      console.log('   Reinicie o servidor para limpar: pm2 restart api');
    }
    
    process.exit(1);
  }
}

// Executar
const ipAddress = process.argv[2] || null;

if (ipAddress) {
  console.log(`🔍 Limpando rate limits para IP: ${ipAddress}\n`);
} else {
  console.log('🔍 Limpando TODOS os rate limits de registro\n');
  console.log('💡 Para limpar um IP específico, use:');
  console.log('   node scripts/clear-rate-limit.cjs 177.67.32.65\n');
}

clearRateLimit(ipAddress)
  .then(() => {
    console.log('\n✅ Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro:', error);
    process.exit(1);
  });

