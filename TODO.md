# Indigo Palm — Booking System TODO

## In Progress
- [ ] Finish checkout flow (guest pays → booking confirmed automatically)

## Up Next

### Hostaway Integration
- [ ] Research Hostaway API: create a reservation to block off calendar dates when booking is confirmed
- [ ] Trigger Hostaway reservation creation after payment confirmed (Square webhook or manual confirm)
- [ ] Prevent double-booking across direct + Airbnb channels

### Booking Confirmed Email (auto)
- [ ] Trigger "You're Booked" email automatically after:
  - Square payment webhook fires (payment received)
  - Or host manually marks as paid
- [ ] Email should include (based on Eann's existing template):
  - Property address
  - Check-in / check-out dates and nights
  - Link to Airbnb listing
  - Link to Welcome Guide
  - Link to indigopalm.co
  - Check-in instructions (or note that they're coming closer to date)
  - Warm sign-off in Indigo Palm brand voice (rewrite Eann's current plain-text version)

### Manual "Send Booking Confirmed" Tool
- [ ] Add a form on admin-approve.html (or a separate admin-send.html) to send a confirmed booking email manually
- [ ] Use case: guest pays via Zelle, or booking arranged outside the website
- [ ] Fields needed:
  - Guest name + email
  - Property (dropdown)
  - Check-in / check-out dates
  - Number of guests
  - Optional: pool heat, special notes
  - Send button → fires "You're Booked" email via Resend
- [ ] Should also trigger Hostaway calendar block

## Reference
- Eann's current "You're Booked" email (plain text, sent manually from Gmail):
  > Hi [Name], this is confirmation that we have received your payment.
  > We are looking forward to hosting you at [address] from [dates] ([X nights]).
  > Airbnb listing / Welcome Guide / Website links
  > Check-in instructions to come closer to the date.
  > Excited to host you! Eann
- This needs to be rewritten in Indigo Palm brand voice and sent via Resend (not Gmail)
