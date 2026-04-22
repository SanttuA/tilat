# Permissions

Identity is owned by this application using Django-managed email/password users.
Global app admin and unit staff assignments live in this application and are
assigned through the backend.
Only active Django users can authenticate; deactivating a user blocks both
signin and any already-issued bearer tokens.
Password auth tokens expire after `PASSWORD_AUTH_TOKEN_TTL_DAYS` days, and the
web auth cookie lifetime must use the same value.
Protected web pages must validate the bearer token through the identity endpoint
before rendering protected user data.

## Roles

- Anonymous: browse public resources and availability.
- User: create and cancel own reservations.
- Unit staff: manage assigned units.
- Admin: manage everything.

## Unit Staff

Unit staff can manage reservations, resources, opening hours, bilingual content,
and staff memberships for their assigned units.

Unit staff cannot:

- Manage other units.
- Grant global admin.
- Remove their own final staff membership from a unit unless they are also admin.

## Admin

Admins can manage all units, resources, reservations, users, and staff
memberships. Admin status is an app-owned profile flag assigned through Django
admin or backend maintenance workflows.
