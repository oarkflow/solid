import { createSignal } from '@/core/velocity';
import { Button, Input } from '@/core/ui';

interface Props {
    onSend: (text: string) => void;
    isLoading: () => boolean;
}

export function ChatInput(props: Props) {
    const [text, setText] = createSignal('');

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        if (!text().trim() || props.isLoading()) return;
        props.onSend(text());
        setText('');
    };

    return (
        <div class="p-4 border-t border-gray-200 bg-white">
            <form onSubmit={handleSubmit} class="flex gap-2">
                <div class="flex-1">
                    <Input
                        value={text()}
                        onInput={(e: any) => setText(e.target.value)}
                        placeholder="Type a message..."
                        disabled={props.isLoading()}
                        className="w-full"
                    />
                </div>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={() => props.isLoading() || !text().trim()}
                >
                    {() => props.isLoading() ? 'Sending...' : 'Send'}
                </Button>
            </form>
        </div>
    );
}
