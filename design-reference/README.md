# Design Reference

The current live thedesignboutique.com is the design spec. This folder holds the reference we build against and diff to. Exact match is the target (Angelo mandate).

## Capture manifest

Screenshots to capture per page, at three breakpoints (375 mobile, 768 tablet, 1440 desktop), full-page:

- Home (with the "Laney Said" video ring hero and forest motif)
- A service page (e.g. /solutions/seo-services)
- About (+ Team, Vision & Values, saliXus Process)
- Work (portfolio mosaic) + one client detail page
- Testimonials (incl. the Joe Montana feature)
- Blog index ("Laney Said") + one blog post
- Gold (events) + one gold event
- Contact (with form)
- Global header (with "Hire Us!" CTA) and footer

Files named `<page>__<breakpoint>.png`. Source: the live site (safe to view; the backdoor only triggers on a crafted request, not a normal page load) or the local LocalWP import at tdb.loc.

## improvements.md

Anything on the live site that looks broken, inconsistent, or worth improving goes in `improvements.md` for Angelo's approval. Per the mandate, nothing changes from the current design without an explicit yes.
