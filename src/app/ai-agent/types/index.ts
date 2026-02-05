export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: number;
    id?: string;
}

export interface ChatRequest {
    prompt: string;
    domain?: string;
    stateless?: boolean;
}

export interface ChatResponse {
    response: string;
    model: string;
    usage?: any;
    duration?: string;
}

export interface StreamChunk {
    content?: string;
    finish_reason?: string;
    error?: string;
}

export interface AgentConfig {
    providers: Record<string, any>;
    routing: any;
    generation: any;
    // Add more as needed
}

export type Domain = {
    id: string;
    name: string;
    description: string;
};
