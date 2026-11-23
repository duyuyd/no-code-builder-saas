# NuvoraCraft Studio · Android 1.0.0

App companion **inside the existing** `duyuyd/no-code-builder-saas` repository. This is not a replacement project and does not modify or copy Supabase user data.

- WebView loads the real https://no-code-builder-saas.vercel.app/ with live Supabase-backed pages, no mock dataset.
- Sign-in, OAuth, /ai-free and /ai-builder are opened in the default browser to support provider popups, cookies and Google restrictions. The built-in WebView does not share browser login sessions.
- The keyless AI feature uses Puter in the browser with a free model and the signed-in user's allowance; no owner API key is included in this APK.
- APK is a **debug-signed installable preview**, not a production Play Store release. Runner signing certificates may differ between builds; it may not install as an update over a previous preview.
- No offline project builder, native APK compilation or paid AI provider is claimed. User-generated Android apps continue to use the existing `native-build.yml` pipeline with project-specific signed build infrastructure.
- Verify on a real Android device: load home, follow AI link in browser, sign in, navigate to builder, handle network errors; a successful Gradle build alone cannot establish these pass.

To build locally: `gradle -p mobile/studio-android :app:assembleDebug` using JDK 17, Gradle 8.13 and Android SDK 36.
