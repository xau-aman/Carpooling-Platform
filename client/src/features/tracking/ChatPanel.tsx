import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { getSocket } from '../../lib/socket'
import { ChatMessage } from '../../types'

interface Props {
  tripId: string
  messages: ChatMessage[]
  currentUserId: string
}

export default function ChatPanel({ tripId, messages, currentUserId }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    if (!input.trim()) return
    getSocket().emit('chat:message', { tripId, message: input.trim() })
    setInput('')
  }

  return (
    <div className="neo-card flex flex-col h-72">
      <div className="px-4 py-2 border-b-2 border-[#0f0f0f] bg-[#0f0f0f]">
        <p className="text-xs font-bold uppercase text-white tracking-wider">Trip Chat</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <p className="text-xs text-[#6b6b6b] text-center mt-4">No messages yet. Say hi!</p>
        )}
        {messages.map(msg => {
          const mine = msg.senderId === currentUserId
          return (
            <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-3 py-2 text-sm border-2 border-[#0f0f0f] ${mine ? 'bg-[#f97316] text-white' : 'bg-white'}`}>
                {!mine && <p className="text-xs font-bold mb-0.5 text-[#6b6b6b]">{msg.sender.name}</p>}
                <p>{msg.message}</p>
                <p className={`text-xs mt-0.5 ${mine ? 'text-white/70' : 'text-[#6b6b6b]'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex border-t-2 border-[#0f0f0f]">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 text-sm outline-none bg-white"
        />
        <button onClick={send} className="px-4 bg-[#0f0f0f] text-white hover:bg-[#f97316] transition-colors">
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
