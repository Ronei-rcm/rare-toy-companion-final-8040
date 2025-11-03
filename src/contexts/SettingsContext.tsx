import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Settings = {
  pix_discount_percent: number;
  digital_pay_discount_percent: number;
  free_shipping_min: number;
  shipping_base_price: number;
  enable_apple_pay: boolean;
  enable_google_pay: boolean;
  cart_recovery_enabled: boolean;
  cart_recovery_banner_delay_ms: number;
  cart_recovery_email_delay_ms: number;
};

const defaultSettings: Settings = {
  pix_discount_percent: 5,
  digital_pay_discount_percent: 2,
  free_shipping_min: 200,
  shipping_base_price: 15,
  enable_apple_pay: true,
  enable_google_pay: true,
  cart_recovery_enabled: true,
  cart_recovery_banner_delay_ms: 120000,
  cart_recovery_email_delay_ms: 600000,
};

const SettingsContext = createContext<{ settings: Settings; reload: () => void } | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  const load = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings`, { credentials: 'include' });
      if (!res.ok) throw new Error('settings_get_failed');
      const data = await res.json();
      const raw = (data && data.settings) || {};
      const parsed: Settings = {
        pix_discount_percent: Number(raw.pix_discount_percent ?? defaultSettings.pix_discount_percent),
        digital_pay_discount_percent: Number(raw.digital_pay_discount_percent ?? defaultSettings.digital_pay_discount_percent),
        free_shipping_min: Number(raw.free_shipping_min ?? defaultSettings.free_shipping_min),
        shipping_base_price: Number(raw.shipping_base_price ?? defaultSettings.shipping_base_price),
        enable_apple_pay: String(raw.enable_apple_pay ?? defaultSettings.enable_apple_pay) === 'true',
        enable_google_pay: String(raw.enable_google_pay ?? defaultSettings.enable_google_pay) === 'true',
        cart_recovery_enabled: String(raw.cart_recovery_enabled ?? defaultSettings.cart_recovery_enabled) === 'true',
        cart_recovery_banner_delay_ms: Number(raw.cart_recovery_banner_delay_ms ?? defaultSettings.cart_recovery_banner_delay_ms),
        cart_recovery_email_delay_ms: Number(raw.cart_recovery_email_delay_ms ?? defaultSettings.cart_recovery_email_delay_ms),
      };
      setSettings(parsed);
    } catch {
      setSettings(defaultSettings);
    }
  };

  useEffect(() => { load(); }, []);

  const value = useMemo(() => ({ settings, reload: load }), [settings]);

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings deve ser usado dentro de SettingsProvider');
  return ctx;
}


