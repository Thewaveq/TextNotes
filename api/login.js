// api/login.js

// Используем надежный 'require' синтаксис
const { kv } = require('@vercel/kv');

module.exports = async (request, response) => {
  // Заголовки, чтобы браузер не блокировал запрос
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Ответ на служебный запрос OPTIONS от браузера
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // Работаем только с POST-запросами
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Метод не разрешен' });
  }

  try {
    const { email } = request.body;
    if (!email) {
      return response.status(400).json({ message: 'Email не был отправлен' });
    }

    const userId = email.toLowerCase();
    
    // Проверяем, есть ли пользователь в базе. Если нет - создаем.
    const userExists = await kv.get(`user:${userId}`);
    if (!userExists) {
      await kv.set(`user:${userId}`, { registeredAt: new Date().toISOString() });
    }

    // Возвращаем на фронтенд JSON с реальным ID пользователя
    return response.status(200).json({ userId: userId });

  } catch (error) {
    // Если что-то пойдет не так при работе с базой, вернем ошибку
    console.error('ОШИБКА РАБОТЫ С KV:', error);
    return response.status(500).json({ 
      message: 'Произошла ошибка при работе с базой данных KV.',
      errorDetails: error.message 
    });
  }
};
