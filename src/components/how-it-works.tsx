import { Search, Building2, FileText, CheckCircle2 } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Search Employers",
    desc: "Search 126,000+ verified UK employers who hold an active visa sponsorship licence.",
  },
  {
    icon: Building2,
    title: "Check Hiring Signals",
    desc: "Review each employer's real CoS activity, sponsorship tier, and live hiring signals.",
  },
  {
    icon: FileText,
    title: "Apply With Confidence",
    desc: "Apply knowing the employer can sponsor your visa and support your move.",
  },
  {
    icon: CheckCircle2,
    title: "Get Hired & Relocate",
    desc: "Receive your offer, get your visa sponsorship and start your new career in the UK.",
  },
];

export function HowItWorks() {
  return (
    <section className="container py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">How It Works</h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Find a job that matches your skills and get hired by UK employers who sponsor.
        </p>
      </div>

      <div className="stagger relative mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {/* connecting dashed line (desktop only) */}
        <div
          className="pointer-events-none absolute inset-x-0 top-8 hidden h-0 border-t-2 border-dashed border-red-600/25 lg:block"
          aria-hidden="true"
        />
        {STEPS.map((step, i) => (
          <div key={step.title} className="relative flex flex-col items-center text-center">
            <span className="relative z-10 grid size-16 shrink-0 place-items-center rounded-full border-2 border-red-600 bg-card text-red-600">
              <step.icon className="size-6" />
            </span>
            <h3 className="mt-4 font-heading text-sm font-semibold">
              {i + 1}. {step.title}
            </h3>
            <p className="mt-1.5 max-w-[15rem] text-xs leading-relaxed text-muted-foreground">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
