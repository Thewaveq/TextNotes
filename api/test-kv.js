// api/test-kv.js

import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  try {
    // 1. Пытаемся записать тестовое значение
    await kv.set('hello', 'world');

    // 2. Пытаемся прочитать это значение
    const value = await kv.get('hello');

    // 3. Если значение прочитано и оно правильное, отправляем ответ OK
    if (value === 'world') {
      return response.status(200).json({ 
          status: "OK", 
          message: "Успешно записали и прочитали из KV хранилища. Всё подключено!" 
      });
    } else {
      throw new Error('Прочитанное значение не совпадает с записанным.');
    }

  } catch (error) {
    // Если произошла любая ошибка, значит подключение не работает
    console.error(error);
    return response.status(500).json({ 
        status: "ERROR", 
        message: "Не удалось подключиться к KV хранилищу.",
        error: error.message
    });
  }
}
