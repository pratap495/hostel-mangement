import sys
import time
import requests
import json

BASE_URL = "http://localhost"
AUTH_URL = f"{BASE_URL}/api/v1/auth"
TENANT_URL = f"{BASE_URL}/api/v1/tenants"
ROOM_URL = f"{BASE_URL}/api/v1/rooms"
HOSTELER_URL = f"{BASE_URL}/api/v1/hostelers"
FINANCE_URL = f"{BASE_URL}/api/v1/finance"
STORAGE_URL = f"{BASE_URL}/api/v1/storage"

def run_tests():
    print("====================================================")
    print("      HostelMint E2E System Integration Test        ")
    print("====================================================\n")

    # 1. Verify service health checks
    print("[1/8] Verifying Health Check Endpoints...")
    services = ["auth/health", "rooms/health", "finance/health", "storage/health", "notifications/health"]
    for svc in services:
        try:
            r = requests.get(f"{BASE_URL}/api/v1/{svc}", timeout=3)
            print(f"  - {svc}: {r.status_code} -> {r.json()}")
        except Exception as e:
            print(f"  - {svc} HEALTH WARNING: {e} (Make sure docker-compose is running)")
            
    # 2. Test Rate Limiter Lockout (Phase 2 / Task 2.5)
    print("\n[2/8] Testing Rate Limiter failed attempts lockout protection...")
    email = "fakeowner@email.com"
    locked = False
    for i in range(1, 7):
        try:
            r = requests.post(f"{AUTH_URL}/login", json={"email": email, "password": "wrong_password"})
            print(f"  Attempt {i}: Response Code: {r.status_code}")
            if r.status_code == 429:
                locked = True
                print("  -> Brute-force Lockout Triggered Successfully!")
                break
        except Exception as e:
            print(f"  Connection error during lockout test: {e}")
            break
            
    # 3. Authenticate as Super Admin & Onboard Owner (Task 2.4)
    print("\n[3/8] Logging in as Super Admin & onboarding Owner...")
    token = ""
    try:
        r = requests.post(f"{AUTH_URL}/login", json={
            "email": "superadmin@hostelmint.com",
            "password": "SecurePassword123"
        })
        if r.status_code == 200:
            token = r.json()["token"]
            print("  - Super Admin authenticated successfully.")
        else:
            print(f"  - Failed Super Admin login: {r.text}")
            return
    except Exception as e:
        print(f"  - Super Admin connection error: {e}")
        return
        
    headers = {"Authorization": f"Bearer {token}"}
    owner_email = f"owner_{int(time.time())}@hostelmint.com"
    owner_pass = ""
    owner_id = ""
    
    try:
        r = requests.post(f"{TENANT_URL}/owners", headers=headers, json={
            "email": owner_email,
            "name": "Alex Mercer",
            "phone": "+919900112233"
        })
        if r.status_code == 201:
            res_data = r.json()
            owner_id = res_data["id"]
            owner_pass = res_data["temp_password"]
            print(f"  - Owner onboarded. Email: {owner_email} | Temp Password: {owner_pass}")
        else:
            print(f"  - Owner onboarding failed: {r.text}")
            return
    except Exception as e:
        print(f"  - Connection error during onboarding: {e}")
        return

    # 4. Provision Hostel Dynamic Database (Task 3.2 / 2.4)
    print("\n[4/8] Onboarding Hostel & provisioning tenant database...")
    hostel_id = ""
    try:
        r = requests.post(f"{TENANT_URL}/hostels", headers=headers, json={
            "name": "HostelMint Elite",
            "address": "45 Outer Ring Road, Bangalore",
            "contact_number": "+918045678901",
            "floors_count": 3,
            "rooms_count": 30
        })
        if r.status_code == 201:
            hostel_id = r.json()["hostel_id"]
            print(f"  - Hostel provisioned dynamically. ID: {hostel_id}")
        else:
            print(f"  - Hostel provisioning failed: {r.text}")
            return
    except Exception as e:
        print(f"  - Connection error during provisioning: {e}")
        return

    # 5. Authenticate as Owner
    print("\n[5/8] Logging in as the new Owner...")
    owner_token = ""
    try:
        r = requests.post(f"{AUTH_URL}/login", json={
            "email": owner_email,
            "password": owner_pass
        })
        if r.status_code == 200:
            res_json = r.json()
            owner_token = res_json["token"]
            print("  - Owner authenticated successfully.")
            
            # Since force_reset is True, reset the password immediately to unlock the API
            if res_json.get("force_reset"):
                print("  - Owner has force_reset flag. Updating password to secure permanent password...")
                new_pass = "SecurePermanentPassword123"
                reset_res = requests.post(f"{AUTH_URL}/change-password", headers={"Authorization": f"Bearer {owner_token}"}, json={
                    "current_password": owner_pass,
                    "new_password": new_pass
                })
                if reset_res.status_code == 200:
                    print("  - Password successfully updated.")
                    # Log in again to get the fresh token without the force_reset flag
                    login_again = requests.post(f"{AUTH_URL}/login", json={
                        "email": owner_email,
                        "password": new_pass
                    })
                    owner_token = login_again.json()["token"]
                    print("  - Logged back in with new password successfully.")
                else:
                    print(f"  - Password update failed: {reset_res.text}")
                    return
        else:
            print(f"  - Owner authentication failed: {r.text}")
            return
    except Exception as e:
        print(f"  - Owner login connection error: {e}")
        return

    owner_headers = {
        "Authorization": f"Bearer {owner_token}",
        "X-Hostel-ID": hostel_id
    }

    # 6. Test Room Capacity limits (Phase 4 / Task 4.4)
    print("\n[6/8] Creating Room 202 (capacity: 2) & testing over-allocation...")
    room_id = ""
    try:
        r = requests.post(ROOM_URL + "/", headers=owner_headers, json={
            "room_number": "202",
            "floor": 2,
            "room_type": "double",
            "capacity": 2,
            "monthly_rent": 6000.00
        })
        if r.status_code == 201:
            room_id = r.json()["id"]
            print(f"  - Room 202 created successfully. ID: {room_id}")
        else:
            print(f"  - Room creation failed: {r.text}")
            return
    except Exception as e:
        print(f"  - Room creation connection error: {e}")
        return

    # Register 3 residents
    resident_ids = []
    for name in ["Resident A", "Resident B", "Resident C"]:
        try:
            r = requests.post(HOSTELER_URL + "/", headers=owner_headers, json={
                "name": name,
                "phone": f"+9199008877{len(resident_ids)}",
                "permanent_address": "Test street, Bangalore",
                "emergency_contact_name": "Emergency name",
                "emergency_contact_phone": "+919900000000",
                "date_of_joining": "2026-07-13"
            })
            if r.status_code == 201:
                resident_ids.append(r.json()["id"])
                print(f"  - Registered: {name}")
        except Exception as e:
            print(f"  - Resident registration error: {e}")
            break

    # Assign residents
    print("  - Assigning Resident A to Room 202, Bed 1...")
    requests.post(f"{ROOM_URL}/assign", headers=owner_headers, json={
        "hosteler_id": resident_ids[0],
        "room_id": room_id,
        "bed_number": 1,
        "assigned_date": "2026-07-13"
    })
    
    print("  - Assigning Resident B to Room 202, Bed 2...")
    requests.post(f"{ROOM_URL}/assign", headers=owner_headers, json={
        "hosteler_id": resident_ids[1],
        "room_id": room_id,
        "bed_number": 2,
        "assigned_date": "2026-07-13"
    })
    
    print("  - Assigning Resident C to Room 202 (Should fail due to capacity)...")
    r = requests.post(f"{ROOM_URL}/assign", headers=owner_headers, json={
        "hosteler_id": resident_ids[2],
        "room_id": room_id,
        "bed_number": 3,
        "assigned_date": "2026-07-13"
    })
    print(f"  - Allocation Attempt 3 Code: {r.status_code}")
    if r.status_code == 400 and "ROOM_CAPACITY_EXCEEDED" in r.text:
        print("  -> Over-allocation check works perfectly!")
    else:
        print(f"  WARNING: Expected ROOM_CAPACITY_EXCEEDED, got: {r.text}")

    # 7. Test Finance Ledger and Pagination (Phase 5 / Task 5.2 / 5.4)
    print("\n[7/8] Logging Income payments & testing pagination...")
    try:
        r = requests.post(f"{FINANCE_URL}/income", headers=owner_headers, json={
            "hosteler_id": resident_ids[0],
            "amount": 6000.00,
            "payment_date": "2026-07-13",
            "payment_mode": "upi",
            "reference_number": "TXN998877"
        })
        print(f"  - Logged rent payment of INR 6000.00: Code {r.status_code}")
    except Exception as e:
        print(f"  - Income logging error: {e}")

    # Create 5 inventory assets
    for i in range(1, 6):
        requests.post(f"{FINANCE_URL}/inventory", headers=owner_headers, json={
            "asset_name": f"Asset {i}",
            "quantity": i * 10,
            "condition": "good"
        })
    print("  - Onboarded 5 inventory assets.")

    # Paginated listing
    try:
        r = requests.get(f"{FINANCE_URL}/inventory?page=1&limit=3", headers=owner_headers)
        res_data = r.json()
        print(f"  - Paginated asset query limit=3: Got {len(res_data['data'])} records.")
        print(f"  - Pagination Meta: {res_data['pagination']}")
    except Exception as e:
        print(f"  - Asset pagination listing error: {e}")

    # 8. Test S3 Presigned URL (Phase 7 / Task 7.1 / 7.2)
    print("\n[8/8] Testing S3 Presigned URL Storage Service uploads & downloads...")
    try:
        r = requests.post(f"{STORAGE_URL}/presigned-upload?file_name=profile.jpg&mime_type=image/jpeg", headers=owner_headers)
        if r.status_code == 200:
            print("  - Presigned S3 upload policy successfully generated.")
            file_key = r.json()["file_key"]
            
            # Fetch short-lived download token
            d = requests.get(f"{STORAGE_URL}/presigned-download?file_key={file_key}", headers=owner_headers)
            print(f"  - Presigned short-lived download URL generated: {d.json()['download_url'][:60]}...")
        else:
            print(f"  - Presigned upload policy request failed: {r.text}")
    except Exception as e:
        print(f"  - Storage connection error: {e}")

    print("\n====================================================")
    print("            Integration Tests Completed             ")
    print("====================================================")

if __name__ == "__main__":
    run_tests()
