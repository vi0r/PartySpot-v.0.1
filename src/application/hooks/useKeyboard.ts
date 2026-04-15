import { useState, useEffect } from 'react';

export function useKeyboard() {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    // Standard approach: Listen to VisualViewport resize
    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      
      // If the viewport height shrinks significantly (e.g. > 150px), 
      // it's likely the keyboard opening.
      // On mobile, the window.innerHeight - vv.height is a good indicator.
      const isVisible = window.innerHeight - vv.height > 150;
      setKeyboardVisible(isVisible);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
  }, []);

  return isKeyboardVisible;
}
