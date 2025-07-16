#!/usr/bin/env zsh
# Copies local cards-sqlite.db to Raspberry Pi server
# Usage: ./copy-api-db-to-server.sh

set -e  # Exit on any error

remoteUser="pi"
remoteHost="raspberrypi.local"
remotePath="/home/pi/skorbord-cards/api/db/cards-sqlite.db"
localPath="api/db/cards-sqlite.db"

echo "Copying local database to ${remoteUser}@${remoteHost}:${remotePath} ..."

# Verify local file exists
if [[ ! -f "$localPath" ]]; then
    echo "Error: Local database file '$localPath' does not exist. Aborting." >&2
    exit 1
fi

# Check file size for safety
localSize=$(stat -f%z "$localPath" 2>/dev/null || stat -c%s "$localPath" 2>/dev/null)
if [[ $localSize -eq 0 ]]; then
    echo "Error: Local database file '$localPath' is empty. Aborting for safety." >&2
    exit 1
fi

echo "Local database size: $localSize bytes"

# Create backup on remote server first
echo "Creating backup on remote server..."
backupTimestamp=$(date +%Y%m%d_%H%M%S)
remoteBackupPath="/home/pi/skorbord-cards/api/db/cards-sqlite.db.backup.$backupTimestamp"

ssh "${remoteUser}@${remoteHost}" "cp '$remotePath' '$remoteBackupPath'"

if [[ $? -eq 0 ]]; then
    echo "Remote backup created: $remoteBackupPath"
else
    echo "Error: Failed to create remote backup. Aborting." >&2
    exit 1
fi

# Copy the local database to the server
echo "Copying database file..."
scp "$localPath" "${remoteUser}@${remoteHost}:${remotePath}"

if [[ $? -eq 0 ]]; then
    echo "Successfully copied local database to ${remoteUser}@${remoteHost}:${remotePath}"
    
    # Verify the copied file
    echo "Verifying copied file..."
    remoteSize=$(ssh "${remoteUser}@${remoteHost}" "stat -c%s '$remotePath'")
    
    if [[ $localSize -eq $remoteSize ]]; then
        echo "✅ File size verification passed (Local: $localSize bytes, Remote: $remoteSize bytes)"
        
        # Restart the service to ensure it picks up the new database
        echo "Restarting Skorbord Cards App service..."
        ssh "${remoteUser}@${remoteHost}" "sudo systemctl restart skorbord-cards-app"
        
        if [[ $? -eq 0 ]]; then
            echo "✅ Service restarted successfully"
            echo "🎉 Database copy operation completed successfully!"
            echo "📁 Remote backup available at: $remoteBackupPath"
        else
            echo "⚠️  Warning: Failed to restart service. You may need to restart it manually."
            echo "   Run: ssh ${remoteUser}@${remoteHost} 'sudo systemctl restart skorbord-cards-app'"
        fi
    else
        echo "❌ Error: File size mismatch after copy (Local: $localSize, Remote: $remoteSize)" >&2
        echo "Restoring from backup..."
        ssh "${remoteUser}@${remoteHost}" "cp '$remoteBackupPath' '$remotePath'"
        exit 1
    fi
else
    echo "❌ Error: Failed to copy database file. Check your network and SSH keys." >&2
    exit 1
fi
