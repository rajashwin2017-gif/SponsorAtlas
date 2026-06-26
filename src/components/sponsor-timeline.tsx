'use client'

import { motion } from 'framer-motion'
import { Search, Zap, Target, Send, FileCheck, PartyPopper } from 'lucide-react'

const STEPS = [
  {
    icon: Search,
    title: 'Discover Sponsors',
    category: 'Search & Filter',
    color: '#3B82F6',
    bg: '#1e3a5f',
    date: 'Step 01',
    points: [
      'Search 126,000+ active UK sponsors by name, city or industry',
      'Filter by visa route — Skilled Worker, GBM, Scale-up and more',
      'See live CoS volumes from 2025 Home Office data',
    ],
  },
  {
    icon: Zap,
    title: 'Read Hiring Signals',
    category: 'Live Intelligence',
    color: '#F59E0B',
    bg: '#3d2c00',
    date: 'Step 02',
    points: [
      'Spot sponsors with Very High or High hiring activity scores',
      'Cross-reference CoS activity with real job postings',
      'Avoid companies that hold a licence but stopped hiring years ago',
    ],
  },
  {
    icon: Target,
    title: 'Score Your Fit',
    category: 'AI Fit Engine',
    color: '#8B5CF6',
    bg: '#2e1065',
    date: 'Step 03',
    points: [
      'Run AI Sponsorship Fit against your SOC code and salary band',
      'Get a personalised score for each employer on your shortlist',
      'See which roles the sponsor has historically filled via CoS',
    ],
  },
  {
    icon: Send,
    title: 'Apply Targeted',
    category: 'Smart Applications',
    color: '#10B981',
    bg: '#052e16',
    date: 'Step 04',
    points: [
      'Focus only on employers with proven, recent sponsorship history',
      "Tailor your cover letter using the company's CoS trends",
      'Track saved sponsors and set alerts for new job openings',
    ],
  },
  {
    icon: FileCheck,
    title: 'Receive Your CoS',
    category: 'Certificate of Sponsorship',
    color: '#EF4444',
    bg: '#450a0a',
    date: 'Step 05',
    points: [
      'Employer issues a Certificate of Sponsorship via the Home Office',
      'Typical issuance time: 3–10 working days after job offer',
      'Your CoS reference number unlocks the visa application',
    ],
  },
  {
    icon: PartyPopper,
    title: 'Start Your UK Career',
    category: 'Visa Granted',
    color: '#F97316',
    bg: '#431407',
    date: 'Step 06',
    points: [
      'Submit your Skilled Worker visa application online',
      'Decision in as little as 3 weeks with priority processing',
      'Collect your BRP and begin work in the UK',
    ],
  },
]

type Step = (typeof STEPS)[number]

function TimelineCard({ step, index }: { step: Step; index: number }) {
  const isLeft = index % 2 === 0

  return (
    <div className={`relative flex items-center gap-8 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, x: isLeft ? -48 : 48 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.55, ease: 'easeOut', delay: 0.1 }}
        className="w-[calc(50%-2.5rem)] rounded-2xl border border-border bg-card p-6 shadow-sm"
        style={{ borderLeft: `3px solid ${step.color}` }}
      >
        <span className="text-xs font-bold tracking-widest uppercase" style={{ color: step.color }}>
          {step.date}
        </span>
        <h3 className="mt-2 font-heading text-lg font-semibold text-foreground">{step.title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground font-medium">{step.category}</p>
        <ul className="mt-4 space-y-2">
          {step.points.map(pt => (
            <li key={pt} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: step.color }} />
              {pt}
            </li>
          ))}
        </ul>
      </motion.div>

      {/* Centre node */}
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.4, delay: 0.05, type: 'spring', stiffness: 200 }}
        className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 shadow-lg"
        style={{ background: step.bg, borderColor: step.color + '55' }}
      >
        <step.icon className="h-6 w-6" style={{ color: step.color }} />
      </motion.div>

      {/* Spacer for the other side */}
      <div className="w-[calc(50%-2.5rem)]" />
    </div>
  )
}

export function SponsorTimeline() {
  return (
    <section className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
          Your path to UK sponsorship
        </h2>
        <p className="mt-4 text-muted-foreground">
          From cold search to Certificate of Sponsorship — a proven six-step process.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative mx-auto mt-16 max-w-4xl">
        {/* Vertical line */}
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border" aria-hidden="true" />

        <div className="flex flex-col gap-12">
          {STEPS.map((step, i) => (
            <TimelineCard key={step.title} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
