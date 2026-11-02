import { useEffect, useRef, useState } from "react";

type Msg = { role: "guest" | "assistant"; text: string };

const GREETING =
  "Hi! I'm LodgeDesk, an AI assistant for Harris Lodges. Ask me about rooms, rates and branches, or tell me what you'd like and I'll pass it to our team.";

const COMPOSER_NOTE =
  "AI assistant. Messages are processed by Google's API. Please don't share ID or card details.";

/** Swap this for the real front-desk phone/email once the lodge supplies them. */
const CONTACT_PLACEHOLDER = "[contact details to be added]";

const STARTERS = ["Rooms and prices", "Which branch has rooms?", "Conference room"];

const REPLY_DELAY_MS = 900;

/**
 * The single place where guest messages are sent.
 * It stands in for the assistant API for now; replace the body with the real
 * request when the backend is connected — the UI only needs the reply string.
 */
async function sendMessage(text: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, REPLY_DELAY_MS));
  const subject = text.trim().replace(/\s+/g, " ");
  return `Thanks — I've noted "${subject}". This is a placeholder reply while LodgeDesk is being connected to the booking system; a member of our team will follow up with you shortly.`;
}

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", text: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "guest", text: trimmed }]);
    setLoading(true);

    try {
      const reply = await sendMessage(trimmed);
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setError("Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  function talkToPerson() {
    setError(null);
    setMessages((m) => [
      ...m,
      {
        role: "assistant",
        text: `Of course — I've asked the Harris Lodges team to follow up with you. You can also reach them at ${CONTACT_PLACEHOLDER}.`,
      },
    ]);
  }

  return (
    <div className="chat">
      <header className="chat-header">
        <div>
          <h1>LodgeDesk</h1>
          <p>Harris Lodges guest assistant (AI)</p>
        </div>
        <button type="button" className="chat-header-action" onClick={talkToPerson}>
          Talk to a person
        </button>
      </header>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="bubble assistant typing" role="status">
            Thinking…
          </div>
        )}
        <div ref={bottom} />
      </div>

      <footer className="chat-composer">
        {error && (
          <p className="chat-error" role="alert">
            {error}
          </p>
        )}

        <div className="chat-starters" role="group" aria-label="Suggested questions">
          {STARTERS.map((starter) => (
            <button
              key={starter}
              type="button"
              className="chat-chip"
              onClick={() => submit(starter)}
              disabled={loading}
            >
              {starter}
            </button>
          ))}
        </div>

        <div className="chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit(input);
              }
            }}
            placeholder="Type your question…"
            aria-label="Your message"
          />
          <button type="button" onClick={() => void submit(input)} disabled={loading || !input.trim()}>
            Send
          </button>
        </div>

        <p className="chat-note">{COMPOSER_NOTE}</p>
      </footer>
    </div>
  );
}
