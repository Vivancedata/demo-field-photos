---
name: Field Capture Demo
description: >
  The Vivancedata demo shell — a black sheet, one green mono eyebrow beside a
  frame mark, a paste box, and a result that shows its own uncertainty.
  Tokens come entirely from @vivancedata/ui; this file records the shell layered
  on top and the rules that keep the three demos reading as siblings.
colors:
  background: "hsl(0 0% 0%)"
  card: "hsl(0 0% 4%)"
  foreground: "hsl(0 0% 93%)"
  muted-foreground: "hsl(0 0% 63%)"
  mute: "hsl(0 0% 49%)"
  border: "hsl(0 0% 15%)"
  brand: "hsl(152 45% 45%)"
  brand-foreground: "hsl(0 0% 4%)"
  destructive: "hsl(0 90% 55%)"
  mark: "hsl(190 65% 55%)"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 4.5vw, 3.5rem)"
    fontWeight: 600
    letterSpacing: "-0.045em"
  heading-2:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
  body-sm:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
  eyebrow:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    letterSpacing: "0.1em"
  field-label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "12px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "64px"
components:
  action-idle:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.brand-foreground}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "40px"
  action-busy:
    backgroundColor: "{colors.brand}"
    textColor: "{colors.brand-foreground}"
    rounded: "{rounded.sm}"
  action-disabled:
    backgroundColor: "transparent"
    textColor: "{colors.mute}"
    rounded: "{rounded.sm}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
  paste-box:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "16px"
  input-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.sm}"
    padding: "24px"
---

# Design System: Field Capture Demo

## Overview

**Creative North Star: "The Proof Bench"**

A bench, not a brochure. One surface, one job, and the visitor's own material
laid on it. The page is a black sheet with a single card at its centre: you put
something in, you press one control, and the machine shows you what it read —
including, deliberately, the parts it could not. Nothing decorates; the only
colour on the page before a result exists is the green of the eyebrow and the
frame mark beside it.

The shell exists because these three demos are one instrument in three
configurations. They share a ground, a card, a mono eyebrow, a paste box and a
six-state action. Left identical they were indistinguishable in a tab strip, so
each takes one hue from the chart ramp for its mark — the ramp is the same
green-to-cyan family as the brand, so the three read as siblings rather than as
three unrelated pages. This one is `--chart-3`, a cyan.

Every token here comes from `@vivancedata/ui` and is normative there; the app's
own `globals.css` declares no tokens at all and adds only the Tailwind component
and utility layers. What this file records is the shell above the contract.

The shell is **dark only**. `layout.tsx` hard-codes `class="dark"` on `<html>`
and ships no toggle and no light palette. That is a deliberate commitment — the
demo should feel like an instrument rather than a page — and it is also a real
constraint: contrast on the black sheet carries the entire accessibility burden,
and a visitor reading outdoors in daylight gets no lighter alternative.

**Key Characteristics:**
- One card, centred in the viewport, on a pure black ground.
- A green monospace eyebrow beside a mark that names the input.
- Depth is a hairline. There is no shadow anywhere on the page.
- The result shows its own uncertainty as prominently as its confidence.
- One control does the work, and it is legible in all six of its states.

## Colors

The palette is the shared dark contract, spent narrowly: an almost-black ground,
a barely-lifted card, ink-white headings, grey body copy, and one green that
appears only on the eyebrow, the primary action and the flagged panel's heading.

### Primary
- **Brand Green** (`hsl(152 45% 45%)`): the eyebrow, the primary action fill,
  the "Flagged, not guessed" heading, and inline links. It is the only
  saturated colour on the page before a result renders.

### Secondary
- **frame Mark** (`hsl(190 65% 55%)`): the page mark, and nothing else.
  It is drawn from the chart ramp so the three demos differ by one hue while
  staying in the brand family. It also tints the input card's top rule.

### Neutral
- **Sheet** (`hsl(0 0% 0%)`): the page ground, and the inside of the paste box.
- **Card** (`hsl(0 0% 4%)`): the input card and the footer band, lifted off the
  sheet by four points of lightness and a hairline.
