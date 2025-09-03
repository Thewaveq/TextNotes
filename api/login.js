// api/login.js

// Подключаем библиотеку для шифрования, которую Vercel для нас установит
const bcrypt = require('bcryptjs');

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
    // Получаем URL и ТОКЕН, как и раньше
    const apiUrl = process.env.KV_REST_API_URL;
    const apiToken = process.env.KV_REST_API_TOKEN;

    if (!apiUrl || !apiToken) {
      throw new Error("Сервер не видит переменные окружения для подключения к базе.");
    }
    
    // Теперь получаем и email, и пароль от фронтенда
    const { email, password } = request.body;
    if (!email || !password) {
      return response.status(400).json({ message: 'Email и пароль обязательны' });
    }
    const userId = email.toLowerCase();
    
    // --- ОСНОВНАЯ ЛОГИКА ---

    // 1. Ищем пользователя в базе
    const findUserUrl = `${apiUrl}/get/user:${userId}`;
    const userResponse = await fetch(findUserUrl, {
      headers: { 'Authorization': `Bearer ${apiToken}` }
    });
    const userData = await userResponse.json();
    const user = userData.result ? JSON.parse(userData.result) : null;

    // 2. Если пользователя НЕТ - это РЕГИСТРАЦИЯ
    if (!user) {
      // Шифруем пароль
      const hashedPassword = await bcrypt.hash(password, 10); // 10 - сложность шифрования
      
      // Сохраняем нового пользователя с зашифрованным паролем
      const saveUserUrl = `${apiUrl}/set/user:${userId}`;
      await fetch(saveUserUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiToken}` },
        body: JSON.stringify({ hashedPassword: hashedPassword })
      });
      
      // Сразу логиним его
      return response.status(200).json({ userId: userId });
    }

    // 3. Если пользователь ЕСТЬ - это ВХОД
    else {
      // Сравниваем пароль, который ввел пользователь, с зашифрованным паролем из базы
      const isPasswordCorrect = await bcrypt.compare(password, user.hashedPassword);
      
      if (isPasswordCorrect) {
        // Если пароли совпали - впускаем
        return response.status(200).json({ userId: userId });
      } else {
        // Если нет - возвращаем ошибку "Неавторизован"
        return response.status(401).json({ message: 'Неверный пароль' });
      }
    }

  } catch (error) {
    console.error('Критическая ошибка:', error);
    return response.status(500).json({ message: 'Серверная ошибка', error: error.message });
  }
};
