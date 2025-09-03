// api/login.js

// Мы даже не будем пытаться импортировать KV, пока не проверим переменные
const { kv } = require('@vercel/kv');

module.exports = async (request, response) => {
  // Стандартные заголовки CORS
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Метод не разрешен' });
  }

  // --- ДИАГНОСТИЧЕСКИЙ БЛОК ---
  // Проверяем, видит ли функция переменные окружения, необходимые для KV.
  const diagnostics = {
    has_KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    has_KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    has_KV_URL: !!process.env.KV_URL,
    // Также проверим стандартную переменную Vercel, чтобы убедиться, что окружение вообще работает
    vercel_region: process.env.VERCEL_REGION || 'не определен'
  };

  // Если хотя бы одной ключевой переменной нет, сразу возвращаем ошибку с диагностикой
  if (!diagnostics.has_KV_REST_API_URL || !diagnostics.has_KV_REST_API_TOKEN) {
    return response.status(500).json({
      message: "КРИТИЧЕСКАЯ ОШИБКА: Серверная функция не видит переменные окружения для подключения к KV.",
      diagnostics: diagnostics
    });
  }
  // --- КОНЕЦ ДИАГНОСТИЧЕСКОГО БЛОКА ---

  try {
    const { email } = request.body;
    if (!email) {
      return response.status(400).json({ message: 'Email не был отправлен' });
    }

    const userId = email.toLowerCase();
    await kv.set(`user:${userId}`, { lastLogin: new Date().toISOString() });
    
    return response.status(200).json({ userId: userId });

  } catch (error) {
    // Если мы дошли сюда, значит переменные есть, но ошибка в самом коде работы с KV
    console.error('ОШИБКА РАБОТЫ С KV:', error);
    return response.status(500).json({ 
      message: 'Переменные окружения найдены, но произошла ошибка при работе с KV.',
      errorDetails: error.message,
      diagnostics: diagnostics // Прикрепляем диагностику и сюда
    });
  }
};