- **Ink** (`hsl(0 0% 93%)`): the headline, field values, result prose.
- **Grey** (`hsl(0 0% 63%)`): body copy, field labels, flagged items.
- **Decorative Grey** (`hsl(0 0% 49%)`): metadata only.

### Status
- **Destructive** (`hsl(0 90% 55%)`): request errors, and an emergency intent.

### Named Rules

**The One Colour Rule.** Before a result exists, the page shows exactly two
saturated marks: the eyebrow and the mark beside it. Everything else is black,
white and grey. A second accent introduced anywhere on this surface breaks the
instrument feeling the shell is built for.

**The Decorative Grey Rule.** `mute` (3.1:1) and `faint` (2.5:1) do not clear
4.5:1 and may never carry copy a visitor has to read. **The shell currently
breaks this**: the hint under the disabled action — "Paste a field note, take the sample above,
or attach a photo, and this turns on" — is set in `text-mute`. It is the
one sentence that explains why the control is off, so it is exactly the copy the
rule exists to protect. It belongs in `muted-foreground`.

## Typography

**Display and body:** Geist. **Labels, eyebrows and the paste box:** Geist Mono.
No third face, no italic.

**Character:** the sans carries only the headline and the prose; everything that
names a piece of data — the eyebrow, every field label, the intent badges, the
panel headings — is uppercase mono with positive tracking. The effect is a
readout rather than a document, and it is what makes a one-page form feel like
an instrument.

### Hierarchy
- **Display** (600, `clamp(2.5rem, 4.5vw, 3.5rem)`, tracking `-0.045em`): the
  single `h1`. One per page, always the promise in plain words.
- **Heading 2** (600, 1.5rem, `-0.03em`): the result section's title.
- **Body** (400, 1rem): the standfirst under the headline, capped at
  `max-w-prose`.
- **Body Small** (400, 0.875rem): field values, result prose, hints, errors.
- **Eyebrow** (500, 0.75rem, `0.1em`, uppercase, mono): the one line above the
  headline, in brand green.
- **Field Label** (400, 0.75rem, `0.05em`, uppercase, mono, grey): every `dt`,
  every panel heading, the badges.

### Named Rules

**The Readout Rule.** If a piece of text names data rather than being data, it
is uppercase Geist Mono at 12px. Field labels, panel headings and badges follow
this without exception; prose never does.

## Layout

A single column, `max-w-3xl`, centred, with `px-6` and `py-16`. The body is a
flex column with `min-h-screen`: the main region takes `flex-1` and centres its
content vertically, and the footer sits as a band at the foot of the viewport.
This matters — before the fix the card sat in the top third and left the rest of
the page as void, which read as a truncated page rather than a composed one.
`flex-1` will not shrink below its content, so a long result still lays out
top-down and scrolls normally.

Vertical rhythm inside the column: 40px from eyebrow block to card, 40px from
card to result, 24px between result blocks, 16px inside them. The result's field
grid is two columns, three from `sm` up. The line-items table scrolls inside its
own `overflow-x-auto` container rather than widening the page.

## Elevation & Depth

**There are no shadows on this page.** Depth is entirely a hairline plus four
points of lightness: the card and the footer band sit at `hsl(0 0% 4%)` against
a pure black sheet, each outlined with a 1px `border` at `hsl(0 0% 15%)`. The
paste box inverts the relationship — it is *darker* than the card it sits in,
returning to the sheet colour, so the field reads as a well cut into the surface
rather than a panel stacked on it.

### Named Rules

**The Flat Bench Rule.** No `shadow-*` utility belongs on this surface. If a
element needs separating, it gets a hairline; if it needs emphasis, it gets the
green. The shared contract permits two shadow levels and this shell uses
neither, on purpose.

## Shapes

Two radii and no more. **6px** (`rounded-md` under this preset) on every control
and container: the card, the paste box, the chips, the action, the badges and
the result panels. **Full round** only on the spinner's arc. There are no pills
here — pills are the marketing site's language for a call to action, and this is
app chrome, which the shared contract sets at 6px squares.

