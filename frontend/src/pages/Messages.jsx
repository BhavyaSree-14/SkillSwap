import React, { useEffect, useRef, useState } from "react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext.jsx";
import { Send } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [thread, setThread] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  const loadConversations = async () => {
    const { data } = await api.get("/messages/conversations/");
    setConversations(data);
    if (!active && data.length) setActive(data[0].user);
  };

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    if (!active) return;
    (async () => {
      const { data } = await api.get("/messages/", { params: { with: active.id } });
      setThread(data.results ?? data);
      api.post("/messages/mark_read/", { with: active.id });
    })();
  }, [active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    const { data } = await api.post("/messages/", { recipient: active.id, content: text });
    setThread([...thread, data]);
    setText("");
    loadConversations();
  };

  return (
    <div className="h-[calc(100vh-4rem)] -m-4 md:-m-8 flex">
      <div className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 overflow-y-auto">
        <h2 className="font-display font-semibold px-4 py-4">Messages</h2>
        {conversations.length === 0 && (
          <p className="text-sm text-slate-500 px-4">No conversations yet. Start one from the Marketplace or Matchmaking.</p>
        )}
        {conversations.map((c) => (
          <button
            key={c.user.id}
            onClick={() => setActive(c.user)}
            className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900 ${active?.id === c.user.id ? "bg-slate-50 dark:bg-slate-900" : ""}`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">{c.user.username}</span>
              {c.unread_count > 0 && <span className="badge bg-primary-600 text-white">{c.unread_count}</span>}
            </div>
            <p className="text-xs text-slate-500 truncate">{c.last_message.content}</p>
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        {active ? (
          <>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 font-display font-semibold">{active.username}</div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {thread.map((m) => (
                <div key={m.id} className={`max-w-md ${m.sender === user.id ? "ml-auto text-right" : ""}`}>
                  <div className={`inline-block px-4 py-2 rounded-2xl text-sm ${m.sender === user.id ? "bg-primary-600 text-white" : "bg-slate-100 dark:bg-slate-800"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className="p-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <input className="input flex-1" placeholder="Type a message..." value={text} onChange={(e) => setText(e.target.value)} />
              <button className="btn-primary"><Send size={16} /></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Select a conversation</div>
        )}
      </div>
    </div>
  );
}
