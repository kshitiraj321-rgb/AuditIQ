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
  default: "border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]",
  accent: "border-slate-300 bg-slate-950 text-white shadow-[0_16px_36px_rgba(15,23,42,0.16)]",
  success: "border-emerald-200 bg-emerald-50 shadow-[0_8px_24px_rgba(15,23,42,0.05)]",
  warning: "border-amber-200 bg-amber-50 shadow-[0_8px_24px_rgba(15,23,42,0.05)]",
  danger: "border-rose-200 bg-rose-50 shadow-[0_8px_24px_rgba(15,23,42,0.05)]",
};

const accentText: Record<NonNullable<MetricCardProps["accent"]>, string> = {
  default: "text-slate-900",
  green: "text-emerald-700",
  amber: "text-amber-700",
  red: "text-rose-700",
  blue: "text-sky-700",
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
        <section className="rounded-lg border border-slate-200 bg-white/90 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.06)] backdrop-blur md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-2">
              {eyebrow ? (
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {eyebrow}
                </p>
              ) : null}
              <h1 className="text-2xl font-semibold text-slate-950 md:text-4xl">
                {title}
              </h1>
              {description ? (
                <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
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
    <section className={`rounded-xl border p-4 md:p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${toneClasses[tone]} ${className}`}>
      {(title || subtitle) && (
        <header className="mb-4 space-y-1">
          {title ? <h2 className={`text-sm font-semibold ${tone === "accent" ? "text-white" : "text-slate-950"}`}>{title}</h2> : null}
          {subtitle ? <p className={`text-sm leading-6 ${tone === "accent" ? "text-slate-300" : "text-slate-500"}`}>{subtitle}</p> : null}
        </header>
      )}
      {children}
    </section>
  );
}

export function MetricCard({ label, value, detail, footer, accent = "default", icon, trend }: MetricCardProps) {
  const TrendIcon = trend === "up" ? (
    <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
  ) : trend === "down" ? (
    <svg className="h-3 w-3 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
  ) : (
    <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>
  );

  return (
    <div className="group rounded-xl border border-slate-200 bg-white p-5 shadow-[0_8px_22px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 flex items-center gap-2">
          {icon && <span className="text-slate-400">{icon}</span>}
          {label}
        </p>
        {trend && (
          <span className="flex items-center justify-center rounded-full bg-slate-50 p-1">
            {TrendIcon}
          </span>
        )}
      </div>
      <p className={`text-3xl font-semibold tracking-tight ${accentText[accent]}`}>
        {value}
      </p>
      <div className="mt-3 flex-1 flex flex-col justify-between">
        {detail ? <div className="text-sm font-medium text-slate-600">{detail}</div> : <div />}
        {footer ? <p className="mt-5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{footer}</p> : null}
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
    default: "bg-slate-100 text-slate-700 border-slate-200",
    accent: "bg-sky-100 text-sky-700 border-sky-200",
    success: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warning: "bg-amber-100 text-amber-800 border-amber-200",
    danger: "bg-rose-100 text-rose-700 border-rose-200",
    slate: "bg-slate-900 text-white border-slate-900",
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
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 py-10 px-6 text-center transition-colors hover:border-slate-400 hover:bg-slate-50">
      {icon && <div className="mb-4 text-slate-400">{icon}</div>}
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{description}</p>
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-base font-semibold text-slate-950 md:text-lg">{title}</h2>
        {description ? <p className="max-w-2xl text-sm leading-6 text-slate-500">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
