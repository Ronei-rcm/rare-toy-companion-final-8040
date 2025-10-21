import { useEffect, useState, useCallback } from 'react';

interface WebVitalsMetrics {
  LCP: number | null; // Largest Contentful Paint
  FID: number | null; // First Input Delay
  CLS: number | null; // Cumulative Layout Shift
  FCP: number | null; // First Contentful Paint
  TTFB: number | null; // Time to First Byte
  INP: number | null; // Interaction to Next Paint (novo Core Web Vital)
}

interface PerformanceScore {
  score: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  color: string;
}

export function useWebVitals() {
  const [metrics, setMetrics] = useState<WebVitalsMetrics>({
    LCP: null,
    FID: null,
    CLS: null,
    FCP: null,
    TTFB: null,
    INP: null
  });

  const [isSupported, setIsSupported] = useState(false);

  const getPerformanceScore = useCallback((value: number, thresholds: { good: number; poor: number }): PerformanceScore => {
    if (value <= thresholds.good) {
      return { score: 100 - ((value / thresholds.good) * 50), rating: 'good', color: '#10B981' };
    } else if (value <= thresholds.poor) {
      return { score: 100 - (50 + ((value - thresholds.good) / (thresholds.poor - thresholds.good)) * 40), rating: 'needs-improvement', color: '#F59E0B' };
    } else {
      return { score: 10 + ((thresholds.poor / value) * 10), rating: 'poor', color: '#EF4444' };
    }
  }, []);

  const getLCPScore = useCallback((value: number) => 
    getPerformanceScore(value, { good: 2.5, poor: 4.0 }), [getPerformanceScore]);

  const getFIDScore = useCallback((value: number) => 
    getPerformanceScore(value, { good: 100, poor: 300 }), [getPerformanceScore]);

  const getCLSScore = useCallback((value: number) => 
    getPerformanceScore(value, { good: 0.1, poor: 0.25 }), [getPerformanceScore]);

  const getFCPScore = useCallback((value: number) => 
    getPerformanceScore(value, { good: 1.8, poor: 3.0 }), [getPerformanceScore]);

  const getTTFBScore = useCallback((value: number) => 
    getPerformanceScore(value, { good: 800, poor: 1800 }), [getPerformanceScore]);

  const getINPScore = useCallback((value: number) => 
    getPerformanceScore(value, { good: 200, poor: 500 }), [getPerformanceScore]);

  const getOverallScore = useCallback(() => {
    const scores = [
      metrics.LCP ? getLCPScore(metrics.LCP).score : 0,
      metrics.FID ? getFIDScore(metrics.FID).score : 0,
      metrics.CLS ? getCLSScore(metrics.CLS).score : 0,
      metrics.FCP ? getFCPScore(metrics.FCP).score : 0,
      metrics.TTFB ? getTTFBScore(metrics.TTFB).score : 0,
      metrics.INP ? getINPScore(metrics.INP).score : 0
    ].filter(score => score > 0);

    if (scores.length === 0) return { score: 0, rating: 'poor' as const, color: '#EF4444' };

    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (average >= 90) return { score: average, rating: 'good' as const, color: '#10B981' };
    if (average >= 50) return { score: average, rating: 'needs-improvement' as const, color: '#F59E0B' };
    return { score: average, rating: 'poor' as const, color: '#EF4444' };
  }, [metrics, getLCPScore, getFIDScore, getCLSScore, getFCPScore, getTTFBScore, getINPScore]);

  useEffect(() => {
    // Verificar suporte a Performance Observer
    if (!('PerformanceObserver' in window)) {
      console.warn('Performance Observer não suportado');
      return;
    }

    setIsSupported(true);

    // LCP - Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      setMetrics(prev => ({ ...prev, LCP: lastEntry.startTime }));
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // FCP - First Contentful Paint
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint') as any;
      if (fcpEntry) {
        setMetrics(prev => ({ ...prev, FCP: fcpEntry.startTime }));
      }
    });
    fcpObserver.observe({ entryTypes: ['paint'] });

    // CLS - Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          setMetrics(prev => ({ ...prev, CLS: clsValue }));
        }
      }
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // FID - First Input Delay (fallback para INP)
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        setMetrics(prev => ({ ...prev, FID: entry.processingStart - entry.startTime }));
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // TTFB - Time to First Byte
    const ttfbObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const navigationEntry = entries.find(entry => entry.entryType === 'navigation') as any;
      if (navigationEntry) {
        setMetrics(prev => ({ ...prev, TTFB: navigationEntry.responseStart - navigationEntry.requestStart }));
      }
    });
    ttfbObserver.observe({ entryTypes: ['navigation'] });

    // INP - Interaction to Next Paint (novo Core Web Vital)
    const inpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        setMetrics(prev => ({ ...prev, INP: entry.processingEnd - entry.startTime }));
      });
    });
    inpObserver.observe({ entryTypes: ['event'] });

    // Cleanup
    return () => {
      lcpObserver.disconnect();
      fcpObserver.disconnect();
      clsObserver.disconnect();
      fidObserver.disconnect();
      ttfbObserver.disconnect();
      inpObserver.disconnect();
    };
  }, []);

  // Função para enviar métricas para analytics
  const sendToAnalytics = useCallback((customMetrics?: Partial<WebVitalsMetrics>) => {
    const allMetrics = { ...metrics, ...customMetrics };
    
    // Enviar para Google Analytics 4
    if (typeof gtag !== 'undefined') {
      Object.entries(allMetrics).forEach(([key, value]) => {
        if (value !== null) {
          gtag('event', 'web_vitals', {
            metric_name: key,
            metric_value: Math.round(value),
            metric_rating: getOverallScore().rating
          });
        }
      });
    }

    // Enviar para API própria
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...allMetrics,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    }).catch(console.error);
  }, [metrics, getOverallScore]);

  return {
    metrics,
    isSupported,
    getLCPScore,
    getFIDScore,
    getCLSScore,
    getFCPScore,
    getTTFBScore,
    getINPScore,
    getOverallScore,
    sendToAnalytics
  };
}
