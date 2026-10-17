# Quality Management Plan – Catalog & Equipment Management Module
**Course:** SE3110: Quality Management in Software Engineering  
**Assigned Member:** Jerun  
**Module Focus:** Tool & Equipment Listings, Pricing & Deposit Boundaries, Specifications JSON, Owner Authorization, Deletion Safety & Availability  

---

## 1. Module Scope & Architecture

The Catalog Module is the core inventory and discovery engine of RentaTool:
* **Backend:** `src/backend/Modules/Catalog` (Controllers: `EquipmentController`, `CategoriesController`, Service: `EquipmentService`)
* **Persistence:** `Equipment`, `Categories`, `EquipmentImages` in PostgreSQL
* **Web Portal:** `src/web/src/modules/catalog` (Catalog Management, Equipment Listing View, Details Modal)
* **Mobile App:** Catalog Browse, Category Filters, Search, Equipment Details & Listing Creation

---

## 2. Quality Objectives & Acceptance Criteria

1. **Catalog Integrity:** New listings must require title, valid category ID, positive daily rate, positive replacement value, and location.
2. **Owner Authorization:** Only the verified equipment owner (or an Administrator) can modify or delete/deactivate an equipment listing.
3. **Data Safety & Integrity:** Equipment deletion must verify that no active or ongoing bookings exist before allowing deactivation/removal.
4. **Search & Filter Accuracy:** Keyword searching, category filtering, and pagination must return accurate, non-redundant results within performance limits.
5. **Metadata & Trust Metrics:** Equipment cards must correctly surface owner verification badges and trust scores.

---

## 3. How to Run the Automated Quality Tests

The automated test suite verifies public discovery, filtering, validation, and authorization boundaries:

```powershell
# Run against Cloud Deployed Backend (AWS EC2)
python quality-management\Jerun-Catalog\test_catalog.py --url http://18.139.3.242:5000/api/v1

# Or run against Local Backend
python quality-management\Jerun-Catalog\test_catalog.py --url http://127.0.0.1:5000/api/v1
```

---

## 4. Evidence & Artifacts

Place all equipment listing screenshots, category filter verification, deletion safety logs, and response payloads inside the [evidence/](./evidence) directory according to [EVIDENCE_GUIDE.md](./evidence/EVIDENCE_GUIDE.md).
