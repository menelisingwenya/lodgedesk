import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";

type Msg = { role: "guest" | "assistant"; text: string };

const GREETING =
  "Hi! I'm LodgeDesk, an AI assistant for Harris Lodges. Ask me about rooms, rates and branches, or tell me what you'd like and I'll pass it to our team.";

const COMPOSER_NOTE =
  "AI assistant. Messages are processed by Google's API. Please don't share ID or card details.";

/** Swap this for the real front-desk phone/email once the lodge supplies them. */
const CONTACT_PLACEHOLDER = "[contact details to be added]";

const STARTERS = ["Rooms and prices", "Which branch has rooms?", "Conference room"];

const SESSION_KEY = "lodgedesk_session";
let memorySessionId: string | null = null;

function getSessionId(): string {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) return stored;
  } catch {
    // sessionStorage read unavailable
  }

  if (memorySessionId) return memorySessionId;

  const newId = crypto.randomUUID();
  memorySessionId = newId;

  try {
    sessionStorage.setItem(SESSION_KEY, newId);
  } catch {
    // sessionStorage write unavailable
  }

  return newId;
}

async function sendMessage(message: string): Promise<string> {
  const sessionId = getSessionId();

  const { data, error } = await supabase.functions.invoke<{
    reply?: string;
    conversation_id?: string;
    handoff?: boolean;
  }>("chat", {
    body: { session_id: sessionId, message },
  });

  if (error || !data || typeof data.reply !== "string") {
    console.error(error ? "FunctionsHttpError" : "ChatResponseError");
    throw new Error("ChatError");
  }

  return data.reply;
}

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([{ role: "assistant", text: GREETING }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const hasStarted = messages.length > 1;

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const messageToSend = trimmed.slice(0, 2000);

    setInput("");
    setError(null);
    setMessages((m) => [...m, { role: "guest", text: messageToSend }]);
    setLoading(true);

    try {
      const reply = await sendMessage(messageToSend);
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

  const controls = (
    <>
      {error && (
        <p className="chat-error" role="alert">
          {error}
        </p>
      )}

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
          maxLength={2000}
        />
        <button type="button" onClick={() => void submit(input)} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>

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

      <p className="chat-note">{COMPOSER_NOTE}</p>
    </>
  );

  return (
    <div className={`chat${hasStarted ? " chat-active" : " chat-empty"}`}>
      <header className="chat-header">
        <div>
          <h1>LodgeDesk</h1>
          <p>Harris Lodges guest assistant (AI)</p>
        </div>
        <button type="button" className="chat-header-action" onClick={talkToPerson}>
          Talk to a person
        </button>
      </header>

      {hasStarted ? (
        <>
          <div className="chat-messages" aria-live="polite">
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

          <footer className="chat-composer">{controls}</footer>
        </>
      ) : (
        <main className="chat-empty-state">
          <section className="chat-hero" aria-labelledby="chat-hero-title">
            <div className="chat-orb" aria-hidden="true">
              <span />
            </div>
            <h2 id="chat-hero-title">How can I help you today?</h2>
            <p className="chat-welcome">{GREETING}</p>
          </section>
          <section className="chat-composer chat-composer-empty" aria-label="Start a conversation">
            {controls}
          </section>
        </main>
      )}
    </div>
  );
}
