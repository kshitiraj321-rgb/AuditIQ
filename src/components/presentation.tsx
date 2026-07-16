import type { ReactNode } from "react";

type ShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

type PanelProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  tone?: "default" | "accent" | "success" | "warning" | "danger";
};

type MetricCardProps = {
  label: string;
  value: string;
  detail?: ReactNode;
  footer?: string;
  accent?: "default" | "green" | "amber" | "red" | "blue";
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
};

const toneClasses: Record<NonNullable<PanelProps["tone"]>, string> = {
  default: "border-[#2A2E37] bg-[#181B21] shadow-[0_8px_24px_rgba(0,0,0,0.2)]",
  accent: "border-[#5E6AD2]/50 bg-[#181B21] text-white shadow-[0_16px_36px_rgba(94,106,210,0.15)]",
  success: "border-emerald-500/20 bg-emerald-500/5 shadow-[0_8px_24px_rgba(0,0,0,0.2)]",
  warning: "border-amber-500/20 bg-amber-500/5 shadow-[0_8px_24px_rgba(0,0,0,0.2)]",
  danger: "border-rose-500/20 bg-rose-500/5 shadow-[0_8px_24px_rgba(0,0,0,0.2)]",
};

const accentText: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  default: "text-white",
  green: "text-emerald-400",
  amber: "text-amber-400",
  red: "text-rose-400",
  blue: "text-[#22D3EE]",
};

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  className = "",
}: ShellProps) {
  return (
    <main className={`min-h-screen px-4 py-5 md:px-8 md:py-8 ${className}`}>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-xl border border-[#2A2E37] bg-[#181B21]/80 p-5 shadow-lg backdrop-blur-md md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-2">
              {eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9CA3AF]">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="text-2xl font-semibold text-white md:text-4xl tracking-tight">
                {title}
              </h1>
              {description ? (
                <p className="max-w-3xl text-sm leading-6 text-[#9CA3AF] md:text-base">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
          </div>
        </section>

        {children}
      </div>
    </main>
  );
}

export function Panel({
  title,
  subtitle,
  children,
  className = "",
  tone = "default",
}: PanelProps) {
  return (
    <section className={`rounded-xl border p-4 md:p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] ${toneClasses[tone]} ${className}`}>
      {(title || subtitle) && (
        <header className="mb-4 space-y-1">
          {title ? <h2 className={`text-sm font-semibold ${tone === "accent" ? "text-white" : "text-[#F3F4F6]"}`}>{title}</h2> : null}
          {subtitle ? <p className={`text-sm leading-6 ${tone === "accent" ? "text-slate-400" : "text-[#9CA3AF]"}`}>{subtitle}</p> : null}
        </header>
      )}
      {children}
    </section>
  );
}

export function MetricCard({ label, value, detail, footer, accent = "default", icon, trend }: MetricCardProps) {
  const TrendIcon = trend === "up" ? (
    <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
  ) : trend === "down" ? (
    <svg className="h-3 w-3 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
  ) : (
    <svg className="h-3 w-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>
  );

  return (
    <div className="group rounded-xl border border-[#2A2E37] bg-[#181B21] p-5 shadow-md transition duration-300 hover:-translate-y-[2px] hover:border-[#5E6AD2]/50 hover:shadow-[0_4px_20px_rgba(94,106,210,0.15)] flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9CA3AF] flex items-center gap-2">
          {icon && <span className="text-slate-500">{icon}</span>}
          {label}
        </p>
        {trend && (
          <span className="flex items-center justify-center rounded-full bg-slate-800/50 p-1 border border-slate-700/50">
            {TrendIcon}
          </span>
        )}
      </div>
      <p className={`text-3xl font-semibold tracking-tight ${accentText[accent]} tabular-nums`}>
        {value}
      </p>
      <div className="mt-3 flex-1 flex flex-col justify-between">
        {detail ? <div className="text-sm font-medium text-slate-400">{detail}</div> : <div />}
        {footer ? <p className="mt-5 text-[10px] font-semibold uppercase tracking-widest text-[#9CA3AF]">{footer}</p> : null}
      </div>
    </div>
  );
}

export function Tag({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "accent" | "success" | "warning" | "danger" | "slate";
}) {
  const classes: Record<NonNullable<typeof tone>, string> = {
    default: "bg-slate-800 text-slate-300 border-slate-700",
    accent: "bg-[#5E6AD2]/10 text-[#22D3EE] border-[#5E6AD2]/30",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    slate: "bg-slate-800 text-white border-slate-700",
  };

  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold ${classes[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#2A2E37] bg-[#181B21]/50 py-10 px-6 text-center transition-colors hover:border-[#5E6AD2]/50 hover:bg-[#181B21]">
      {icon && <div className="mb-4 text-slate-500">{icon}</div>}
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#9CA3AF]">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-4">
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-base font-semibold text-white md:text-lg tracking-tight">{title}</h2>
        {description ? <p className="max-w-2xl text-sm leading-6 text-[#9CA3AF]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
