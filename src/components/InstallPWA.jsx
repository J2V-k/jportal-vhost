import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";

const InstallPWA = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isStandalone) {
      setSupportsPWA(false);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setPromptInstall(e);
      setSupportsPWA(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!promptInstall) return;

    promptInstall.prompt();

    const { outcome } = await promptInstall.userChoice;
    if (outcome === 'accepted') {
      setPromptInstall(null);
      setSupportsPWA(false);
    }
  };

  if (!supportsPWA) return null;

  return (
    <div className="w-full px-4 mb-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        whileTap={{ scale: 0.99 }}
      >
        <Button
          onClick={handleInstallClick}
          variant="default"
          className="w-full h-12 flex items-center justify-start gap-4 px-6 shadow-xl shadow-primary/10 rounded-xl group overflow-hidden relative"
        >
          <div className="bg-primary-foreground/15 p-2 rounded-lg group-hover:bg-primary-foreground/20 transition-colors relative z-10">
            <Download className="w-4 h-4 text-primary-foreground" strokeWidth={3} />
          </div>

          <div className="flex flex-col items-start leading-none relative z-10">
            <span className="text-sm font-bold tracking-tight">
              Install JP Portal
            </span>
            <span className="text-[9px] font-black uppercase opacity-80 tracking-[0.15em] mt-1">
              Fast & Secure
            </span>
          </div>

          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
        </Button>
      </motion.div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};

export default InstallPWA;