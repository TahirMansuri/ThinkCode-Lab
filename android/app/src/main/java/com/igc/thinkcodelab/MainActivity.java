package com.igc.thinkcodelab;

import android.content.Context;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.view.View;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {

    private static final String NATIVE_STDIN_PATH = "/__native_stdin";
    private static final int SPLASH_SYSTEM_BG = Color.parseColor("#080C14");
    private static final int DARK_SYSTEM_BG = Color.parseColor("#0E1622");
    private static final int LIGHT_SYSTEM_BG = Color.parseColor("#FFFFFF");

    private boolean currentLightSystemBars = false;
    private boolean appReadyApplied = false;

    private static final class StdinSlot {
        boolean done = false;
        boolean cancelled = false;
        String text = "";
    }

    private final Object stdinLock = new Object();
    private StdinSlot activeSlot = null;
    private StdinSlot earlyReply = null;

    private final class NativeStdinBridge {
        @JavascriptInterface
        public void submit(String text) {
            synchronized (stdinLock) {
                if (activeSlot != null) {
                    activeSlot.cancelled = false;
                    activeSlot.text = text != null ? text : "";
                    activeSlot.done = true;
                    activeSlot = null;
                    stdinLock.notifyAll();
                } else {
                    StdinSlot s = new StdinSlot();
                    s.done = true;
                    s.cancelled = false;
                    s.text = text != null ? text : "";
                    earlyReply = s;
                }
            }
        }

        @JavascriptInterface
        public void cancel() {
            cancelNativeStdin();
        }

        @JavascriptInterface
        public void reset() {
            cancelNativeStdin();
        }
    }

    private void cancelNativeStdin() {
        synchronized (stdinLock) {
            earlyReply = null;
            if (activeSlot != null) {
                activeSlot.cancelled = true;
                activeSlot.text = "";
                activeSlot.done = true;
                activeSlot = null;
                stdinLock.notifyAll();
            }
        }
    }

    private final class SystemUiBridge {
        @JavascriptInterface
        public void setTheme(boolean isLight) {
            runOnUiThread(() -> {
                appReadyApplied = true;
                applySystemBarAppearance(isLight, true);
            });
        }

        @JavascriptInterface
        public void printDocument(String jobName) {
            runOnUiThread(() -> {
                if (bridge == null || bridge.getWebView() == null) return;
                PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                if (pm == null) return;
                String title = (jobName != null && !jobName.trim().isEmpty())
                    ? jobName.trim()
                    : "ThinkCodeLab-LabJournal";
                PrintDocumentAdapter adapter = bridge.getWebView().createPrintDocumentAdapter(title);
                PrintAttributes attrs = new PrintAttributes.Builder()
                    .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                    .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                    .build();
                pm.print(title, adapter, attrs);
            });
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupEdgeToEdgeInsets();
    }

    @Override
    public void onResume() {
        super.onResume();
        applySystemBarAppearance(currentLightSystemBars, appReadyApplied);
    }

    private void setupEdgeToEdgeInsets() {
        Window window = getWindow();
        if (window == null) return;

        WindowCompat.setDecorFitsSystemWindows(window, false);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.setStatusBarContrastEnforced(false);
            window.setNavigationBarContrastEnforced(false);
        }

        View contentView = findViewById(android.R.id.content);
        if (contentView != null) {
            contentView.setBackgroundColor(SPLASH_SYSTEM_BG);
            ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, windowInsets) -> {
                Insets bars = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
                );
                Insets ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
                int bottom = Math.max(bars.bottom, ime.bottom);
                v.setPadding(bars.left, bars.top, bars.right, bottom);
                return WindowInsetsCompat.CONSUMED;
            });
            ViewCompat.requestApplyInsets(contentView);
        }

        applySystemBarAppearance(false, false);
    }

    @SuppressWarnings("deprecation")
    private void applySystemBarAppearance(boolean isLight, boolean isAppReady) {
        currentLightSystemBars = isLight;
        Window window = getWindow();
        if (window == null) return;

        int barBg = !isAppReady ? SPLASH_SYSTEM_BG : (isLight ? LIGHT_SYSTEM_BG : DARK_SYSTEM_BG);
        View contentView = findViewById(android.R.id.content);
        if (contentView != null) {
            contentView.setBackgroundColor(barBg);
        }

        if (Build.VERSION.SDK_INT < 35) {
            window.setStatusBarColor(Color.TRANSPARENT);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                window.setNavigationBarColor(Color.TRANSPARENT);
            } else {
                // API 24-25 lack light navigation bar icons; keep dark scrim for legible 3-button icons
                window.setNavigationBarColor(DARK_SYSTEM_BG);
            }
        }

        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(window, window.getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(isLight && isAppReady);
            controller.setAppearanceLightNavigationBars(isLight && isAppReady);
        }
    }

    @Override
    protected void load() {
        super.load();
        if (this.bridge == null) return;

        if (this.bridge.getWebView() != null) {
            this.bridge.getWebView().addJavascriptInterface(new NativeStdinBridge(), "ThinkCodeNativeStdin");
            this.bridge.getWebView().addJavascriptInterface(new SystemUiBridge(), "ThinkCodeSystemUI");
        }

        ServiceWorkerController.getInstance().setServiceWorkerClient(new ServiceWorkerClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebResourceRequest request) {
                WebResourceResponse stdinResp = maybeHandleNativeStdin(request);
                if (stdinResp != null) return stdinResp;
                WebResourceResponse resp = bridge.getLocalServer().shouldInterceptRequest(request);
                return withCrossOriginHeaders(resp, request != null ? request.getUrl() : null);
            }
        });

        this.bridge.setWebViewClient(new BridgeWebViewClient(this.bridge) {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse stdinResp = maybeHandleNativeStdin(request);
                if (stdinResp != null) return stdinResp;
                WebResourceResponse resp = super.shouldInterceptRequest(view, request);
                return withCrossOriginHeaders(resp, request != null ? request.getUrl() : null);
            }
        });

        if (this.bridge.getWebView() != null && this.bridge.getAppUrl() != null) {
            this.bridge.getWebView().loadUrl(this.bridge.getAppUrl());
        }
    }

    @Override
    public void onDestroy() {
        cancelNativeStdin();
        super.onDestroy();
    }

    private WebResourceResponse maybeHandleNativeStdin(WebResourceRequest request) {
        if (request == null || request.getUrl() == null || this.bridge == null) {
            return null;
        }
        Uri url = request.getUrl();
        String host = url.getHost();
        String path = url.getPath();
        if (host == null || !host.equalsIgnoreCase(this.bridge.getHost()) || !NATIVE_STDIN_PATH.equals(path)) {
            return null;
        }

        StdinSlot slot;
        synchronized (stdinLock) {
            if (earlyReply != null) {
                slot = earlyReply;
                earlyReply = null;
            } else {
                slot = new StdinSlot();
                activeSlot = slot;
                while (!slot.done) {
                    try {
                        stdinLock.wait();
                    } catch (InterruptedException e) {
                        slot.cancelled = true;
                        slot.done = true;
                        if (activeSlot == slot) activeSlot = null;
                        Thread.currentThread().interrupt();
                        break;
                    }
                }
            }
        }

        byte[] payload;
        try {
            JSONObject obj = new JSONObject();
            obj.put("cancelled", slot.cancelled);
            obj.put("text", slot.text != null ? slot.text : "");
            payload = obj.toString().getBytes(StandardCharsets.UTF_8);
        } catch (Exception e) {
            payload = "{\"cancelled\":true,\"text\":\"\"}".getBytes(StandardCharsets.UTF_8);
        }

        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-store, no-cache, must-revalidate");
        headers.put("Access-Control-Allow-Origin", "*");
        headers.put("Cross-Origin-Opener-Policy", "same-origin");
        headers.put("Cross-Origin-Embedder-Policy", "require-corp");
        headers.put("Cross-Origin-Resource-Policy", "cross-origin");

        return new WebResourceResponse(
            "application/json",
            "UTF-8",
            200,
            "OK",
            headers,
            new ByteArrayInputStream(payload)
        );
    }

    private WebResourceResponse withCrossOriginHeaders(WebResourceResponse resp, Uri url) {
        if (resp == null || url == null || this.bridge == null) {
            return resp;
        }
        String host = url.getHost();
        if (host == null || !host.equalsIgnoreCase(this.bridge.getHost())) {
            return resp;
        }
        Map<String, String> headers = new HashMap<>();
        if (resp.getResponseHeaders() != null) {
            headers.putAll(resp.getResponseHeaders());
        }
        headers.put("Cross-Origin-Opener-Policy", "same-origin");
        headers.put("Cross-Origin-Embedder-Policy", "require-corp");
        headers.put("Cross-Origin-Resource-Policy", "cross-origin");
        resp.setResponseHeaders(headers);
        return resp;
    }
}
