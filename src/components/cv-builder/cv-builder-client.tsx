"use client";

import { useState } from "react";
import {
  FileText, User, Briefcase, GraduationCap, Code, Plus, Trash2,
  Sparkles, Download, Loader2, CheckCircle2, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

type Section = "personal" | "summary" | "experience" | "education" | "skills";

interface CvData {
  personal: { name: string; email: string; phone: string; location: string; linkedin: string };
  summary: string;
  experience: { title: string; company: string; duration: string; bullets: string[] }[];
  education: { degree: string; school: string; year: string }[];
  skills: string[];
}

const EMPTY_CV: CvData = {
  personal: { name: "", email: "", phone: "", location: "", linkedin: "" },
  summary: "",
  experience: [{ title: "", company: "", duration: "", bullets: [""] }],
  education: [{ degree: "", school: "", year: "" }],
  skills: [],
};

const AI_SUGGESTIONS: Record<Section, string[]> = {
  personal: ["Add a professional LinkedIn URL", "Include your UK work location or preferred city"],
  summary: [
    "Quantify your impact (e.g. 'Led a team of 5 engineers')",
    "Mention your target visa route (Skilled Worker)",
    "Highlight 2-3 top achievements upfront",
  ],
  experience: [
    "Use action verbs: Led, Built, Improved, Reduced, Increased",
    "Add metrics: % improvement, £ saved, users impacted",
    "Align job titles to SOC code occupations",
  ],
  education: ["Include relevant certifications and professional memberships", "Add dissertation or final project if relevant"],
  skills: [
    "Match skills to the job description keywords",
    "Separate technical from soft skills",
    "Include tools, frameworks and methodologies",
  ],
};

const ATS_TIPS = [
  { label: "Contact info", done: (cv: CvData) => !!(cv.personal.name && cv.personal.email) },
  { label: "Professional summary", done: (cv: CvData) => cv.summary.length > 50 },
  { label: "Work experience", done: (cv: CvData) => cv.experience.some((e) => e.title && e.company) },
  { label: "Education", done: (cv: CvData) => cv.education.some((e) => e.degree) },
  { label: "Skills section", done: (cv: CvData) => cv.skills.length >= 4 },
];

const SECTIONS: { id: Section; label: string; icon: typeof User }[] = [
  { id: "personal", label: "Personal info", icon: User },
  { id: "summary", label: "Summary", icon: FileText },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Code },
];

