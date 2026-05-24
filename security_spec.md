# FF VAULT Security Specification

## Data Invariants
1. Listings must have a valid price (>= 0).
2. Only verified administrators can create, update, or delete listings.
3. Anyone can read available listings.
4. Listings cannot be modified by the public.
5. Status must be either 'available' or 'sold'.

## The Dirty Dozen Payloads (Red Team TDD)
1. **Unauthorized Create**: An unauthenticated user tries to post a listing.
2. **Identity Spoofing**: A authenticated user (not admin) tries to post a listing with their UID as sellerId.
3. **Price Poisoning**: An admin tries to set a negative price.
4. **State Skip**: A non-admin tries to mark a listing as 'sold'.
5. **Ghost Field**: An admin tries to add `isPromoted: true` which is not in the schema.
6. **ID Injection**: Trying to use a 2MB string as a listing ID.
7. **Admin Escalation**: A normal user tries to create a document in the `/admins/` collection.
8. **Malicious Delete**: A normal user tries to delete an admin's listing.
9. **Email Spoof**: An unverified email user tries to access admin data.
10. **Type Poisoning**: Sending `price: "999"` (string) instead of a number.
11. **Timestamp Manipulation**: Sending a `createdAt` from 2020.
12. **Blanket Read Attack**: Trying to query a collection without filters that should be private (if any were private).

## Success Criteria
- Public can only `get` and `list` from `listings`.
- Only `isAdmin()` can `write` to `listings`.
- Only existing admins can add new admins (or it's bootstrapped).
