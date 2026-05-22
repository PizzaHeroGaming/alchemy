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

## Release signing config (command-line builds)

To build signed AABs from PowerShell instead of Android Studio's GUI:

### 1. Copy the template

Copy `android-templates/keystore.properties.template` to
`android/keystore.properties` and fill in your real values. The android/
folder is gitignored so passwords never reach git.

### 2. Patch `android/app/build.gradle`

Add this loader block at the very top of the file (above `apply plugin: ...`):

```groovy
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Inside the `android { ... }` block, add a `signingConfigs` block:

```groovy
signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            storeFile     file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
            keyAlias      keystoreProperties['keyAlias']
            keyPassword   keystoreProperties['keyPassword']
        }
    }
}
```

In the `buildTypes { release { ... } }` block, add the signingConfig
reference inside an existence check so debug builds without keystore.properties
still work:

```groovy
buildTypes {
    release {
        minifyEnabled false
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        if (keystorePropertiesFile.exists()) {
            signingConfig signingConfigs.release
        }
    }
}
```

Also inside `android { ... }`, pin Java + Kotlin to JVM target 17 so the
Java and Kotlin compilers agree on a target (Kotlin 1.9.x otherwise picks
whatever the JDK's max target is, which on JDK 17 is 17 but on JDK 21
becomes 21 and triggers an "Inconsistent JVM-target compatibility" error):

```groovy
compileOptions {
    sourceCompatibility JavaVersion.VERSION_17
    targetCompatibility JavaVersion.VERSION_17
}
kotlinOptions {
    jvmTarget = "17"
}
```

### 3. Pin the JDK in `android/gradle.properties`

`gradlew` from a plain PowerShell prompt uses the system default JDK — on
many machines that's Java 8, which AGP 8.6+ refuses to run on. Force
Gradle to use Android Studio's bundled JBR (JDK 17) by adding this line
to `android/gradle.properties`:

```properties
org.gradle.java.home=C\:/Program Files/Android/Android Studio/jbr
```

(The `\:` is properties-file escaping for the drive-letter colon. On a
different install path, edit accordingly. The path is correct for the
default Android Studio install on Windows.)

### 4. Build from command line

```powershell
npm run sync
cd android
.\gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

(Earlier Android Studio GUI builds wrote to `android/app/release/app-release.aab`
— gradlew uses the conventional Gradle output path instead. Same file, different
directory.)
