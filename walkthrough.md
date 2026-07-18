# E2E Frontend & Backend Integration Walkthrough

This document outlines the changes made to connect the React Native Expo mobile frontend with the 5-microservice Python FastAPI backend gateway, transitioning the application from static mock data to a fully dynamic multi-tenant production environment.

---

## Key Achievements

1. **Exposed Dashboard Query APIs**:
   * Implemented new list and context query endpoints for registered Owners, Hostels, Rooms (with dynamic occupancy counts), and Chronological Financial Ledgers on the backend.
2. **Setup Request-Header Interceptor Client**:
   * Created a central Axios [apiClient.ts](file:///e:/Luminous%20Jolt/Hostel_Hub/frontend/src/services/apiClient.ts) client that dynamically resolves user context (JWT bearer authorization) and tenant context (`X-Hostel-ID` header) directly from the active Redux store for every outgoing HTTP call.
3. **Refactored Frontend Service Layer**:
   * Completely rebuilt all mock services (`authService`, `hostelService`, `ownerService`, `roomService`, `hostelerService`, `financeService`, `notificationService`) to issue HTTP requests and synchronize response data into Redux, clearing all static seeded mock details.
4. **Verified TypeScript Integrity**:
   * Added `bedNumber?: number` to the shared `Hosteler` profile interface context. Verified clean TypeScript build compile (`npx tsc --noEmit` returns exit code 0).

---

## Technical Details & Code Paths

### Centralized Axios Client
We introduced the API client in [apiClient.ts](file:///e:/Luminous%20Jolt/Hostel_Hub/frontend/src/services/apiClient.ts) configured to target the local Nginx proxy:
```typescript
export const API_BASE_URL = 'http://localhost'; // Gateway route
```

### Backend Endpoint Updates
* **Owner & Hostel Listing**:
  * [tenant_routes.py](file:///e:/Luminous%20Jolt/Hostel_Hub/backend/auth_service/app/routers/tenant_routes.py): Implemented `GET /api/v1/tenants/owners` and `GET /api/v1/tenants/hostels`.
* **Chronological Financial Ledger**:
  * [finance_routes.py](file:///e:/Luminous%20Jolt/Hostel_Hub/backend/finance_service/app/routers/finance_routes.py): Added `GET /api/v1/finance/transactions` which returns a unified income and expense timeline.
* **Active Room Occupancies**:
  * [room_routes.py](file:///e:/Luminous%20Jolt/Hostel_Hub/backend/hostel_service/app/routers/room_routes.py): Added `GET /api/v1/rooms` joining bed allocations to return dynamic `occupiedCount`.

---

## How to Verify the Output Yourself

Follow these steps to spin up the integrated environment and run manual E2E validation:

### 1. Start the Backend Stack
Ensure Docker is running and run the following command to rebuild and launch the backend gateway:
```powershell
# Navigate to backend directory
cd backend

# Build and start all microservices, databases, and proxy gateways
docker-compose up --build -d
```

### 2. Launch the React Native Frontend
In a separate terminal window, launch the React Native application targeting web, an emulator, or a physical device:
```powershell
# Navigate to frontend directory
cd frontend

# Install package dependencies
npm install

# Start the application on your desired platform:
npm run web      # Open in browser (localhost)
npm run android  # Open in Android Emulator (maps to 10.0.2.2 automatically)
npm run ios      # Open in iOS Simulator (localhost)
```

> [!NOTE]
> **Mobile Network Resolution**:
> * **iOS Simulator / Web**: Communicates directly via `http://localhost`.
> * **Android Emulator**: Automatically routes network calls to the host machine's gateway via `http://10.0.2.2` (configured inside `apiClient.ts`).
> * **Physical Devices (Wi-Fi)**: Replace the host value in `apiClient.ts`'s `getBaseUrl` function with your computer's local IP address (e.g. `http://192.168.x.x`).

### 3. Verify End-to-End Flows

#### A. Super Admin Dashboard Validation
1. Log in as Super Admin:
   * **Username**: `superadmin@hostelmint.com`
   * **Password**: `SecurePermanentPassword123` (or your seeded database credentials).
2. Go to the **Owners & Hostels** tab:
   * Verify the onboarded list is retrieved from the database.
   * Add a new Owner profile (`testowner@email.com`) and create a new Hostel.
   * Toggle Owner status (Enable/Disable) and verify the state updates.

#### B. Owner Dashboard Validation
1. Log in as the Owner you just created (use temporary credentials returned by the Super Admin panel or reset via the password change page).
2. Enforce the required password change on first login.
3. Switch between assigned hostels using the top selector and verify that the context updates the active screen.
4. Try executing the following actions:
   * **Add a Room**: Create room "101" on floor 1, type double, rent 5000. Check that it is retrieved instantly in the Room list.
   * **Register Resident**: Add "Resident X" and assign them to Room 101. Verify that Room 101's occupied bed count updates to `1 / 2`.
   * **Log Ledger Event**: Record a payment of ₹5,000 for rent from Resident X. Check that it appears immediately in the Transactions list and updates your monthly net revenue metrics.
