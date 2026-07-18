# 📋 Design Brief — Rehab Clinic

> Filled from the actual application. Structure follows the enterprise-brief template,
> but note the key divergence: this is a **tablet-first, touch-first clinical tool**, not
> a desktop/dark-sidebar/dense-table enterprise app. Where the template assumed otherwise,
> the app's reality is called out.

## Role & Goal
Act as an expert clinical/enterprise UI/UX designer. Design a **scalable, accessible,
tablet-first** interface for a rehabilitation clinic records platform. Prioritize
**bedside touch efficiency, clear data hierarchy, and legible progress visualization**
over visual trends. The product handles medical PII, so it must feel trustworthy and
precise — but warm, not cold.

## 1. Project Overview
- **Product Name:** Rehab Clinic (working name; Armenian: *Վերականգնողական կլինիկա*).
- **Core Purpose:** A **multi-tenant clinical records & assessment platform** for
  rehabilitation / physiotherapy clinics. It carries a patient through the full journey:
  registration → clinical history (anamnesis) → standardized physical assessments
  (range-of-motion, muscle strength, pain) recorded across visits → **baseline-vs-latest
  progress tracking** → an auto-generated discharge report (epicrisis). Multi-tenant
  (clinic-scoped) from day one; single clinic today, many later.
- **Target Device(s):** **Tablet-first (touch, used bedside)** — the primary device.
  Responsive up to desktop for admin work. *Not* primarily desktop. No native mobile
  phone target (phone is too small for the assessment canvas).

## 2. Target Audience & User Personas
- **Primary Users:**
  - **Clinician** (physiotherapist / kinesiotherapist) — records assessments bedside,
    reviews progress, writes discharge reports. The main persona.
  - **Clinic admin** — manages the clinic and reviews the security **audit trail**.
- **User Environment:** Clinic treatment rooms. The clinician is often **standing,
  holding a tablet in one hand** while assessing a patient with the other. Variable
  lighting, possibly gloved hands, **intermittent wifi**. Admin work happens at a desk.
- **Pain Points to Solve:**
  - Free-text clinical notes that **can't be compared or charted** over time.
  - **Slow keyboard entry** at the bedside (needs tap-based input).
  - No clear, glanceable view of **whether the patient is actually improving**.
  - **Manual, time-consuming discharge reports** written from scratch.
  - No **audit trail / tamper-proofing** for sensitive medical records.
  - Bilingual staff (Armenian/English) forced to work in one language.

## 3. Visual Identity & Tone
- **Vibe:** Professional, trustworthy, modern, **clinical-clean but warm**. "Modern
  health app," not "legacy hospital EMR" and not "cold enterprise dashboard."
- **Color Palette:** **Light, neutral surfaces** with a calm **teal/cyan primary**
  (care, trust, medical). Semantic accents are load-bearing: **green = improvement,
  red = decline, amber = warning/offline, gray/blue = neutral (tracked, no direction)**.
  Gentle depth (soft shadows, layering), rounded corners.
  *Divergence from template:* **not** a dark sidebar / dark monitoring theme — the
  product is a light clinical surface. Dark mode is a nice-to-have, not the default.
- **Typography:** Highly legible sans optimized for data/labels (Inter / Roboto / SF Pro
  in spirit) **with first-class Armenian glyph support** (e.g. Noto Sans Armenian). A
  characterful display face for headings, a neutral workhorse for values/labels.
  Numbers and units (degrees, 0–10, kg) must read cleanly.
- **Avoid:** playful illustrations, motion that slows the workflow, low-contrast text,
  **dense enterprise data tables**, generic dashboard-template layouts, uniform card
  grids with no hierarchy.

## 4. Key Screens & Features to Design
Mapping the template's categories to the app's real screens (★ = highest priority / unique):

- **Overview / entry:** **Patients list** — searchable list of patients as **tappable
  cards** (avatar initials, name, age·phone, chevron), a prominent "New patient" action,
  and an empty state. (The app has no metrics dashboard; the "overview" of value is the
  per-patient **Progress** view, below.)
- **Data table / list views:**
  - **Sessions list** (visits within a treatment case) — cards with session # + date.
  - ★ **Comparison table** (Progress) — per motion/muscle/vital: **Baseline · Latest ·
    Δ · % change · direction chip** (green ↗ / red ↘ / neutral). Direction is *semantic*,
    not sign-based: for pain, a **decrease shows green** ("improved"). Design must support
    "the number went down and that's good."
  - **Audit trail table** (admin) — When · User · Action (color badge: Created/Updated/
    Removed/Viewed) · Entity · IP, with filters and a "Verify integrity" banner.
