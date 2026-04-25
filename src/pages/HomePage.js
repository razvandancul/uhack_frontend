import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../App";
import uclujLogo  from "../U_Cluj.svg.png";
import portarImg  from "../portar.jpeg";
import fundasImg  from "../fundasok.jpg";
import mijImg     from "../mijlocas.jpeg";
import atacantImg from "../atacant.jpeg";

async function apiChat(message) {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) throw new Error(`Chat failed: ${res.status}`);
    return await res.json();
  } catch {
    return { reply: "Eroare la conexiune cu backend-ul.", players: [] };
  }
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function StarIcon({ filled }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24"
      fill={filled ? "#000" : "none"} stroke={filled ? "#000" : "#bbb"}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function TypingDots() {
  return <div className="typing-dots"><span /><span /><span /></div>;
}

function initials(name = "") {
  return name.split(" ").slice(0, 2).map(w => w[0] ?? "").join("").toUpperCase();
}

export default function HomePage({ isPlayerInAnyShortlist, onOpenProfile, onOpenStarModal, upsertPlayer }) {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    if (!chatMode) setChatMode(true);
    setMessages(prev => [...prev, { role: "user", text }]);
    setInput("");
    setIsTyping(true);
    const response = await apiChat(text);
    if (response.players?.length) response.players.forEach(p => upsertPlayer(p));
    setMessages(prev => [...prev, { role: "ai", text: response.reply, players: response.players || [] }]);
    setIsTyping(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const cards = [
    { src: portarImg,  alt: "Portar",   rotate: -18, translateX: -90 },
    { src: fundasImg,  alt: "Fundaș",   rotate: -6,  translateX: -30 },
    { src: mijImg,     alt: "Mijlocaș", rotate:  6,  translateX:  30 },
    { src: atacantImg, alt: "Atacant",  rotate:  18, translateX:  90 },
  ];

  const InputBox = (
    <div className="chat-container-wrapper">
      <div className="input-box-container">
        <textarea
          placeholder="Scrie mesajul tău aici..."
          className="chat-textarea"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows="2"
        />
        <div className="button-row">
          <button className="send-btn" onClick={handleSend}>
            <span className="send-icon"><SendIcon /></span>
          </button>
        </div>
      </div>
    </div>
  );

  if (!chatMode) {
    return (
      <>
        <div className="welcome-container">
          <div style={{ position: "relative", height: 180, width: 320, marginBottom: 16 }}>
            {cards.map((card, i) => (
              <img key={i} src={card.src} alt={card.alt} style={{
                position: "absolute", left: "50%", bottom: 0,
                width: 130, height: 240, objectFit: "cover",
                borderRadius: 10, border: "2px solid #e0e0e0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.13)",
                transform: `translateX(calc(-50% + ${card.translateX}px)) rotate(${card.rotate}deg)`,
                transformOrigin: "bottom center", zIndex: i,
              }} />
            ))}
          </div>
          <h1 className="welcome-title">Slavă ție, studenție!</h1>
          <p className="welcome-subtitle">Spune-mi ce tip de jucători cauți sau ce informații ai nevoie.</p>
        </div>
        <div className="bottom-input-area">{InputBox}</div>
      </>
    );
  }

  return (
    <div className="chat-page">
      <div className="messages-area">
        {messages.map((msg, i) => (
          <div key={i} className={`message-row ${msg.role}`}>
            {msg.role === "ai" && (
              <div className="ai-avatar">
                <img src={uclujLogo} alt="AI" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", mixBlendMode: "multiply" }} />
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: "70%" }}>
              <div className={`message-bubble ${msg.role}`}>{msg.text}</div>
              {msg.players?.length > 0 && msg.players.map(p => (
                <ChatPlayerCard
                  key={p.id} player={p}
                  onOpenProfile={() => onOpenProfile(p.id)}
                  onStar={() => onOpenStarModal(p)}
                  isStarred={isPlayerInAnyShortlist(p.id)}
                />
              ))}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="message-row ai">
            <div className="ai-avatar">
              <img src={uclujLogo} alt="AI" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", mixBlendMode: "multiply" }} />
            </div>
            <div className="message-bubble ai"><TypingDots /></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-bar">{InputBox}</div>
    </div>
  );
}

function ChatPlayerCard({ player, onOpenProfile, onStar, isStarred }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, border: "1px solid #e5e5e5", borderRadius: 10, background: "#fff", fontSize: 13 }}>
      <div className="player-avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{initials(player.name)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>{player.name}</div>
        <div style={{ fontSize: 11, color: "#888" }}>{player.club} · {player.age} ani · {player.position}</div>
        <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 11 }}>
          {player.rating != null && <span style={{ fontWeight: 600 }}>RTG {player.rating}</span>}
          {player.compatibilityScore != null && <span style={{ color: "#1d9e75", fontWeight: 600 }}>COMP {player.compatibilityScore}%</span>}
          {player.marketValue && <span style={{ color: "#888" }}>{player.marketValue}</span>}
        </div>
      </div>
      <button onClick={onOpenProfile} style={{ padding: "5px 10px", fontSize: 11, border: "1px solid #000", borderRadius: 6, background: "#000", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Profil →</button>
      <button onClick={onStar} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
        <StarIcon filled={isStarred} />
      </button>
    </div>
  );
}