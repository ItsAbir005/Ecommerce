"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchApi } from "../lib/api";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "agent" | "user";
  text: string;
  timestamp: Date;
  card?: React.ReactNode; // rich inline card
}

type Order = {
  _id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  order_items: { title: string; quantity: number; image?: string }[];
  createdAt: string;
};

// ─── Style helpers ────────────────────────────────────────────────────────────

const STATUS_ICON: Record<string, string> = {
  pending: "⏳", confirmed: "💳", paid: "💳",
  shipped: "🚚", delivered: "📦", cancelled: "❌", returned: "↩️",
};

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending:   { bg: "rgba(234,179,8,0.15)",   text: "#fde047" },
  confirmed: { bg: "rgba(99,102,241,0.15)",  text: "#a5b4fc" },
  paid:      { bg: "rgba(99,102,241,0.15)",  text: "#a5b4fc" },
  shipped:   { bg: "rgba(6,182,212,0.15)",   text: "#67e8f9" },
  delivered: { bg: "rgba(16,185,129,0.15)",  text: "#6ee7b7" },
  cancelled: { bg: "rgba(239,68,68,0.15)",   text: "#fca5a5" },
  returned:  { bg: "rgba(107,114,128,0.15)", text: "#d1d5db" },
};

// ─── Quick-reply chips ────────────────────────────────────────────────────────

const QUICK_REPLIES_GUEST  = ["Track my order", "Return & refund policy", "Payment issues", "How to sell on Aura?", "Contact support"];
const QUICK_REPLIES_LOGGED = ["Where is my order?", "Cancel order", "Return & refund policy", "Payment issues", "Contact support"];

// ─── Static FAQ answers ───────────────────────────────────────────────────────

const STATIC_ANSWERS: Record<string, string> = {
  "return & refund policy":
    "We offer a **7-day return window** from delivery. Items must be unused and in original packaging. Refunds are processed within **3–5 business days** after we receive the item. 📦",
  "payment issues":
    "If your payment failed, please check your card details or try a different payment method. For stuck charges, contact your bank or email **support@aura.shop**. 💳",
  "how to sell on aura?":
    "Click the **🏷️ Sell** link in the nav bar, fill in your product details, upload photos, and submit. Our team will review and approve your listing within **24 hours**. 🚀",
  "contact support":
    "Our human agents are available **Mon–Fri, 9 AM–6 PM IST**. 💬\n📧 **support@aura.shop**\n📞 **+91-800-AURA-HELP**",
  "track my order":
    "Please **sign in** to your account and I can show your live order status! Or visit the [Orders page](/orders) directly.",
};

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

// ─── Mini-markdown renderer  **bold** and \n linebreaks ──────────────────────

