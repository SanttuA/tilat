# Domain Model

All datetimes are stored in UTC. Business display timezone is
`Europe/Helsinki`.

## LocalizedText

Localized content is represented as:

```json
{ "fi": "Suomeksi", "en": "In English" }
```

Names require both languages. Optional descriptive fields may be blank in one
language and display with Finnish fallback.

## Entities

- `UserProfile`: reservation-domain profile linked to a Django password user.
- `Unit`: a location or organization that owns resources.
- `Resource`: a reservable room, equipment item, or service.
- `OpeningHours`: weekly opening interval for a resource.
- `Reservation`: user booking for one resource and time interval.
- `UnitStaffMembership`: app-managed user-to-unit staff assignment.

## Reservation States

- `requested`: created and awaiting approval.
- `confirmed`: accepted booking.
- `denied`: staff rejected request.
- `cancelled`: user or staff cancelled booking.

`requested` and `confirmed` reservations block overlapping bookings.

## Availability

Availability is generated from resource opening hours, existing blocking
reservations, `slot_minutes`, and the requested date. Slots are returned as
start/end ISO timestamps and an availability state.
