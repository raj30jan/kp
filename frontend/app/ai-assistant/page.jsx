'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles, User } from 'lucide-react'

export default function AiAssistantPage() {
  const [lang, setLang] = useState('hi')
  const isHindi = lang === 'hi'
  const [messages, setMessages] = useState([
    { role: 'bot', text: isHindi ? 'नमस्ते! मैं किसानपत्रिका AI सहायक हूँ। फसल, मौसम, मंडी भाव या सरकारी योजनाओं के बारे में पूछें।' : 'Hello! I am KisanPatrika AI Assistant. Ask me about crops, weather, mandi rates, or government schemes.' },
  ])
  const [input, setInput] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const suggestions = isHindi
    ? ['आज का मंडी भाव', 'गेहूं के लिए मौसम', 'PM-KISAN योजना', 'कीटनाशक सलाह']
    : ['Today\'s mandi rates', 'Weather for wheat', 'PM-KISAN scheme', 'Pesticide advice']

  const handleSend = (text) => {
    const msg = text || input
    if (!msg.trim()) return
    setMessages((prev) => [...prev, { role: 'user', text: msg }])
    setInput('')
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        role: 'bot',
        text: isHindi
          ? 'मैं आपके सवाल को समझ रहा हूँ। वर्तमान में मैं एक डेमो सहायक हूँ — जल्द ही पूर्ण AI सुविधा उपलब्ध होगी!'
          : 'I understand your question. Currently I am a demo assistant — full AI capabilities coming soon!',
      }])
    }, 800)
  }

  return (
    <div className='flex min-h-screen flex-col bg-slate-50'>

      <div className='mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 md:px-6'>
        <div className='mb-4 flex items-center gap-3'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100'>
            <Bot className='h-6 w-6 text-emerald-700' />
          </div>
          <div>
            <h1 className='text-xl font-bold text-gray-900'>
              {isHindi ? 'किसानपत्रिका AI सहायक' : 'KisanPatrika AI Assistant'}
            </h1>
            <p className='text-sm text-gray-500'>
              {isHindi ? '24x7 किसान सहायता' : '24x7 Farmer Support'}
            </p>
          </div>
        </div>

        <div className='flex-1 space-y-4 overflow-y-auto rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100'>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                  {m.role === 'user' ? <User className='h-4 w-4 text-blue-700' /> : <Bot className='h-4 w-4 text-emerald-700' />}
                </div>
                <div className={`rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-emerald-50 text-gray-800'}`}>
                  {m.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className='mt-3 flex flex-wrap gap-2'>
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className='inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50'
            >
              <Sparkles className='h-3 w-3' />
              {s}
            </button>
          ))}
        </div>

        <div className='mt-3 flex gap-2'>
          <input
            type='text'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isHindi ? 'अपना सवाल लिखें...' : 'Type your question...'}
            className='flex-1 rounded-full border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'
          />
          <button
            onClick={() => handleSend()}
            className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white transition hover:bg-emerald-700'
          >
            <Send className='h-5 w-5' />
          </button>
        </div>
      </div>

    </div>
  )
}
