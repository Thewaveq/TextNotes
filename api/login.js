// api/login.js

const crypto = require('crypto');

// Вспомогательная функция для шифрования, она не изменилась
const scrypt = (password, salt) => {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex'));
    });
  });
};

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
    const apiUrl = process.env.KV_REST_API_URL;
    const apiToken = process.env.KV_REST_API_TOKEN;

    if (!apiUrl || !apiToken) {
      throw new Error("Сервер не видит переменные окружения для подключения к базе.");
    }
    
    const { email, password } = request.body;
    if (!email || !password) {
      return response.status(400).json({ message: 'Email и пароль обязательны' });
    }
    const userId = email.toLowerCase();
    
    // 1. Ищем пользователя в базе
    const findUserUrl = `${apiUrl}/get/user:${userId}`;
    const userResponse = await fetch(findUserUrl, {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    });
    const userData = await userResponse.json();
    const user = userData.result ? JSON.parse(userData.result) : null;

    // 2. ИСПРАВЛЕННАЯ ЛОГИКА: Если пользователя нет ИЛИ у него нет пароля - это РЕГИСТРАЦИЯ/ОБНОВЛЕНИЕ
    if (!user || !user.hashedPassword) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await scrypt(password, salt);
      const newUser = { salt, hashedPassword };
      
      const saveUserUrl = `${apiUrl}/set/user:${userId}`;
      await fetch(saveUserUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiToken}` },
        body: JSON.stringify(newUser)
      });
      
      return response.status(200).json({ userId: userId });
    }

    // 3. Если пользователь ЕСТЬ и у него ЕСТЬ пароль - это ВХОД
    else {
      // Эта проверка теперь безопасна, потому что мы знаем, что user.salt существует
      const hashedPassword = await scrypt(password, user.salt);
      
      if (hashedPassword === user.hashedPassword) {
        return response.status(200).json({ userId: userId });
      } else {
        return response.status(401).json({ message: 'Неверный пароль' });
      }
    }

  } catch (error) {
    console.error('Критическая ошибка:', error);
    return response.status(500).json({ message: 'Серверная ошибка', error: error.message });
  }
};
