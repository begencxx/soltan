SOLTAN RESTAURANT - ONLINE MENU (v2)

SETUP (one time)
1. Firebase Console > Authentication > enable Email/Password. Add ONE staff user. Then turn off "Enable create (sign-up)" in Authentication > Settings > User actions.
2. Put that staff email in firestore.rules and storage.rules (replace CHANGE_ME@example.com).
3. Firestore > Rules: paste firestore.rules > Publish. Storage > enable it, Rules: paste storage.rules > Publish.
4. Open /staff.html, log in, press "Başlangyç menýuny ýükle" to import the 28 default items. From then on, edit the menu only in the staff panel (data.js is just a fallback/seed).
5. Deploy the folder (Firebase Hosting, Netlify or Cloudflare Pages).

STAFF PANEL
- Orders: change status (Täze > Taýýarlanýar > Ýolda > Tamamlandy / Ýatyryldy). Done orders move to "Taryh" and are never deleted.
- New orders play a sound (keep the tab open; click once after login so the browser allows audio).
- A red warning shows if the order total doesn't match current menu prices.
- Products: add/edit/delete, "Tükendi" marks an item sold out. Images are resized and stored in Firebase Storage.

NOT INCLUDED YET: App Check, Telegram notifications (needs Cloud Functions), opening hours, delivery options, PWA.
