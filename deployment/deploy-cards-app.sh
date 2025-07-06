#!/bin/bash
# Build and deploy Skorbord frontend to Raspberry Pi (bash version)

# 1. Build the frontend (from project root, using app as prefix)
npm --prefix app run build

# 2. Copy built files to Raspberry Pi backend directory (so Express can serve them)
ssh pi@raspberrypi.local "mkdir -p ~/skorbord-cards/api/app/dist"
scp -r app/dist/* pi@raspberrypi.local:~/skorbord-cards/api/app/dist/

# 3. (Optional) Copy updated backend files if needed
rsync -av --exclude 'node_modules' --exclude 'scoreboards.db' --exclude '*.test.js' ./api/ pi@raspberrypi.local:~/skorbord-cards/api/

# 4. Restart the backend service on the Pi (serves both API and frontend)
ssh pi@raspberrypi.local "sudo systemctl restart skorbord-cards-app.service"

echo "skorbord-cards-app.service restarted successfully on Raspberry Pi."
