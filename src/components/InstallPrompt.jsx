import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const InstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Überprüfe, ob die App bereits installiert ist
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Überprüfe, ob es sich um ein iOS-Gerät handelt
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);
    
    // Wenn die App bereits installiert ist oder es kein iOS-Gerät ist, zeige keinen Prompt an
    if (isStandalone) {
      return;
    }
    
    // Event-Listener für das beforeinstallprompt-Event (nicht auf iOS verfügbar)
    const handleBeforeInstallPrompt = (e) => {
      // Verhindere, dass der Standard-Installationsprompt angezeigt wird
      e.preventDefault();
      
      // Speichere das Event, um es später zu verwenden
      setDeferredPrompt(e);
      
      // Zeige den benutzerdefinierten Prompt an
      setShowPrompt(true);
    };
    
    // Zeige den Prompt für iOS-Geräte an
    if (isIOSDevice) {
      // Überprüfe, ob der Benutzer den Prompt bereits geschlossen hat
      const hasClosedPrompt = localStorage.getItem('iosPromptClosed');
      
      if (!hasClosedPrompt) {
        setShowPrompt(true);
      }
    } else {
      // Registriere den Event-Listener für andere Geräte
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
    
    return () => {
      // Entferne den Event-Listener beim Aufräumen
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  // Funktion zum Installieren der App
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Zeige den Installations-Prompt an
    deferredPrompt.prompt();
    
    // Warte auf die Entscheidung des Benutzers
    const { outcome } = await deferredPrompt.userChoice;
    
    // Das deferredPrompt kann nur einmal verwendet werden
    setDeferredPrompt(null);
    
    // Verstecke den Prompt
    setShowPrompt(false);
    
    // Optional: Protokolliere das Ergebnis
    console.log(`User ${outcome === 'accepted' ? 'accepted' : 'dismissed'} the install prompt`);
  };
  
  // Funktion zum Schließen des Prompts
  const handleClosePrompt = () => {
    setShowPrompt(false);
    
    // Speichere für iOS-Geräte, dass der Benutzer den Prompt geschlossen hat
    if (isIOS) {
      localStorage.setItem('iosPromptClosed', 'true');
    }
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white p-4 shadow-lg border-t border-gray-200 z-50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900">
            Installiere TattooTime
          </h3>
          
          {isIOS ? (
            <p className="mt-1 text-sm text-gray-600">
              Tippe auf <span className="inline-flex items-center"><svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" /></svg> Teilen</span> und dann auf "Zum Home-Bildschirm", um TattooTime zu installieren.
            </p>
          ) : (
            <p className="mt-1 text-sm text-gray-600">
              Installiere diese App auf deinem Gerät, um sie auch offline nutzen zu können.
            </p>
          )}
        </div>
        
        <button
          type="button"
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-500"
          onClick={handleClosePrompt}
        >
          <span className="sr-only">Schließen</span>
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {!isIOS && (
        <div className="mt-4">
          <button
            type="button"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={handleInstallClick}
          >
            Installieren
          </button>
        </div>
      )}
    </div>
  );
};

export default InstallPrompt;

