# Skorbord App: Final Production Deployment Checklist (Raspberry Pi)

- [ ] 1. Ensure `.env` files are set up in both `api/` and `app/` with production values.
- [ ] 2. Build the frontend: `npm --prefix app run build`
- [ ] 3. Copy frontend build to Pi: `scp -r app/dist/* pi@raspberrypi.local:~/skorbord-cards/api/app/dist/`
- [ ] 4. Copy backend files to Pi: `rsync -av --exclude 'node_modules' --exclude 'scoreboards.db' --exclude '*.test.js' ./api/ pi@raspberrypi.local:~/skorbord-cards/api/`
- [ ] 5. Copy SQLite DB if needed: `scp api/scoreboards.db pi@raspberrypi.local:~/skorbord-cards/api/`
- [ ] 6. SSH into Pi and install backend dependencies: `cd ~/skorbord-cards/api && npm install`
- [ ] 7. Ensure backend serves static files from `app/dist/` (already configured)
- [ ] 8. Set up and enable systemd service (`skorbord-cards-app.service`) for backend
- [ ] 9. Set up and enable Cloudflared tunnel as a service for secure public access
- [ ] 10. Test production URLs: `https://cards.skorbord.app/:sqid` and `https://cards.skorbord.app/api/:sqid`
- [ ] 11. Document any last-minute issues or improvements in `manual_testing_report.md`
