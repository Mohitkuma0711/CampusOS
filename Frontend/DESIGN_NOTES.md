# CareerOS design notes

## Direction

CareerOS is a workbench for career decisions, not a generic productivity dashboard. The visual language uses the restraint of a paper dossier with the warmth of a human coach: a maroon signal color, quiet paper surfaces, editorial serif moments, and dense but calm utility controls.

## Tokens

- `--ink` is a deep green-black because career work needs high reading contrast without the coldness of pure black.
- `--paper` is a warm near-white because resumes, notes, and applications are documents first; it keeps the interface from becoming a blank SaaS canvas.
- `--maroon-core` is the CareerOS brand anchor, reserved for decisive actions and the central career core rather than scattered decoration.
- `--maroon-muted` is a low-intensity maroon for selected navigation and hover states; full-strength maroon on every interaction would read aggressive across a whole workbench.
- `--signal-green` marks progress and completed work because it reads as forward movement against the maroon anchor.
- `--apricot` is a human warmth token for coaching and mentorship moments, separating guidance from system status.

## Type

`Playfair Display` carries the feeling of a career milestone in hero and section headings. `DM Sans` owns every control, label, body line, and data point so the interface stays legible and the UI never competes with the user's content.

The type scale is explicit: `0.72rem` metadata, `0.82rem` utility text, `0.94rem` body copy, `1.15rem` lead copy, `1.55rem` module headings, `clamp(2.8rem, 6vw, 5rem)` hero display. Serif headings use tighter leading (`1.02`) while sans body text uses generous leading (`1.65`) for scanning and reflection.

## Composition

The five modules intentionally do not share one card pattern:

- Resume uses a split editor and paper-preview composition because writing and seeing the result are simultaneous tasks.
- ATS checker uses a horizontal comparison band because a candidate needs to compare the resume against a job signal.
- Mock interview uses a linear transcript layout because the user is practicing a sequence of turns.
- Skill tests use a progress rail with one active question because assessment is about momentum and state.
- Mentorship uses a calendar grid because time and availability are the core information.

The repeated rounded-card-with-icon pattern is explicitly rejected. It would make unrelated workflows look interchangeable and would flatten the difference between writing, comparison, conversation, assessment, and scheduling.

## Motion

There is one orchestrated motion moment: the 3D hero camera dollies from a wide shot to its resting position. The rest of the site is motion-quiet. Hover feedback only clarifies an action or changes a control's contrast; there are no scroll-triggered fade-ins, card lifts, or decorative loops. Reduced motion disables the camera movement and orbit, replacing it with a static arrangement.

## Copy rules

Copy names the next action and the user's real task: `Start mock interview`, `Compare resume to a job`, `Continue the assessment`, and `Find a mentor time`. Empty states describe what to do next, such as `Add your first target role to see matching jobs`, instead of saying `Nothing here yet`. We avoid dot-separated meta strings, vague `Get started` CTAs, em-dash-labeled headers, and all-caps prose because those patterns feel like template chrome rather than guidance.

## Accessibility and responsive behavior

Every link and button receives a visible maroon focus ring with a paper-colored offset. The 3D scene has a static fallback for WebGL failure and reduced-motion users, and labels remain HTML rather than being drawn into the canvas. At `880px`, the hero canvas becomes a full-width visual band above the copy. At `760px`, the sidebar becomes an icon rail and module compositions stack. At `640px`, the mentorship calendar collapses to a legible agenda list because a seven-column grid cannot preserve readable day cells. At `520px`, utility metadata wraps and the resume split becomes a vertical writing-then-preview flow.

## Critique

This avoids the generic cream-and-terracotta landing page by using maroon as a controlled signal inside a green-black workbench. It rejects a uniform card grid by giving each career task its own spatial grammar. It avoids all-caps labels and per-element scroll animation, replacing them with sentence-case guidance and one deliberate 3D entrance. The result is quieter than an AI-generated dashboard, but more specific to the actual decisions a candidate makes.
