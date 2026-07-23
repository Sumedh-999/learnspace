import { useState, useRef, useEffect } from 'react'
import { streamChat } from '../api/client'

const CHIPS = [
  'What is due today?',
  'Show my grades',
  'Upcoming quizzes?',
  'Any announcements?'
]

export default function ChatBot({ onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm LearnBot 👋 Ask me about your assignments, grades, quizzes, or courses!"
    }
  ])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text) {
    const q = text || input.trim()
    if (!q || streaming) return

    setInput('')
    const userMsg = { role: 'user', content: q }
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }])
    setStreaming(true)

    try {
      for await (const chunk of streamChat(q, 1)) {
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk
          }
          return updated
        })
      }
    } catch (e) {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.'
        }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="chatbot">
      <div className="chat-head">
        <span>🤖 LearnBot AI</span>
        <button onClick={onClose} className="chat-close">×</button>
      </div>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.content || (streaming && i === messages.length - 1
              ? <span className="typing"><span /><span /><span /></span>
              : '')}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 2 && (
        <div className="chat-chips">
          {CHIPS.map(c => (
            <button key={c} className="chip" onClick={() => send(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') send()
          }}
          placeholder="Ask about your courses..."
          disabled={streaming}
        />
        <button
          onClick={() => send()}
          disabled={streaming || !input.trim()}
          className="send-btn"
        >
          ➤
        </button>
      </div>
    </div>
  )
}
