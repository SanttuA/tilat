# Product MVP

The MVP is a bilingual, accessible reservation service for browsing resources,
viewing availability, and managing bookings. It uses a product-specific domain
and API.

## User Goals

- Browse reservable resources without signing in.
- Search by Finnish or English resource/unit content.
- View resource details and available time slots.
- Sign in with authentik OIDC.
- Reserve an available slot.
- See and cancel own reservations.

## Staff Goals

- Work only within assigned units unless globally admin.
- Approve, deny, and cancel reservations.
- Create and edit resources, opening hours, and bilingual content.
- Assign and remove staff for units they manage.

## Admin Goals

- Manage all units, resources, reservations, users, and memberships.
- Use the Next staff/admin UI for normal work.
- Use Django admin as a maintenance fallback.

## Out Of Scope For V1

- Legacy reservation API compatibility.
- Payments.
- External calendar sync.
- Catering, reports, maps, and geospatial filtering.
- Machine translation.
- Per-resource staff permissions.
