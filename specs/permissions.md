# Permissions

authentik provides identity and a global `reservation-admins` group claim. Unit
staff assignments live in this application.

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
memberships. Admin status comes only from authentik group claims.
