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

## Staff Data Views

Tables must expose semantic headers and support keyboard use. On narrow screens,
use responsive alternatives that preserve labels and relationships.

## Acceptance

Automated axe checks must pass for primary public, staff, and admin routes in
both locales. Manual checks must cover keyboard-only use, focus order, screen
reader labels, 200% zoom, 320px width, reduced motion, and color contrast.
