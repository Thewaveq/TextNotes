// Импортируем клиент для работы с Vercel KV
import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  // Разрешаем CORS, чтобы фронтенд мог обращаться к API
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
      return response.status(400).json({ message: 'Email обязателен' });
    }

    // Используем email в нижнем регистре как уникальный ключ (ID) пользователя
    const userId = email.toLowerCase();
    
    // Проверяем, существует ли уже пользователь с таким ID
    const userExists = await kv.get(`user:${userId}`);

    // Если пользователя нет, создаем его (в нашем случае просто сохраняем ID)
    if (!userExists) {
      await kv.set(`user:${userId}`, { registeredAt: new Date().toISOString() });
    }

    // Возвращаем ID пользователя на клиент
    return response.status(200).json({ userId: userId });

  } catch (error) {
    console.error(error);
    return response.status(500).json({ message: 'Внутренняя ошибка сервера' });
  }
}