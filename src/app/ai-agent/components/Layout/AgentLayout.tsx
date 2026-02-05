import { h, createSignal } from '@/core/velocity';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAgentChat } from '../../hooks/useAgentChat';
import { ChatWindow } from '../Chat/ChatWindow';
import { ConfigDashboard } from '../Config/ConfigDashboard';

export function AgentLayout() {
    const {
        messages,
        streamingContent,
        isLoading,
        sendMessage,
        reset,
        domain,
        setDomain,
        stateless,
        setStateless
    } = useAgentChat();

    const [showSidebar, setShowSidebar] = createSignal(false);
    const [showConfig, setShowConfig] = createSignal(false);

    return (
        <div class="flex w-full bg-gray-50 overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            <div
                class={`fixed inset-0 bg-black/50 z-20 lg:hidden ${showSidebar() ? 'block' : 'hidden'}`}
                onClick={() => setShowSidebar(false)}
            />

            {/* Sidebar */}
            <div class={`
                fixed inset-y-0 left-0 z-30 transform transition-transform duration-200 lg:relative lg:translate-x-0
                ${showSidebar() ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <Sidebar
                    domain={domain()}
                    setDomain={setDomain}
                    stateless={stateless()}
                    setStateless={setStateless}
                    onReset={reset}
                    onToggleDashboard={() => setShowConfig(!showConfig())}
                />
            </div>

            {/* Main Content */}
            <div class="flex-1 flex flex-col min-w-0">
                <Header onToggleSidebar={() => setShowSidebar(true)} />

                <main class="flex-1 relative overflow-hidden flex flex-col">
                    {() => showConfig() ? (
                        <div class="flex-1 overflow-auto bg-white m-4 rounded-lg shadow-sm">
                            <ConfigDashboard />
                        </div>
                    ) : (
                        <ChatWindow
                            messages={messages}
                            streamingContent={streamingContent}
                            isLoading={isLoading}
                            onSend={sendMessage}
                        />
                    )}
                </main>
            </div>
        </div>
    );
}
