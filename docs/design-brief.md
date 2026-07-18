# Design Brief — Rehabilitation Clinic App

> Hand this document to a UI/UX design agent. It describes the product, its users,
> every screen, the critical interactions, and the visual direction — enough to
> design the full interface without reading any code.

---

## 1. What the product is

A web application for **rehabilitation specialists and kinesiotherapists** to manage
patients, record clinical histories, perform standardized physical assessments, and
generate discharge reports. Its signature feature is showing a patient's **measurable
progress over time** — baseline vs. latest, visualized.

It is used **bedside on tablets**, so the design is **touch-first and calm** — a tool a
clinician holds in one hand while assessing a patient with the other.

## 2. Who uses it & the context of use

- **Primary user:** a clinician (physiotherapist / kinesiotherapist), often standing,
  holding a tablet, mid-assessment. Not at a desk.
- **Secondary user:** a clinic admin (reviews the audit trail, manages the clinic).
- **Environment:** clinic treatment rooms. Variable lighting, possibly gloved hands,
  intermittent wifi. Speed and large tap targets matter more than density.
- **Emotional tone:** trustworthy, precise, medical — but warm and reassuring, not
  cold or intimidating. This is healthcare, not enterprise software.

## 3. Design principles (constraints the design must honor)

1. **Tablet-first, touch-first.** Touch targets ≥ 44px. Data entry by **tapping**
   (sliders, steppers, segmented controls) — never by typing numbers where avoidable.
2. **One-handed reachability.** Primary actions reachable with a thumb; important
   controls near the bottom or sides, not only the top.
3. **Structured over free-text.** Measurements are numbers, entered via controls, so
   they can be compared and charted. Avoid open text fields for clinical values.
4. **Progressive, not overwhelming.** Short, tabbed forms — never endless scroll.
   Show the patient journey one clear step at a time.
5. **Bilingual (Armenian + English).** Armenian is the default. Text length varies
   between languages — layouts must not break when labels get longer.
6. **Legible under pressure.** Strong hierarchy, generous spacing, high contrast.
   A clinician should grasp a screen in a glance.
7. **Color carries meaning.** Green = improvement, red = decline, neutral gray = a
   tracked value with no "good direction." Use color semantically, not decoratively.

## 4. Visual direction

- **Overall feel:** clean clinical + warm. Think "modern health app," not "hospital
  EMR." Soft surfaces, rounded corners, gentle depth (subtle shadows/layering),
  purposeful whitespace.
- **Palette:** a calm **teal/cyan** primary (trust, care, medical) on light neutral
  surfaces. Semantic accents: teal/green for positive, red for negative, amber for
  warnings/offline, gray/blue for neutral. Avoid harsh pure-white-on-black.
- **Typography:** a clean, highly legible sans with a real pairing strategy — a
  characterful display face for headings, a neutral workhorse for data/labels. Must
  include good **Armenian** glyph support (e.g. Noto Sans Armenian as a fallback).
- **Depth & rhythm:** tappable cards lift slightly on hover/press; sticky action bars
  for primary tasks; intentional spacing rhythm, not uniform padding everywhere.
- **Motion:** subtle and functional — a joint dot growing when selected, a card
  lifting, a value snapping on a slider. Nothing decorative or distracting.
- **Avoid:** generic dashboard-template look, uniform card grids with no hierarchy,
  flat gray-on-white with one accent, dense enterprise tables.

## 5. Information architecture

```
Login
 └─ Patients (list, search, add)
     └─ Patient detail (biometrics + treatment cases)
         └─ Treatment case / "episode" (e.g. "Right shoulder rehab")
             ├─ Sessions (visits list) ──▶ Assessment screen  ★ the core
             ├─ Progress (baseline→latest comparison + charts)  ★ the payoff
             ├─ Anamnesis (history intake forms)
             └─ Epicrisis (auto-generated discharge report)
 └─ Audit trail (admin only)
```

Global chrome: a top bar with the app/brand, a **language switcher**, an **offline
indicator**, and a user menu (logout; admins also see "Audit trail").

## 6. Screen-by-screen UX

### 6.1 Login
- Centered card on a soft, atmospheric gradient background. Brand mark + name.
- Email + password, a clear primary "Sign in" button, inline error messaging.
- Feels calm and secure; sets the warm-clinical tone.

### 6.2 Patients list
- Header with title + prominent **"New patient"** action.
- A **search field** (by name).
- Patients shown as **tappable cards** (avatar with initials, name, age · phone,
  chevron). A friendly empty state when there are none.
- "New patient" opens a **modal form**: name, sex, DOB, phone, height, dominant hand,
  referring physician. Sensible touch inputs (selects, date, number stepper).

### 6.3 Patient detail
- Breadcrumb back to Patients. Patient name as the page title, with an **⋮ actions
  menu** (Edit patient / Remove patient — remove asks for confirmation and explains
  the record is hidden, not destroyed).
- A row of **biometric stat tiles** (height, dominant hand, sex, phone) — small
  uppercase label, big value.
- **Treatment cases** section: each case a tappable card (title, diagnosis, a status
  badge: Active / Discharged / On hold / Cancelled). "New case" opens a modal.

### 6.4 Treatment case (the hub) — tabbed
Title + diagnosis, a primary **"Start assessment session"** button, and tabs:
**Sessions · Progress · Anamnesis · Epicrisis.**

- **Sessions tab:** list of visits (session number + date) as tappable cards; each
  opens that session's assessment. "Start session" creates a new visit and jumps
  straight into assessment.

### 6.5 ★ Assessment screen (the UX centerpiece — design this most carefully)
This is where a clinician records measurements bedside. It must be effortless to tap.

