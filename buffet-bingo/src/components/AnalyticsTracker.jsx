import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getAnalytics, logEvent } from 'firebase/analytics';

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    try {
      const analytics = getAnalytics();
      logEvent(analytics, 'page_view', {
        page_path: location.pathname + location.search,
      });
    } catch (error) {
      // Analytics might not be initialized or supported in this environment
    }
  }, [location]);

  return null;
};

export default AnalyticsTracker;