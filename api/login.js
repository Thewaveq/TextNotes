// api/login.js

const { kv } = require('@vercel/kv');

module.exports = async (request, response) => {
  // Стандартные заголовки
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Метод не разрешен' });
  }

  try {
    const { email } = request.body;
    if (!email) {
      return response.status(400).json({ message: 'Email не был отправлен' });
    }
    const userId = email.toLowerCase();
    
    // Попытка выполнить операцию с базой
    await kv.set(`user:${userId}`, { lastLogin: new Date().toISOString() });
    
    return response.status(200).json({ userId: userId });

  } catch (error) {
    // 
    // ЭТО САМАЯ ВАЖНАЯ ЧАСТЬ
    // ЕСЛИ КОД ПАДАЕТ, МЫ ОТПРАВЛЯЕМ НАЗАД В БРАУЗЕР ПОЛНОЕ СООБЩЕНИЕ ОБ ОШИБКЕ
    //
    console.error('КРИТИЧЕСКАЯ ОШИБКА, КОТОРУЮ МЫ ЛОВИМ:', error);
    return response.status(500).json({ 
      message: 'Сервер упал. Вот настоящая причина:',
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack, // Это покажет нам, где именно в коде произошел сбой
    });
  }
};
