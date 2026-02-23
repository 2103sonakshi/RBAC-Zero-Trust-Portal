import React, { useState, useEffect } from "react";
import { Download, X, Info } from "lucide-react";

const InstallApp = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(window.deferredPrompt || null);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // If it was already set before React loaded, sync it
        if (window.deferredPrompt) {
            setDeferredPrompt(window.deferredPrompt);
        }

        // Check if device is iOS
        const isIosDevice =
            /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        setIsIOS(isIosDevice);

        // Check if app is already installed/running as standalone
        const isStandaloneMode =
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true;
        setIsStandalone(isStandaloneMode);

        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            window.deferredPrompt = e;
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener(
                "beforeinstallprompt",
                handleBeforeInstallPrompt
            );
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            console.log("No deferred prompt available");
            return;
        }

        try {
            // Show the install prompt
            deferredPrompt.prompt();

            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
        } catch (error) {
            console.error("Installation prompt failed:", error);
        } finally {
            // We've used the prompt, and can't use it again, throw it away
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        // Hide it by pretending it's standalone mode
        setIsStandalone(true);
    };

    // If already installed, don't show
    if (isStandalone) return null;

    // Render prompt for Android/Desktop (fallback)
    return (
        <div className="fixed bottom-4 left-4 right-4 z-[9999] md:left-auto md:right-4 md:w-96 bg-gray-900 border border-blue-500 rounded-xl p-4 shadow-2xl animate-fade-in-up pointer-events-auto">
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
            >
                <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-4">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                    <Download className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1 pr-6">
                    <h3 className="text-white font-medium text-sm">
                        Install RBAC Portal
                    </h3>
                    <p className="text-gray-400 text-xs mt-1 mb-3">
                        Install our app on your device for quick access, offline
                        capabilities, and a better native experience.
                    </p>
                    <button
                        onClick={() => {
                            if (deferredPrompt) {
                                handleInstallClick();
                            } else {
                                alert("To install, please click the Install App/Display icon located in your browser's address bar (top right corner).");
                            }
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors cursor-pointer relative z-[10000]"
                    >
                        Install Application
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallApp;
