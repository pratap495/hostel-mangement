# Hostel Management System — Splash & Login

React Native screens matching the provided design (dark theme, gold/amber accent).

## Files
- `theme.js` — shared colors
- `screens/SplashScreen.js` — full-bleed background photo, logo, tagline, auto-navigates after 2.5s
- `screens/LoginScreen.js` — "Super Admin Login" screen: logo, tagline, hero image with carousel dots, Login button, OTP button, copyright
- `App.js` — example navigation wiring

## Install dependencies
```bash
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-vector-icons
```
For iOS, also run `npx pod-install` after installing.

If using **Expo**, swap `react-native-vector-icons` for `@expo/vector-icons` (same `Icon` API, import from `@expo/vector-icons/Ionicons` instead).

## Assets
Add your own images at:
- `assets/hostel-building.jpg` — dark, warm-lit hostel exterior at night (for the Splash screen)
- `assets/hostel-interior.jpg` — cozy interior shot with armchair/side table (for the Login screen carousel)

Create an `assets/` folder next to `screens/` and drop in your photos with those exact filenames, or update the `require(...)` paths in each screen.

## Notes
- Auto-navigation on the splash screen is wired to a route named `Login` — rename in `SplashScreen.js` if your stack differs.
- The Login and OTP buttons navigate to `LoginForm` and `OtpLogin` routes — add those screens to `App.js` when you build them.
- Fonts default to the system font. To match a more editorial look, link a custom font (e.g. Poppins/Manrope) and update `theme.js` → `fonts`.
