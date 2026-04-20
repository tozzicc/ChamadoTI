import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../lib/api';

interface Settings {
  appName: string;
  logoPath?: string;
  visibleCharts: string[];
  defaultChartType: string;
}

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    appName: 'Chamado TI',
    visibleCharts: ['user_open', 'tech_resolve', 'resolution_time', 'category_freq'],
    defaultChartType: 'BAR'
  });
  const [loading, setLoading] = useState(true);

  const refreshSettings = async () => {
    try {
      const response = await axios.get(`${API_URL}/settings`);
      setSettings({
        ...response.data,
        visibleCharts: typeof response.data.visibleCharts === 'string' 
          ? JSON.parse(response.data.visibleCharts) 
          : response.data.visibleCharts
      });
    } catch (error) {
      console.error('Failed to fetch settings', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
