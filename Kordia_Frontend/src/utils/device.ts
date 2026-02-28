export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Checking user agent for mobile terms
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  
  // Additional check based on screen width just to be robust, though userAgent is better for PWA context
  const isNarrowScreen = window.innerWidth <= 768;

  return isMobileUA || isNarrowScreen;
};
