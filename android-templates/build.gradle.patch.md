# build.gradle patches

After `npx cap add android` runs, open
`android/app/build.gradle` and add the Google Mobile Ads SDK dependency.

## Inside the `dependencies { ... }` block

Add:

```groovy
implementation 'com.google.android.gms:play-services-ads:23.6.0'
```

Final shape:

```groovy
dependencies {
    implementation fileTree(include: ['*.jar'], dir: 'libs')
    implementation "androidx.appcompat:appcompat:$androidxAppCompatVersion"
    implementation project(':capacitor-android')
    testImplementation "junit:junit:$junitVersion"
    androidTestImplementation "androidx.test.ext:junit:$androidxJunitVersion"
    androidTestImplementation "androidx.test.espresso:espresso-core:$androidxEspressoCoreVersion"
    implementation project(':capacitor-cordova-android-plugins')

    // Google Mobile Ads SDK — wired up by AdsInterface.kt.
    implementation 'com.google.android.gms:play-services-ads:23.6.0'
}
```

After saving, Android Studio will prompt to **"Sync Now"** in the toolbar
banner. Click it. Gradle downloads the SDK; takes ~30-60s on first sync.

## Version note

`23.6.0` is the current stable as of mid-2026. If Android Studio warns of
a newer version available, you can bump it — the API surface used in
`AdsInterface.kt` is stable across the 22.x → 23.x line.
