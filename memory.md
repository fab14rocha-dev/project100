## What it is
Landing page for Fabricio's personal challenge: help 100 people solve real problems for free using AI as the tool (not the product). Vanilla HTML/CSS/JS + Firebase + EmailJS + GSAP. Live at project100.dev.

## Key decisions
- AI is positioned as the tool, not the product — all copy leads with the problem, never the technology. This is a deliberate brand choice, not a style preference
- Calendly was removed from the form flow (was step 8) — simplified to direct contact only
- Counter on the page tracks both completed and in-progress cases

## Context not in files
- Admin dashboard: admin.html — password `fab-admin-2026`
- GitHub repo: https://github.com/fab14rocha-dev/project100
- EmailJS fires on form submit to notify Fabricio of new leads
- Google Analytics: G-6D01FZTZ0R
- Deploy: Firebase deploy required after every change — git push alone does not update the live site

## Session log
- 2026-06-15: Memory file created. Recent work: updated form copy, removed Calendly step, updated offer section and CTAs, added scroll hint arrow on mobile, restored CNAME for custom domain.
- 2026-06-16: No code changes. Status flipped to Complete in the portfolio site (project is built and done, even though the 100-person challenge is ongoing). Calendly removed from tools list in portfolio card.
