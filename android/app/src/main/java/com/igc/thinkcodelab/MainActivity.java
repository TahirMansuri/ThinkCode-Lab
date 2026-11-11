package com.igc.thinkcodelab;

import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.webkit.ServiceWorkerClient;
import android.webkit.ServiceWorkerController;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {

    private static final String NATIVE_STDIN_PATH = "/__native_stdin";

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

    @Override
    protected void load() {
        super.load();
        if (this.bridge == null) return;

        if (this.bridge.getWebView() != null) {
            this.bridge.getWebView().addJavascriptInterface(new NativeStdinBridge(), "ThinkCodeNativeStdin");
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
