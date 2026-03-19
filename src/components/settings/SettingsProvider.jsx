import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState(null);

  const defaultSettings = {
    account_size: '',
    position_sizing_percent: '',
    default_stop_loss_percent: '',
    target_profit_dollars: '',
    max_dollars: '',
    risk_amount: '',
    float_10m_min_r: '',
    float_10m_max_r: '',
    float_10_50m_min_r: '',
    float_10_50m_max_r: '',
    float_50_200m_min_r: '',
    float_50_200m_max_r: '',
    float_200m_min_r: '',
    float_200m_max_r: '',
    float_categories: {
      micro: { min: 0, max: 20000000, label: 'Micro', color: 'text-red-400', positionMultiplier: 0.3, stopLossPercent: 3.0, maxFloatPercent: 0.1 },
      small: { min: 20000000, max: 50000000, label: 'Small', color: 'text-orange-400', positionMultiplier: 0.5, stopLossPercent: 3.5, maxFloatPercent: 0.25 },
      medium: { min: 50000000, max: 500000000, label: 'Medium', color: 'text-yellow-400', positionMultiplier: 0.8, stopLossPercent: 4.0, maxFloatPercent: 0.5 },
      large: { min: 500000000, max: 2000000000, label: 'Large', color: 'text-blue-400', positionMultiplier: 1.2, stopLossPercent: 5.0, maxFloatPercent: 0.75 },
      mega: { min: 2000000000, max: Infinity, label: 'Mega', color: 'text-emerald-400', positionMultiplier: 1.5, stopLossPercent: 6.0, maxFloatPercent: 1.0 }
    }
  };

  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const list = await base44.entities.Settings.list();
        const first = list && list[0] ? list[0] : null;
        if (!isMounted) return;
        
        if (first) {
          setSettingsId(first.id);
          setSettings({
            account_size: first.account_size?.toString() || '',
            position_sizing_percent: first.position_sizing_percent?.toString() || '',
            default_stop_loss_percent: first.default_stop_loss_percent?.toString() || '',
            target_profit_dollars: first.target_profit_dollars?.toString() || '',
            max_dollars: first.max_dollars?.toString() || '',
            risk_amount: first.risk_amount?.toString() || '1000',
            float_10m_min_r: first.float_10m_min_r?.toString() || '',
            float_10m_max_r: first.float_10m_max_r?.toString() || '',
            float_10_50m_min_r: first.float_10_50m_min_r?.toString() || '',
            float_10_50m_max_r: first.float_10_50m_max_r?.toString() || '',
            float_50_200m_min_r: first.float_50_200m_min_r?.toString() || '',
            float_50_200m_max_r: first.float_50_200m_max_r?.toString() || '',
            float_200m_min_r: first.float_200m_min_r?.toString() || '',
            float_200m_max_r: first.float_200m_max_r?.toString() || '',
            float_categories: first.float_categories || defaultSettings.float_categories
          });
        } else {
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    
    const data = {
      account_size: parseFloat(settings.account_size) || 25000,
      position_sizing_percent: parseFloat(settings.position_sizing_percent) || 1,
      default_stop_loss_percent: parseFloat(settings.default_stop_loss_percent) || 3,
      target_profit_dollars: parseFloat(settings.target_profit_dollars) || 500,
      max_dollars: parseFloat(settings.max_dollars) || 5000,
      risk_amount: parseFloat(settings.risk_amount) || 1500,
      float_10m_min_r: parseFloat(settings.float_10m_min_r) || 4,
      float_10m_max_r: parseFloat(settings.float_10m_max_r) || 7,
      float_10_50m_min_r: parseFloat(settings.float_10_50m_min_r) || 3,
      float_10_50m_max_r: parseFloat(settings.float_10_50m_max_r) || 5,
      float_50_200m_min_r: parseFloat(settings.float_50_200m_min_r) || 2,
      float_50_200m_max_r: parseFloat(settings.float_50_200m_max_r) || 3,
      float_200m_min_r: parseFloat(settings.float_200m_min_r) || 1,
      float_200m_max_r: parseFloat(settings.float_200m_max_r) || 2,
      float_categories: settings.float_categories
    };
    
    try {
      if (settingsId) {
        const updated = await base44.entities.Settings.update(settingsId, data);
        setSettingsId(updated.id);
      } else {
        const created = await base44.entities.Settings.create(data);
        setSettingsId(created.id);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const updateRiskAmount = (newRiskAmount) => {
    setSettings(prev => ({ ...prev, risk_amount: newRiskAmount }));
  };

  const riskAmount = settings.risk_amount || '';

  const updateFloatCategory = (categoryKey, updates) => {
    setSettings(prev => ({
      ...prev,
      float_categories: {
        ...prev.float_categories,
        [categoryKey]: { ...prev.float_categories[categoryKey], ...updates }
      }
    }));
  };

  const value = {
    settings,
    loading,
    saving,
    riskAmount,
    updateSettings,
    updateRiskAmount,
    updateFloatCategory,
    saveSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;