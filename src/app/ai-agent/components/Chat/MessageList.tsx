import { h } from '@/core/ui';
import { MessageBubble } from './MessageBubble';
import { Message } from '../../types';
import { createEffect, For, Show } from '@/core/velocity';

interface Props {
    messages: () => Message[];
    streamingContent: () => string;
}

export function MessageList(props: Props) {
    let bottomRef: HTMLDivElement | undefined;

    // Auto-scroll effect
    createEffect(() => {
        // dep dependence
        const _ = props.messages().length;
        const __ = props.streamingContent().length;
        if (bottomRef) {
            bottomRef.scrollIntoView({ behavior: 'smooth' });
        }
    });

    return (
        <div class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            <For each={props.messages}>
                {(msg) => <MessageBubble message={msg} />}
            </For>

            <Show when={() => props.streamingContent()}>
                {(content) => (
                    <MessageBubble
                        message={{
                            role: 'assistant',
                            content: content,
                            id: 'streaming'
                        }}
                    />
                )}
            </Show>

            <div ref={bottomRef} />
        </div>
    );
}
