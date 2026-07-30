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
  const [speaking, setSpeaking] = useState(false)

  const bottomRef = useRef(null)
  const audioRef = useRef(null)
  const audioUrlRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => {
      stopSpeaking()
    }
  }, [])

  function stopSpeaking() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = null
    }

    setSpeaking(false)
  }

  async function speakText(text) {
    try {
      stopSpeaking()
      setSpeaking(true)

      const clean = text.replace(/[*_#`]/g, '').replace(/\n/g, ' ')
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/tts/speak`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clean })
        }
      )

      if (!res.ok) {
        stopSpeaking()
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)

      audioRef.current = audio
      audioUrlRef.current = url

      audio.onended = () => {
        stopSpeaking()
      }

      audio.onerror = () => {
        stopSpeaking()
      }

      await audio.play()
    } catch (e) {
      stopSpeaking()
    }
  }

  async function send(text) {
    const q = text || input.trim()
    if (!q || streaming) return

    stopSpeaking()
    setInput('')

    const userMsg = { role: 'user', content: q }
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }])
    setStreaming(true)

    let full = ''

    try {
      for await (const chunk of streamChat(q, 1)) {
        full += chunk

        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: full
          }
          return updated
        })
      }

      if (full.trim()) {
        await speakText(full)
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
      stopSpeaking()
    } finally {
      setStreaming(false)
    }
  }

  function handleClose() {
    stopSpeaking()
    onClose?.()
  }

  return (
    <div className="chatbot">
      <div className="chat-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🤖 LearnBot AI</span>
          {speaking && <span style={{ fontSize: 12 }}>🔊</span>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {speaking && (
            <button onClick={stopSpeaking} className="chat-stop-btn" type="button">
              Stop
            </button>
          )}
          <button onClick={handleClose} className="chat-close" type="button">×</button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            {m.content || (
              streaming && i === messages.length - 1
                ? <span className="typing"><span /><span /><span /></span>
                : ''
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 2 && (
        <div className="chat-chips">
          {CHIPS.map(c => (
            <button
              key={c}
              className="chip"
              onClick={() => send(c)}
              type="button"
            >
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
          placeholder={speaking ? 'Sarah is speaking...' : 'Ask about your courses...'}
          disabled={streaming}
        />
        <button
          onClick={() => send()}
          disabled={streaming || !input.trim()}
          className="send-btn"
          type="button"
        >
          ➤
        </button>
      </div>
    </div>
  )
}
