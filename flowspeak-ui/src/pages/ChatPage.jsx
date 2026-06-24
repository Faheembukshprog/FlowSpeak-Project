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

function renderDataTable(data, intent) {
  if (!data) return null;

  // Handle orders list
  if (intent === 'LIST_MY_ORDERS' && data.orders) {
    return (
      <div className="space-y-3 mt-2">
        {data.orders.length === 0 ? (
          <p className="text-sm text-slate-600">No orders found</p>
        ) : (
          data.orders.map((order, idx) => (
            <div key={idx} className="border border-slate-200 rounded p-3 bg-slate-50">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-slate-600">{formatLocal(order.createdAt)}</p>
                </div>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                  order.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                  order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>{order.status}</span>
              </div>
              <div className="mt-2 text-sm">
                {order.items.map((item, i) => (
                  <p key={i} className="text-slate-700">{item.quantity}x {item.productName} @ ${item.unitPrice.toFixed(2)}</p>
                ))}
              </div>
              <p className="text-sm font-semibold text-slate-800 mt-2">Total: ${order.totalAmount.toFixed(2)}</p>
            </div>
          ))
        )}
      </div>
    );
  }

  // Handle product search results
  if (intent === 'SEARCH_PRODUCTS' && data.products) {
    return (
      <div className="space-y-2 mt-2">
        {data.products.length === 0 ? (
          <p className="text-sm text-slate-600">No products found</p>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {data.products.map((prod, idx) => (
              <div key={idx} className="border border-slate-200 rounded p-2 bg-slate-50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm">{prod.name}</p>
                    <p className="text-xs text-slate-600">SKU: {prod.sku}</p>
                  </div>
                  <span className="text-sm font-semibold">${prod.price.toFixed(2)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                    prod.available ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {prod.stockQuantity} in stock
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Handle quote request
  if (intent === 'REQUEST_QUOTE' && data.productName) {
    return (
      <div className="border border-blue-200 rounded p-3 bg-blue-50 mt-2">
        <div className="text-sm space-y-1">
          <p><span className="font-semibold">Product:</span> {data.productName}</p>
          <p><span className="font-semibold">Quantity:</span> {data.quantity}</p>
          <p><span className="font-semibold">Unit Price:</span> ${data.regularUnitPrice.toFixed(2)}</p>
          <p><span className="font-semibold">Bulk Price:</span> ${data.bulkUnitPrice.toFixed(2)} ({data.discountPercentage}% off)</p>
          <p className="text-lg font-bold text-blue-600 pt-2">Total: ${data.totalPrice.toFixed(2)}</p>
          {data.totalSavings > 0 && (
            <p className="text-xs text-emerald-600">Save ${data.totalSavings.toFixed(2)} with bulk discount</p>
          )}
          {!data.inStock && (
            <p className="text-xs text-amber-600">⚠️ Only {data.availableStock} units in stock</p>
          )}
        </div>
      </div>
    );
  }

  // Handle single order creation
  if ((intent === 'CREATE_ORDER' || intent === 'RESERVE_STOCK') && data.orderNumber) {
    return (
      <div className="border border-emerald-200 rounded p-3 bg-emerald-50 mt-2">
        <p className="text-sm"><span className="font-semibold">Order Number:</span> {data.orderNumber}</p>
        <p className="text-sm"><span className="font-semibold">Product:</span> {data.productName}</p>
        <p className="text-sm"><span className="font-semibold">Quantity:</span> {data.quantity}</p>
        <p className="text-sm"><span className="font-semibold">Total:</span> ${data.totalAmount.toFixed(2)}</p>
        <p className="text-sm"><span className="font-semibold">Status:</span> {data.status}</p>
      </div>
    );
  }

  return null;
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

      <div className="flex-1 overflow-hidden rounded-2xl border bg-white flex flex-col">
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {chat.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${message.role === 'user' ? 'bg-emerald-500 text-white' : 'bg-white border'} max-w-[85%] rounded-2xl px-4 py-3 shadow`}>
                  <div className="whitespace-pre-wrap text-sm">{message.text}</div>
                  {message.role === 'system' && (
                    <>
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
                        <span className="text-[0.625rem] text-slate-400">{formatLocal(message.ts)}</span>
                      </div>
                      {message.data && renderDataTable(message.data, message.intent)}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={submitMessage} className="mt-auto border-t bg-white px-6 py-4 shrink-0">
          <div className="mx-auto flex max-w-4xl gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Create order for 5 Dell XPS... Show my orders... Search for laptops... Quote on 100 monitors"
              className="min-h-14 flex-1 resize-none rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
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

