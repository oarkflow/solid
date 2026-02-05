import { ChatRequest, ChatResponse, AgentConfig, Domain } from '../types';

const BASE_URL = '/chat'; // Using Vite proxy to localhost:8080

export const api = {
    async chat(req: ChatRequest): Promise<ChatResponse> {
        const res = await fetch(`${BASE_URL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req)
        });
        if (!res.ok) throw new Error('Chat request failed');
        return res.json();
    },

    async resetMemory(): Promise<void> {
        await fetch(`/reset`, { method: 'POST' });
    },

    async getConfig(): Promise<AgentConfig> {
        const res = await fetch(`/config`);
        return res.json();
    },

    async saveConfig(config: AgentConfig): Promise<void> {
        await fetch(`/config`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });
    },

    async getDomains(): Promise<Domain[]> {
        // Mock domains if endpoint doesn't exist yet, or fetch from config
        // Assuming config has domains text for now, or use a specific endpoint
        try {
            const res = await fetch(`/config/domains`);
            if (res.ok) return res.json();
        } catch (e) {
            console.warn('Failed to fetch domains, using defaults');
        }
        return [
            { id: 'general', name: 'General', description: 'General assistnat' },
            { id: 'healthcare', name: 'Healthcare', description: 'Medical assistant' },
            { id: 'coding', name: 'Coding', description: 'Programming assistant' }
        ];
    }
};
