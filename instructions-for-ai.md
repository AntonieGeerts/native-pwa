# Summary of API Authentication Debugging for PMO Native App

## Initial Problem:
- The Capacitor native app (Android APK) was failing to load data (e.g., ticket categories, statuses) from the backend API (`https://new-app.managedpmo.com/app/api/...`).
- Console logs showed errors like "Auth check received HTML instead of JSON" and subsequent API calls failing similarly.
- The PWA version (served from `pmo_native-app/` root via Apache alias) was reportedly working correctly.

## Investigation & Fixes:

1.  **Header Handling (`pwa_token` vs `Pwa-Token`):**
    *   Identified that the frontend (`api-service.js`) was sending a custom header `pwa_token` along with the standard `Authorization: Bearer`.
    *   Initial backend middleware (`CheckAuth.php`) and custom auth library (`Auth.php`) used `getallheaders()`, which is unreliable.
    *   Refactored backend to use `$request->header()`.
    *   Logs showed `pwa_token` (with underscore) was being stripped by Apache.
    *   **Fix:** Changed frontend (`api-service.js`) and backend (`CheckAuth.php`, `Auth.php`) to use the dashed header `Pwa-Token`.

2.  **Token Validation (`custom_expiry_token_check`):**
    *   Even with the correct header name, API calls still failed with "Unauthenticated!" or a specific HASH_MISMATCH error object after adding debug returns.
    *   Logging was initially not working (`LOG_CHANNEL=stderr` in `.env`, logs went to Apache error log, but relevant messages were missing).
    *   Enabled file logging (`storage/logs/laravel.log`).
    *   Added detailed logging to `Auth.php`'s `custom_expiry_token_generate` and `custom_expiry_token_check` functions.
    *   Logs revealed the hash mismatch was due to inconsistent handling of the `APP_KEY`. Token generation/checking functions were using `config('app.key')` which includes the `base64:` prefix, directly in the `sha1` calculation.
    *   **Fix:** Modified `Auth.php`, `Thetoken.php`, and `Thefirebase.php` to consistently strip the `base64:` prefix from `config('app.key')` before using it in the `sha1` hash calculation for both token generation and validation.

3.  **Deployment:**
    *   Created `pmo2__backend/deploy-backend.sh` script to automate cache clearing (`config:clear`, `cache:clear`, `config:cache`) and Apache restart (`sudo systemctl restart apache2`).
    *   Ran this script after backend code changes.

## Current Status:

- Backend authentication logic for `Pwa-Token` is now fixed and confirmed working via `curl` tests using a newly generated token.
- Frontend (`pmo_native-app/www/`) has been updated to send the `Pwa-Token` header.
- The latest APK build should reflect these frontend changes and work with the deployed backend fixes.

## Remaining Tasks (Frontend PWA):

- The PWA served from `pmo_native-app/` root still needs layout fixes applied (safe area padding).
- Changes applied to `pmo_native-app/index.html` and `pmo_native-app/assets/css/styles.css` (for `.app-header` and `.tab-bar`) need to be verified/completed. Specifically, the padding for `.main-content` and `.content-area` in `pmo_native-app/assets/css/styles.css` still needs to be adjusted for safe areas, similar to how it was done for the `www` version.