The one departure from a plain rectangle is the input card's **top rule**: a 2px
top border in the demo's mark hue at 60% opacity, against a 1px hairline on its
other three sides. It is the only place the mark colour appears outside the mark
itself, and it ties the card to the page's identity without adding a second
decorative system.

## Components

### Eyebrow and Mark
- **Composition:** a 20px mark, then 10px, then the uppercase mono eyebrow in
  brand green.
- **Mark:** a 20×20 line-drawn glyph at 1.3–1.6px stroke, `aria-hidden`, tinted
  with the demo's chart hue. It names the *input*, never the brand.

### Primary Action
The one control that spends money, and the shell's most deliberate component.
Six states, each separated from the others by more than opacity, because the
page loads with an empty box and the disabled state is the first thing anyone
sees:

- **Idle:** solid brand fill, `brand-foreground` label, 6px, 40px min height.
- **Hover:** `brightness-110`.
- **Active:** `brightness-95`, nudged 1px down.
- **Focus:** a 2px `foreground` ring, offset 2px clear of the card.
- **Busy:** brand at 70% with an inline spinner, `cursor-progress`,
  `aria-busy`, and the label changes to the present participle.
- **Disabled:** hollow — a hairline border, no fill, muted label — plus a line
  of copy underneath saying what would turn it on.

The disabled treatment is hollow rather than faded on purpose: the earlier
version used `bg-primary` with `disabled:opacity-50`, and since `primary` is a
near-white pill in dark mode, half of it on a black sheet landed as flat mid-grey
that looked broken rather than waiting.

### Sample Chips
- **Style:** hairline border, transparent fill, 6px, 14px label.
- **Hover:** `bg-accent`, the neutral wash.
- **Focus:** 2px ring in `ring`, offset from the card.
- **Purpose:** load a bundled fictional sample so a visitor reaches the result
  state without typing. They are real buttons and must stay keyboard-reachable
  with a visible focus style.

### Paste Box
A `textarea` in Geist Mono at 14px, sheet-coloured inside the card, hairline
bordered, 6px, `resize-y`. Mono because the thing pasted is a transcript or a
document, and proportional type makes a misread column invisible.

### Result Panels
- **Field grid:** a `dl` of mono uppercase `dt` labels over ink `dd` values,
  falling back to an em dash when a field came back empty. Two columns, three
  from `sm`.
- **Bordered panel:** hairline, 6px, 16px padding, a mono uppercase heading, and
  its content at 14px.

### Flagged, Not Guessed
**The signature component of all three demos, and the reason they exist.** A
hairline panel whose mono uppercase heading is the only panel heading rendered in
brand green rather than grey, listing verbatim what the system could not read.

It must never be styled as an error, a warning or a caveat. It is the product's
best behaviour, and the visual system should treat it as a result, not a
shortfall. Green, not amber; a panel, not a toast; always rendered when the list
is non-empty, never collapsed behind a disclosure.

### Footer
A card-coloured band with a hairline top edge, 14px grey copy, and one brand
link back to vivancedata.com. It is the only route onward from the page.

## Do's and Don'ts

### Do:
- **Do** keep exactly one `h1`, and make it the promise in plain words.
- **Do** set anything that names data in uppercase Geist Mono at 12px.
- **Do** separate surfaces with a 1px hairline and four points of lightness.
- **Do** give the primary action six visually distinct states, and say in copy
  what turns it on when it is off.
- **Do** render "Flagged, not guessed" in brand green as a result, not a warning.
- **Do** keep the mark hue to the mark and the card's top rule, nothing else.

### Don't:
- **Don't** add a shadow. This surface is flat, and the hairline is the depth.
- **Don't** set copy a visitor must read in `mute` or `faint` — including the
  hint under the disabled action, which currently breaks this rule.
- **Don't** introduce a second accent colour, gradient, glow or floating shape.
- **Don't** use a pill. Pills are the marketing site's language; this is chrome
  at 6px.
- **Don't** style the flagged list as an error state.
- **Don't** let a result table widen the page; it scrolls in its own container.
- **Don't** write "VivanceData". The brand is Vivancedata, one word, capital V —
  the old spelling is still in this app's title, eyebrow and footer and is a
  defect to fix, not a style to match.
