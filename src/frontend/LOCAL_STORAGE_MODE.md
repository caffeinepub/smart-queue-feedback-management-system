# Local Storage Mode Documentation

## Overview

Local Storage Mode allows the Smart Queue & Feedback Management System to operate entirely within the browser using localStorage, without requiring backend canister calls. This mode is useful for development, testing, and offline demonstrations.

## How to Enable/Disable

1. Click the **Database icon** (📊) in the header navigation
2. Toggle the **"Enable Local Storage Mode"** switch
3. The page will reload and all queue/feedback operations will use browser storage

To disable, toggle the switch off and reload.

## Data Model

### Storage Keys

All localStorage keys use the namespace `sqfm:` with version `v1`:

- `sqfm:version` - Storage schema version
- `sqfm:v1:tokenCounters` - Per-service token counters
- `sqfm:v1:queue:{serviceId}` - Queue entries for a service
- `sqfm:v1:feedback:{serviceId}` - Feedback submissions for a service
- `sqfm:v1:services` - Available services (defaults provided)

### Queue Entry Schema

