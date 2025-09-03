import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  // Здесь будет логика для работы с заметками:
  // 1. Получать userId из запроса
  // 2. По GET-запросу - отдавать заметки из `kv.get(\`notes:${userId}\`)`
  // 3. По POST-запросу - добавлять новую заметку в `kv.set(\`notes:${userId}\`, newNotes)`
  
  return response.status(200).json({ message: 'Здесь будут заметки' });
}