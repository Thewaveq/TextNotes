// api/login.js

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
    // Получаем URL и ТОКЕН из переменных окружения
    const apiUrl = process.env.KV_REST_API_URL;
    const apiToken = process.env.KV_REST_API_TOKEN;

    // Если ключей нет, то ничего не сработает
    if (!apiUrl || !apiToken) {
      throw new Error("Переменные окружения KV_REST_API_URL или KV_REST_API_TOKEN не найдены.");
    }
    
    const { email } = request.body;
    if (!email) {
      return response.status(400).json({ message: 'Email не был отправлен' });
    }
    const userId = email.toLowerCase();
    
    // Формируем прямой запрос к базе данных Upstash
    const commandUrl = `${apiUrl}/set/user:${userId}`;
    const commandBody = JSON.stringify({ registeredAt: new Date().toISOString() });
    
    // Отправляем команду с помощью встроенного fetch
    const fetchResponse = await fetch(commandUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
      body: commandBody,
    });
    
    // Если база данных вернула ошибку, сообщаем об этом
    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      throw new Error(`Ошибка от базы данных: ${errorText}`);
    }

    // Если всё успешно, отправляем ответ в браузер
    return response.status(200).json({ userId: userId });

  } catch (error) {
    // Если что-то пошло не так, возвращаем полную ошибку
    console.error('ФИНАЛЬНАЯ ОШИБКА:', error);
    return response.status(500).json({ 
      message: 'Сервер упал. Причина:',
      error: error.message,
    });
  }
};
