# MIDDO Partner Update — Online/Offline & Notifications

**Date:** 17 Aug 2026

## Kya kiya gaya

### 1. Delivery Partner — Go Offline (Database save)
- **Pehle:** "Go Offline" sirf app ke andar local state tha, restart par wapas online ho jata tha.
- **Ab:** Offline/Online status database me save hota hai (`partnerProfile.isOnline`).
- **API:** `PATCH /api/delivery-partner/profile/availability` with `{ isOnline: true/false, role: "rider" }`
- **Order assign block:** Agar rider offline hai to admin order assign nahi kar sakta — error: *"Delivery partner is offline. Order cannot be assigned."*

### 2. Vendor — Kitchen OFF (Database save)
- **Pehle:** Kitchen ON/OFF sirf UI me tha, database me save nahi hota tha.
- **Ab:** Kitchen status database me save hota hai (`partnerProfile.kitchenOpen`).
- **API:** `PATCH /api/delivery-partner/profile/availability` with `{ kitchenOpen: true/false, role: "homechef" }`
- **Order assign block:** Agar kitchen OFF hai to vendor ko order assign nahi hoga — error: *"Vendor kitchen is offline. Order cannot be assigned."*
- Kitchen OFF hone par naye order ki push notification bhi skip hoti hai.

### 3. Vendor UI — Kitchen OFF par red button
- Dashboard hero me "Request OFF / Open Kitchen" button kitchen OFF par **halka red** dikhega.
- Status dot bhi red ho jata hai jab kitchen band ho.
- Quick Actions me "Kitchen ON" button bhi red highlight ke sath dikhega jab kitchen band ho.

### 4. Push Notifications fix
- **Foreground:** App open hone par bhi order assign notification ab Alert popup ke through dikhegi.
- **Background handler:** `index.js` me background message handler add kiya.
- **Notification tap:** Notification tap karne par sahi tab (Orders / Deliveries / Alerts) khulega.
- **Backend push:** Android/iOS ke liye high priority push config improve kiya.
- Order assign hone par app orders/deliveries refresh karega aur alerts list update hogi.

### 5. Alerts tab fix
- **Pehle:** Saari riders/vendors ki notifications dikh rahi thi (privacy issue).
- **Ab:** Sirf logged-in partner ki apni notifications dikhengi (`recipientId` / `recipientEmail` se filter).
- Push aane par alerts list auto-refresh hoti hai.
- Alerts tab kholne par latest notifications load hote hain.

---

## Files changed

### Backend
| File | Change |
|------|--------|
| `backend/src/controllers/deliveryPartnerController.js` | Availability API, profile me `isOnline` / `kitchenOpen`, notification filter fix |
| `backend/src/routes/delivery-partner/deliveryPartnerProfileRoutes.js` | `PATCH /availability` route |
| `backend/src/controllers/orderController.js` | Offline rider/vendor par order assign block |
| `backend/src/utils/partnerNotifications.js` | Offline skip, push priority improve |

### Partner App (MIDDO-Partner)
| File | Change |
|------|--------|
| `src/screens/PartnerAppScreen.jsx` | Toggle API connect, alerts refresh, notification open handler |
| `src/services/partnerProfileApi.js` | `updatePartnerAvailability()` function |
| `src/services/partnerNotifications.js` | Foreground alert, notification open listener |
| `src/screens/partner/AlertsPanel.jsx` | Refresh on push, loading state |
| `src/components/partner/DashboardHero.jsx` | Red styling when kitchen OFF |
| `src/components/partner/QuickActions.jsx` | Red styling for kitchen OFF button |
| `src/screens/partner/HomeChefDashboard.jsx` | Offline flag pass to QuickActions |
| `index.js` | Background message handler |

---

## Database fields (User.partnerProfile)

| Field | Role | Default | Meaning |
|-------|------|---------|---------|
| `isOnline` | Rider | `true` | Delivery partner available for orders |
| `kitchenOpen` | Vendor | `true` | Kitchen accepting orders |

---

## Test kaise karein

1. **Rider offline test**
   - Rider app me "Go Offline" dabao
   - Admin se order assign karo → error aana chahiye
   - "Go Online" karke dubara assign karo → kaam karna chahiye

2. **Vendor kitchen OFF test**
   - HomeChef app me "Request OFF" / "Kitchen OFF" dabao
   - Admin se vendor assign karo → error aana chahiye
   - Kitchen ON karke dubara try karo

3. **Notification test**
   - App login karke alerts tab kholo
   - Admin se order assign karo
   - Push notification + Alerts tab me entry dikhni chahiye

4. **Restart test**
   - Offline/Kitchen OFF karke app band karke dubara kholo
   - Status wahi rehna chahiye jo database me save hai

---

## API Reference

```
PATCH /api/delivery-partner/profile/availability
Authorization: Bearer <token>

# Rider
{ "isOnline": false, "role": "rider" }

# Vendor
{ "kitchenOpen": false, "role": "homechef" }
```

Response:
```json
{
  "success": true,
  "message": "Partner availability updated",
  "data": {
    "profile": {
      "isOnline": false,
      "kitchenOpen": true,
      ...
    }
  }
}
```
