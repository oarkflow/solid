import { h } from '@/core/ui';
import { MarkdownView } from '../formatting/MarkdownView';
import { Message } from '../../types';

interface Props {
    message: Message;
}

export function MessageBubble(props: Props) {
    const isUser = () => props.message.role === 'user';

    return (
        <div class={`flex w-full mb-4 ${isUser() ? 'justify-end' : 'justify-start'}`}>
            <div
                class={`
                    max-w-[80%] p-3 rounded-lg
                    ${isUser() ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 shadow-sm rounded-bl-none'}
                `}
            >
                <div class="text-xs opacity-50 mb-1 capitalize">{props.message.role}</div>
                <div class={isUser() ? 'text-white' : 'text-gray-800'}>
                    <MarkdownView content={props.message.content} />
                </div>
            </div>
        </div>
    );
}
