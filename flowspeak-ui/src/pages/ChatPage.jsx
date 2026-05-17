import { useEffect, useRef } from 'react';
import { Clock, Send } from 'lucide-react';
import { useAppState } from '../state/AppStateContext.jsx';

function formatLocal(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function ChatPage() {
  const { chat, input, setInput, loading, error, submitMessage } = useAppState();
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
  }, [chat]);

  return (
    <section className="flex h-[calc(100vh-96px)] flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Demo Chat Window</h2>
          <p className="text-sm text-slate-500">AI interprets intent; backend executes truth.</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-700">
          <Clock className="h-4 w-4" /> Intent parser
        </div>
      </header>

      <div className="flex-1 overflow-hidden rounded-2xl border bg-white">
        <div ref={chatScrollRef} className="h-full overflow-y-auto p-6">
          <div className="space-y-4">
            {chat.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${message.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-white border'} max-w-[78%] rounded-2xl px-4 py-3 shadow`}>
                  <div className="whitespace-pre-wrap text-sm">{message.text}</div>
                  {message.role === 'system' && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        message.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-800'
                          : message.status === 'FAILED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {message.intent}
                      </span>
                      <span className="text-2xs text-slate-400">{formatLocal(message.ts)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submitMessage} className="sticky bottom-0 z-10 mt-auto bg-white px-6 py-4">
          <div className="mx-auto flex max-w-4xl gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Check stock for Dell XPS"
              className="min-h-[56px] flex-1 resize-none rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Send className="h-4 w-4" /> {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        </form>
      </div>
    </section>
  );
}
