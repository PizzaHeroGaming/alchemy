package com.pizzaherogaming.athanor

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Register the AdsInterface AFTER super.onCreate so bridge.webView is
        // initialized. The web code calls window.AndroidAds.showRewarded() to
        // hand control to Kotlin; Kotlin delivers the result back via
        // window.__onRewarded(success) running inside the WebView.
        bridge.webView.addJavascriptInterface(
            AdsInterface(this, bridge.webView),
            "AndroidAds"
        )
    }
}
