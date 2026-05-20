package com.pizzaherogaming.athanor

import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.getcapacitor.BridgeActivity
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

/**
 * Bridge between the WebView and the Google Mobile Ads SDK.
 *
 * The web code calls `window.AndroidAds.showRewarded()`. We load (if not
 * already pre-loaded) and show a rewarded ad, then deliver success/failure
 * back to JS via `window.__onRewarded(success)`. The next ad is preloaded
 * immediately after dismissal so the player rarely waits.
 *
 * IMPORTANT: Always use TEST IDs during development. Tapping your own real
 * ad units can get your AdMob account suspended. Flip USE_TEST_ADS to false
 * only when building the production release.
 */
class AdsInterface(
    private val activity: BridgeActivity,
    private val webView: WebView
) {
    companion object {
        private const val TAG = "AdsInterface"

        // ───────────────────────────────────────────────────────────────
        //  AD UNIT IDs
        //  Flip USE_TEST_ADS to false ONLY for the release build.
        // ───────────────────────────────────────────────────────────────
        private const val USE_TEST_ADS = true

        // Google's universal test rewarded ad unit. Always serves a test
        // ad. Safe to click during development.
        private const val TEST_REWARDED_AD_UNIT_ID =
            "ca-app-pub-3940256099942544/5224354917"

        // Production rewarded ad unit (Pizza Hero Gaming / Athanor).
        // DO NOT click this ad yourself during development — AdMob will
        // flag self-clicks and can suspend the account.
        private const val PROD_REWARDED_AD_UNIT_ID =
            "ca-app-pub-8467944404188469/4765242095"

        private val REWARDED_AD_UNIT_ID: String
            get() = if (USE_TEST_ADS) TEST_REWARDED_AD_UNIT_ID else PROD_REWARDED_AD_UNIT_ID
    }

    private var rewardedAd: RewardedAd? = null
    private var isLoading = false
    private var rewardEarned = false

    init {
        MobileAds.initialize(activity) {
            Log.d(TAG, "MobileAds initialized")
            preloadRewarded()
        }
    }

    private fun preloadRewarded() {
        if (isLoading || rewardedAd != null) return
        isLoading = true
        Log.d(TAG, "Preloading rewarded ad: $REWARDED_AD_UNIT_ID")
        val request = AdRequest.Builder().build()
        RewardedAd.load(activity, REWARDED_AD_UNIT_ID, request, object : RewardedAdLoadCallback() {
            override fun onAdLoaded(ad: RewardedAd) {
                Log.d(TAG, "Rewarded ad loaded")
                rewardedAd = ad
                isLoading = false
            }

            override fun onAdFailedToLoad(error: LoadAdError) {
                Log.w(TAG, "Rewarded ad failed to load: ${error.message}")
                rewardedAd = null
                isLoading = false
            }
        })
    }

    /** Called from JS via window.AndroidAds.showRewarded() */
    @JavascriptInterface
    fun showRewarded() {
        Log.d(TAG, "showRewarded() called from JS")
        activity.runOnUiThread {
            val ad = rewardedAd
            if (ad == null) {
                Log.w(TAG, "No ad ready — delivering failure and preloading")
                deliverReward(false)
                preloadRewarded()
                return@runOnUiThread
            }

            rewardEarned = false
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    Log.d(TAG, "Ad dismissed — rewardEarned=$rewardEarned")
                    rewardedAd = null
                    deliverReward(rewardEarned)
                    preloadRewarded()
                }

                override fun onAdFailedToShowFullScreenContent(adError: AdError) {
                    Log.w(TAG, "Ad failed to show: ${adError.message}")
                    rewardedAd = null
                    deliverReward(false)
                    preloadRewarded()
                }

                override fun onAdShowedFullScreenContent() {
                    Log.d(TAG, "Ad showed full-screen")
                }
            }

            ad.show(activity) { rewardItem ->
                Log.d(TAG, "Reward earned: ${rewardItem.amount} ${rewardItem.type}")
                rewardEarned = true
            }
        }
    }

    private fun deliverReward(success: Boolean) {
        activity.runOnUiThread {
            val js = "if (typeof window.__onRewarded === 'function') window.__onRewarded($success);"
            webView.evaluateJavascript(js, null)
        }
    }
}
