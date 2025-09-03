// api/login.js

// Используем require вместо import - это надежнее для серверных функций
const { kv } = require('@vercel/kv');

module.exports = async (request, response) => {
  // Устанавливаем заголовки для CORS, чтобы браузер не ругался
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Vercel иногда отправляет предварительный запрос OPTIONS
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // Наша логика работает только для POST запросов
  if (request.method !== 'POST') {
    return response.status(405).json({ message: 'Метод не разрешен' });
  }

  try {
    // Проверяем, что тело запроса не пустое
    if (!request.body || !request.body.email) {
      return response.status(400).json({ message: 'Email не был отправлен в теле запроса' });
    }

    const { email } = request.body;
    const userId = email.toLowerCase();
    
    // Пытаемся получить данные о пользователе из KV хранилища
    const userExists = await kv.get(`user:${userId}`);

    // Если пользователя нет, создаем запись о нем
    if (!userExists) {
      await kv.set(`user:${userId}`, { registeredAt: new Date().toISOString() });
    }

    // Возвращаем успешный ответ в формате JSON
    return response.status(200).json({ userId: userId });

  } catch (error) {
    // ЕСЛИ ЧТО-ТО ПОЙДЕТ НЕ ТАК - мы отправим ошибку в правильном JSON формате
    console.error('КРИТИЧЕСКАЯ ОШИБКА:', error);
    return response.status(500).json({ 
      message: 'Внутренняя ошибка сервера. Вероятно, проблема с подключением к KV.',
      errorDetails: error.message 
    });
  }
};
