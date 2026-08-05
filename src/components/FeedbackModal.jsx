import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageSquare, Send, CheckCircle2, Star, Bug, Sparkles } from 'lucide-react'

export default function FeedbackModal({ isOpen, onClose }) {
  const [rating, setRating] = useState(5)
  const [category, setCategory] = useState('feature') // 'feature' | 'bug' | 'ux'
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setComment('')
      onClose()
    }, 2000)
  }

  return (
    <AnimatePresence>
      {isOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-[#0F1420] p-6 text-white shadow-2xl shadow-black/50"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-[#38BDF8]/15 text-[#38BDF8]">
                <MessageSquare size={20} />
              </span>
              <div>
                <h2 className="text-lg font-extrabold tracking-wide text-white">Tester Feedback</h2>
                <p className="text-[11px] font-medium text-white/50">Send notes to dev team</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/60 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {submitted ? (
            <div className="my-8 flex flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#34D399]/20 text-[#34D399]">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="mt-3 text-lg font-bold text-white">Feedback Received!</h3>
              <p className="mt-1 text-[12px] text-white/50">Thank you for helping us polish the Rush Rideshare experience.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">Demo Rating</label>
                <div className="mt-1 flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        size={24}
                        className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-white/40'}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">Feedback Category</label>
                <div className="mt-1 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setCategory('feature')}
                    className={`flex items-center justify-center gap-1 rounded-xl border py-2 text-[11px] font-bold transition-all ${
                      category === 'feature'
                        ? 'border-[#38BDF8] bg-[#38BDF8]/15 text-white'
                        : 'border-white/10 bg-white/[0.03] text-white/40'
                    }`}
                  >
                    <Sparkles size={13} /> Feature
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('ux')}
                    className={`flex items-center justify-center gap-1 rounded-xl border py-2 text-[11px] font-bold transition-all ${
                      category === 'ux'
                        ? 'border-[#6366F1] bg-[#6366F1]/20 text-white'
                        : 'border-white/10 bg-white/[0.03] text-white/40'
                    }`}
                  >
                    <MessageSquare size={13} /> UX / Design
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('bug')}
                    className={`flex items-center justify-center gap-1 rounded-xl border py-2 text-[11px] font-bold transition-all ${
                      category === 'bug'
                        ? 'border-rose-500 bg-rose-500/20 text-white'
                        : 'border-white/10 bg-white/[0.03] text-white/40'
                    }`}
                  >
                    <Bug size={13} /> Bug Report
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10.5px] font-bold uppercase tracking-wider text-white/50">Your Notes</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Share feedback on ride requests, map experience, authentication, or UI feel..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-[12.5px] text-white placeholder-white/50 focus:border-[#38BDF8] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#38BDF8] py-3 text-[13px] font-extrabold text-[#061018] transition-transform active:scale-95"
              >
                <Send size={15} /> Submit Feedback
              </button>
            </form>
          )}
        </motion.div>
      </div>)}</AnimatePresence>
  )
}
