package vn.nptduy.nuvoracraft;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.net.Uri;
import android.view.KeyEvent;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebSettings;
import android.graphics.Color;
import android.widget.FrameLayout;
import android.widget.TextView;
import android.view.Gravity;

/** Thin mobile companion for the existing, production-hosted NuvoraCraft service. */
public final class MainActivity extends Activity {
  private static final String HOST = "no-code-builder-saas.vercel.app";
  private static final String HOME = "https://" + HOST + "/";
  private WebView browser;

  private void external(Uri uri) {
    if (uri == null || !"https".equalsIgnoreCase(uri.getScheme())) return;
    try { startActivity(new Intent(Intent.ACTION_VIEW,uri)); }
    catch (Exception ignored) { /* No browser available; WebView remains unchanged. */ }
  }

  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    browser = new WebView(this);
    browser.setBackgroundColor(Color.rgb(7,13,27));
    WebSettings settings=browser.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setAllowFileAccess(false);
    settings.setAllowContentAccess(false);
    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    settings.setJavaScriptCanOpenWindowsAutomatically(false);
    settings.setSupportMultipleWindows(false);
    browser.setWebChromeClient(new WebChromeClient());
    browser.setWebViewClient(new WebViewClient() {
      @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
        Uri uri=request.getUrl();
        String host=uri.getHost(),path=uri.getPath();
        boolean own="https".equalsIgnoreCase(uri.getScheme())&&HOST.equalsIgnoreCase(host);
        if(own) {
          // Puter popup auth and third-party OAuth are intentionally handled in a full browser.
          if(path!=null&&(path.startsWith("/ai-free")||path.startsWith("/ai-builder")||
              path.startsWith("/login")||path.startsWith("/auth"))) { external(uri);return true; }
          return false;
        }
        external(uri);return true;
      }
    });
    FrameLayout root=new FrameLayout(this);
    root.addView(browser,new FrameLayout.LayoutParams(-1,-1));
    setContentView(root);
    if(state!=null)browser.restoreState(state);
    else browser.loadUrl(HOME);
  }
  @Override public void onBackPressed() {
    if(browser!=null&&browser.canGoBack())browser.goBack();
    else super.onBackPressed();
  }
  @Override protected void onSaveInstanceState(Bundle bundle) {
    if(browser!=null)browser.saveState(bundle);
    super.onSaveInstanceState(bundle);
  }
  @Override protected void onDestroy() {
    if(browser!=null){browser.stopLoading();browser.destroy();browser=null;}
    super.onDestroy();
  }
}
