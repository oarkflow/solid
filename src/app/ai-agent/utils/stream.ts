import { Message } from '../types';

export function parseStreamLine(line: string): Message | null {
    if (!line.startsWith('data: ')) return null;
    const jsonStr = line.slice(6);
    if (jsonStr === '[DONE]') return null;

    try {
        const data = JSON.parse(jsonStr);
        if (data.content) {
            return {
                role: 'assistant',
                content: data.content
            };
        }
        return null;
    } catch (e) {
        return null;
    }
}
