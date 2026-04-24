# Accessibility

WCAG 2.2 AA is a release blocker for public, staff, and admin workflows in
Finnish and English.

## Implementation Requirements

- Use semantic landmarks and one logical `h1` per page.
- Provide a skip link.
- Ensure visible focus indicators and keyboard-operable controls.
- Do not rely on color alone.
- Respect reduced motion.
- Keep text readable at 200% zoom and at 320px width.
- Use sufficient color contrast for text, controls, focus, and state markers.
- Give every form control a visible label.
- Connect help and errors using `aria-describedby`.
- Use accessible error summaries.
- Use `aria-live` only for meaningful async status changes.

## Booking Slots

Slots must be native buttons or radio controls with names that include resource,
date, start time, end time, and availability state.

## Reservation Forms

Reservation forms must render only configured fields. Every visible input must
have a visible label, required state, autocomplete where appropriate, and errors
connected with `aria-describedby`. Slot selection must move users to the
reservation form page without losing keyboard access or screen reader context.

## Action Feedback

Async user actions must provide localized, accessible feedback. Success messages
may be transient when announced with polite live regions and enough time to read.
Error messages must remain visible until dismissed, replaced, or the user leaves
the page. Dismiss controls must have accessible names, feedback must not rely on
color alone, and motion must respect reduced-motion preferences.

## Staff Data Views

Tables must expose semantic headers and support keyboard use. On narrow screens,
use responsive alternatives that preserve labels and relationships.

## Acceptance

Automated axe checks must pass for primary public, staff, and admin routes in
both locales. Manual checks must cover keyboard-only use, focus order, screen
reader labels, 200% zoom, 320px width, reduced motion, and color contrast.
