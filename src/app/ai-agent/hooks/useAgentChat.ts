import { createSignal, createMemo } from '@/core/velocity';
import { api } from '../services/api';
import { Message, ChatRequest } from '../types';

export function useAgentChat() {
    const [messages, setMessages] = createSignal<Message[]>([]);
    const [isLoading, setIsLoading] = createSignal(false);
    const [streamingContent, setStreamingContent] = createSignal('');
    const [domain, setDomain] = createSignal('general');
    const [stateless, setStateless] = createSignal(false);

    const addMessage = (msg: Message) => {
        setMessages([...messages(), msg]);
    };

    const sendMessage = async (content: string) => {
        if (!content.trim()) return;

        const userMsg: Message = { role: 'user', content, timestamp: Date.now() };
        addMessage(userMsg);
        setIsLoading(true);
        setStreamingContent('');

        try {
            // Start Stream
            const response = await fetch('/chat/stream', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: content,
                    domain: domain()
                })
            });

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiText = '';

            // Create placeholder message if not exists?
            // Actually we render streamingContent separately or as a temp message.

            while (true) {
                const { done, value } = await reader.read();
                console.log('Received chunk:', { done, value });
                if (done) break;
                console.log('Chunk value:', value);
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.content) {
                                aiText += data.content;
                                setStreamingContent(aiText);
                            }
                        } catch (e) {
                            // ignore parse errors for partial lines
                        }
                    }
                }
            }

            // Finalize
            addMessage({ role: 'assistant', content: aiText, timestamp: Date.now() });
            setStreamingContent('');

        } catch (error) {
            console.error(error);
            addMessage({ role: 'assistant', content: 'Error generating response.' });
        } finally {
            setIsLoading(false);
        }
    };

    const reset = async () => {
        await api.resetMemory();
        setMessages([]);
    };

    return {
        messages,
        streamingContent,
        isLoading,
        sendMessage,
        reset,
        domain,
        setDomain,
        stateless,
        setStateless
    };
}
