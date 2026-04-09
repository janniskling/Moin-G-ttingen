import { useEffect, useState } from 'react';
import { ArrowBigUp, ArrowBigDown, Send, Clock, Flame, Trash2, MessageSquare, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import type { ChatMessage } from '../entities/types';
import { useAuth } from '../context/AuthContext';
import {
    getMessages,
    getReplies,
    postMessage,
    deleteMessage,
    voteMessage,
    removeChatVote,
    getUserChatVotes,
    MESSAGES_PER_PAGE,
} from '../services/chat';

interface MessageCardProps {
    msg: ChatMessage;
    userId: string | undefined;
    userVotes: Record<string, number>;
    onVote: (id: string, direction: 1 | -1) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

const MessageCard = ({ msg, userId, userVotes, onVote, onDelete }: MessageCardProps) => {
    const [showReplies, setShowReplies] = useState(false);
    const [showInput, setShowInput] = useState(false);
    const [replies, setReplies] = useState<ChatMessage[]>([]);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [replyText, setReplyText] = useState('');
    const [replyError, setReplyError] = useState<string | null>(null);
    const [localScore, setLocalScore] = useState(msg.score);

    useEffect(() => { setLocalScore(msg.score); }, [msg.score]);

    const userVote = userVotes[msg.id];

    const getTimeString = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        return `${Math.floor(hours / 24)}d`;
    };

    const fetchReplies = async () => {
        if (replies.length === 0) setLoadingReplies(true);
        const data = await getReplies(msg.id);
        setReplies(data);
        setLoadingReplies(false);
    };

    const handleInteraction = async () => {
        if (!showReplies) {
            setShowReplies(true);
            setShowInput(true);
            await fetchReplies();
        } else {
            if (!showInput) {
                setShowInput(true);
            } else {
                setShowReplies(false);
                setShowInput(false);
            }
        }
    };

    const handleSendReply = async () => {
        if (!replyText.trim()) return;
        setReplyError(null);
        try {
            await postMessage(replyText, msg.id);
            setReplyText('');
            await fetchReplies();
            setShowInput(false);
        } catch {
            setReplyError('Antwort konnte nicht gesendet werden.');
        }
    };

    const handleChildDelete = async (childId: string) => {
        if (confirm('Antwort löschen?')) {
            try {
                await deleteMessage(childId);
                await fetchReplies();
            } catch {
                // silently ignore – child is already shown deleted optimistically
            }
        }
    };

    const handleLocalVote = async (direction: 1 | -1) => {
        const currentVote = userVote || 0;
        let newScoreDelta = 0;
        if (currentVote === direction) newScoreDelta = -direction;
        else if (currentVote === -direction) newScoreDelta = direction * 2;
        else newScoreDelta = direction;

        setLocalScore(prev => prev + newScoreDelta);
        await onVote(msg.id, direction);
    };

    return (
        <Card className="border-none shadow-sm bg-card/50 mb-3 ml-1 border-l-2 border-l-transparent hover:border-l-primary/10 transition-colors">
            <CardContent className="p-4 flex gap-4">
                {/* Vote Column */}
                <div className="flex flex-col items-center gap-1">
                    <button
                        onClick={() => handleLocalVote(1)}
                        className={`transition-colors ${userVote === 1 ? 'text-orange-500' : 'text-muted-foreground hover:text-orange-500/70'}`}
                    >
                        <ArrowBigUp className={`h-8 w-8 ${userVote === 1 ? 'fill-current' : ''}`} />
                    </button>
                    <span className={`font-bold text-sm ${userVote ? (userVote === 1 ? 'text-orange-500' : 'text-blue-500') : 'text-foreground'}`}>
                        {localScore}
                    </span>
                    <button
                        onClick={() => handleLocalVote(-1)}
                        className={`transition-colors ${userVote === -1 ? 'text-blue-500' : 'text-muted-foreground hover:text-blue-500/70'}`}
                    >
                        <ArrowBigDown className={`h-8 w-8 ${userVote === -1 ? 'fill-current' : ''}`} />
                    </button>
                </div>

                {/* Content Column */}
                <div className="flex-1 space-y-2 pt-1 min-w-0">
                    <p className="text-base leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground w-full flex-wrap gap-2">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{getTimeString(msg.created_at)}</span>
                            </div>
                            <button onClick={handleInteraction} className="flex items-center gap-1 hover:text-primary transition-colors">
                                <MessageSquare className="h-3 w-3" />
                                <span>Antworten</span>
                            </button>
                            {localScore > 5 && (
                                <div className="flex items-center gap-1 text-orange-500">
                                    <Flame className="h-3 w-3" />
                                    <span>Heiß</span>
                                </div>
                            )}
                        </div>
                        {userId && msg.user_id === userId && (
                            <button
                                onClick={() => onDelete(msg.id)}
                                className="text-red-500/50 hover:text-red-500 transition-colors p-1"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    {/* Replies Section */}
                    {showReplies && (
                        <div className="mt-4 pl-4 border-l-2 border-muted space-y-3 animate-in slide-in-from-top-2">
                            {showInput && (
                                <div className="space-y-2 mb-4 animate-in slide-in-from-top-2 fade-in">
                                    <div className="flex gap-2">
                                        <input
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            placeholder="Antworten..."
                                            className="flex-1 bg-background text-sm rounded-md border px-3 py-2"
                                            autoFocus
                                        />
                                        <Button size="sm" onClick={handleSendReply} disabled={!replyText.trim()}>
                                            <Send className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    {replyError && (
                                        <p className="text-xs text-red-500">{replyError}</p>
                                    )}
                                </div>
                            )}
                            {loadingReplies ? (
                                <div className="text-xs text-muted-foreground">Lade Antworten...</div>
                            ) : replies.length > 0 ? (
                                replies.map(r => (
                                    <MessageCard
                                        key={r.id}
                                        msg={r}
                                        userId={userId}
                                        userVotes={userVotes}
                                        onVote={onVote}
                                        onDelete={handleChildDelete}
                                    />
                                ))
                            ) : !showInput && (
                                <div className="text-xs text-muted-foreground italic">Keine Antworten bisher.</div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default function Chats() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userVotes, setUserVotes] = useState<Record<string, number>>({});
    const [newItem, setNewItem] = useState('');
    const [sortBy, setSortBy] = useState<'new' | 'top'>('new');
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [postError, setPostError] = useState<string | null>(null);
    const [hasMore, setHasMore] = useState(false);
    const [offset, setOffset] = useState(0);

    const loadData = async (reset = false, currentOffset?: number) => {
        const off = currentOffset ?? (reset ? 0 : offset);
        if (reset) {
            setLoading(true);
            setError(null);
        } else {
            setLoadingMore(true);
        }

        try {
            // getUserChatVotes() calls supabase.auth.getUser() which can hang if the session
            // is being refreshed. Run both with a 10-second timeout so loading never gets stuck.
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 10000)
            );
            const [msgs, votes] = await Promise.race([
                Promise.all([
                    getMessages(sortBy, off, MESSAGES_PER_PAGE),
                    off === 0 ? getUserChatVotes() : Promise.resolve<Record<string, number>>({}),
                ]),
                timeoutPromise,
            ]);

            setMessages(prev => reset ? msgs : [...prev, ...msgs]);
            if (off === 0) setUserVotes(votes);
            setHasMore(msgs.length === MESSAGES_PER_PAGE);
            setOffset(off + msgs.length);
        } catch {
            setError('Nachrichten konnten nicht geladen werden.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        loadData(true, 0);
    }, [sortBy]);

    const handlePost = async () => {
        if (!newItem.trim() || newItem.length > 250) return;
        if (!user) {
            setPostError('Bitte einloggen zum Posten!');
            return;
        }
        setPostError(null);
        try {
            await postMessage(newItem);
            setNewItem('');
            await loadData(true, 0);
        } catch {
            setPostError('Nachricht konnte nicht gesendet werden.');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Wirklich löschen?')) {
            try {
                await deleteMessage(id);
                setMessages(prev => prev.filter(m => m.id !== id));
            } catch {
                setError('Nachricht konnte nicht gelöscht werden.');
            }
        }
    };

    const handleVote = async (id: string, direction: 1 | -1) => {
        if (!user) {
            setPostError('Bitte einloggen zum Voten!');
            return;
        }
        const currentVote = userVotes[id] || 0;
        const newVoteState = currentVote === direction ? undefined : direction;

        setUserVotes(prev => {
            const next = { ...prev };
            if (newVoteState === undefined) delete next[id];
            else next[id] = newVoteState;
            return next;
        });

        try {
            if (newVoteState === undefined) {
                await removeChatVote(id);
            } else {
                await voteMessage(id, direction);
            }
        } catch {
            loadData(true, 0);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            <div className="flex items-center justify-between pt-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Community</h1>
                <div className="flex bg-muted rounded-lg p-1">
                    <button
                        onClick={() => setSortBy('new')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${sortBy === 'new' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                    >
                        Neu
                    </button>
                    <button
                        onClick={() => setSortBy('top')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${sortBy === 'top' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
                    >
                        Top
                    </button>
                </div>
            </div>

            {/* Input Area */}
            <div className="space-y-2">
                <div className="relative">
                    <textarea
                        value={newItem}
                        onChange={e => setNewItem(e.target.value)}
                        placeholder="Was geht in Göttingen?"
                        className="w-full min-h-[100px] bg-card border rounded-xl p-4 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-base"
                        maxLength={250}
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        <span className={`text-xs ${newItem.length > 200 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {newItem.length}/250
                        </span>
                        <Button
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={handlePost}
                            disabled={!newItem.trim()}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                {postError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                        <span>{postError}</span>
                    </div>
                )}
            </div>

            {/* Error State */}
            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                    <button onClick={() => loadData(true)} className="ml-auto underline hover:no-underline font-medium">
                        Neu laden
                    </button>
                </div>
            )}

            {/* Message Stream */}
            <div className="space-y-3">
                {loading && messages.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground animate-pulse">Lade Nachrichten...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        Noch nichts los hier. Schreib den ersten Post!
                    </div>
                ) : (
                    <>
                        {messages.map(msg => (
                            <MessageCard
                                key={msg.id}
                                msg={msg}
                                userId={user?.id}
                                userVotes={userVotes}
                                onVote={handleVote}
                                onDelete={handleDelete}
                            />
                        ))}

                        {hasMore && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => loadData(false, offset)}
                                disabled={loadingMore}
                            >
                                {loadingMore ? 'Lade...' : 'Mehr laden'}
                            </Button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
