// api/notes.js
import { kv } from '@vercel/kv';

// Вспомогательная функция для генерации уникального ID для заметки
// Используем время в миллисекундах + короткую случайную строку
const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

export default async function handler(request, response) {
    try {
        const { method } = request;

        // === ПОЛУЧЕНИЕ ВСЕХ ЗАМЕТОК (GET) ===
        if (method === 'GET') {
            // userId получаем из параметров URL (например, /api/notes?userId=user@example.com)
            const { userId } = request.query;
            if (!userId) {
                return response.status(400).json({ message: 'userId является обязательным параметром' });
            }

            const notesKey = `notes:${userId}`;
            const notes = await kv.get(notesKey);

            // Если заметок нет, возвращаем пустой массив
            return response.status(200).json(notes || []);
        }

        // === СОЗДАНИЕ НОВОЙ ЗАМЕТКИ (POST) ===
        if (method === 'POST') {
            const { userId, text } = request.body;
            if (!userId || typeof text === 'undefined') {
                return response.status(400).json({ message: 'userId и text являются обязательными' });
            }

            const notesKey = `notes:${userId}`;
            const existingNotes = await kv.get(notesKey) || [];

            const newNote = {
                id: generateId(), // Генерируем уникальный ID
                text: text,
                description: '' // Описание по умолчанию пустое
            };

            const updatedNotes = [...existingNotes, newNote];
            await kv.set(notesKey, updatedNotes);

            // Возвращаем созданную заметку, чтобы фронтенд мог сразу её отобразить
            return response.status(201).json(newNote);
        }
        
        // === ОБНОВЛЕНИЕ ЗАМЕТКИ (PUT) ===
        if (method === 'PUT') {
            const { userId, noteId, text, description } = request.body;
            if (!userId || !noteId || typeof text === 'undefined' || typeof description === 'undefined') {
                return response.status(400).json({ message: 'userId, noteId, text и description обязательны' });
            }

            const notesKey = `notes:${userId}`;
            const notes = await kv.get(notesKey) || [];

            let updatedNote = null;
            const updatedNotes = notes.map(note => {
                if (note.id === noteId) {
                    updatedNote = { ...note, text, description };
                    return updatedNote;
                }
                return note;
            });
            
            // Если заметка с таким ID не была найдена
            if (!updatedNote) {
                return response.status(404).json({ message: 'Заметка не найдена' });
            }

            await kv.set(notesKey, updatedNotes);
            return response.status(200).json(updatedNote);
        }

        // === УДАЛЕНИЕ ЗАМЕТКИ (DELETE) ===
        if (method === 'DELETE') {
            const { userId, noteId } = request.body;
            if (!userId || !noteId) {
                return response.status(400).json({ message: 'userId и noteId обязательны' });
            }

            const notesKey = `notes:${userId}`;
            const notes = await kv.get(notesKey) || [];

            const updatedNotes = notes.filter(note => note.id !== noteId);

            // Проверяем, действительно ли что-то было удалено
            if (notes.length === updatedNotes.length) {
                return response.status(404).json({ message: 'Заметка для удаления не найдена' });
            }

            await kv.set(notesKey, updatedNotes);
            return response.status(200).json({ message: 'Заметка успешно удалена' });
        }

        // Если используется другой метод (не GET, POST, PUT, DELETE)
        response.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return response.status(405).end(`Method ${method} Not Allowed`);

    } catch (error) {
        console.error('Ошибка в api/notes:', error);
        return response.status(500).json({ message: 'Внутренняя серверная ошибка', error: error.message });
    }
}