export function CvBuilderClient() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<Section>("personal");
  const [cv, setCv] = useState<CvData>(EMPTY_CV);
  const [aiLoading, setAiLoading] = useState(false);
  const [skill, setSkill] = useState("");

  const atsScore = Math.round((ATS_TIPS.filter((t) => t.done(cv)).length / ATS_TIPS.length) * 100);
  const atsColor = atsScore >= 80 ? "text-emerald-600" : atsScore >= 50 ? "text-amber-600" : "text-red-600";

  function handleAiSuggest() {
    setAiLoading(true);
    setTimeout(() => {
      setAiLoading(false);
      toast("AI suggestions applied. Review and edit as needed.", "success");
      // Demo: fill in a sample summary if empty
      if (!cv.summary) {
        setCv((prev) => ({
          ...prev,
          summary: "Results-driven professional with 5+ years of experience delivering impactful solutions. Proven track record of improving efficiency by 30% through data-driven approaches. Seeking a Skilled Worker visa sponsored role in the UK to contribute expertise to a high-growth team.",
        }));
      }
    }, 1800);
  }

  function handleDownload() {
    toast("PDF export requires a Pro plan. Upgrade to download your CV.", "info");
  }

  function addSkill() {
    if (!skill.trim()) return;
    setCv((prev) => ({ ...prev, skills: [...prev.skills, skill.trim()] }));
    setSkill("");
  }

  return (
    <div className="container py-10 sm:py-14">
      {/* Header */}
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">AI CV Builder</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">Build your sponsorship CV</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          ATS-optimised for UK employers. Aligned to SOC code requirements for Skilled Worker visa roles.
        </p>
      </div>

      <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-[220px_1fr_260px]">
        {/* Section nav */}
        <aside>
          <div className="surface-card p-3">
            <nav className="space-y-0.5" aria-label="CV sections">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    activeSection === s.id
                      ? "bg-red-600/10 text-red-600"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <s.icon className="size-4" />
                  {s.label}
                </button>
              ))}
            </nav>

            {/* ATS score */}
            <div className="mt-4 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="eyebrow">ATS Score</p>
                <span className={cn("font-heading text-lg font-bold tabular", atsColor)}>{atsScore}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", atsScore >= 80 ? "bg-emerald-500" : atsScore >= 50 ? "bg-amber-500" : "bg-red-500")}
                  style={{ width: `${atsScore}%` }}
                />
              </div>
              <ul className="mt-2.5 space-y-1">
                {ATS_TIPS.map((t) => (
                  <li key={t.label} className={cn("flex items-center gap-1.5 text-xs", t.done(cv) ? "text-emerald-600" : "text-muted-foreground")}>
                    <CheckCircle2 className={cn("size-3.5", t.done(cv) ? "text-emerald-600" : "text-muted-foreground/40")} />
                    {t.label}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-3 space-y-2">
              <Button variant="gradient" size="sm" className="w-full gap-1.5" onClick={handleAiSuggest} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                {aiLoading ? "Improving…" : "AI improve"}
              </Button>
              <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={handleDownload}>
                <Download className="size-3.5" /> Download PDF
              </Button>
            </div>
          </div>
        </aside>

        {/* Editor */}
        <div className="surface-card min-h-[600px] p-6">
          {activeSection === "personal" && (
            <SectionWrapper title="Personal information" hint="Your contact details visible to employers.">
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldGroup label="Full name" id="name">
                  <Input id="name" value={cv.personal.name} onChange={(e) => setCv((p) => ({ ...p, personal: { ...p.personal, name: e.target.value } }))} placeholder="Alex Johnson" />
                </FieldGroup>
                <FieldGroup label="Email" id="email">
                  <Input id="email" type="email" value={cv.personal.email} onChange={(e) => setCv((p) => ({ ...p, personal: { ...p.personal, email: e.target.value } }))} placeholder="alex@example.com" />
                </FieldGroup>
                <FieldGroup label="Phone" id="phone">
                  <Input id="phone" value={cv.personal.phone} onChange={(e) => setCv((p) => ({ ...p, personal: { ...p.personal, phone: e.target.value } }))} placeholder="+44 7700 000000" />
                </FieldGroup>
                <FieldGroup label="Location" id="location">
                  <Input id="location" value={cv.personal.location} onChange={(e) => setCv((p) => ({ ...p, personal: { ...p.personal, location: e.target.value } }))} placeholder="London, UK" />
                </FieldGroup>
                <FieldGroup label="LinkedIn URL" id="linkedin" className="sm:col-span-2">
                  <Input id="linkedin" value={cv.personal.linkedin} onChange={(e) => setCv((p) => ({ ...p, personal: { ...p.personal, linkedin: e.target.value } }))} placeholder="linkedin.com/in/yourname" />
                </FieldGroup>
              </div>
            </SectionWrapper>
          )}

          {activeSection === "summary" && (
            <SectionWrapper title="Professional summary" hint="3-4 sentences. Mention your experience, key achievement, and visa sponsorship intention.">
              <textarea
                value={cv.summary}
                onChange={(e) => setCv((p) => ({ ...p, summary: e.target.value }))}
                rows={6}
                placeholder="Results-driven [role] with [X] years of experience in [industry]. Proven track record of [achievement]. Seeking a Skilled Worker visa sponsored role in the UK…"
                className="w-full resize-none rounded-xl border border-border bg-surface/60 p-4 text-sm outline-none transition focus:border-red-600/40"
              />
              <p className="mt-1.5 text-right text-xs text-muted-foreground">{cv.summary.length} characters</p>
            </SectionWrapper>
          )}

          {activeSection === "experience" && (
            <SectionWrapper title="Work experience" hint="Most recent role first. Use action verbs and quantify achievements.">
              <div className="space-y-6">
                {cv.experience.map((exp, i) => (
                  <div key={i} className="rounded-xl border border-border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role {i + 1}</span>
                      {cv.experience.length > 1 && (
                        <button
                          onClick={() => setCv((p) => ({ ...p, experience: p.experience.filter((_, j) => j !== i) }))}
                          className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-red-600/10 hover:text-red-600"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <FieldGroup label="Job title" id={`exp-title-${i}`}>
                        <Input id={`exp-title-${i}`} value={exp.title} onChange={(e) => { const next = [...cv.experience]; next[i] = { ...next[i], title: e.target.value }; setCv((p) => ({ ...p, experience: next })); }} placeholder="Software Engineer" />
                      </FieldGroup>
                      <FieldGroup label="Company" id={`exp-co-${i}`}>
                        <Input id={`exp-co-${i}`} value={exp.company} onChange={(e) => { const next = [...cv.experience]; next[i] = { ...next[i], company: e.target.value }; setCv((p) => ({ ...p, experience: next })); }} placeholder="Acme Corp" />
                      </FieldGroup>
                      <FieldGroup label="Duration" id={`exp-dur-${i}`} className="sm:col-span-2">
                        <Input id={`exp-dur-${i}`} value={exp.duration} onChange={(e) => { const next = [...cv.experience]; next[i] = { ...next[i], duration: e.target.value }; setCv((p) => ({ ...p, experience: next })); }} placeholder="Jan 2022 – Present" />
                      </FieldGroup>
                    </div>
                    <div className="mt-3 space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">Key achievements</label>
                      {exp.bullets.map((b, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <span className="text-muted-foreground">•</span>
                          <input
                            value={b}
                            onChange={(e) => { const next = [...cv.experience]; next[i].bullets[j] = e.target.value; setCv((p) => ({ ...p, experience: next })); }}
                            placeholder="Led a team of 5 engineers to deliver X, resulting in Y"
                            className="flex-1 rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm outline-none focus:border-red-600/40"
                          />
                          {exp.bullets.length > 1 && (
                            <button onClick={() => { const next = [...cv.experience]; next[i].bullets = next[i].bullets.filter((_, k) => k !== j); setCv((p) => ({ ...p, experience: next })); }} className="text-muted-foreground hover:text-red-600">
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={() => { const next = [...cv.experience]; next[i].bullets.push(""); setCv((p) => ({ ...p, experience: next })); }}
                        className="flex items-center gap-1 text-xs text-red-600 hover:underline"
                      >
                        <Plus className="size-3" /> Add bullet
                      </button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCv((p) => ({ ...p, experience: [...p.experience, { title: "", company: "", duration: "", bullets: [""] }] }))}
                >
                  <Plus className="size-4" /> Add experience
                </Button>
              </div>
            </SectionWrapper>
          )}

          {activeSection === "education" && (
            <SectionWrapper title="Education" hint="Include degrees, certifications and professional qualifications.">
              <div className="space-y-4">
                {cv.education.map((edu, i) => (
                  <div key={i} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-3">
                    <FieldGroup label="Degree / qualification" id={`edu-deg-${i}`} className="sm:col-span-2">
                      <Input id={`edu-deg-${i}`} value={edu.degree} onChange={(e) => { const next = [...cv.education]; next[i] = { ...next[i], degree: e.target.value }; setCv((p) => ({ ...p, education: next })); }} placeholder="BSc Computer Science" />
                    </FieldGroup>
                    <FieldGroup label="Year" id={`edu-yr-${i}`}>
                      <Input id={`edu-yr-${i}`} value={edu.year} onChange={(e) => { const next = [...cv.education]; next[i] = { ...next[i], year: e.target.value }; setCv((p) => ({ ...p, education: next })); }} placeholder="2022" />
                    </FieldGroup>
                    <FieldGroup label="Institution" id={`edu-sch-${i}`} className="sm:col-span-3">
                      <Input id={`edu-sch-${i}`} value={edu.school} onChange={(e) => { const next = [...cv.education]; next[i] = { ...next[i], school: e.target.value }; setCv((p) => ({ ...p, education: next })); }} placeholder="University of Manchester" />
                    </FieldGroup>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={() => setCv((p) => ({ ...p, education: [...p.education, { degree: "", school: "", year: "" }] }))}>
                  <Plus className="size-4" /> Add education
                </Button>
              </div>
            </SectionWrapper>
          )}

          {activeSection === "skills" && (
            <SectionWrapper title="Skills" hint="Add technical skills, tools and methodologies. Match keywords from target job descriptions.">
              <div className="flex gap-2">
                <Input
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill(); } }}
                  placeholder="Type a skill and press Enter"
                  className="flex-1"
                />
                <Button variant="gradient" onClick={addSkill} disabled={!skill.trim()}>
                  <Plus className="size-4" /> Add
                </Button>
              </div>
              {cv.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {cv.skills.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setCv((p) => ({ ...p, skills: p.skills.filter((_, j) => j !== i) }))}
                      className="group inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-3 py-1 text-sm text-foreground transition-colors hover:border-red-600/40 hover:text-red-600"
                    >
                      {s}
                      <Trash2 className="size-3 text-muted-foreground transition-colors group-hover:text-red-600" />
                    </button>
                  ))}
                </div>
              )}
              {cv.skills.length === 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-border py-8 text-center">
                  <Code className="mx-auto size-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">No skills added yet</p>
                </div>
              )}
              <div className="mt-4 rounded-lg border border-border bg-surface/50 p-3">
                <p className="text-xs font-semibold text-muted-foreground">Suggested for visa applications</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["Project management", "Stakeholder management", "Agile/Scrum", "Data analysis", "Technical writing"].map((s) => (
                    !cv.skills.includes(s) && (
                      <button
                        key={s}
                        onClick={() => setCv((p) => ({ ...p, skills: [...p.skills, s] }))}
                        className="rounded-full border border-dashed border-border px-2.5 py-0.5 text-xs text-muted-foreground hover:border-red-600/40 hover:text-red-600"
                      >
                        + {s}
                      </button>
                    )
                  ))}
                </div>
              </div>
            </SectionWrapper>
          )}
        </div>

        {/* AI tips panel */}
        <aside className="space-y-4">
          <div className="surface-card p-4">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-red-600" /> AI suggestions
            </p>
            <ul className="mt-3 space-y-2.5">
              {AI_SUGGESTIONS[activeSection].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
                  <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-red-600/10 text-[10px] font-bold text-red-600">{i + 1}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="surface-card overflow-hidden p-4">
            <p className="text-sm font-semibold">Target a sponsor</p>
            <p className="mt-1 text-xs text-muted-foreground">Run an AI Fit Check to match your CV to a specific sponsor.</p>
            <Link href="/search" className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600 hover:underline">
              Browse sponsors <ArrowRight className="size-3" />
            </Link>
          </div>

          <div className="surface-card p-4">
            <p className="text-sm font-semibold">Pro features</p>
            <ul className="mt-2 space-y-2">
              {["PDF & Word export", "Unlimited versions", "ATS keyword scanner", "Cover letter builder"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-red-600" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/pricing" className="mt-3 block">
              <Button variant="gradient" size="sm" className="w-full">Upgrade to Pro</Button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SectionWrapper({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-5 border-b border-border pb-4">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </div>
      {children}
    </div>
  );
}

function FieldGroup({ label, id, children, className }: { label: string; id: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
