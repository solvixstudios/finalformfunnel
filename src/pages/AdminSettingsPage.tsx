/**
 * AdminSettingsPage — Tabbed admin settings for Payment Methods + Pricing Plans.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Save, Loader2, Settings, CreditCard, MessageCircle, Globe, Wallet,
  Plus, Trash2, GripVertical, Crown, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  getAdminSettings, savePaymentConfig, savePlans, getPlans,
  type PaymentConfig, DEFAULT_PAYMENT_CONFIG,
} from '@/lib/adminSettingsService';
import { ADMIN_EMAIL, DEFAULT_PLANS } from '@/data/plans';
import type { PricingPlan } from '@/types/subscription';
import { toast } from 'sonner';

type Tab = 'payments' | 'plans';

const AdminSettingsPage = () => {
  const [tab, setTab] = useState<Tab>('payments');
  const [config, setConfig] = useState<PaymentConfig>(DEFAULT_PAYMENT_CONFIG);
  const [plans, setPlans] = useState<PricingPlan[]>(DEFAULT_PLANS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [settings, firestorePlans] = await Promise.all([
        getAdminSettings(),
        getPlans(),
      ]);
      setConfig(settings.paymentConfig);
      if (firestorePlans.length > 0) setPlans(firestorePlans);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (tab === 'payments') {
        await savePaymentConfig(config, ADMIN_EMAIL);
      } else {
        await savePlans(plans, ADMIN_EMAIL);
      }
      toast.success('Saved!', { description: tab === 'payments' ? 'Payment configuration updated.' : 'Pricing plans updated.' });
    } catch (error: any) {
      toast.error('Failed to save', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (path: string, value: string | boolean) => {
    setConfig(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = copy;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const updatePlan = (index: number, path: string, value: string | number | boolean) => {
    setPlans(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = copy[index];
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  };

  const addPlan = () => {
    const id = `plan_${Date.now()}`;
    setPlans(prev => [...prev, {
      id, name: 'New Plan', monthlyOrders: 100,
      price: { usd: { monthly: 10, annual: 8 }, dzd: { monthly: 2500, annual: 2000 } },
      features: { activeFunnels: 1, metaPixels: 1, tiktokPixels: 1, googleSheets: 1, storeConnections: 1, brandingRemoved: false, integrationSupport: false },
    }]);
  };

  const removePlan = (index: number) => {
    if (plans[index].id === 'free') { toast.error('Cannot remove the Free plan'); return; }
    setPlans(prev => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-[#908878]" size={24} /></div>;
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'payments', label: 'Payment Methods', icon: <CreditCard size={14} /> },
    { id: 'plans', label: 'Pricing Plans', icon: <Crown size={14} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF5A1F]/10 flex items-center justify-center">
            <Settings className="text-[#FF5A1F]" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#4A443A] tracking-tight">Platform Settings</h1>
            <p className="text-sm text-[#908878] font-medium">Configure payment methods and pricing plans.</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="font-bold text-xs gap-1.5 shadow-sm">
          {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#F2EFE8] rounded-xl p-1 border border-[#E6E0D3] mb-6 w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12px] font-bold transition-all",
            tab === t.id ? "bg-white text-[#4A443A] shadow-sm border border-[#E6E0D3]" : "text-[#908878] hover:text-[#4A443A]"
          )}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* ═══ PAYMENTS TAB ═══ */}
      {tab === 'payments' && (
        <div className="space-y-4">
          {/* WhatsApp */}
          <SettingsSection icon={<MessageCircle size={14} className="text-[#25D366]" />} title="WhatsApp" subtitle="Contact number for payment support" color="bg-[#25D366]/10">
            <FieldRow label="Phone Number" hint="Country code + number, no + or spaces">
              <Input value={config.whatsappNumber} onChange={(e) => updateConfig('whatsappNumber', e.target.value)} placeholder="213550000000" className="border-[#E6E0D3] focus-visible:ring-[#FF5A1F] h-9 text-[12px] font-mono max-w-xs" />
            </FieldRow>
          </SettingsSection>

          {/* RedotPay */}
          <SettingsSection icon={<Globe size={14} className="text-emerald-500" />} title="RedotPay" subtitle="Visa/Mastercard via RedotPay" color="bg-emerald-50"
            enabled={config.redotpay?.enabled} onToggle={(v) => updateConfig('redotpay.enabled', v)}>
            <FieldRow label="Payment Link">
              <Input value={config.redotpay?.link || ''} onChange={(e) => updateConfig('redotpay.link', e.target.value)} placeholder="https://url.hk/i/en/..." className="border-[#E6E0D3] focus-visible:ring-[#FF5A1F] h-9 text-[12px] font-mono" />
            </FieldRow>
            <FieldRow label="Instructions">
              <Input value={config.redotpay?.instructions || ''} onChange={(e) => updateConfig('redotpay.instructions', e.target.value)} className="border-[#E6E0D3] focus-visible:ring-[#FF5A1F] h-9 text-[12px]" />
            </FieldRow>
          </SettingsSection>

          {/* USDT */}
          <SettingsSection icon={<Wallet size={14} className="text-amber-500" />} title="USDT (Binance)" subtitle="Crypto payment via USDT" color="bg-amber-50"
            enabled={config.usdt?.enabled} onToggle={(v) => updateConfig('usdt.enabled', v)}>
            <FieldRow label="Network">
              <Input value={config.usdt?.network || ''} onChange={(e) => updateConfig('usdt.network', e.target.value)} placeholder="BEP-20 (BSC)" className="border-[#E6E0D3] focus-visible:ring-[#FF5A1F] h-9 text-[12px]" />
            </FieldRow>
            <FieldRow label="Wallet Address">
              <Input value={config.usdt?.walletAddress || ''} onChange={(e) => updateConfig('usdt.walletAddress', e.target.value)} placeholder="0x..." className="border-[#E6E0D3] focus-visible:ring-[#FF5A1F] h-9 text-[12px] font-mono" />
            </FieldRow>
            <FieldRow label="Instructions">
              <Input value={config.usdt?.instructions || ''} onChange={(e) => updateConfig('usdt.instructions', e.target.value)} className="border-[#E6E0D3] focus-visible:ring-[#FF5A1F] h-9 text-[12px]" />
            </FieldRow>
          </SettingsSection>

          {/* CCP */}
          <SettingsSection icon={<CreditCard size={14} className="text-blue-500" />} title="CCP" subtitle="Algérie Poste transfer" color="bg-blue-50"
            enabled={config.ccp?.enabled} onToggle={(v) => updateConfig('ccp.enabled', v)}>
            <FieldRow label="Account Name">
              <Input value={config.ccp.accountName} onChange={(e) => updateConfig('ccp.accountName', e.target.value)} className="border-[#E6E0D3] focus-visible:ring-[#FF5A1F] h-9 text-[12px]" />
            </FieldRow>
            <FieldRow label="Account Number">
              <Input value={config.ccp.accountNumber} onChange={(e) => updateConfig('ccp.accountNumber', e.target.value)} className="border-[#E6E0D3] focus-visible:ring-[#FF5A1F] h-9 text-[12px] font-mono" />
            </FieldRow>
            <FieldRow label="Instructions">
              <Input value={config.ccp.instructions} onChange={(e) => updateConfig('ccp.instructions', e.target.value)} className="border-[#E6E0D3] focus-visible:ring-[#FF5A1F] h-9 text-[12px]" />
            </FieldRow>
          </SettingsSection>

          {/* Baridi Pay */}
          <SettingsSection icon={<CreditCard size={14} className="text-violet-500" />} title="Baridi Pay" subtitle="BaridiMob RIP transfer" color="bg-violet-50"
            enabled={config.baridiPay?.enabled} onToggle={(v) => updateConfig('baridiPay.enabled', v)}>
            <FieldRow label="RIP Number">
              <Input value={config.baridiPay.rip} onChange={(e) => updateConfig('baridiPay.rip', e.target.value)} className="border-[#E6E0D3] focus-visible:ring-[#FF5A1F] h-9 text-[12px] font-mono" />
            </FieldRow>
            <FieldRow label="Instructions">
              <Input value={config.baridiPay.instructions} onChange={(e) => updateConfig('baridiPay.instructions', e.target.value)} className="border-[#E6E0D3] focus-visible:ring-[#FF5A1F] h-9 text-[12px]" />
            </FieldRow>
          </SettingsSection>
        </div>
      )}

      {/* ═══ PLANS TAB ═══ */}
      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-[#908878] font-medium">{plans.length} plans configured</p>
            <Button variant="outline" size="sm" onClick={addPlan} className="text-[11px] font-bold gap-1 border-[#E6E0D3] text-[#4A443A]">
              <Plus size={12} /> Add Plan
            </Button>
          </div>

          {plans.map((plan, i) => (
            <Card key={plan.id} className="rounded-2xl border-[#E6E0D3] shadow-sm bg-white overflow-hidden">
              <CardContent className="p-0">
                {/* Plan header */}
                <div className="flex items-center justify-between px-5 py-3 bg-[#FAF9F6] border-b border-[#E6E0D3]">
                  <div className="flex items-center gap-2">
                    <GripVertical size={14} className="text-[#D4CFC5]" />
                    <div className="w-7 h-7 rounded-lg bg-[#FF5A1F]/10 flex items-center justify-center">
                      <Crown size={12} className="text-[#FF5A1F]" />
                    </div>
                    <Input value={plan.name} onChange={(e) => updatePlan(i, 'name', e.target.value)}
                      className="border-0 bg-transparent font-bold text-[14px] text-[#4A443A] h-7 p-0 focus-visible:ring-0 w-32" />
                    {plan.id === 'free' && (
                      <span className="px-2 py-0.5 rounded-full bg-[#E6E0D3] text-[#908878] text-[8px] font-bold uppercase tracking-widest">Default</span>
                    )}
                  </div>
                  {plan.id !== 'free' && (
                    <button onClick={() => removePlan(i)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                {/* Plan body */}
                <div className="p-5 space-y-4">
                  {/* Core */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="grid gap-1">
                      <label className="text-[9px] font-bold text-[#A69D8A] uppercase tracking-widest">Plan ID</label>
                      <Input value={plan.id} onChange={(e) => updatePlan(i, 'id', e.target.value)} disabled={plan.id === 'free'}
                        className="border-[#E6E0D3] h-8 text-[11px] font-mono" />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-[9px] font-bold text-[#A69D8A] uppercase tracking-widest">Orders / Month</label>
                      <Input type="number" value={plan.monthlyOrders} onChange={(e) => updatePlan(i, 'monthlyOrders', parseInt(e.target.value) || 0)}
                        className="border-[#E6E0D3] h-8 text-[11px]" />
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <p className="text-[9px] font-bold text-[#A69D8A] uppercase tracking-widest mb-2">Pricing</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="grid gap-1">
                        <label className="text-[8px] font-bold text-[#D4CFC5] uppercase">USD · Monthly</label>
                        <Input type="number" value={plan.price.usd.monthly} onChange={(e) => updatePlan(i, 'price.usd.monthly', parseFloat(e.target.value) || 0)}
                          className="border-[#E6E0D3] h-7 text-[11px]" />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-[8px] font-bold text-[#D4CFC5] uppercase">USD · Annual</label>
                        <Input type="number" value={plan.price.usd.annual} onChange={(e) => updatePlan(i, 'price.usd.annual', parseFloat(e.target.value) || 0)}
                          className="border-[#E6E0D3] h-7 text-[11px]" />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-[8px] font-bold text-[#D4CFC5] uppercase">DZD · Monthly</label>
                        <Input type="number" value={plan.price.dzd.monthly} onChange={(e) => updatePlan(i, 'price.dzd.monthly', parseFloat(e.target.value) || 0)}
                          className="border-[#E6E0D3] h-7 text-[11px]" />
                      </div>
                      <div className="grid gap-1">
                        <label className="text-[8px] font-bold text-[#D4CFC5] uppercase">DZD · Annual</label>
                        <Input type="number" value={plan.price.dzd.annual} onChange={(e) => updatePlan(i, 'price.dzd.annual', parseFloat(e.target.value) || 0)}
                          className="border-[#E6E0D3] h-7 text-[11px]" />
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <p className="text-[9px] font-bold text-[#A69D8A] uppercase tracking-widest mb-2">Feature Limits</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { key: 'features.activeFunnels', label: 'Funnels' },
                        { key: 'features.metaPixels', label: 'Meta Pixels' },
                        { key: 'features.tiktokPixels', label: 'TikTok Pixels' },
                        { key: 'features.googleSheets', label: 'Sheets' },
                        { key: 'features.storeConnections', label: 'Stores' },
                      ].map(f => {
                        const keys = f.key.split('.');
                        const val = (plan as any)[keys[0]][keys[1]];
                        return (
                          <div key={f.key} className="grid gap-1">
                            <label className="text-[8px] font-bold text-[#D4CFC5] uppercase">{f.label}</label>
                            <Input type="number" value={val} onChange={(e) => updatePlan(i, f.key, parseInt(e.target.value) || 0)}
                              className="border-[#E6E0D3] h-7 text-[11px]" />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <label className="flex items-center gap-2 text-[11px] font-medium text-[#7A7365] cursor-pointer">
                        <input type="checkbox" checked={plan.features.brandingRemoved} onChange={(e) => updatePlan(i, 'features.brandingRemoved', e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-[#E6E0D3] text-[#FF5A1F] focus:ring-[#FF5A1F]" />
                        Branding removed
                      </label>
                      <label className="flex items-center gap-2 text-[11px] font-medium text-[#7A7365] cursor-pointer">
                        <input type="checkbox" checked={plan.features.integrationSupport} onChange={(e) => updatePlan(i, 'features.integrationSupport', e.target.checked)}
                          className="w-3.5 h-3.5 rounded border-[#E6E0D3] text-[#FF5A1F] focus:ring-[#FF5A1F]" />
                        Integration support
                      </label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Helper Components ─────────────────────────────────────────

function SettingsSection({ icon, title, subtitle, color, enabled, onToggle, children }: {
  icon: React.ReactNode; title: string; subtitle: string; color: string;
  enabled?: boolean; onToggle?: (v: boolean) => void; children: React.ReactNode;
}) {
  return (
    <Card className="rounded-2xl border-[#E6E0D3] shadow-sm bg-white overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#FAF9F6] border-b border-[#E6E0D3]">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", color)}>{icon}</div>
            <div>
              <h3 className="text-[13px] font-bold text-[#4A443A]">{title}</h3>
              <p className="text-[10px] text-[#A69D8A] font-medium">{subtitle}</p>
            </div>
          </div>
          {onToggle && (
            <button onClick={() => onToggle(!enabled)} className={cn("transition-colors", enabled ? "text-[#FF5A1F]" : "text-[#D4CFC5]")}>
              {enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
            </button>
          )}
        </div>
        <div className={cn("px-5 py-4 space-y-3", onToggle && !enabled && "opacity-40 pointer-events-none")}>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-[11px] font-bold text-[#4A443A]">{label}</label>
      {children}
      {hint && <p className="text-[9px] text-[#A69D8A]">{hint}</p>}
    </div>
  );
}

export default AdminSettingsPage;