function RenderText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, li) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={li}>
            {parts.map((p, i) =>
              p.startsWith("**") && p.endsWith("**") ? (
                <strong key={i}>{p.slice(2, -2)}</strong>
              ) : (
                <span key={i}>{p}</span>
              )
            )}
            {li < lines.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

// ─── Order Card (inline in chat) ──────────────────────────────────────────────

function OrderCard({
  order,
  onCancelRequest,
}: {
  order: Order;
  onCancelRequest: (order: Order) => void;
}) {
  const sc = STATUS_COLOR[order.status] ?? STATUS_COLOR.pending;
  const canCancel = ["pending", "confirmed", "paid"].includes(order.status);

  return (
    <div
      className="mt-2 rounded-xl p-3 text-sm space-y-2"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* Order ID + status */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="font-mono text-xs text-white/50">
          #{order._id.slice(-8).toUpperCase()}
        </span>
        <span
          className="text-[11px] px-2 py-0.5 rounded-full font-semibold"
          style={{ background: sc.bg, color: sc.text }}
        >
          {STATUS_ICON[order.status]} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>

      {/* Items */}
      <p className="text-white/70 text-xs leading-snug line-clamp-2">
        {order.order_items.map((i) => `${i.title} ×${i.quantity}`).join("  ·  ")}
      </p>

      {/* Footer row */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-emerald-400 font-bold">
          ${order.total_amount.toFixed(2)}
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={`/orders/${order._id}`}
            target="_blank"
            className="text-[11px] text-indigo-300 hover:text-indigo-200 underline underline-offset-2"
          >
            View details →
          </Link>
          {canCancel && (
            <button
              onClick={() => onCancelRequest(order)}
              className="text-[11px] text-rose-400 hover:text-rose-300 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SupportAgent() {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [unread, setUnread] = useState(0);
  const [showPulse, setShowPulse] = useState(true);

  // Cancel-confirmation state
  const [pendingCancel, setPendingCancel] = useState<Order | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setShowPulse(false); setUnread(0); }
  }, [open]);

  // Greet on first open
  useEffect(() => {
    if (open && !hasGreeted) {
      setHasGreeted(true);
      setTimeout(() => {
        addAgent(
          user
            ? `👋 Hi **${user.name.split(" ")[0]}**! I'm **Aura Assistant**. I can check your real orders, help with cancellations, and more. What can I do for you?`
            : "👋 Hi there! I'm **Aura Assistant**, your 24/7 support agent. What can I help you with today?"
        );
      }, 380);
    }
  }, [open, hasGreeted, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, pendingCancel]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // ── helpers ──────────────────────────────────────────────────────────────────

  function uid() { return Date.now().toString() + Math.random(); }
  function fmt(d: Date) { return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

  function addAgent(text: string, card?: React.ReactNode) {
    setMessages((prev) => [...prev, { id: uid(), role: "agent", text, timestamp: new Date(), card }]);
    if (!open) setUnread((u) => u + 1);
  }

  function addUser(text: string) {
    setMessages((prev) => [...prev, { id: uid(), role: "user", text, timestamp: new Date() }]);
  }

  // ── Intent handlers ───────────────────────────────────────────────────────────

  async function handleWhereIsMyOrder() {
    if (!user) {
      addAgent("Please **sign in** first so I can pull up your orders. 🔐");
      return;
    }
    setTyping(true);
    try {
      const data = await fetchApi("/orders/my?page=1&limit=5");
      const orders: Order[] = data.orders || [];
      setTyping(false);

      if (orders.length === 0) {
        addAgent("You haven't placed any orders yet. Ready to start shopping? 🛍️");
        return;
      }

      addAgent(`Here are your **${orders.length > 1 ? "recent orders" : "latest order"}**, ${user.name.split(" ")[0]}:`);

      // Add one message per order with a rich card
      orders.forEach((order) => {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "agent",
            text: "",
            timestamp: new Date(),
            card: (
              <OrderCard
                order={order}
                onCancelRequest={initCancelFlow}
              />
            ),
          },
        ]);
      });

      setTimeout(() => {
        addAgent("Need anything else? You can tap **Cancel order** on any eligible order above, or ask me something else. 😊");
      }, 400);
    } catch {
      setTyping(false);
      addAgent("I couldn't fetch your orders right now. Please try again shortly or visit the [Orders](/orders) page.");
    }
  }

  async function handleCancelOrderIntent() {
    if (!user) {
      addAgent("Please **sign in** first so I can check your cancellable orders. 🔐");
      return;
    }
    setTyping(true);
    try {
      const data = await fetchApi("/orders/my?page=1&limit=10");
      const orders: Order[] = data.orders || [];
      setTyping(false);

      const cancellable = orders.filter((o) =>
        ["pending", "confirmed", "paid"].includes(o.status)
      );

      if (cancellable.length === 0) {
        addAgent(
          "You have no orders that can be cancelled right now. Orders that have already shipped or been delivered cannot be cancelled. 📦\n\nFor returns, see our **Return & Refund Policy**."
        );
        return;
      }

      addAgent(
        `Here ${cancellable.length === 1 ? "is" : "are"} your **${cancellable.length} cancellable order${cancellable.length > 1 ? "s" : ""}**. Tap **Cancel** on the one you'd like to cancel:`
      );

      cancellable.forEach((order) => {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "agent",
            text: "",
            timestamp: new Date(),
            card: (
              <OrderCard
                order={order}
                onCancelRequest={initCancelFlow}
              />
            ),
          },
        ]);
      });
    } catch {
      setTyping(false);
      addAgent("I couldn't load your orders right now. Please try again.");
    }
  }

  // Called when user taps "Cancel" on an OrderCard
  function initCancelFlow(order: Order) {
    setPendingCancel(order);
    addAgent(
      `⚠️ Are you sure you want to cancel order **#${order._id.slice(-8).toUpperCase()}**?\n\n${order.order_items.map((i) => `• ${i.title} ×${i.quantity}`).join("\n")}\n\nTotal: **$${order.total_amount.toFixed(2)}**`
    );
  }

  async function confirmCancel() {
    if (!pendingCancel) return;
    const order = pendingCancel;
    setPendingCancel(null);
    setTyping(true);
    try {
      await fetchApi(`/orders/${order._id}/cancel`, { method: "PUT" });
      setTyping(false);
      addAgent(
        `✅ Order **#${order._id.slice(-8).toUpperCase()}** has been **cancelled** successfully. Any payment will be refunded within **3–5 business days**. Is there anything else I can help you with?`
      );
    } catch (err: any) {
      setTyping(false);
      addAgent(
        `❌ I couldn't cancel that order: **${err.message || "Unknown error"}**. Please try from the [Orders](/orders) page or contact support.`
      );
    }
  }

  function abortCancel() {
    setPendingCancel(null);
    addAgent("No problem — your order is safe! 👍 Anything else I can help with?");
  }

  // ── Dispatch logic ─────────────────────────────────────────────────────────

  async function handleIntent(text: string) {
    const lower = text.toLowerCase().trim();

    if (lower.includes("where is my order") || lower.includes("track") || lower.includes("my order")) {
      await handleWhereIsMyOrder();
      return;
    }

    if (lower.includes("cancel order") || lower.includes("cancel my order") || lower === "cancel order") {
      await handleCancelOrderIntent();
      return;
    }

    // Static FAQ matching
    for (const key of Object.keys(STATIC_ANSWERS)) {
      if (lower.includes(key)) {
        addAgent(STATIC_ANSWERS[key]);
        return;
      }
    }

    addAgent(
      "Thanks for reaching out! 😊 I've noted your question. A human agent will follow up via email shortly.\n\nOr try asking me:\n• **Where is my order?**\n• **Cancel order**\n• **Return & refund policy**"
    );
  }

  function handleSend(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setInput("");
    addUser(trimmed);
    setTyping(true);
    setTimeout(async () => {
      setTyping(false);
      await handleIntent(trimmed);
    }, 900);
  }

  function handleQuickReply(label: string) { handleSend(label); }

  const quickReplies = user ? QUICK_REPLIES_LOGGED : QUICK_REPLIES_GUEST;
  const showQuickReplies = messages.length <= 1 && !typing;

  return (
    <>
      {/* ── Floating Button ─────────────────────────────────────────────────── */}
      <button
        id="support-agent-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle support chat"
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          boxShadow: "0 8px 30px rgba(99,102,241,0.5)",
        }}
      >
        {showPulse && !open && (
          <span
            className="absolute inset-0 rounded-full animate-ping opacity-40"
            style={{ background: "rgba(99,102,241,0.6)" }}
          />
        )}
        <span
          className="transition-transform duration-300"
          style={{ transform: open ? "rotate(90deg) scale(0.85)" : "scale(1)" }}
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2} stroke="white" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={1.8} stroke="white" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          )}
        </span>
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
            {unread}
          </span>
        )}
      </button>

      {/* ── Chat Panel ──────────────────────────────────────────────────────── */}
      <div
        id="support-agent-panel"
        className="fixed bottom-24 right-6 z-[9998] w-[370px] max-w-[calc(100vw-3rem)] flex flex-col rounded-2xl overflow-hidden transition-all duration-300 origin-bottom-right"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "all" : "none",
          transform: open ? "scale(1) translateY(0)" : "scale(0.92) translateY(16px)",
          background: "rgba(10,10,20,0.88)",
          backdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 30px 70px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.15)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10"
          style={{ background: "linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.12))" }}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
              🤖
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2"
              style={{ borderColor: "rgba(10,10,20,0.95)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm leading-tight">Aura Assistant</p>
            <p className="text-emerald-400 text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              {user ? `Logged in as ${user.name.split(" ")[0]}` : "Online · Always here to help"}
            </p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
              strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
          style={{
            minHeight: "300px",
            maxHeight: "360px",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(99,102,241,0.25) transparent",
          }}
        >
          {messages.length === 0 && !typing && (
            <div className="flex flex-col items-center justify-center h-full py-10 text-center">
              <div className="text-4xl mb-3">👋</div>
              <p className="text-zinc-400 text-sm">Support agent ready — how can I help?</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {msg.role === "agent" && (
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm mt-0.5"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                >
                  🤖
                </div>
              )}
              <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                {msg.text && (
                  <div
                    className="px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed"
                    style={
                      msg.role === "user"
                        ? { background: "linear-gradient(135deg,#6366f1,#7c3aed)", color: "#fff", borderBottomRightRadius: "4px" }
                        : { background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)", color: "#e4e4e7", borderBottomLeftRadius: "4px" }
                    }
                  >
                    <RenderText text={msg.text} />
                  </div>
                )}
                {msg.card && (
                  <div className="w-full">{msg.card}</div>
                )}
                <span className="text-[10px] text-zinc-500 px-1">{fmt(msg.timestamp)}</span>
              </div>
            </div>
          ))}

          {typing && (
            <div className="flex gap-2 items-end">
              <div
                className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
              >
                🤖
              </div>
              <div
                className="rounded-2xl rounded-bl-sm"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Cancel Confirmation Bar ── */}
        {pendingCancel && (
          <div
            className="mx-3 mb-2 rounded-xl p-3 flex items-center justify-between gap-3"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)" }}
          >
            <p className="text-xs text-rose-300 leading-snug flex-1">
              Confirm cancel <strong>#{pendingCancel._id.slice(-8).toUpperCase()}</strong>?
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={abortCancel}
                className="text-xs px-3 py-1.5 rounded-lg border border-white/20 text-zinc-300 hover:bg-white/10 transition-colors"
              >
                Keep
              </button>
              <button
                onClick={confirmCancel}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white transition-colors"
                style={{ background: "linear-gradient(135deg,#ef4444,#b91c1c)" }}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        )}

        {/* Quick Replies */}
        {showQuickReplies && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
            {quickReplies.map((label) => (
              <button
                key={label}
                onClick={() => handleQuickReply(label)}
                className="text-xs px-3 py-1.5 rounded-full border transition-all duration-200 hover:-translate-y-0.5 active:scale-95"
                style={{
                  borderColor: "rgba(99,102,241,0.5)",
                  color: "#a5b4fc",
                  background: "rgba(99,102,241,0.08)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(99,102,241,0.2)";
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.8)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(99,102,241,0.08)";
                  e.currentTarget.style.borderColor = "rgba(99,102,241,0.5)";
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="px-3 pb-3"
        >
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2 border"
            style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
          >
            <input
              ref={inputRef}
              id="support-agent-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything…"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              id="support-agent-send"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
              style={{ background: input.trim() ? "linear-gradient(135deg,#6366f1,#7c3aed)" : "rgba(99,102,241,0.3)" }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-4 h-4">
                <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
              </svg>
            </button>
          </div>
          <p className="text-center text-[10px] text-zinc-600 mt-2">
            Aura AI · <span className="text-indigo-500/60">support@aura.shop</span>
          </p>
        </form>
      </div>
    </>
  );
}
