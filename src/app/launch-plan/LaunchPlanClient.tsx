'use client';

import { useEffect, useState } from 'react';
import './launch-plan.css';
import {
  LAUNCH_DATE,
  hero,
  terms,
  thesis,
  funnel,
  earlyAccess,
  economics,
  phases,
  weeklyThemes,
  community,
  expansion,
  v2Thesis,
  commercialKpis,
  kpis,
  team,
  teamNote,
  capacity,
  openDecisions,
} from './_content';

function useCountdown(target: Date) {
  // `null` on server + first client render = stable "—" placeholder, no hydration mismatch.
  // Real value lands in useEffect after mount.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) {
    return { days: null, hours: null, minutes: null, seconds: null, done: false };
  }
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { days, hours, minutes, seconds, done: diff === 0 };
}

export default function LaunchPlanClient() {
  const { days, hours, minutes, seconds, done } = useCountdown(LAUNCH_DATE);

  return (
    <div className="launch-plan-scope">
      <header className="lp-topbar">
        <div className="lp-topbar__inner">
          <span className="lp-wordmark">verity</span>
          <span className="lp-mono">launch-plan // v2 {'\u00b7'} merged 2026-04</span>
        </div>
      </header>

      <main>
        {/* ===== HERO ===== */}
        <section className="lp-container lp-hero">
          <div className="lp-hero__grid">
            <div>
              <div className="lp-eyebrow">{hero.eyebrow}</div>
              <h1 className="lp-display" style={{ marginTop: 12 }}>
                {hero.title}
              </h1>
              <p className="lp-body lp-hero__sub">{hero.subtitle}</p>
            </div>
            <aside className="lp-countdown" aria-label="Launch countdown">
              <div className="lp-countdown__label">{hero.launchDate}</div>
              <div className="lp-countdown__grid">
                <div className="lp-countdown__cell">
                  <div className="lp-countdown__num">{days === null || done ? '\u2014' : days}</div>
                  <div className="lp-countdown__unit">days</div>
                </div>
                <div className="lp-countdown__cell">
                  <div className="lp-countdown__num">{hours === null || done ? '\u2014' : hours}</div>
                  <div className="lp-countdown__unit">hrs</div>
                </div>
                <div className="lp-countdown__cell">
                  <div className="lp-countdown__num">{minutes === null || done ? '\u2014' : minutes}</div>
                  <div className="lp-countdown__unit">min</div>
                </div>
                <div className="lp-countdown__cell">
                  <div className="lp-countdown__num">{seconds === null || done ? '\u2014' : seconds}</div>
                  <div className="lp-countdown__unit">sec</div>
                </div>
              </div>
              <div className="lp-countdown__foot">
                {hero.launchLabel}
                <br />
                {hero.publicLaunch}
              </div>
            </aside>
          </div>
        </section>

        <hr className="lp-divider" />

        {/* ===== TERMS GLOSSARY ===== */}
        <section className="lp-container" style={{ paddingTop: 32, paddingBottom: 32 }}>
          <div className="lp-eyebrow">Terms at a glance</div>
          <dl className="lp-terms">
            {terms.map((t) => (
              <div key={t.term} className="lp-terms__row">
                <dt className="lp-terms__term">{t.term}</dt>
                <dd className="lp-terms__def">{t.def}</dd>
              </div>
            ))}
          </dl>
        </section>

        <hr className="lp-divider" />

        {/* ===== THESIS + PRIMITIVES ===== */}
        <section className="lp-container lp-section">
          <div className="lp-thesis__grid">
            <div>
              <div className="lp-eyebrow">01 // Thesis</div>
              <h2 className="lp-h1" style={{ marginTop: 12 }}>
                {thesis.title}
              </h2>
              <p className="lp-body" style={{ marginTop: 16, color: 'var(--lp-ink)' }}>
                {thesis.body}
              </p>
            </div>
            <div className="lp-primitives">
              {thesis.primitives.map((p) => (
                <div key={p.name} className="lp-primitive">
                  <div className="lp-primitive__role">{p.role}</div>
                  <div className="lp-primitive__name">{p.name}</div>
                  <div className="lp-primitive__detail">{p.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="lp-divider" />

        {/* ===== FUNNEL ===== */}
        <section className="lp-container lp-section">
          <div className="lp-eyebrow">02 // The funnel</div>
          <h2 className="lp-h1" style={{ marginTop: 12, marginBottom: 12 }}>
            {funnel.title}
          </h2>
          <p className="lp-body lp-body--muted" style={{ maxWidth: 780, marginBottom: 32 }}>
            {funnel.intro}
          </p>
          <div className="lp-funnel">
            {funnel.stages.map((s, i) => (
              <div key={s.code}>
                <article className="lp-funnel__stage" data-stage={s.code}>
                  <header className="lp-funnel__head">
                    <span className="lp-funnel__code">{s.code}</span>
                    <div className="lp-funnel__layer">{s.layer}</div>
                  </header>
                  <div className="lp-funnel__body">
                    <div className="lp-funnel__surface">{s.surface}</div>
                    <div className="lp-funnel__where">{s.where}</div>
                    <div className="lp-funnel__grid">
                      <div>
                        <div className="lp-funnel__key">Job</div>
                        <div className="lp-funnel__val">{s.job}</div>
                      </div>
                      <div>
                        <div className="lp-funnel__key">Captures</div>
                        <div className="lp-funnel__val">{s.capture}</div>
                      </div>
                      <div>
                        <div className="lp-funnel__key">Feeds into</div>
                        <div className="lp-funnel__val">{s.feedsInto}</div>
                      </div>
                    </div>
                  </div>
                </article>
                {i < funnel.stages.length - 1 ? (
                  <div className="lp-funnel__arrow" aria-hidden="true">
                    <span>{'\u2193'}</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <hr className="lp-divider" />

        {/* ===== EARLY ACCESS ===== */}
        <section className="lp-container lp-section">
          <div className="lp-eyebrow">03 // Flagship mechanic</div>
          <div className="lp-ea" style={{ marginTop: 16 }}>
            <div className="lp-ea__head">
              <div>
                <span className="lp-ea__pill">Early Access</span>
                <h3 className="lp-h1" style={{ marginTop: 12 }}>
                  {earlyAccess.title}
                </h3>
              </div>
              <p className="lp-body" style={{ maxWidth: 480 }}>
                {earlyAccess.summary}
              </p>
            </div>
            <div className="lp-ea__pillars">
              {earlyAccess.pillars.map((p) => (
                <div key={p.label}>
                  <div className="lp-ea__k">{p.k}</div>
                  <div className="lp-ea__label">{p.label}</div>
                </div>
              ))}
            </div>
            <ul className="lp-ea__benefits">
              {earlyAccess.benefits.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </div>

          {/* Unit economics sub-block */}
          <div className="lp-economics" style={{ marginTop: 24 }}>
            <div className="lp-economics__head">
              <span className="lp-eyebrow">{economics.title}</span>
              <span className="lp-economics__note">{economics.note}</span>
            </div>
            <div className="lp-economics__grid">
              {economics.rows.map((r) => (
                <div key={r.label} className="lp-economics__row">
                  <div className="lp-economics__label">{r.label}</div>
                  <div className="lp-economics__value">{r.value}</div>
                  <div className="lp-economics__detail">{r.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="lp-divider" />

        {/* ===== PHASES ===== */}
        <section className="lp-container lp-section">
          <div className="lp-eyebrow">04 // Three-phase protocol</div>
          <h2 className="lp-h1" style={{ marginTop: 12, marginBottom: 24 }}>
            Signal {'\u2192'} Deploy {'\u2192'} Compound.
          </h2>
          <div className="lp-phases">
            {phases.map((p) => (
              <article key={p.code} className="lp-phase">
                <div className="lp-phase__code">PHASE {p.code}</div>
                <div className="lp-phase__name">{p.name}</div>
                <div className="lp-phase__window">{p.window}</div>
                <p className="lp-body lp-body--muted" style={{ fontSize: 14 }}>
                  {p.objective}
                </p>
                <p className="lp-caption" style={{ fontSize: 13, color: 'var(--lp-ink)' }}>
                  {p.topActivity}
                </p>
                <p className="lp-phase__support">
                  <span className="lp-phase__support-label">Support</span> {p.support}
                </p>
                <div className="lp-phase__key">{'\u25C6'} {p.keyMoment}</div>
              </article>
            ))}
          </div>
        </section>

        <hr className="lp-divider" />

        {/* ===== WEEKLY THEMES ===== */}
        <section className="lp-container lp-section">
          <div className="lp-eyebrow">05 // Weekly themes</div>
          <h2 className="lp-h1" style={{ marginTop: 12, marginBottom: 12 }}>
            15 weeks, one theme each.
          </h2>
          <p className="lp-body lp-body--muted" style={{ maxWidth: 720, marginBottom: 24 }}>
            The campaign arc from May 1 to Aug 13. One line per week \u2014 scan the whole narrative in ten seconds.
          </p>
          <ol className="lp-weeks">
            {weeklyThemes.map((w) => (
              <li key={w.week} className="lp-weeks__row">
                <span className="lp-weeks__num">W{w.week}</span>
                <span className="lp-weeks__window">{w.window}</span>
                <span
                  className="lp-weeks__phase"
                  data-phase={w.phase.split(' ')[0].toLowerCase()}
                >
                  {w.phase}
                </span>
                <span className="lp-weeks__theme">{w.theme}</span>
              </li>
            ))}
          </ol>
        </section>

        <hr className="lp-divider" />

        {/* ===== COMMUNITY & LOYALTY STACK ===== */}
        <section className="lp-container lp-section">
          <div className="lp-eyebrow">06 // Retention layer</div>
          <h2 className="lp-h1" style={{ marginTop: 12, marginBottom: 12 }}>
            {community.title}
          </h2>
          <p className="lp-body lp-body--muted" style={{ maxWidth: 720, marginBottom: 24 }}>
            {community.intro}
          </p>
          <div className="lp-stack">
            {community.stack.map((s) => (
              <article key={s.code} className="lp-stack__item">
                <div className="lp-stack__code">{s.code}</div>
                <div>
                  <div className="lp-stack__head">
                    <h3 className="lp-stack__name">{s.name}</h3>
                    <span className="lp-stack__phase">{s.phase}</span>
                  </div>
                  <p className="lp-stack__detail">{s.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <hr className="lp-divider" />

        {/* ===== BEYOND 90 DAYS ===== */}
        <section className="lp-container lp-section">
          <div className="lp-eyebrow">07 // Expansion roadmap</div>
          <h2 className="lp-h1" style={{ marginTop: 12, marginBottom: 12 }}>
            {expansion.title}
          </h2>
          <p className="lp-body lp-body--muted" style={{ maxWidth: 720, marginBottom: 24 }}>
            {expansion.intro}
          </p>
          <div className="lp-v2" role="note" aria-label="v2 thesis">
            <span className="lp-v2__label">{v2Thesis.label}</span>
            <p className="lp-v2__statement">{v2Thesis.statement}</p>
            <p className="lp-v2__note">{v2Thesis.note}</p>
          </div>
          <div className="lp-expansion">
            {expansion.phases.map((p) => (
              <article key={p.code} className="lp-expansion__phase">
                <header className="lp-expansion__head">
                  <span className="lp-expansion__code">{p.code}</span>
                  <div>
                    <div className="lp-expansion__label">{p.label}</div>
                    <div className="lp-expansion__window">{p.window}</div>
                  </div>
                </header>
                <ul className="lp-expansion__items">
                  {p.items.map((it) => (
                    <li key={it.ip}>
                      <div className="lp-expansion__row">
                        <span className="lp-expansion__date">{it.date}</span>
                        <span className="lp-expansion__ip">{it.ip}</span>
                      </div>
                      <div className="lp-expansion__note">{it.note}</div>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <hr className="lp-divider" />

        {/* ===== KPIS ===== */}
        <section className="lp-container lp-section">
          <div className="lp-eyebrow">08 // KPIs at Day 90</div>
          <h2 className="lp-h1" style={{ marginTop: 12, marginBottom: 24 }}>
            What success looks like.
          </h2>
          <div className="lp-kpis">
            {kpis.map((k) => (
              <div key={k.metric} className="lp-kpi">
                <div className="lp-kpi__num">{k.day90}</div>
                <div className="lp-kpi__metric">{k.metric}</div>
                <div className="lp-kpi__note">{k.note}</div>
                {k.critical ? (
                  <div className="lp-kpi__critical">Critical</div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="lp-commercial" style={{ marginTop: 32 }}>
            <div className="lp-commercial__head">
              <span className="lp-eyebrow">{commercialKpis.title}</span>
            </div>
            <p className="lp-body lp-body--muted" style={{ maxWidth: 720, marginBottom: 16 }}>
              {commercialKpis.intro}
            </p>
            <div className="lp-commercial__grid">
              {commercialKpis.rows.map((r) => (
                <div key={r.metric} className="lp-commercial__row">
                  <div className="lp-commercial__target">{r.target}</div>
                  <div className="lp-commercial__metric">{r.metric}</div>
                  <div className="lp-commercial__note">{r.note}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="lp-divider" />

        {/* ===== TEAM + OPEN DECISIONS ===== */}
        <section className="lp-container lp-section">
          <div className="lp-ops">
            <div>
              <div className="lp-eyebrow">09 // Who owns what</div>
              <h2 className="lp-h1" style={{ marginTop: 12, marginBottom: 8 }}>
                Team.
              </h2>
              <p className="lp-caption" style={{ marginBottom: 16 }}>
                {teamNote}
              </p>
              <div>
                {team.map((t) => (
                  <div key={t.role} className="lp-team-row">
                    <div>
                      <div className="lp-team-role">{t.role}</div>
                      <div className="lp-team-who">{t.who}</div>
                    </div>
                    <div className="lp-team-owns">{t.owns}</div>
                  </div>
                ))}
              </div>

              {/* Capacity + contingency */}
              <div className="lp-capacity" style={{ marginTop: 24 }}>
                <div className="lp-capacity__head">
                  <span className="lp-eyebrow">{capacity.title}</span>
                </div>
                <p className="lp-caption" style={{ marginBottom: 16 }}>
                  {capacity.intro}
                </p>
                <div className="lp-capacity__table">
                  <div className="lp-capacity__hrow">
                    <span>Workstream</span>
                    <span>Primary</span>
                    <span>Backup</span>
                  </div>
                  {capacity.backups.map((b) => (
                    <div key={b.stream} className="lp-capacity__brow">
                      <span className="lp-capacity__stream">{b.stream}</span>
                      <span className="lp-capacity__primary">{b.primary}</span>
                      <span className="lp-capacity__backup">{b.backup}</span>
                    </div>
                  ))}
                </div>
                <div className="lp-capacity__drop">
                  <div className="lp-capacity__drop-label">Drop-able under stress</div>
                  <ul className="lp-capacity__drop-list">
                    {capacity.droppable.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div>
              <div className="lp-eyebrow">10 // Open decisions</div>
              <h2 className="lp-h1" style={{ marginTop: 12, marginBottom: 16 }}>
                Needs a call before May 14.
              </h2>
              <ul className="lp-decisions">
                {openDecisions.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
