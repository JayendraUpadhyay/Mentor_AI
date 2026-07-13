import { useEffect, useRef, useState } from "react";
import { askDoubt } from "../lib/api.js";


const WELCOME_MESSAGE = {
  role: "model",
  content: "Hey! I'm MentorAI 👋 Ask me anything — code, concepts, whatever you're stuck on.",
};

export default function DoubtChat() {
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("mentorai_doubt_history") || "[]");
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    localStorage.setItem("mentorai_doubt_history", JSON.stringify(messages.slice(-30)));
  }, [messages]);


  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const plain = text.replace(/[*_`#]/g, "");
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // history is everything before this new message — always starts with a
      // real user turn since the static welcome bubble is never part of state
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const data = await askDoubt({ message: text, history });
      setMessages((prev) => [...prev, { role: "model", content: data.response }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: `⚠️ Error: ${err.message || "could not connect to the backend"}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function usePrompt(prompt) {
    setInput(prompt);
  }

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col gap-5 lg:min-h-[calc(100vh-5rem)]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-glow">doubt solver</p>
          <h1 className="font-display text-3xl font-semibold text-ink-100">Ask away, no doubt too small</h1>
        </div>
        {messages.length > 0 && <button onClick={() => setMessages([])} className="rounded-lg border border-white/10 bg-white/[.03] px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-ink-400 transition hover:border-cyan-glow/40 hover:text-cyan-glow">Clear chat</button>}
      </div>

      <div className="mentor-chat-shell glass flex flex-1 flex-col overflow-hidden rounded-[24px]">
        <div className="chat-topline"><span>MENTOR LINK / SECURE</span><span className="chat-online">● Online</span></div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="flex flex-col gap-4">
            <ChatBubble role={WELCOME_MESSAGE.role} content={WELCOME_MESSAGE.content} onSpeak={speak} />
            {messages.length === 0 && <EmptyState onPick={usePrompt} />}
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role} content={m.content} onSpeak={speak} />
            ))}
            {loading && <TypingIndicator />}
          </div>
        </div>

        <form onSubmit={handleSend} className="chat-composer flex items-center gap-2 border-t border-white/10 p-3 md:p-4">
  
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your doubt..."
            className="flex-1 rounded-lg border border-white/10 bg-void/60 px-4 py-2.5 text-sm text-ink-100 placeholder:text-ink-600 focus:border-cyan-glow/50 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-gradient-to-r from-cyan-glow to-violet-glow px-5 py-2.5 font-display text-sm font-semibold text-void shadow-glow-cyan transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ onPick }) {
  const prompts = ["Explain recursion with a simple example", "Make a 7-day study plan for React", "Why does binary search need sorted data?"];
  return <div className="chat-empty">
    <div className="chat-orb"><span>✦</span></div>
    <p className="font-display text-lg text-ink-100">Your AI mentor is ready.</p>
    <p className="max-w-md text-center text-sm text-ink-400">Ask for explanations, code help, revision plans, or a quick confidence boost before you begin.</p>
    <div className="chat-suggestions">{prompts.map((prompt) => <button key={prompt} onClick={() => onPick(prompt)}>{prompt}<span>↗</span></button>)}</div>
  </div>;
}

function ChatBubble({ role, content, onSpeak }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`group relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed md:max-w-[70%] ${
          isUser
            ? "bg-gradient-to-br from-cyan-glow/20 to-violet-glow/20 border border-cyan-glow/20 text-ink-100"
            : "glass text-ink-100"
        }`}
      >
        {isUser ? <span className="whitespace-pre-wrap">{content}</span> : <MarkdownMessage content={content} />}
        {!isUser && (
          <button
            onClick={() => onSpeak(content)}
            className="mt-2 flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-ink-600 opacity-0 transition-opacity hover:text-cyan-glow group-hover:opacity-100"
          >
            🔊 Listen
          </button>
        )}
      </div>
    </div>
  );
}

function MarkdownMessage({ content }) {
  const lines = content.replace(/\r/g, "").split("\n");
  const blocks = [];
  let paragraph = [];
  let listItems = [];
  let listType = null;
  let codeLines = [];
  let codeLanguage = "";

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(<p key={`p-${blocks.length}`} className="mb-3 last:mb-0">{inlineMarkdown(paragraph.join(" "))}</p>);
      paragraph = [];
    }
  };

  const flushList = () => {
    if (!listItems.length) return;
    const Tag = listType === "ordered" ? "ol" : "ul";
    blocks.push(
      <Tag
        key={`list-${blocks.length}`}
        className={`mb-3 space-y-1 pl-5 last:mb-0 ${listType === "ordered" ? "list-decimal" : "list-disc"}`}
      >
        {listItems.map((item, index) => <li key={index}>{inlineMarkdown(item)}</li>)}
      </Tag>
    );
    listItems = [];
    listType = null;
  };

  const flushCode = () => {
    if (!codeLines.length && !codeLanguage) return;
    blocks.push(
      <div key={`code-${blocks.length}`} className="mb-3 overflow-hidden rounded-lg border border-white/10 bg-black/30 last:mb-0">
        {codeLanguage && <div className="border-b border-white/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-cyan-glow">{codeLanguage}</div>}
        <pre className="overflow-x-auto p-3 font-mono text-xs leading-6 text-ink-100"><code>{codeLines.join("\n")}</code></pre>
      </div>
    );
    codeLines = [];
    codeLanguage = "";
  };

  lines.forEach((line, index) => {
    const codeFence = line.match(/^```\s*([\w+-]*)\s*$/);
    if (codeFence) {
      if (codeLines.length || codeLanguage) {
        flushCode();
      } else {
        flushParagraph();
        flushList();
        codeLanguage = codeFence[1] || "code";
      }
      return;
    }

    if (codeLanguage) {
      codeLines.push(line);
      return;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const unorderedItem = line.match(/^[-*+]\s+(.+)$/);
    const orderedItem = line.match(/^\d+[.)]\s+(.+)$/);

    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      const Heading = `h${level}`;
      const sizes = ["text-lg", "text-base", "text-sm"];
      blocks.push(<Heading key={`h-${index}`} className={`mb-2 font-display font-semibold text-cyan-glow ${sizes[level - 1]}`}>{inlineMarkdown(heading[2])}</Heading>);
    } else if (unorderedItem || orderedItem) {
      flushParagraph();
      const nextType = orderedItem ? "ordered" : "unordered";
      if (listType && listType !== nextType) flushList();
      listType = nextType;
      listItems.push((unorderedItem || orderedItem)[1]);
    } else if (!line.trim()) {
      flushParagraph();
      flushList();
    } else if (/^([-*_])\1\1+$/.test(line.trim())) {
      flushParagraph();
      flushList();
      blocks.push(<hr key={`hr-${index}`} className="my-3 border-white/15" />);
    } else {
      paragraph.push(line.trim());
    }
  });

  flushParagraph();
  flushList();
  flushCode();
  return <>{blocks}</>;
}

function inlineMarkdown(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index} className="font-semibold text-cyan-glow">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="rounded bg-white/10 px-1 py-0.5 font-mono text-xs text-violet-glow">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="glass flex items-center gap-1.5 rounded-2xl px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-pulse-slow rounded-full bg-cyan-glow"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}