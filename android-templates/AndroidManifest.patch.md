# AndroidManifest.xml patches

After `npx cap add android` runs, open
`android/app/src/main/AndroidManifest.xml` and apply two changes:

## 1. Add network permissions (just above `<application ...>`)

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

`INTERNET` is usually already added by Capacitor — only add it if missing.
`ACCESS_NETWORK_STATE` is required by the Google Mobile Ads SDK.

## 2. Add the AdMob App ID meta-data (inside `<application ...>`)

```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-8467944404188469~7315383819"/>
```

That's the real Pizza Hero Gaming app ID. **Always use the real app ID
here, even during test-ad development** — Google requires it. (The
risky-to-misuse value is the *ad unit* ID, not the app ID. The app ID
just identifies your AdMob account.)

Final shape inside `<application>` should look like:

```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:label="@string/app_name"
    ...>

    <meta-data
        android:name="com.google.android.gms.ads.APPLICATION_ID"
        android:value="ca-app-pub-8467944404188469~7315383819"/>

    <activity
        android:name=".MainActivity"
        ...>
        ...
    </activity>
</application>
```
