# Developer Reference: Meal Window Naming & Time Period Wording Guide

Pasted by the user during brainstorming on 2026-09-17 as inspiration/reference for a
future feature (dynamic naming of rolling-window entry groups). Not yet designed or
implemented — saved here verbatim so a future session can read it without relying on
chat history. Treat this as a reference the user supplied, not an approved spec: the
naming matrix, thresholds, and copy below still need to go through
`superpowers:brainstorming` before any of it is built.

---

This reference document defines dynamic window names, copy conventions, and fallback
rules for the `What Did I Eat` auto-clustering engine when grouping photos by time
windows (rather than a full 24h calendar day).

---

## 1. Rolling Window Wording Matrix (Chronological)

When photos cluster via the dynamic rolling threshold (e.g. captures within +60 mins of
previous item), the system labels each cluster based on the initial capture timestamp or
duration span:

| Time Span (Start) | Primary Window Title | Secondary Subtitle / Context | Example Use Case |
| :--- | :--- | :--- | :--- |
| **05:00 — 08:30** | **Early Morning Awakening** | Dawn bite, fresh hydration, early coffee | First tea, pre-workout banana, early shift |
| **08:30 — 11:30** | **Morning Breakfast** | Sourdough, eggs, morning brew | Main breakfast or mid-morning bakery run |
| **11:30 — 14:00** | **Midday Lunch** | Nourishing plate, savory bowl | Work lunch, quick salad, soup & sandwich |
| **14:00 — 16:30** | **Afternoon Bite & Coffee** | Sweet break, flat white, fruit plate | Energy dip snack, espresso, afternoon pastry |
| **16:30 — 18:30** | **Late Afternoon Grazing** | Aperitivo, light tapas, crisp refreshment | Pre-dinner appetizer, cheese & nuts |
| **18:30 — 21:30** | **Evening Dinner** | Shared feast, warm skillet, home cooked | Main evening dinner, restaurant with friends |
| **21:30 — 00:00** | **Late Evening Nibble** | Calming herbal tea, bedtime dessert | Dark chocolate, chamomile tea, late dessert |
| **00:00 — 05:00** | **Night Owl Kitchen** | Midnight pantry visit, night shift fuel | Late night toast, midnight snack |

---

## 2. Multi-Period & Grazing Adaptations

When entries span across multiple standard boundaries or extend significantly via the
+1h join threshold:

1. **Short duration (single item or ≤ 15 min):**
   - Format: `[Meal Type] Quick Bite` (e.g. *Midday Quick Bite*, *Morning Espresso Break*)
2. **Extended duration (spanning ≥ 75 min with multiple joined photos):**
   - Format: `[Start Period] & [Extended Period]`
   - Examples:
     - `Lunch & Afternoon Bites` (Started 12:12, finished 13:45)
     - `Dinner & Evening Dessert` (Started 19:15, finished 21:00)
     - `Leisurely Grazing Window` (3+ items spaced 45 mins apart)
3. **Ambiguous or Non-Traditional Times:**
   - Format by primary character: `Afternoon Fuel`, `Workdesk Grazing`, `Sunday Feast`

---

## 3. Location Metadata & Stamp Formatting

To keep awareness conscious without map clutter:
- **Location pill format:** `📍 {Neighborhood / Street}, {City}` (e.g. `📍 Hayes Valley, SF` or `📍 Home Kitchen`)
- **Metadata string:** `Photos taken at 12:12 · Hayes Valley`
- **Fallback when EXIF GPS is empty:** `📍 Location unlogged` or silent omission.

---

## 4. UI Rules & Fallback Hierarchy
- Never inject calorie, gram, macro, or guilt terminology.
- Display entry timeline in vertical stem order:
  ```
  19:00 (latest)
    |
  17:44
    |
  12:00 (first)
  ```
- If user sets grouping to **Strict Calendar Day**, window title defaults to `Tuesday, Oct 24` with photo count badges.
- If user sets grouping to **Traditional Meal Slots**, bucket strictly into: `Breakfast`, `Lunch`, `Dinner`, `Snacks`.
