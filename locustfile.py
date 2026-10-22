"""
CloudGov - Performance & Load Testing Suite (Locust)
=====================================================
Simulates concurrent citizen portal traffic, service applications,
and public QR code cryptographic verifications on AWS Free Tier architecture.

Execution Runbook:
------------------
1. Install Locust:
   pip install locust

2. Run 100 Concurrent Users Test (Local Smoke Test):
   locust -f locustfile.py --headless -u 100 -r 10 --run-time 2m --host http://localhost:8000 --html loadtest_100_users.html

3. Run 500 Concurrent Users Stress Test (EC2 Host / ALB):
   locust -f locustfile.py --headless -u 500 -r 25 --run-time 3m --host http://YOUR_ALB_DNS --html loadtest_500_users.html

4. Run 1,000 Concurrent Users Peak Concurrency Test:
   locust -f locustfile.py --headless -u 1000 -r 50 --run-time 5m --host http://YOUR_ALB_DNS --html loadtest_1000_users.html

5. Interactive Web UI Mode:
   locust -f locustfile.py --host http://localhost:8000
   Open http://localhost:8089 in browser.
"""

import random
import uuid
from locust import HttpUser, task, between, events


class CitizenUser(HttpUser):
    # Think time between citizen actions (1 to 3 seconds)
    wait_time = between(1.0, 3.0)

    def on_start(self):
        """Authenticates citizen on test worker start to simulate session state."""
        self.auth_headers = {}
        self.service_ids = []
        self.my_application_ids = []
        self.known_certificates = ["CG-PUB-2026-967874", "CG-REV-2026-100001", "CG-SOC-2026-554421"]

        # Citizen credentials or unique test citizen
        test_email = f"loadtest_{uuid.uuid4().hex[:6]}@citizen.gov"
        register_payload = {
            "name": f"Citizen {uuid.uuid4().hex[:4]}",
            "email": test_email,
            "phone": "+919876543210",
            "password": "Password@123",
            "role": "citizen"
        }

        # Attempt registration
        with self.client.post("/api/v1/auth/register", json=register_payload, catch_response=True) as reg_res:
            if reg_res.status_code in [201, 200]:
                reg_res.success()
            elif reg_res.status_code == 400:
                # If already exists, fallback to standard citizen login
                test_email = "citizen@cloudgov.gov"
                reg_res.success()

        # Login to obtain Bearer Token
        login_res = self.client.post("/api/v1/auth/login", json={
            "email": test_email,
            "password": "Password@123" if "loadtest" in test_email else "Citizen@123"
        })

        if login_res.status_code == 200:
            token = login_res.json().get("access_token")
            self.auth_headers = {"Authorization": f"Bearer {token}"}

        # Pre-fetch service catalog IDs
        services_res = self.client.get("/api/v1/services/")
        if services_res.status_code == 200:
            services_data = services_res.json()
            self.service_ids = [s["id"] for s in services_data if "id" in s]

    # -------------------------------------------------------------------------
    # Task 1: Healthcheck Probe (Weight 10 - Monitoring baseline)
    # -------------------------------------------------------------------------
    @task(10)
    def probe_health(self):
        self.client.get("/api/health", name="[GET] /api/health (ALB Healthcheck)")

    # -------------------------------------------------------------------------
    # Task 2: Service Catalog Browsing (Weight 30 - Frequent read operation)
    # -------------------------------------------------------------------------
    @task(30)
    def browse_services(self):
        dept = random.choice(["Revenue", "Municipal", "Social Welfare", ""])
        url = f"/api/v1/services/?department={dept}" if dept else "/api/v1/services/"
        self.client.get(url, name="[GET] /api/v1/services/ (Catalog Query)")

    # -------------------------------------------------------------------------
    # Task 3: Public QR Code Cryptographic Verification (Weight 40 - High Concurrency Read)
    # -------------------------------------------------------------------------
    @task(40)
    def verify_qr_certificate(self):
        cert_id = random.choice(self.known_certificates)
        self.client.get(
            f"/verify/certificate/{cert_id}",
            name="[GET] /verify/certificate/{id} (Public QR Verification)"
        )

    # -------------------------------------------------------------------------
    # Task 4: Citizen Application Status Check (Weight 25 - Dashboard read)
    # -------------------------------------------------------------------------
    @task(25)
    def view_my_applications(self):
        if not self.auth_headers:
            return
        res = self.client.get(
            "/api/v1/applications/",
            headers=self.auth_headers,
            name="[GET] /api/v1/applications/ (Citizen Portal)"
        )
        if res.status_code == 200:
            apps = res.json()
            for a in apps:
                if a.get("certificate"):
                    cert_no = a["certificate"].get("certificate_number")
                    if cert_no and cert_no not in self.known_certificates:
                        self.known_certificates.append(cert_no)

    # -------------------------------------------------------------------------
    # Task 5: Submit Service Application (Weight 15 - Transaction write)
    # -------------------------------------------------------------------------
    @task(15)
    def submit_application(self):
        if not self.auth_headers or not self.service_ids:
            return

        service_id = random.choice(self.service_ids)
        payload = {
            "service_id": service_id,
            "applicant_data": {
                "applicant_full_name": f"Citizen {uuid.uuid4().hex[:6]}",
                "annual_income": random.randint(200000, 900000),
                "district": random.choice(["Central", "North", "South", "East", "West"]),
                "residential_address": "Plot 42, Civil Lines"
            },
            "documents": [
                {
                    "file_name": "income_proof.pdf",
                    "file_url": "s3://cloudgov-vault/income_proof.pdf",
                    "doc_type": "Income Proof",
                    "file_size": 240500
                }
            ]
        }

        with self.client.post(
            "/api/v1/applications/",
            headers=self.auth_headers,
            json=payload,
            name="[POST] /api/v1/applications/ (Apply Service)",
            catch_response=True
        ) as res:
            if res.status_code == 201:
                app_data = res.json()
                self.my_application_ids.append(app_data["id"])
                res.success()
            else:
                res.failure(f"Application submission failed with code {res.status_code}")

    # -------------------------------------------------------------------------
    # Task 6: Lodge Public Grievance (Weight 10 - Citizen Grievance)
    # -------------------------------------------------------------------------
    @task(10)
    def lodge_grievance(self):
        if not self.auth_headers:
            return

        payload = {
            "department": random.choice(["Revenue", "Municipal Corporation", "Social Welfare"]),
            "subject": f"Inquiry regarding service processing {uuid.uuid4().hex[:4]}",
            "description": "Requesting expedited desk verification under citizen charter SLA provisions.",
            "priority": random.choice(["low", "medium", "high"])
        }

        self.client.post(
            "/api/v1/grievances/",
            headers=self.auth_headers,
            json=payload,
            name="[POST] /api/v1/grievances/ (Lodge Grievance)"
        )


class PublicVerifierUser(HttpUser):
    """Simulates external verification officers and third parties scanning QR codes."""
    wait_time = between(0.5, 2.0)

    @task
    def scan_qr_code(self):
        sample_certs = ["CG-PUB-2026-967874", "CG-REV-2026-100001", "CG-SOC-2026-554421"]
        cert = random.choice(sample_certs)
        self.client.get(f"/verify/certificate/{cert}", name="[GET] /verify/certificate (Third-party QR Scan)")
