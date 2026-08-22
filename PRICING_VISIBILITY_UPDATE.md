# Pricing Visibility Update - Hide from VIEWER Role

**Date:** August 14, 2026  
**Status:** ⚠️ IN PROGRESS  
**Priority:** HIGH

---

## 🎯 Objective

Hide all pricing, cost, and revenue information from users with VIEWER role.  
Only ADMIN and EDITOR can see financial data.

---

## ✅ Completed

### 1. Permissions System Updated
- ✅ Added `"View Pricing & Revenue"` permission to `lib/permissions.ts`
- ✅ Default: ADMIN=true, EDITOR=true, VIEWER=false
- ✅ Added `canViewPricing()` helper function

### 2. Dashboard (app/page.tsx)
- ✅ Cost/Price tab hidden for VIEWER role
- ✅ Tab conditionally rendered based on role

---

## 📝 TODO - Files Requiring Updates

### High Priority

#### 1. **frontend/app/raw-materials/page.tsx**
**What to hide:**
- ❌ "Price (₹)" column in table
- ❌ "Stock Value" column in table
- ❌ Unit Price display in card view
- ❌ Stock Value display in card view
- ❌ "Unit Price (₹)" field in Add/Edit modal
- ❌ Price in Excel/CSV exports
- ❌ Price in import template

**Implementation:**
```tsx
import { canViewPricing } from "@/lib/permissions";

const showPricing = canViewPricing();

// In table header:
{showPricing && <TH col="price" label="Price" />}
{showPricing && <th>Stock Value</th>}

// In table body:
{showPricing && <td>₹{item.price.toLocaleString("en-IN")}</td>}
{showPricing && <td>₹{(item.quantity * item.price).toLocaleString("en-IN")}</td>}

// In card view:
{showPricing && (
  <div>
    <p>Unit Price</p>
    <p>₹{item.price.toLocaleString("en-IN")}</p>
  </div>
)}

// In modal:
{showPricing && (
  <Field label="Unit Price (₹) *">
    <input type="number" ... />
  </Field>
)}

// In exports:
const exportData = items.map(i => ({
  ID: i.id,
  Name: i.name,
  ...(showPricing ? { "Price (₹)": i.price } : {}),
  ...(showPricing ? { "Stock Value (₹)": i.quantity * i.price } : {})
}));
```

---

#### 2. **frontend/app/finished-products/page.tsx**
**What to hide:**
- ❌ "Price (₹)" column
- ❌ "Stock Value" column  
- ❌ Unit Price in card view
- ❌ Stock Value in card view
- ❌ "Price (₹)" field in Add/Edit modal
- ❌ Price in exports

**Same implementation as raw-materials**

---

#### 3. **frontend/app/reports/page.tsx**
**What to hide:**
- ❌ "Price (₹)" column in all report tabs
- ❌ Price/Cost/Revenue summaries
- ❌ Total value calculations

**Implementation:**
```tsx
const showPricing = canViewPricing();

// In table headers and data rows
{showPricing && ...price columns...}

// In summary cards
{showPricing && (
  <StatCard
    label="Total Value"
    value={`₹${totalValue.toLocaleString()}`}
  />
)}
```

---

#### 4. **frontend/app/clients/page.tsx** (If has pricing)
Check if client module displays any pricing information and hide if present.

---

### Medium Priority

#### 5. **frontend/app/bom/page.tsx** (Bill of Materials)
**What to hide:**
- ❌ Material cost per unit
- ❌ Total BOM cost
- ❌ Cost calculations

---

### Low Priority  

#### 6. **Backend API** (Optional Enhancement)
Consider filtering price fields from API responses for VIEWER role:
- `backend/src/routes/rawMaterials.js`
- `backend/src/routes/finishedProducts.js`
- `backend/src/routes/dashboard.js`

---

## 🔧 Implementation Steps

### Step 1: Update Each Page Component

For each file listed above:

1. Import the helper:
   ```tsx
   import { canViewPricing } from "@/lib/permissions";
   ```

2. Add state check at component top:
   ```tsx
   const showPricing = canViewPricing();
   ```

3. Wrap all price-related UI in conditionals:
   ```tsx
   {showPricing && <PriceColumn />}
   ```

4. Update exports to exclude price when `showPricing === false`

---

### Step 2: Test with Each Role

1. Login as **ADMIN**:
   - ✅ All pricing visible
   - ✅ Cost/Price tab visible in dashboard
   
2. Login as **EDITOR**:
   - ✅ All pricing visible
   - ✅ Cost/Price tab visible in dashboard

3. Login as **VIEWER**:
   - ❌ No pricing columns in tables
   - ❌ No price fields in modals (read-only anyway)
   - ❌ No Cost/Price tab in dashboard
   - ❌ Exports don't include price columns

---

## 📊 Testing Checklist

### Dashboard
- [ ] VIEWER: Cost/Price tab not visible
- [ ] ADMIN/EDITOR: Cost/Price tab visible and working

### Raw Materials
- [ ] VIEWER: No "Price" column in table
- [ ] VIEWER: No "Stock Value" column in table
- [ ] VIEWER: No price in card view
- [ ] VIEWER: Exports don't include price
- [ ] ADMIN/EDITOR: All pricing visible

### Finished Products
- [ ] VIEWER: No "Price" column in table
- [ ] VIEWER: No "Stock Value" column in table
- [ ] VIEWER: No price in card view
- [ ] VIEWER: Exports don't include price
- [ ] ADMIN/EDITOR: All pricing visible

### Reports
- [ ] VIEWER: No price columns in any tab
- [ ] VIEWER: No financial summaries
- [ ] ADMIN/EDITOR: All pricing visible

---

## 🔒 Security Notes

1. **Frontend Only**: This update hides pricing in the UI only
2. **API Access**: VIEWER can still call APIs that return price data
3. **Recommendation**: Add backend filtering for complete security

---

## 📞 Contact

**Implementation Support:**  
Civitas Atlas Technologies Pvt. Ltd., Pune  
civitasatlasco@gmail.com

---

*© 2026 Civitas Atlas Technologies Pvt. Ltd., Pune. All rights reserved.*
