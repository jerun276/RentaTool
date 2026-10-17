# Quality Management Plan – Booking & Reservation Module
**Course:** SE3110: Quality Management in Software Engineering  
**Assigned Member:** Nirojan  
**Module Focus:** Booking Requests, Date Range Logic, Rental Pricing Calculation, QR Handover Flow, Availability & Status State Transitions  

---

## 1. Module Scope & Architecture

The Booking Module manages the end-to-end rental lifecycle of tools between Renters and Owners:
* **Backend:** `src/backend/Modules/Booking` (Controllers: `BookingsController`, Service: `BookingService`)
* **Persistence:** `Bookings` in PostgreSQL
* **Web Portal:** `src/web/src/modules/booking` (Operations Command Center, Booking Overview, Status Badges)
* **Mobile App:** Rental Booking Calendar, Cost Calculation, QR Code Display (Pickup & Return), QR Scanner

---

## 2. Quality Objectives & Acceptance Criteria

1. **State Machine Integrity:** Bookings must strictly transition through:
   $$\text{Pending} \longrightarrow \text{Confirmed} \longrightarrow \text{Active} \longrightarrow \text{Completed}$$
   Illegal transitions (e.g. `Pending` $\to$ `Completed`) must be rejected by the API.
2. **Date Conflict Rejection:** The system must reject overlapping bookings for the same equipment where dates intersect an existing `Confirmed` or `Active` reservation.
3. **Price Math Accuracy:** Total rental cost must strictly equal:
   $$\text{Total Price} = \text{Rental Days} \times \text{Daily Rate}$$
4. **QR Code Security:** QR codes must only be exposed to authorized parties during `Confirmed` (Pickup QR) and `Active` (Return QR) states. Re-scanning used QRs must be prohibited.
5. **Authorization:** Renters can only see their own rentals; Owners can only see and manage incoming booking requests for their tools.

---

## 3. How to Run the Automated Quality Tests

The automated test suite verifies booking endpoints, security authorization, and state checks:

```powershell
# Run against Cloud Deployed Backend (AWS EC2)
python quality-management\Nirojan-Booking\test_booking.py --url http://18.139.3.242:5000/api/v1

# Or run against Local Backend
python quality-management\Nirojan-Booking\test_booking.py --url http://127.0.0.1:5000/api/v1
```

---

## 4. Evidence & Artifacts

Place all booking request screenshots, QR handover capture, date conflict rejection logs, and operations desk views inside the [evidence/](./evidence) directory according to [EVIDENCE_GUIDE.md](./evidence/EVIDENCE_GUIDE.md).
