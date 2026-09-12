# LearnMate AI — GitHub Pages Login Fixed

This build fixes the GitHub Pages login error:

`Unexpected token '<' ... is not valid JSON`

Why it happened:
GitHub Pages returned HTML for `/api/...` because there was no running Node backend.

## This version
- GitHub Pages automatically runs in **Demo Mode** when no backend URL is configured.
- Demo Kid / Parent / Teacher login works.
- Kid dashboard, teacher syllabus, quiz, reports and AI Tutor demo work.
- No JSON parsing crash.
- No broken `/socket.io/socket.io.js` request on GitHub Pages.

### Demo logins
- Kid: `LM-AARAV-1001` / `1234`
- Parent: `parent@demo.com` / `demo123`
- Teacher: `teacher@demo.com` / `demo123`

## Upload to GitHub
Upload these root files:
`index.html`, `style.css`, `app.js`, `sw.js`, `icon.svg`

For the **real backend**, deploy the `backend/` folder separately, then in browser console run:
`localStorage.setItem("learnmate_api_base","https://YOUR-BACKEND-URL"); location.reload();`
