// api/login.js

module.exports = async (request, response) => {
  // Стандартные заголовки
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // Создаем объект с диагностикой
  const diagnostics = {
    // !! перед переменной превращает ее в true (если она есть) или false (если ее нет)
    KV_URL_EXISTS: !!process.env.KV_URL,
    KV_REST_API_URL_EXISTS: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN_EXISTS: !!process.env.KV_REST_API_TOKEN,
    VERCEL_REGION: process.env.VERCEL_REGION || "NOT FOUND"
  };

  // Отправляем этот объект на фронтенд как успешный ответ
  // Код 200 означает "ВСЕ ХОРОШО", даже если переменные не найдены
  return response.status(200).json({
    message: "Это диагностический ответ от сервера.",
    variables: diagnostics
  });
};
