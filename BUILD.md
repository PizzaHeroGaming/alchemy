# Build & Ship — Athanor: Alchemy Merge

How to wrap the web build with Capacitor for Google Play.

## One-time setup (per machine)

```powershell
cd "D:\Claude Coding\alchemy"
npm install
npm run build                 # populates www/ with the web files
npx cap add android           # generates the android/ folder
```

That last command takes ~1-2 minutes. It downloads Capacitor's Android shell
and lays out a Gradle project at `android/`.

## Drop in the AdMob bridge

After `npx cap add android` finishes:

1. Copy **`android-templates/AdsInterface.kt`** to
   `android/app/src/main/java/com/pizzaherogaming/athanor/AdsInterface.kt`
2. Replace **`android/app/src/main/java/com/pizzaherogaming/athanor/MainActivity.kt`**
   with the contents of `android-templates/MainActivity.kt`
3. Edit `android/app/src/main/AndroidManifest.xml` per
   `android-templates/AndroidManifest.patch.md`
4. Edit `android/app/build.gradle` per
   `android-templates/build.gradle.patch.md`

## Required SDK / AGP / Gradle versions

Capacitor's scaffolding ships with older defaults. Play Console now requires
targetSdk 35, and that needs newer Android Gradle Plugin + Gradle wrapper.
Bump these in the freshly-generated `android/` folder:

1. **`android/variables.gradle`** — set `compileSdkVersion = 35` and
   `targetSdkVersion = 35` (Capacitor's default is 34, which Play rejects).
2. **`android/build.gradle`** — bump the AGP classpath to
   `com.android.tools.build:gradle:8.6.1` (AGP 8.2 only supports compileSdk 34).
3. **`android/gradle/wrapper/gradle-wrapper.properties`** — bump the
   `distributionUrl` to `gradle-8.9-all.zip` (AGP 8.6 requires Gradle 8.7+).

After these edits, Android Studio will prompt to Sync Gradle. Accept. First
sync downloads the new Gradle + AGP (~100 MB) and takes 2-5 minutes.

## Version codes

Every AAB uploaded to Play needs a unique, monotonically increasing
`versionCode` in `android/app/build.gradle`. Once an AAB has been uploaded
to ANY track (internal, closed, production) with versionCode N, you can
never reuse N again — even for a rebuild of the same release.

Bump it for every upload:

```groovy
defaultConfig {
    ...
    versionCode 3        // increment +1 for each new build
    versionName "1.0.1"  // human-visible, semver-style is fine
}
```

`versionName` is the user-visible string ("v1.0.1"); only bump it when the
release is a real version change. `versionCode` MUST increment every time.

## Run it

```powershell
npm run android               # builds web -> www, syncs to native, opens Android Studio
```

In Android Studio:

1. Wait for Gradle sync (~30-60s first time)
2. Plug in your phone (USB debugging on) or start an emulator
3. Click the green **Run** button
4. Athanor installs and launches

To verify ads:

1. Hit the **Hint** button in the topbar
2. The modal opens with "Watch ad · reveal a hint"
3. Tap it → Google's universal test rewarded ad plays
4. Watch through → reward fires → recipe ingredients reveal

Watch Logcat in Android Studio for `AdsInterface` log lines if anything
goes wrong (`Preloading...`, `Loaded`, `Reward earned: N TYPE`, etc).

## After web code changes

```powershell
npm run sync                  # rebuilds www/ + pushes to android/
```

Then hit **Run** again in Android Studio. The native shell doesn't need
to be rebuilt unless `AdsInterface.kt` or `AndroidManifest.xml` changed.

## Going to production

1. Open `android-templates/AdsInterface.kt` AND the copy in
   `android/app/src/main/java/com/pizzaherogaming/athanor/AdsInterface.kt`.
   Change `USE_TEST_ADS = true` to `false`.
2. Sign the release APK / AAB via Android Studio's "Generate Signed Bundle".
3. Create the signing keystore. **Back this file up — losing it means you
   can never update the app on Play Store.**
4. Upload AAB to Google Play Console (internal-test track first).
5. Submit for review. Allow 1-7 days for first-app approval.

## Testing on your own device safely

Tapping live ads on your own production unit IDs can flag your AdMob
account. While the code uses test IDs by default, if you switch to
production IDs you should also register your device as a test device:

1. Run the app once with a real ID — Logcat prints a line like:
   `Use RequestConfiguration.Builder().setTestDeviceIds(Arrays.asList("33BE2250B43518CCDA7DE426D04EE231"))`
2. Copy the hex string.
3. Add it to `AdsInterface.kt`'s `MobileAds.initialize(...)` block:
   ```kotlin
   val configuration = RequestConfiguration.Builder()
       .setTestDeviceIds(listOf("33BE2250B43518CCDA7DE426D04EE231"))
       .build()
   MobileAds.setRequestConfiguration(configuration)
   ```

Now your device sees test ads even with prod IDs in code.