- **Interactive body diagram (SVG):** a clean, schematic human figure with **tappable
  joint markers** (shoulders, elbows, wrists, hips, knees, ankles, neck, low back —
  left & right). Tapping a joint:
  - highlights it (e.g. the dot grows and changes color),
  - opens a **side drawer** for that joint.
- **Joint drawer** has two tabs:
  - **Range of motion (ROM):** for each motion (flexion, abduction, rotation…): an
    **Active/Passive** segmented toggle, the **normal range** shown for reference, and
    a **large slider + number stepper** to enter degrees.
  - **Strength (MMT):** for each muscle: a **0–5 segmented control** (tap a number).
- **Pain (VAS):** an always-visible card with a **0–10 slider** that shifts color
  (green→amber→red) as it rises, anchored "No pain" ↔ "Worst pain."
- **Sticky bottom save bar:** "N measurements ready" + a big **Save** button.
  When offline, the bar is disabled and an offline banner appears.
- Joints that already have data are visually marked on the diagram (so the clinician
  sees coverage at a glance).

Design goals here: **thumb-friendly, glanceable, satisfying to tap.** The body diagram
is the hero — make it feel like a purpose-built medical instrument, not a form.

### 6.6 ★ Progress tab (the payoff — the app's headline feature)
Shows measurable change over the course of treatment.

- A **metric selector** (ROM / MMT / VAS / Weight / BP / HR) and, when relevant, a
  **body-region filter**.
- A **baseline → latest comparison table**: each row is a motion/muscle/vital with
  **Baseline, Latest, Δ (change), % change**, and a **direction chip** — green ↗
  "Improvement," red ↘ "Decline," or neutral. Crucially, direction is semantic: for
  pain, a *decrease* is an improvement (shown green) — the design must support "the
  number went down but this is good."
- A **trend line chart** over sessions/time, one line per measurement, clean axes,
  a legend, in the palette.
- Empty state prompts recording at least two sessions to see progress.

Make this screen feel **rewarding and clear** — it's the moment the clinician sees the
patient is getting better. Hierarchy and color do the heavy lifting.

### 6.7 Anamnesis tab (history intake)
- Sub-tabs: **Disease history** and **Life history**.
- Short, well-grouped **text-area forms** (onset, mechanism, course, prior treatment,
  comorbidities, medications, red flags / contraindications; occupation, lifestyle,
  habits, allergies). Pre-filled from saved data; a Save button that enables only when
  something changed.

### 6.8 Epicrisis tab (auto-generated discharge report)
- A **"Generate"** (or "Regenerate") action.
- **Summary badges:** counts of improved / declined / unchanged metrics + number of
  sessions.
- The generated report body: patient + case, course of treatment, and the
  **baseline→latest findings grouped by test type**, plus goals and a summary. Present
  it as a clean, readable clinical document (this is what gets printed/handed over).

### 6.9 Audit trail (admin only)
- A **secure, official-feeling** screen. Title + a **"Verify integrity"** action that
  shows a reassuring "Integrity verified — N entries, chain intact" banner (or a red
  tamper warning).
- A note that the log is append-only and cannot be edited or deleted.
- Filters (by type, by action) + a **table**: When · User · Action (color-coded
  badge: Created/Updated/Removed) · Entity · IP.

## 7. Key reusable components to design
- **Tappable list/entity card** (patients, cases, sessions) with hover/press states.
- **Stat/biometric tile** (label + big value).
- **Status badge** (episode status; audit action; direction chip).
- **Segmented control** (Active/Passive, MMT 0–5) — large, tactile.
- **Value slider** (ROM degrees, VAS pain) with a number stepper companion.
- **Interactive body diagram** with selectable, state-aware joint markers.
- **Side drawer** with tabs (the joint entry panel).
- **Comparison table row** with baseline→latest→Δ→direction.
- **Trend line chart** styled as part of the design system.
- **Sticky action bar** (save), **modal form**, **top app bar** with language switch +
  offline indicator, **empty states**, **toasts/notifications**.

## 8. States to design (don't forget these)
- Loading (skeletons/spinners), **empty** (no patients / no sessions / no data yet),
  **error** (failed save), **offline** (banner + disabled writes), success (toast).
- **Both languages** — verify layouts with longer Armenian strings.
- Hover / focus / active / disabled for every interactive element.
- Admin vs clinician (admin sees the Audit trail entry; clinician does not).

## 9. Accessibility & non-functional
- Touch targets ≥ 44px; visible focus states; sufficient color contrast; never rely on
  color alone (pair direction color with an arrow/label).
- Respect reduced-motion.
- Responsive from tablet portrait/landscape up to desktop; must not overflow at 768px.
- Fast, glanceable, forgiving (confirm destructive actions; nothing is truly deleted).

## 10. Screens to prioritize if time-boxed
1. **Assessment screen** (body diagram + ROM/MMT/VAS entry) — hardest, highest value.
2. **Progress tab** (comparison table + trend chart) — the headline payoff.
3. **Patient list + patient detail** — the everyday navigation spine.
4. Epicrisis, Anamnesis, Login, Audit trail.

---

### One-paragraph summary (for a design agent's system prompt)

> Design a **tablet-first, touch-first web app for rehabilitation clinicians** to assess
> patients and visualize their recovery. Calm, warm-clinical aesthetic; teal primary on
> light neutral surfaces; strong hierarchy; semantic color (green = improvement, red =
> decline, neutral = tracked). Bilingual (Armenian default + English). The signature
> screens are an **interactive SVG body diagram** where tapping a joint opens a drawer
> to enter range-of-motion (slider), strength (0–5 segmented control), and pain (0–10
> slider); and a **Progress view** with a baseline→latest comparison table and trend
> chart that color-codes improvement — including "pain went down = good." Everything is
> big-tap, glanceable, and reassuring, used bedside on a tablet.