- **Detail / settings / forms:**
  - **Patient detail** — biometric **stat tiles** (height, dominant hand, sex, phone),
    a treatment-cases list, and a ⋮ menu (Edit / Remove-with-confirmation).
  - **Modal forms** — create/edit patient, create case — touch-friendly inputs
    (selects, date, number steppers) with validation.
  - **Anamnesis** — tabbed history forms (disease history / life history) as grouped
    text areas; pre-filled; save enabled only when changed.
- ★ **Assessment screen (the hero — design most carefully):** an **interactive SVG body
  diagram** with tappable joint markers (shoulders, elbows, wrists, hips, knees, ankles,
  neck, low back — L/R). Tapping a joint highlights it and opens a **side drawer** with
  two tabs: **Range of motion** (per motion: Active/Passive segmented toggle, the normal
  range shown, a large **slider + number stepper** for degrees) and **Strength** (a
  **0–5 segmented control** per muscle). A always-visible **Pain (VAS) card** with a 0–10
  slider that shifts color. A **sticky bottom save bar** ("N measurements ready" + Save),
  disabled with a banner when offline. Joints with data are marked on the diagram.
- ★ **Epicrisis (discharge report):** a Generate/Regenerate action, **summary badges**
  (improved / declined / unchanged / sessions), and a clean, printable report body
  grouping baseline→latest findings by test type.
- **Navigation:** a **top app bar** (brand/home, **language switcher EN/HY**, **offline
  indicator**, user menu → logout; admins also see "Audit trail"). Within a treatment
  case, content is organized by **tabs** (Sessions / Progress / Anamnesis / Epicrisis),
  and pages use **breadcrumbs**. *Divergence:* there is **no persistent left sidebar
  today** — navigation is list-drill-down + tabs. A collapsible sidebar could be proposed
  for a future multi-clinic admin area.

## 5. Technical Constraints & Handoff
- **Design System:** **Component-driven, built on Mantine** (the app's actual UI library)
  — so components should map to Mantine primitives (AppShell, Card, Modal, Drawer, Tabs,
  SegmentedControl, Slider, NumberInput, Table, Badge, Menu, Notifications). Touch targets
  **≥ 44px**; tap-based entry (sliders/steppers/segmented controls) over typing.
- **Deliverables:** Figma file with organized layers, auto-layout on all components, and
  an interactive prototype of the **primary workflow**: register patient → start session
  → tap a joint → enter ROM/strength/pain → save → view Progress.
- **States to Include:**
  - Hover / active / focus / disabled on every interactive element.
  - **Error** states with clear inline validation (forms, failed save toast).
  - **Loading** (skeletons/spinners) and **empty** states (no patients / no sessions /
    not enough data for a comparison — "record ≥ 2 sessions to see progress").
  - **Offline** state (banner + disabled writes) — a first-class state here.
  - **Both languages** (Armenian default + English) — verify layouts with longer Armenian
    strings; nothing may overflow.
  - **Role variants** — admin sees the Audit trail nav item; clinician does not.
  - **Semantic color never alone** — always pair direction color with an arrow/label.

## Reusable component inventory
Tappable entity card · biometric stat tile · status/direction badge · large segmented
control (Active/Passive, MMT 0–5) · value slider + number stepper · **interactive body
diagram with state-aware joint markers** · tabbed side drawer · comparison-table row ·
trend line chart · sticky save bar · modal form · top app bar (language + offline) ·
empty/loading/error states · toasts.

## Priority order (if time-boxed)
1. ★ **Assessment screen** (body diagram + ROM/MMT/VAS) — hardest, highest value.
2. ★ **Progress** (comparison table + trend chart) — the headline payoff.
3. Patients list + patient detail — the everyday navigation spine.
4. Epicrisis, Anamnesis, Login, Audit trail.

## One-paragraph summary (paste into a design agent)
> Design a **tablet-first, touch-first clinical app** for rehabilitation clinicians to
> assess patients and visualize recovery. Calm, warm-clinical light aesthetic; teal
> primary on neutral surfaces; strong hierarchy; **semantic color (green = improvement,
> red = decline, neutral = tracked)**. Bilingual (Armenian default + English), Mantine
> components, ≥44px touch targets. The signature screens are an **interactive SVG body
> diagram** where tapping a joint opens a drawer to enter range-of-motion (slider),
> strength (0–5 segmented control), and pain (0–10 slider); and a **Progress view** with
> a baseline→latest comparison table + trend chart that color-codes improvement —
> including "pain went down = good." Big-tap, glanceable, reassuring, used bedside.
