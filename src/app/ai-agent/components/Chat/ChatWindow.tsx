import { h } from '@/core/ui';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { Message } from '../../types';

interface Props {
    messages: () => Message[];
    streamingContent: () => string;
    isLoading: () => boolean;
    onSend: (text: string) => void;
}

export function ChatWindow(props: Props) {
    return (
        <div class="flex flex-col h-full">
            <MessageList
                messages={props.messages}
                streamingContent={props.streamingContent}
            />
            <ChatInput
                onSend={props.onSend}
                isLoading={props.isLoading}
            />
        </div>
    );
}
