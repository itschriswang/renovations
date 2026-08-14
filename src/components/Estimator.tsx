import { useMemo, useState, useId } from 'react';
import {
  DEFAULT_INPUT,
  FINISH_TIERS,
  FLOOR_AREAS,
  STOREYS,
  SUBFLOORS,
  estimate,
  type EstimatorBand,
  type EstimatorInput,
} from '../lib/estimator';

/**
 * The cost estimator.
 *
 * The only genuinely stateful thing on the site, which is why it is the only
 * React island. Nothing is gated: the result appears as you change the
 * answers, and the email field at the bottom is an optional way to keep a copy
 * — never a condition of seeing it.
 */

const AUD = new Intl.NumberFormat('en-AU', {
  style: 'currency',
  currency: 'AUD',
  maximumFractionDigits: 0,
});

const money = (n: number) => AUD.format(n);

interface Props {
  /**
   * The published cost bands, passed from the server. They are not imported
   * here because the loader that reads them uses node:fs.
   */
  bands: EstimatorBand[];
  /** Where the "email me this" form posts. */
  action: string;
  costsHref: string;
  contactHref: string;
}

export default function Estimator({ bands, action, costsHref, contactHref }: Props) {
  const [input, setInput] = useState<EstimatorInput>(DEFAULT_INPUT);
  const result = useMemo(() => estimate(input, bands), [input, bands]);
  const id = useId();

  const set = <K extends keyof EstimatorInput>(key: K, value: EstimatorInput[K]) =>
    setInput((prev) => ({ ...prev, [key]: value }));

  if (!result) return null;

  const maxShare = Math.max(...result.breakdown.map((b) => b.share));

  return (
    <div className="est">
      <form className="est__form" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="est__group">
          <legend className="est__legend">What are you building?</legend>
          <select
            className="est__select"
            value={input.projectType}
            onChange={(e) => set('projectType', e.target.value)}
            aria-label="Project type"
          >
            {bands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </fieldset>

        <fieldset className="est__group">
          <legend className="est__legend">How big, roughly?</legend>
          <div className="est__choices">
            {FLOOR_AREAS.map((a) => (
              <label key={a.id} className="est__choice">
                <input
                  type="radio"
                  name={`${id}-area`}
                  value={a.id}
                  checked={input.floorArea === a.id}
                  onChange={() => set('floorArea', a.id)}
                />
                <span>{a.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="est__group">
          <legend className="est__legend">Finish level</legend>
          <div className="est__choices est__choices--stacked">
            {FINISH_TIERS.map((f) => (
              <label key={f.id} className="est__choice est__choice--noted">
                <input
                  type="radio"
                  name={`${id}-finish`}
                  value={f.id}
                  checked={input.finish === f.id}
                  onChange={() => set('finish', f.id)}
                />
                <span>
                  <strong>{f.label}</strong>
                  <small>{f.note}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="est__row">
          <fieldset className="est__group">
            <legend className="est__legend">Single or double storey</legend>
            <div className="est__choices">
              {STOREYS.map((s) => (
                <label key={s.id} className="est__choice">
                  <input
                    type="radio"
                    name={`${id}-storeys`}
                    value={s.id}
                    checked={input.storeys === s.id}
                    onChange={() => set('storeys', s.id)}
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="est__group">
            <legend className="est__legend">What is the floor?</legend>
            <div className="est__choices">
              {SUBFLOORS.map((s) => (
                <label key={s.id} className="est__choice">
                  <input
                    type="radio"
                    name={`${id}-subfloor`}
                    value={s.id}
                    checked={input.subfloor === s.id}
                    onChange={() => set('subfloor', s.id)}
                  />
                  <span>{s.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <fieldset className="est__group">
          <legend className="est__legend">
            Are you removing or moving any load bearing walls?
          </legend>
          <div className="est__choices">
            <label className="est__choice">
              <input
                type="radio"
                name={`${id}-structural`}
                checked={input.structural}
                onChange={() => set('structural', true)}
              />
              <span>Yes, or probably</span>
            </label>
            <label className="est__choice">
              <input
                type="radio"
                name={`${id}-structural`}
                checked={!input.structural}
                onChange={() => set('structural', false)}
              />
              <span>No, the layout stays</span>
            </label>
          </div>
        </fieldset>
      </form>

      <output className="est__out" aria-live="polite">
        <p className="est__out-label">Indicative range, GST inclusive</p>
        <p className="est__range" data-numeric>
          {money(result.low)} to {money(result.high)}
        </p>
        <p className="est__weeks" data-numeric>
          Roughly {result.weeks[0]} to {result.weeks[1]} weeks on site
        </p>

        <p className="est__caveat">
          This is an estimate, not a quote. A quote is a fixed price in a contract, and we
          cannot give you one until we have measured the house and opened up enough of it to
          know what is behind the walls.
        </p>

        <h3 className="est__sub">Where the money goes</h3>
        <ul className="est__breakdown">
          {result.breakdown.map((b) => (
            <li key={b.label} className="est__line">
              <span className="est__line-label">{b.label}</span>
              <span className="est__bar-track" aria-hidden="true">
                <span className="est__bar" style={{ inlineSize: `${(b.share / maxShare) * 100}%` }} />
              </span>
              <span className="est__line-value" data-numeric>
                {money(b.low)}–{money(b.high)}
              </span>
              <span className="est__line-share" data-numeric>
                {b.share}%
              </span>
            </li>
          ))}
        </ul>

        <h3 className="est__sub">How we got there</h3>
        <p className="est__basis">
          Starting from our published band for{' '}
          <a href={`${costsHref}#${result.bandId}`}>{result.bandName}</a> —{' '}
          <span data-numeric>
            {money(result.baseLow)} to {money(result.baseHigh)}
          </span>{' '}
          — then adjusted for what you told us:
        </p>
        <ul className="est__applied">
          {result.applied.map((a) => (
            <li key={a.label}>
              <span>{a.label}</span>
              <span data-numeric>
                {a.factor === 1 ? 'no change' : `${a.factor > 1 ? '+' : ''}${Math.round((a.factor - 1) * 100)}%`}
              </span>
            </li>
          ))}
        </ul>

        <form className="est__email" method="post" action={action}>
          <h3 className="est__sub">Email me this estimate</h3>
          <p className="est__email-note">
            Optional. The numbers are already on this page — this just sends you a copy so you
            do not have to write it down.
          </p>
          <input type="hidden" name="estimate" value={JSON.stringify({ input, result })} />
          <div className="est__email-row">
            <label className="visually-hidden" htmlFor={`${id}-email`}>
              Your email address
            </label>
            <input
              className="est__input"
              id={`${id}-email`}
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <button className="button button--secondary" type="submit">
              Send it
            </button>
          </div>
          <div className="est__honeypot" aria-hidden="true">
            <label htmlFor={`${id}-company`}>Company (leave blank)</label>
            <input id={`${id}-company`} name="company" type="text" tabIndex={-1} autoComplete="off" />
          </div>
          <input type="hidden" name="started" value={String(Date.now())} />
        </form>

        <p className="est__next">
          Ready for a real number? <a href={contactHref}>Book a site consultation</a>.
        </p>
      </output>
    </div>
  );
}
