/**
 * Service worker registration + install prompt handling.
 * Lets the user install the app on their phone/desktop.
 */

// Register service worker (works on https + localhost)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("[PWA] Service worker registration failed:", err);
    });
  });
}

// Install prompt handling (Chrome/Edge/Android)
let deferredPrompt: BeforeInstallPromptEvent | null = null;
const installBtn = document.getElementById("install-btn") as HTMLButtonElement | null;

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  if (installBtn) installBtn.classList.remove("hidden");
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      installBtn.classList.add("hidden");
    }
    deferredPrompt = null;
  });
}

window.addEventListener("appinstalled", () => {
  if (installBtn) installBtn.classList.add("hidden");
  deferredPrompt = null;
});
