'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'

const BallCanvas = dynamic(
  () => import('@/components/canvas/ball-canvas').then(m => ({ default: m.BallCanvas })),
  { ssr: false }
)

const INDUSTRIES = [
  { label: 'Technology',    emoji: '💻', color: '#3B82F6' },
  { label: 'Healthcare',    emoji: '🏥', color: '#10B981' },
  { label: 'Finance',       emoji: '📈', color: '#F59E0B' },
  { label: 'Engineering',   emoji: '⚙️',  color: '#8B5CF6' },
  { label: 'Education',     emoji: '🎓', color: '#EF4444' },
  { label: 'Hospitality',   emoji: '🏨', color: '#F97316' },
  { label: 'Consulting',    emoji: '💼', color: '#06B6D4' },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export function IndustryBalls() {
  return (
    <section className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-red-500">Coverage</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Every industry. Every route.
        </h2>
        <p className="mt-4 text-white/45">
          126,000+ sponsors across all major UK sectors — all searchable, all ranked by real CoS activity.
        </p>
      </div>

      <motion.ul
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mt-14 flex flex-wrap items-center justify-center gap-8"
      >
        {INDUSTRIES.map(({ label, emoji, color }) => (
          <motion.li
            key={label}
            variants={item}
            className="flex flex-col items-center gap-3"
          >
            <div className="h-28 w-28">
              <BallCanvas color={color} />
            </div>
            <span className="text-sm font-medium text-white/45">{label}</span>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  )
}
