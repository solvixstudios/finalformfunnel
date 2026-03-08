import { Webhook, Plus, Trash2, Edit3, Code2, Globe } from "lucide-react";
import { useState } from "react";
import { useFormStore } from "../../../stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { HelpPopup } from "@/components/ui/help-popup";

export const WebhookEditor = () => {
    const formConfig = useFormStore((state) => state.formConfig);
    const setFormConfig = useFormStore((state) => state.setFormConfig);
    const webhooks = formConfig.addons?.webhooks || [];

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", url: "", isActive: true, events: ["order_created"] });

    const handleSave = () => {
        if (!formData.name || !formData.url) return;

        const newWebhooks = [...webhooks];
        if (editingId) {
            const index = newWebhooks.findIndex((w) => w.id === editingId);
            if (index > -1) newWebhooks[index] = { ...formData, id: editingId };
        } else {
            newWebhooks.push({ ...formData, id: crypto.randomUUID() });
        }

        setFormConfig({
            ...formConfig,
            addons: { ...formConfig.addons, webhooks: newWebhooks }
        });

        setIsAdding(false);
        setEditingId(null);
        setFormData({ name: "", url: "", isActive: true, events: ["order_created"] });
    };

    const handleEdit = (webhook: any) => {
        setFormData({
            name: webhook.name || "",
            url: webhook.url || "",
            isActive: webhook.isActive ?? true,
            events: webhook.events || ["order_created"]
        });
        setEditingId(webhook.id);
        setIsAdding(true);
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newWebhooks = webhooks.filter((w) => w.id !== id);
        setFormConfig({
            ...formConfig,
            addons: { ...formConfig.addons, webhooks: newWebhooks }
        });
    };

    const toggleWebhookStatus = (id: string, active: boolean) => {
        const newWebhooks = webhooks.map((w) => w.id === id ? { ...w, isActive: active } : w);
        setFormConfig({
            ...formConfig,
            addons: { ...formConfig.addons, webhooks: newWebhooks }
        });
    };

    const toggleEvent = (event: string) => {
        setFormData(prev => ({
            ...prev,
            events: prev.events.includes(event)
                ? prev.events.filter(e => e !== event)
                : [...prev.events, event]
        }));
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-50 to-violet-100 border border-violet-200/60 flex items-center justify-center shadow-sm shrink-0">
                        <Code2 size={18} className="text-violet-600" />
                    </div>
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">Webhook Endpoints</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Push order data to external URLs
                        </p>
                    </div>
                </div>

                <div className="p-3">
                    {/* List View */}
                    {!isAdding ? (
                        <div className="space-y-3">
                            {webhooks.length === 0 ? (
                                <div className="bg-gradient-to-br from-slate-50 to-white border border-dashed border-slate-200 rounded-xl p-6 text-center flex flex-col items-center">
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-3">
                                        <Globe size={22} className="text-slate-300" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-700 mb-1">No webhooks configured</p>
                                    <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                                        Push form submissions instantly to your own server or Make/Zapier.
                                    </p>
                                </div>
                            ) : (
                                webhooks.map(webhook => (
                                    <div key={webhook.id} className="group bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-violet-300 transition-all flex items-center gap-3">
                                        <div className="shrink-0 flex items-center gap-2">
                                            <Switch
                                                checked={webhook.isActive}
                                                onCheckedChange={(c) => toggleWebhookStatus(webhook.id, c)}
                                                className="data-[state=checked]:bg-violet-500 scale-90"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0" onClick={() => handleEdit(webhook)}>
                                            <p className="text-xs font-bold text-slate-800 truncate cursor-pointer hover:text-violet-700 transition-colors">
                                                {webhook.name}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                                                {webhook.url}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-violet-600 hover:bg-violet-50" onClick={() => handleEdit(webhook)}>
                                                <Edit3 size={12} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={(e) => handleDelete(webhook.id, e)}>
                                                <Trash2 size={12} />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}

                            <div className="pt-2 mt-2">
                                <Button
                                    onClick={() => {
                                        setIsAdding(true);
                                        setEditingId(null);
                                        setFormData({ name: "", url: "", isActive: true, events: ["order_created"] });
                                    }}
                                    className="w-full bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200/50 shadow-sm h-9 rounded-xl text-xs font-bold transition-all active:scale-95"
                                >
                                    <Plus size={14} className="mr-1.5" />
                                    Add Webhook Endpoint
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Edit/Add Form */
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4 animate-in zoom-in-95 duration-200">
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Webhook Name</Label>
                                <Input
                                    placeholder="e.g. Make.com Automation"
                                    className="mt-1 h-9 text-xs bg-white"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700">Endpoint URL</Label>
                                <Input
                                    placeholder="https://..."
                                    className="mt-1 h-9 text-xs font-mono bg-white"
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Events to send</Label>
                                <div className="space-y-2 bg-white p-3 rounded-lg border border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <Label className="text-xs font-semibold text-slate-700">Order Created</Label>
                                            <HelpPopup>Triggered on new form submission</HelpPopup>
                                        </div>
                                        <Switch
                                            checked={formData.events.includes("order_created")}
                                            onCheckedChange={() => toggleEvent("order_created")}
                                            className="data-[state=checked]:bg-violet-500"
                                        />
                                    </div>

                                    <div className="w-full h-px bg-slate-100" />

                                    <div className="flex items-center justify-between opacity-50 pointer-events-none">
                                        <div className="flex items-center gap-1.5">
                                            <Label className="text-xs font-semibold text-slate-700">Order Updated  (Coming Soon)</Label>
                                            <HelpPopup>Status changes, etc.</HelpPopup>
                                        </div>
                                        <Switch disabled checked={false} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-9 text-xs rounded-lg"
                                    onClick={() => {
                                        setIsAdding(false);
                                        setEditingId(null);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 h-9 text-xs rounded-lg bg-violet-600 hover:bg-violet-700 text-white"
                                    onClick={handleSave}
                                    disabled={!formData.name || !formData.url}
                                >
                                    {editingId ? "Save Changes" : "Add Webhook"}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
