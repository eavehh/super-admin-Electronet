# CSMS Admin Panel - API Integration Guide

## Quick Start

1. **Download and Install**
   \`\`\`bash
   # Download the code via "Download ZIP" or clone from GitHub
   npm install
   npm run dev
   \`\`\`

2. **Configure Server**
   - The backend is already configured to use: `http://176.88.248.139:8081`
   - To change the server, edit `lib/config.ts` and update `baseUrl`

3. **Create Account**
   - Navigate to `/register`
   - Create a superadmin account
   - You'll be automatically logged in

## API Integration Status

### Authentication
- ✅ Login: `POST /auth/login`
- ✅ Register: `POST /auth/register`
- ✅ Logout: `POST /auth/logout`
- ✅ Get Current User: `GET /auth/me`
- ✅ JWT token management with localStorage

### Stations
- ✅ Get All Stations: `GET /stations?siteId=&search=&limit=&skip=`
- ✅ Get Station Details: `GET /stations/{stationId}`
- ✅ Get Station Status: `GET /stations/{stationId}/status`
- ✅ Remote Control: `POST /stations/{stationId}/remote-control`
  - RemoteStartTransaction
  - RemoteStopTransaction
  - Reset
  - UnlockConnector
- ✅ Real-time updates via WebSocket

### Sites
- ✅ Get All Sites: `GET /sites`
- ✅ Get Site Details: `GET /sites/{siteId}`
- ✅ Create Site: `POST /sites`

### Transactions
- ✅ Get All Transactions: `GET /transactions?status=&siteId=&stationId=&limit=&skip=`
- ✅ Start Transaction: `POST /transactions/start`
- ✅ Stop Transaction: `POST /transactions/{transactionId}/stop`

### Analytics
- ✅ Dashboard Stats: `GET /analytics/dashboard`
- ✅ Trends: `GET /analytics/trends?period=&days=`

### WebSocket
- ✅ Connection URL: `ws://176.88.248.139:8081/ws?token={accessToken}`
- ⚠️ Note: WebSocket is configured but not yet implemented on backend
- Events expected:
  - `station_status`
  - `connector_status_change`
  - `transaction_started`
  - `transaction_update`
  - `transaction_stopped`

## Features

### Dashboard
- Total stations, active sessions, energy consumption, revenue
- Top performing stations
- System overview

### Charging Stations
- List all stations with filters (site, search)
- Real-time status indicators (Connected/Disconnected)
- Connector information and power metrics
- Remote Start/Stop transaction controls
- Export to CSV

### Sites
- List all charging locations
- Site statistics (total stations, active stations)
- Create new sites
- Export to CSV

### Transactions
- Complete transaction history
- Filter by status, date range, station
- Energy consumption and cost tracking
- Export to CSV

## Project Structure

\`\`\`
lib/
  config.ts          # API base URL configuration
  auth.ts            # JWT token management
  api-client.ts      # Complete API client with all endpoints
  types.ts           # TypeScript interfaces matching API responses
  websocket-client.ts # WebSocket connection handler

app/
  login/page.tsx     # Login page
  register/page.tsx  # Registration page
  dashboard/
    page.tsx         # Dashboard with analytics
    stations/page.tsx # Stations management
    sites/page.tsx   # Sites management
    transactions/page.tsx # Transaction history

components/
  auth-provider.tsx  # Authentication context
  dashboard-layout.tsx # Main dashboard layout with sidebar
  ui/                # Shadcn UI components
\`\`\`

## Environment Variables

The app uses the following environment variables (optional):
- `NEXT_PUBLIC_API_URL` - Override the default API URL

## API Response Format

All API endpoints return responses in this format:
\`\`\`json
{
  "success": true|false,
  "data": { ... },
  "error": "error message" // only if success=false
}
\`\`\`

## Authentication Flow

1. User registers via `/auth/register` or logs in via `/auth/login`
2. Server returns `accessToken`, `refreshToken`, and user object
3. Tokens are stored in localStorage
4. All subsequent API calls include `Authorization: Bearer {accessToken}` header
5. WebSocket connection uses the same token in query parameter

## Notes

- All pages show loading states while fetching data
- Error messages are displayed with toast notifications
- Empty states are shown when no data is available
- The app is fully responsive (mobile, tablet, desktop)
- Dark theme is enabled by default

## Troubleshooting

### Connection Issues
- Check that the backend server is running on `http://176.88.248.139:8081`
- Verify CORS is enabled on the backend
- Check browser console for detailed error messages

### WebSocket Issues
- WebSocket is configured but may not work until backend implements it
- Check browser DevTools Network tab for WebSocket connection status
- The app will still work without WebSocket (no real-time updates)

### Authentication Issues
- Clear localStorage and try logging in again
- Check that the token is being sent in API requests
- Verify the backend /auth/me endpoint is working
