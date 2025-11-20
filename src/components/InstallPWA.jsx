import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { motion } from "framer-motion";

const InstallPWA = () => {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState(null);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent));

    const handler = (e) => {
      e.preventDefault();
      setPromptInstall(e);
      setSupportsPWA(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setSupportsPWA(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!promptInstall) {
      return;
    }
    promptInstall.prompt();
    const { outcome } = await promptInstall.userChoice;
    if (outcome === 'accepted') {
      setPromptInstall(null);
      setSupportsPWA(false);
    }
  };

  if (!supportsPWA || !isAndroid) return null;

  return (
    <motion.li className="flex-1" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
      <button
        onClick={handleInstallClick}
        className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors text-gray-400 hover:text-gray-200 dark:text-gray-500 dark:hover:text-gray-800"
      >
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <Download className="w-6 h-6 mb-1" />
        </motion.div>
      </button>
    </motion.li>
  );
};

export default InstallPWA;