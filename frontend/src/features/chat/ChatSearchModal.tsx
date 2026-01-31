import React, { useState, useEffect, useRef } from 'react';
import type { ChatSession } from '../../types';

interface ChatSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessions: ChatSession[];
    onSelectSession: (sessionId: string) => void;
}

interface SearchResult {
    session: ChatSession;
    matchedInTitle: boolean;
    matchedMessages: Array<{
        messageId: string;
        snippet: string;
        field: 'text' | 'originalPrompt' | 'optimizedPrompt' | 'explanation' | 'imagePrompt';
    }>;
}

const ChatSearchModal: React.FC<ChatSearchModalProps> = ({
    isOpen,
    onClose,
    sessions,
    onSelectSession,
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        } else {
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const searchQuery = query.toLowerCase();
        const searchResults: SearchResult[] = [];

        sessions.forEach((session) => {
            const matchedMessages: SearchResult['matchedMessages'] = [];
            let matchedInTitle = false;

            // Tìm trong title
            if (session.title.toLowerCase().includes(searchQuery)) {
                matchedInTitle = true;
            }

            // Tìm trong messages
            session.messages.forEach((msg) => {
                const fields = [
                    { key: 'text' as const, value: msg.text },
                    { key: 'originalPrompt' as const, value: msg.originalPrompt },
                    { key: 'optimizedPrompt' as const, value: msg.optimizedPrompt },
                    { key: 'explanation' as const, value: msg.explanation },
                    { key: 'imagePrompt' as const, value: msg.imagePrompt },
                ];

                fields.forEach(({ key, value }) => {
                    if (value && value.toLowerCase().includes(searchQuery)) {
                        // Tạo snippet với context
                        const index = value.toLowerCase().indexOf(searchQuery);
                        const start = Math.max(0, index - 50);
                        const end = Math.min(value.length, index + searchQuery.length + 50);
                        let snippet = value.substring(start, end);

                        if (start > 0) snippet = '...' + snippet;
                        if (end < value.length) snippet = snippet + '...';

                        matchedMessages.push({
                            messageId: msg.id,
                            snippet,
                            field: key,
                        });
                    }
                });
            });

            if (matchedInTitle || matchedMessages.length > 0) {
                searchResults.push({
                    session,
                    matchedInTitle,
                    matchedMessages,
                });
            }
        });

        setResults(searchResults);
    }, [query, sessions]);

    const highlightText = (text: string, query: string): React.ReactNode => {
        if (!query || !text) return text;

        const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

        return parts.map((part, index) => {
            if (part.toLowerCase() === query.toLowerCase()) {
                return (
                    <strong key={index} className="font-bold text-white">
                        {part}
                    </strong>
                );
            }
            return part;
        });
    };

    const handleSelectSession = (sessionId: string) => {
        onSelectSession(sessionId);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl w-full max-w-2xl max-h-[75vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="p-4 border-b border-gray-700/50">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Tìm kiếm đoạn chat..."
                            className="w-full px-4 py-3 pl-10 bg-gray-700/50 text-white rounded-lg border border-gray-600/50 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                        />
                        <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {query && results.length === 0 && (
                        <div className="p-8 text-center text-gray-400">
                            <p>Không tìm thấy kết quả nào</p>
                        </div>
                    )}

                    {!query && (
                        <div className="p-8 text-center text-gray-400">
                            <p>Nhập từ khóa để tìm kiếm trong lịch sử chat</p>
                        </div>
                    )}

                    {query && results.length > 0 && (
                        <div className="divide-y divide-gray-700/50">
                            {results.map((result) => (
                                <div
                                    key={result.session._id}
                                    className="p-4 hover:bg-gray-700/30 cursor-pointer transition-colors"
                                    onClick={() => handleSelectSession(result.session._id)}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="w-6 h-6 rounded-full bg-gray-700/50 flex items-center justify-center">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                                </svg>
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-semibold mb-1">
                                                {result.matchedInTitle ? (
                                                    highlightText(result.session.title, query)
                                                ) : (
                                                    result.session.title
                                                )}
                                            </h3>
                                            {result.matchedMessages.length > 0 && (
                                                <div className="space-y-1 mt-2">
                                                    {result.matchedMessages.slice(0, 2).map((match, idx) => (
                                                        <p key={idx} className="text-sm text-gray-400 line-clamp-2">
                                                            {highlightText(match.snippet, query)}
                                                        </p>
                                                    ))}
                                                    {result.matchedMessages.length > 2 && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            +{result.matchedMessages.length - 2} kết quả khác
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChatSearchModal;
