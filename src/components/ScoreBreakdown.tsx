import { groupFactors } from '../lib/scoring'
import type { ScoreResult } from '../types'

export function ScoreBreakdown({ result, compact = false }: { result: ScoreResult; compact?: boolean }) {
  const groups = groupFactors(result)
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.group}>
          <div className="mb-1.5 flex items-baseline justify-between text-xs font-semibold uppercase tracking-wide text-ink-faint">
            <span>{g.group}</span>
            <span className="tabular-nums normal-case tracking-normal">{g.earned.toFixed(1)} / {g.max}</span>
          </div>
          <ul className="space-y-1.5">
            {g.factors.filter((f) => !compact || f.earned > 0).map((f) => (
              <li key={f.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5">
                <div className={`min-w-0 text-[13px] ${f.earned > 0 ? 'text-ink' : 'text-ink-faint'}`}>
                  <span className="font-medium">{f.label}</span>
                  {f.detail && <span className="text-ink-soft">{`: ${f.detail}`}</span>}
                </div>
                <div className="text-right text-xs tabular-nums text-ink-soft">+{f.earned.toFixed(1)}<span className="text-ink-faint"> / {f.max}</span></div>
                <div className="col-span-2 h-1 overflow-hidden rounded-full bg-sand">
                  <div className="h-full rounded-full bg-accent/70 transition-all duration-500" style={{ width: `${Math.min(100, (f.earned / Math.max(1, f.max)) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <p className="border-t border-line pt-3 text-xs text-ink-faint">
        Raw {result.raw} of {result.max} possible points, shown as {result.percent}%. Weights and priorities are yours to change in Profile. Hiring and open-role signals are demo placeholders.
      </p>
    </div>
  )
}
