## What it is
Landing page for Fabricio's personal challenge: help 100 people solve real problems for free using AI as the tool (not the product). Claude Design (dc) component + Firebase + EmailJS. Live at project100.dev.

## Key decisions
- AI is positioned as the tool, not the product — all copy leads with the problem, never the technology. This is a deliberate brand choice, not a style preference
- Full redesign using Claude Design (dc) component architecture — index.html is now a .dc.html file rendered via React runtime (support.js). GSAP and the old style.css/form.js/main.js are no longer used by the landing page (kept in repo but unused)
- Form reduced from 6 steps to 4: name, email, problem, phone. Business type and revenue steps intentionally removed
- Counter updated to 7 completed / 1 in progress / 92 spots left
- Second testimonial added: Martina S. from MRL event ticketing
- Grid of 100 cells added to hero — each cell has a hover tooltip; open cells open the form on click

## Context not in files
- Admin dashboard: admin.html — Firebase Authentication (email + password)
- GitHub repo: https://github.com/fab14rocha-dev/project100
- EmailJS fires on form submit to notify Fabricio of new leads
- Google Analytics: G-6D01FZTZ0R
- Firebase is only used for Firestore (leads/sessions/ads data) — it is NOT how the site is hosted
- Deploy: the live site at project100.dev is GitHub Pages, served from the `fab14rocha-dev/project100` repo. The project folder lives inside the main workspace monorepo, so deploying requires a git subtree push: `git subtree split --prefix "2. Projects/1. Active/13. Project 100" -b temp-split && git push project100 temp-split:main --force && git branch -D temp-split`. A plain `git push` to the workspace repo does nothing for the live site
- The `project100` git remote points to https://github.com/fab14rocha-dev/project100.git
- A `CNAME` file at the project root contains `project100.dev` — must stay committed or the custom domain breaks

## Session log
- 2026-06-15: Memory file created. Recent work: updated form copy, removed Calendly step, updated offer section and CTAs, added scroll hint arrow on mobile, restored CNAME for custom domain.
- 2026-06-16: Status flipped to Complete in the portfolio site, Calendly removed from tools list. Updated hero counter to 6 completed / 1 in progress / 93 spots left, deployed via git subtree push. Corrected a wrong note about Firebase deploy — the real deploy mechanism is the subtree push above. Also: the whole workspace Active/Archive/Live reorg (done in an earlier session) had never been committed to git — committed it today as a single large commit before this subtree push would work.
- 2026-06-21: Removed Book call (step 8) from admin funnel display — funnel now shows steps 1-6 only, step 6 gets the green completed style. Replaced hardcoded password login with Firebase Authentication (email + password). Disabled new account sign-ups in Firebase Console. Updated Firestore rules to require auth for reads. Deployed both changes.
- 2026-06-30: Full page redesign. Replaced old Vanilla HTML/CSS/GSAP stack with a Claude Design component. New design: dark warm tone, 10x10 progress grid, animated counters, testimonial slideshow. Form trimmed to 4 steps. Firebase/EmailJS/GA wired back in. Deployed.
