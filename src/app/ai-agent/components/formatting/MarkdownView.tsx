import { h } from '@/core/ui';
import { For } from '@/core/velocity';

interface Props {
    content: string;
}

export function MarkdownView(props: Props) {
    const parts = () => {
        if (!props.content) return [];
        return props.content.split(/(```[\s\S]*?```)/g);
    };

    return (
        <div class="markdown-body space-y-2">
            <For each={parts}>
                {(part) => {
                    if (part.startsWith('```')) {
                        // Code Block
                        const match = part.match(/```(\w+)?\n([\s\S]*?)```/);
                        const lang = match ? match[1] : '';
                        const code = match ? match[2] : part.slice(3, -3);
                        return (
                            <pre class="bg-slate-900 text-slate-50 p-3 rounded-md overflow-x-auto my-2 text-sm">
                                <code>{code}</code>
                            </pre>
                        );
                    } else {
                        // Text - handle inline bold and newlines
                        return <div class="whitespace-pre-wrap">{renderInline(part)}</div>;
                    }
                }}
            </For>
        </div>
    );
}

function renderInline(text: string) {
    // Very simple inline bold parser: **text**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong>{part.slice(2, -2)}</strong>;
        }
        return part;
    });
}
