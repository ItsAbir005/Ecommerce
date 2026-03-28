"use client";

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

interface Message {
    _id: string;
    shipmentId: string;
    senderMode: "customer" | "driver";
    senderId: string;
    text: string;
    createdAt: string;
}

interface ChatBoxProps {
    shipmentId: string;
    userMode: "customer" | "driver";
    userId?: string; 
    token?: string; // Optional auth token for socket or API
    recipientName: string;
    onClose: () => void;
}

export default function ChatBox({ shipmentId, userMode, userId = "anonymous", token, recipientName, onClose }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [socket, setSocket] = useState<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch initial chat history
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const headers: any = { "Content-Type": "application/json" };
                if (token) headers["Authorization"] = `Bearer ${token}`;
                
                const res = await fetch(`${API}/chat/${shipmentId}`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                }
            } catch (err) {
                console.error("Failed to load chat history:", err);
            }
        };
        fetchHistory();
    }, [shipmentId, token]);

    // Setup Socket.io
    useEffect(() => {
        const s = io(SOCKET_URL, { auth: token ? { token } : {} });
        
        s.on("connect", () => {
            console.log("💬 Chat socket connected");
            s.emit("join:chat", { shipmentId });
        });

        s.on("receive:message", (msg: Message) => {
            setMessages((prev) => [...prev, msg]);
        });

        setSocket(s);

        return () => {
            s.disconnect();
        };
    }, [shipmentId, token]);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !socket) return;

        socket.emit("send:message", {
            shipmentId,
            senderMode: userMode,
            senderId: userId,
            text: newMessage.trim(),
        });
        
        setNewMessage("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-card-bg border border-card-border rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[500px] max-h-[85vh] animate-in slide-in-from-bottom-5 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-card-border bg-black/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-lg">
                            {userMode === "customer" ? "🧑‍✈️" : "🧑‍💼"}
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Chat with {recipientName}</h3>
                            <p className="text-xs text-emerald-400 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Online
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-transparent to-black/10">
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-muted text-sm pb-10">
                            <span className="text-4xl mb-3 opacity-50">👋</span>
                            <p>Send a message to start chatting.</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.senderMode === userMode;
                            return (
                                <div key={msg._id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div 
                                        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                                            isMe 
                                                ? 'bg-primary text-white rounded-br-sm' 
                                                : 'bg-white/10 text-gray-100 rounded-bl-sm border border-white/5'
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                    <span className="text-[10px] text-muted mt-1 px-1">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSend} className="p-4 border-t border-card-border bg-black/20">
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/50 text-white placeholder-muted transition-colors"
                        />
                        <button 
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                              <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
