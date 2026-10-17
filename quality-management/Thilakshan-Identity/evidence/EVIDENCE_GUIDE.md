# Identity Module – Evidence Collection Guide (SE3110)

This directory holds test execution artifacts, logs, and screenshots required for SE3110 grading and viva presentation.

## Recommended Evidence Artifacts to Store Here:

1. **`01_registration_and_login.png`** – Screenshot of successful registration and login from the mobile app / postman.
2. **`02_kyc_verification_flow.png`** – Screenshot of KYC document upload on mobile and approval on web admin portal.
3. **`03_jwt_inspection.png`** – Decoded JWT payload screenshot from [jwt.io](https://jwt.io) showing claims (`sub`, `email`, `role`, `exp`).
4. **`04_negative_auth_test.png`** – Screenshot of 401 Unauthorized handling on incorrect credentials.
5. **`identity_test_execution.log`** – Saved terminal output from running `python test_identity.py`.
