import React, { useState, useEffect } from 'react';
import { useLmsStore } from '../store/useLmsStore';
import { Settings, Save, RefreshCw, Info, Shield, BookOpen, Clock, DollarSign, Check } from 'lucide-react';

interface SettingType {
  id: string;
  key: string;
  value: string;
  type: string;
  description: string;
}

const SETTING_GROUPS = [
  {
    label: 'Borrowing & Circulation Policy',
    icon: <BookOpen className="w-4 h-4" />,
    keys: ['max_books_per_student', 'default_loan_days', 'max_renewals', 'renewal_window_days', 'grace_period_days'],
  },
  {
    label: 'Fine & Payment Configuration',
    icon: <DollarSign className="w-4 h-4" />,
    keys: ['default_fine_per_day'],
  },
  {
    label: 'Security & Authentication',
    icon: <Shield className="w-4 h-4" />,
    keys: ['college_email_domain', 'mfa_required_roles', 'max_failed_logins', 'session_timeout_minutes', 'password_min_length'],
  },
  {
    label: 'System Performance',
    icon: <Clock className="w-4 h-4" />,
    keys: ['dashboard_refresh_seconds'],
  },
];

export const SettingsPage: React.FC = () => {
  const { apiFetch } = useLmsStore();
  const [settings, setSettings] = useState<SettingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/settings');
      setSettings(data);
      const vals: Record<string, string> = {};
      for (const s of data) {
        vals[s.key] = s.value;
      }
      setEditValues(vals);
    } catch (err) {
      console.error('Failed to load settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async (key: string) => {
    try {
      await apiFetch(`/settings/${key}`, {
        method: 'PATCH',
        body: JSON.stringify({ value: editValues[key] }),
      });
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
      await fetchSettings();
    } catch (err: any) {
      alert(`Failed to update setting: ${err.message}`);
    }
  };

  const getSetting = (key: string): SettingType | undefined =>
    settings.find(s => s.key === key);

  const getInputType = (type: string) => {
    if (type === 'INTEGER') return 'number';
    if (type === 'DECIMAL') return 'number';
    return 'text';
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-600" />
            System Configuration
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage library-wide policies. Changes take effect immediately.
          </p>
        </div>
        <button
          onClick={fetchSettings}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Reload
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {SETTING_GROUPS.map(group => {
            const groupSettings = group.keys.map(k => getSetting(k)).filter(Boolean) as SettingType[];
            if (groupSettings.length === 0) return null;

            return (
              <div key={group.label} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                {/* Group Header */}
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                  <span className="text-slate-500">{group.icon}</span>
                  <h3 className="font-extrabold text-sm text-slate-800">{group.label}</h3>
                </div>

                {/* Settings Rows */}
                <div className="divide-y divide-slate-100">
                  {groupSettings.map(setting => {
                    const isDirty = editValues[setting.key] !== setting.value;
                    const wasSaved = savedKey === setting.key;

                    return (
                      <div key={setting.key} className="px-6 py-5 flex items-start gap-6">
                        {/* Label & Description */}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-slate-900 capitalize">
                              {setting.key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[9px] font-mono bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded uppercase">
                              {setting.type}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1 leading-relaxed">
                            <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            {setting.description}
                          </p>
                        </div>

                        {/* Edit Input + Save */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <input
                            type={getInputType(setting.type)}
                            value={editValues[setting.key] ?? ''}
                            onChange={e => setEditValues(prev => ({ ...prev, [setting.key]: e.target.value }))}
                            step={setting.type === 'DECIMAL' ? '0.01' : undefined}
                            className={`w-40 bg-slate-50 border rounded-lg px-3 py-2 text-xs font-mono font-semibold focus:outline-none transition-all ${
                              isDirty
                                ? 'border-blue-400 bg-blue-50/30 focus:border-blue-500'
                                : 'border-slate-200 focus:border-blue-400'
                            }`}
                          />
                          <button
                            onClick={() => handleSave(setting.key)}
                            disabled={!isDirty && !wasSaved}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-all ${
                              wasSaved
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isDirty
                                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {wasSaved ? (
                              <><Check className="w-3.5 h-3.5" /> Saved</>
                            ) : (
                              <><Save className="w-3.5 h-3.5" /> Save</>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info note */}
      <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 flex gap-3 text-xs text-blue-700">
        <Info className="w-5 h-5 flex-shrink-0 text-blue-500 mt-0.5" />
        <div>
          <strong>System Configuration Note:</strong> All settings are persisted to the database and take effect on the next API request cycle.
          MFA required roles and email domain settings affect authentication immediately.
          Fine rates apply to newly generated fines only — existing records are unchanged.
        </div>
      </div>
    </div>
  );
};
