# Copies local cards-sqlite.db to Raspberry Pi server
# Usage: .\copy-api-db-to-server.ps1

param()

# Configuration
$remoteUser = "pi"
$remoteHost = "raspberrypi.local"
$remotePath = "/home/pi/skorbord-cards/api/db/cards-sqlite.db"
$localPath = "api\db\cards-sqlite.db"

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Cyan
}

Write-Status "Copying local database to ${remoteUser}@${remoteHost}:${remotePath} ..."

try {
    # Verify local file exists
    if (-not (Test-Path $localPath)) {
        Write-Error "Local database file '$localPath' does not exist. Aborting."
        exit 1
    }

    # Check file size for safety
    $localFile = Get-Item $localPath
    $localSize = $localFile.Length

    if ($localSize -eq 0) {
        Write-Error "Local database file '$localPath' is empty. Aborting for safety."
        exit 1
    }

    Write-Status "Local database size: $localSize bytes"

    # Create backup on remote server first
    Write-Status "Creating backup on remote server..."
    $backupTimestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $remoteBackupPath = "/home/pi/skorbord-cards/api/db/cards-sqlite.db.backup.$backupTimestamp"

    $sshBackupCommand = "ssh ${remoteUser}@${remoteHost} `"cp '$remotePath' '$remoteBackupPath'`""
    $result = cmd /c $sshBackupCommand 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Remote backup created: $remoteBackupPath"
    } else {
        Write-Error "Failed to create remote backup. Aborting."
        Write-Error $result
        exit 1
    }

    # Copy the local database to the server
    Write-Status "Copying database file..."
    $scpCommand = "scp `"$localPath`" ${remoteUser}@${remoteHost}:${remotePath}"
    $result = cmd /c $scpCommand 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Successfully copied local database to ${remoteUser}@${remoteHost}:${remotePath}"
        
        # Verify the copied file
        Write-Status "Verifying copied file..."
        $sshSizeCommand = "ssh ${remoteUser}@${remoteHost} `"stat -c%s '$remotePath'`""
        $remoteSize = [int](cmd /c $sshSizeCommand 2>&1)
        
        if ($localSize -eq $remoteSize) {
            Write-Success "File size verification passed (Local: $localSize bytes, Remote: $remoteSize bytes)"
            
            # Restart the service to ensure it picks up the new database
            Write-Status "Restarting Skorbord Cards App service..."
            $restartCommand = "ssh ${remoteUser}@${remoteHost} `"sudo systemctl restart skorbord-cards-app`""
            cmd /c $restartCommand
            
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Service restarted successfully"
                Write-Success "Database copy operation completed successfully!"
                Write-Status "Remote backup available at: $remoteBackupPath"
            } else {
                Write-Warning "Failed to restart service. You may need to restart it manually."
                Write-Warning "Run: ssh ${remoteUser}@${remoteHost} 'sudo systemctl restart skorbord-cards-app'"
            }
        } else {
            Write-Error "File size mismatch after copy (Local: $localSize, Remote: $remoteSize)"
            Write-Status "Restoring from backup..."
            $restoreCommand = "ssh ${remoteUser}@${remoteHost} `"cp '$remoteBackupPath' '$remotePath'`""
            cmd /c $restoreCommand
            exit 1
        }
    } else {
        Write-Error "Failed to copy database file. Check your network and SSH keys."
        Write-Error $result
        exit 1
    }

} catch {
    Write-Error "An error occurred: $_"
    exit 1
}
