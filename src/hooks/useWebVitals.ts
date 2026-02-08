import { useEffect, useState, useCallback } from 'react';
import { analyticsApi } from '@/services/analytics-api';

interface WebVitalsMetrics {
  LCP: number | null;
  FID: number | null;
  CLS: number | null;
  FCP: number | null;
  TTFB: number | null;
  INP: number | null;
}

interface PerformanceScore {
  score: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  color: string;
}

declare const gtag: any;

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

  const getLCPScore = useCallback((value: number) => getPerformanceScore(value, { good: 2500, poor: 4000 }), [getPerformanceScore]);
  const getFIDScore = useCallback((value: number) => getPerformanceScore(value, { good: 100, poor: 300 }), [getPerformanceScore]);
  const getCLSScore = useCallback((value: number) => getPerformanceScore(value, { good: 0.1, poor: 0.25 }), [getPerformanceScore]);
  const getFCPScore = useCallback((value: number) => getPerformanceScore(value, { good: 1800, poor: 3000 }), [getPerformanceScore]);
  const getTTFBScore = useCallback((value: number) => getPerformanceScore(value, { good: 800, poor: 1800 }), [getPerformanceScore]);
  const getINPScore = useCallback((value: number) => getPerformanceScore(value, { good: 200, poor: 500 }), [getPerformanceScore]);

  const getOverallScore = useCallback(() => {
    const scores = [
      metrics.LCP ? getLCPScore(metrics.LCP).score : 0,
      metrics.FID ? getFIDScore(metrics.FID).score : 0,
      metrics.CLS ? getCLSScore(metrics.CLS * 1000).score : 0, // Ajuste escala CLS para o score
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

  const sendToAnalytics = useCallback(async (customMetrics?: any) => {
    try {
      const data = {
        ...metrics,
        ...customMetrics,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        overallRating: getOverallScore().rating
      };

      // Enviar para API interna
      await analyticsApi.logWebVitals(data);

      // Enviar para GA4 se disponível
      if (typeof gtag !== 'undefined') {
        gtag('event', 'web_vitals_summary', data);
      }
    } catch (error) {
      console.error('Erro ao enviar analytics:', error);
    }
  }, [metrics, getOverallScore]);

  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;
    setIsSupported(true);

    const observers: PerformanceObserver[] = [];

    // LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      setMetrics(prev => ({ ...prev, LCP: lastEntry.startTime }));
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    observers.push(lcpObserver);

    // FCP
    const fcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint') as any;
      if (fcpEntry) setMetrics(prev => ({ ...prev, FCP: fcpEntry.startTime }));
    });
    fcpObserver.observe({ entryTypes: ['paint'] });
    observers.push(fcpObserver);

    // CLS
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
    observers.push(clsObserver);

    // FID
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        setMetrics(prev => ({ ...prev, FID: entry.processingStart - entry.startTime }));
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
    observers.push(fidObserver);

    // TTFB
    const ttfbObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const navigationEntry = entries.find(entry => entry.entryType === 'navigation') as any;
      if (navigationEntry) {
        setMetrics(prev => ({ ...prev, TTFB: navigationEntry.responseStart - navigationEntry.requestStart }));
      }
    });
    ttfbObserver.observe({ entryTypes: ['navigation'] });
    observers.push(ttfbObserver);

    return () => observers.forEach(o => o.disconnect());
  }, []);

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
