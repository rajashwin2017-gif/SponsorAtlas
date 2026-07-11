'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Cpu, Stethoscope, Landmark, HardHat, GraduationCap, ConciergeBell, Lightbulb,
  type LucideIcon,
} from 'lucide-react'

const INDUSTRIES: {
  label: string; keyword: string; icon: LucideIcon; color: string; bg: string; border: string;
}[] = [
  { label: 'Technology Jobs',  keyword: 'Technology',  icon: Cpu,           color: '#3B82F6', bg: 'from-blue-50 to-blue-100/60',    border: 'hover:border-blue-300'  },
  { label: 'Healthcare Jobs',  keyword: 'Healthcare',  icon: Stethoscope,   color: '#10B981', bg: 'from-emerald-50 to-emerald-100/60', border: 'hover:border-emerald-300' },
  { label: 'Finance Jobs',     keyword: 'Finance',     icon: Landmark,      color: '#D97706', bg: 'from-amber-50 to-amber-100/60',   border: 'hover:border-amber-300'  },
  { label: 'Engineering Jobs', keyword: 'Engineering', icon: HardHat,       color: '#7C3AED', bg: 'from-violet-50 to-violet-100/60', border: 'hover:border-violet-300' },
  { label: 'Education Jobs',   keyword: 'Education',   icon: GraduationCap, color: '#DC2626', bg: 'from-red-50 to-red-100/60',       border: 'hover:border-red-300'    },
  { label: 'Hospitality Jobs', keyword: 'Hospitality', icon: ConciergeBell, color: '#EA580C', bg: 'from-orange-50 to-orange-100/60', border: 'hover:border-orange-300' },
  { label: 'Consulting Jobs',  keyword: 'Consulting',  icon: Lightbulb,     color: '#0891B2', bg: 'from-cyan-50 to-cyan-100/60',    border: 'hover:border-cyan-300'   },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show:   { opacity: 1, y: 0,  scale: 1, transition: { duration: 0.35, ease: 'easeOut' as const } },
}

export function IndustryBalls() {
  return (
    <section className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
          Every industry. Every route.
        </h2>
        <p className="mt-4 text-muted-foreground">
          126,000+ sponsors across all major UK sectors — all searchable, all ranked by real CoS activity.
        </p>
      </div>

      <motion.ul
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="mt-14 flex flex-wrap items-center justify-center gap-3"
      >
        {INDUSTRIES.map(({ label, keyword, icon: Icon, color, bg, border }) => (
          <motion.li key={label} variants={item}>
            <Link
              href={`/jobs?industry=${encodeURIComponent(keyword)}`}
              aria-label={`Browse ${label}`}
              className={`group flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-gray-200/80 bg-gradient-to-b ${bg} px-6 py-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${border}`}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm transition-transform duration-200 group-hover:scale-110">
                <Icon className="size-6" style={{ color }} aria-hidden="true" />
              </span>
              <span className="text-xs font-semibold tracking-wide text-slate-700 uppercase">
                {label}
              </span>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  )
}
