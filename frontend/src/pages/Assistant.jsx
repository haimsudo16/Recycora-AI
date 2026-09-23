import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Bot, User, Sparkles } from 'lucide-react'
import { assistantApi, apiErrorMessage } from '../services/api.js'
import { useAuth } from '../hooks/useAuth.jsx'

const DEFAULT_SUGGESTIONS = [
  'Can this item be recycled?',
  'How should I dispose of batteries?',
  'Is this packaging recyclable?',
  'Where can I recycle e-waste?',
  'How can I reduce plastic waste?',
]

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-emerald-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

export default function Assistant() {
  const { isAuthenticated } = useAuth()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hi! I'm the RECYcORA Recycling Assistant. Ask me anything about recycling or disposing of an item, or try one of the suggestions below.",
      followups: DEFAULT_SUGGESTIONS,
    },
  ])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  const send = async (text) => {
    const message = (text ?? input).trim()
    if (!message || thinking) return

    setMessages((m) => [...m, { role: 'user', text: message }])
    setInput('')
    setThinking(true)

    if (!isAuthenticated) {
      setTimeout(() => {
        setMessages((m) => [...m, {
          role: 'assistant',
          text: 'Please log in to chat with the Recycling Assistant — this keeps guidance tailored to your account.',
          followups: [],
        }])
        setThinking(false)
      }, 500)
      return
    }

    try {
      const res = await assistantApi.ask(message)
      setMessages((m) => [...m, { role: 'assistant', text: res.data.reply, followups: res.data.suggested_followups || [] }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: apiErrorMessage(err, "Sorry, I couldn't process that."), followups: [] }])
    } finally {
      setThinking(false)
    }
  }

  return (
    <div className="section-pad py-12 max-w-3xl mx-auto">
      <div className="mb-8">
        <p className="label-mono text-emerald-400 mb-3 flex items-center gap-2">
          <Sparkles size={13} /> Smart Recycling Assistant
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Ask anything about recycling</h1>
      </div>

      <div className="glass-panel flex flex-col h-[65vh]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  m.role === 'user' ? 'bg-white/10 text-offwhite' : 'bg-emerald-400/15 text-emerald-400'
                }`}>
                  {m.role === 'user' ? <User size={15} /> : <Bot size={15} />}
                </div>
                <div className={`max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user' ? 'bg-emerald-400 text-ink-950 font-medium' : 'bg-white/[0.05] text-offwhite'
                  }`}>
                    {m.text}
                  </div>
                  {m.followups?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {m.followups.map((f) => (
                        <button
                          key={f}
                          onClick={() => send(f)}
                          className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-mist hover:text-offwhite hover:border-emerald-400/40 transition-colors"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {thinking && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-400/15 text-emerald-400 flex items-center justify-center shrink-0">
                <Bot size={15} />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-white/[0.05]">
                <TypingIndicator />
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send() }}
          className="p-4 border-t border-white/[0.06] flex items-center gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about recycling or disposal..."
            className="flex-1 rounded-full bg-white/5 border border-white/10 px-5 py-3 text-sm text-offwhite focus:border-emerald-400/60 outline-none transition-colors"
          />
          <button type="submit" className="btn-primary !rounded-full !px-4 !py-3" aria-label="Send message">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}
