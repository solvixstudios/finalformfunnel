import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Check, ChevronRight, Copy, ExternalLink, FileSpreadsheet, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useGoogleSheets, GoogleSheetConfig } from '../../lib/firebase/sheetsHooks';

interface GoogleSheetsIntegrationProps {
    userId: string;
}

export function GoogleSheetsIntegration({ userId }: GoogleSheetsIntegrationProps) {
    const {
        sheets,
        addSheet,
        updateSheet,
        deleteSheet,
        loading
    } = useGoogleSheets(userId);

    const [openSheet, setOpenSheet] = useState(false);
    const [activeTab, setActiveTab] = useState<'manage' | 'guide'>('manage');
    const [view, setView] = useState<'list' | 'add' | 'edit'>('list');

    const [editingSheet, setEditingSheet] = useState<GoogleSheetConfig | null>(null);
    const [form, setForm] = useState({
        name: '',
        webhookUrl: '',
        sheetName: 'Orders',
        abandonedSheetName: 'Abandoned',
        isDefault: false
    });

    const [searchParams] = useSearchParams();

    // Deep Linking Logic
    useEffect(() => {
        const integrationParam = searchParams.get('integration');
        const sheetIdParam = searchParams.get('sheetId');
        const openParam = searchParams.get('open');

        if (integrationParam === 'google-sheets' || openParam === 'google-sheets') {
            // Delay slightly to ensure data is loaded or just set open
            setOpenSheet(true);

            if (sheetIdParam && sheets.length > 0) {
                const targetSheet = sheets.find(s => s.id === sheetIdParam);
                if (targetSheet) {
                    startEditSheet(targetSheet);
                } else if (sheetIdParam === 'new') {
                    startAddSheet();
                }
            }
        }
    }, [searchParams, sheets, loading]); // specific dependency on sheets to ensure we can find the target

    // Reset view when opening/closing
    const handleOpenChange = (open: boolean) => {
        setOpenSheet(open);
        if (!open) {
            // Remove params from URL when closing to clean up state
            // This requires navigation, but for now we just reset local state
            resetForm();
        }
    };

    const resetForm = () => {
        setView('list');
        setEditingSheet(null);
        setForm({
            name: '',
            webhookUrl: '',
            sheetName: 'Orders',
            abandonedSheetName: 'Abandoned',
            isDefault: false
        });
    };

    const startAddSheet = () => {
        setEditingSheet(null);
        setForm({
            name: '',
            webhookUrl: '',
            sheetName: 'Orders',
            abandonedSheetName: 'Abandoned',
            isDefault: sheets.length === 0
        });
        setView('add');
    };

    const startEditSheet = (sheet: GoogleSheetConfig) => {
        setEditingSheet(sheet);
        setForm({
            name: sheet.name,
            webhookUrl: sheet.webhookUrl,
            sheetName: sheet.sheetName || 'Orders',
            abandonedSheetName: sheet.abandonedSheetName || 'Abandoned',
            isDefault: sheet.isDefault
        });
        setView('edit');
    };

    const handleSave = async () => {
        if (!form.name || !form.webhookUrl || !form.sheetName) {
            toast.error('Name, Webhook URL, and Orders Sheet Name are required.');
            return;
        }

        try {
            if (view === 'add') {
                await addSheet(form);
                toast.success('Google Sheet connected!');
            } else if (view === 'edit' && editingSheet) {
                await updateSheet(editingSheet.id, form);
                toast.success('Configuration updated!');
            }
            resetForm();
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to remove this sheet integration?')) {
            try {
                await deleteSheet(id);
                toast.success('Integration removed');
                resetForm();
            } catch (e: any) {
                toast.error(e.message);
            }
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const appScriptCode = `function doPost(e) {
  // --- CONFIGURATION ---
  // These names are sent from the form, but default to:
  var defaultOrdersSheet = "Orders";
  var defaultAbandonedSheet = "Abandoned";
  // ---------------------

  if (!e || !e.postData) return ContentService.createTextOutput("No data");

  try {
    var data = JSON.parse(e.postData.contents);
    var targetSheetName = data.sheetName || defaultOrdersSheet;
    var isAbandoned = data.status === 'abandoned';
    
    // If it's an abandoned checkout, use valid abandoned sheet name
    if (isAbandoned && data.abandonedSheetName) {
      targetSheetName = data.abandonedSheetName;
    }
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(targetSheetName);
    
    // Auto-create sheet if missing
    if (!sheet) {
      sheet = ss.insertSheet(targetSheetName);
      sheet.appendRow(["Timestamp", "Order ID", "Customer Name", "Phone", "Total", "Items", "Status", "City", "Address"]);
    }
    
    // LOGIC: If this is a VALID order, check if we need to remove it from Abandoned
    if (!isAbandoned && data.id && data.abandonedSheetName) {
       var abSheet = ss.getSheetByName(data.abandonedSheetName);
       if (abSheet) {
         var abData = abSheet.getDataRange().getValues();
         // Start from end to safe delete
         for (var i = abData.length - 1; i >= 1; i--) {
           // Assuming Col 2 (index 1) is Order ID
           if (abData[i][1] == data.id) {
             abSheet.deleteRow(i + 1);
             break; // Found and deleted
           }
         }
       }
    }

    // Prepare Row Data
    var timestamp = new Date();
    var itemsStr = "";
    if (data.items && Array.isArray(data.items)) {
      itemsStr = data.items.map(function(i) { return i.productName + " (x" + i.quantity + ")"; }).join(", ");
    }
    
    sheet.appendRow([
      timestamp,
      data.id || "",
      data.customerName || data.name || "",
      data.customerPhone || data.phone || "",
      data.totalPrice || 0,
      itemsStr,
      data.status || "new",
      data.city || data.wilaya || "",
      data.address || ""
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({result: "success"})).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({result: "error", message: error.toString()})).setMimeType(ContentService.MimeType.JSON);
  }
}`;

    // Helper step component
    const Step = ({ num, title, children }: { num: number, title: string, children: React.ReactNode }) => (
        <div className="flex gap-3">
            <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold mt-0.5">
                {num}
            </div>
            <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide pt-0.5">{title}</h4>
                <div className="text-xs text-slate-600 leading-relaxed space-y-2">{children}</div>
            </div>
        </div>
    );

    return (
        <div className="md:col-span-1 md:row-span-1">
            <Sheet open={openSheet} onOpenChange={handleOpenChange}>
                <SheetTrigger asChild>
                    <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl sm:rounded-3xl overflow-hidden hover:ring-2 hover:ring-emerald-100 hover:shadow-xl transition-all duration-300 group relative h-full flex flex-col p-4 sm:p-6 min-h-[140px] sm:min-h-[180px] cursor-pointer active:scale-[0.99]">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="flex flex-col h-full justify-between relative z-10">
                            <div className="flex justify-between items-start">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl text-emerald-600 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform mb-4">
                                    <FileSpreadsheet size={28} />
                                </div>
                                {sheets.length > 0 && (
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-100">
                                        Connected
                                    </Badge>
                                )}
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-slate-900 tracking-tight">Google Sheets</h4>
                                <p className="text-sm text-slate-500 mt-2 font-medium leading-normal">Sync orders to spreadsheets</p>
                            </div>
                        </div>
                    </Card>
                </SheetTrigger>

                <SheetContent hideClose className="sm:max-w-md w-full flex flex-col h-full p-0 gap-0 bg-white overflow-hidden sm:border-l sm:shadow-2xl">
                    <SheetHeader className="px-6 py-5 border-b border-slate-100 shrink-0 bg-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 text-xl shrink-0">
                                    <FileSpreadsheet size={20} />
                                </div>
                                <div className="flex flex-col">
                                    {view === 'add' ? (
                                        <>
                                            <SheetTitle className="text-slate-900 leading-tight">Connect Sheet</SheetTitle>
                                            <SheetDescription className="text-xs mt-0.5">Add logic & webhook</SheetDescription>
                                        </>
                                    ) : view === 'edit' ? (
                                        <>
                                            <SheetTitle className="text-slate-900 leading-tight">Edit Sheet</SheetTitle>
                                            <SheetDescription className="text-xs mt-0.5">Update configuration</SheetDescription>
                                        </>
                                    ) : (
                                        <>
                                            <SheetTitle className="text-slate-900 leading-tight">Google Sheets</SheetTitle>
                                            <SheetDescription className="text-xs mt-0.5">Manage connections</SheetDescription>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {activeTab === 'manage' && (
                                    view === 'list' ? (
                                        <Button
                                            size="sm"
                                            className="bg-[#0F9D58] hover:bg-[#0B8548] text-white h-8 text-xs gap-1.5 shadow-sm px-3 rounded-full"
                                            onClick={() => {
                                                startAddSheet();
                                                setActiveTab('manage');
                                            }}
                                        >
                                            <Plus size={14} className="stroke-[2.5]" /> Add Sheet
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs gap-1.5 px-3 rounded-full"
                                            onClick={resetForm}
                                        >
                                            Cancel
                                        </Button>
                                    )
                                )}

                                <div className="h-6 w-px bg-slate-200 mx-1" />

                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                    onClick={() => handleOpenChange(false)}
                                >
                                    <X size={18} />
                                </Button>
                            </div>
                        </div>
                    </SheetHeader>

                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'manage' | 'guide')} className="flex-1 flex flex-col min-h-0">
                        <TabsList className="grid w-full grid-cols-2 bg-slate-50 p-1 rounded-none shrink-0 border-b border-slate-100">
                            <TabsTrigger value="manage" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 text-xs font-medium text-slate-500">Manage</TabsTrigger>
                            <TabsTrigger value="guide" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 text-xs font-medium text-slate-500">Setup Guide</TabsTrigger>
                        </TabsList>

                        <ScrollArea className="flex-1 bg-slate-50/50 [&>div>div]:!block">
                            <TabsContent value="manage" className="mt-0 p-6 space-y-4">
                                {view === 'list' ? (
                                    <div className="animate-in fade-in duration-300 space-y-4">
                                        {sheets.length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                                                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3">
                                                    <span className="text-2xl grayscale opacity-50">📊</span>
                                                </div>
                                                <h3 className="text-sm font-semibold text-slate-900">No sheets connected yet</h3>
                                                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Connect a Google Sheet to automatically log new orders.</p>
                                                <Button
                                                    className="mt-4 bg-gradient-to-r from-[#0F9D58] to-[#0B8548] hover:from-[#0B8548] hover:to-[#086637] text-white shadow-lg shadow-emerald-100 h-9 text-xs rounded-full px-4 font-medium transition-all hover:scale-105"
                                                    onClick={startAddSheet}
                                                >
                                                    Connect First Sheet
                                                </Button>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            {sheets.map((sheet) => (
                                                <div
                                                    key={sheet.id}
                                                    className="group bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer relative overflow-hidden"
                                                    onClick={() => startEditSheet(sheet)}
                                                >
                                                    <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                                                                <FileSpreadsheet size={18} />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                                                    {sheet.name}
                                                                    {sheet.isDefault && (
                                                                        <Badge variant="secondary" className="text-[10px] bg-emerald-50 text-emerald-700 h-5 px-1.5 border border-emerald-100">
                                                                            Default
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-slate-500 font-mono mt-0.5 truncate max-w-[200px]">
                                                                    {sheet.sheetName} • {sheet.webhookUrl.substring(0, 20)}...
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 group-hover:text-emerald-600 transition-colors">
                                                            <ChevronRight size={16} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    /* Add/Edit Form View */
                                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-5 animate-in slide-in-from-right-8 fade-in duration-300">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-slate-700">Internal Name</Label>
                                                <Input
                                                    placeholder="e.g. Master Orders Sheet"
                                                    className="bg-white h-10 border-slate-200"
                                                    value={form.name}
                                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-semibold text-slate-700">Apps Script Web App URL</Label>
                                                    <Button variant="link" className="h-auto p-0 text-[10px] text-emerald-600" onClick={() => setActiveTab('guide')}>
                                                        Get URL Guide
                                                    </Button>
                                                </div>
                                                <Input
                                                    placeholder="https://script.google.com/macros/s/..."
                                                    className="bg-white font-mono text-xs h-10 border-slate-200"
                                                    value={form.webhookUrl}
                                                    onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-slate-700">Valid Orders Tab</Label>
                                                    <Input
                                                        placeholder="Orders"
                                                        className="bg-white h-10 border-slate-200"
                                                        value={form.sheetName}
                                                        onChange={(e) => setForm({ ...form, sheetName: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs font-semibold text-slate-700">Abandoned Tab</Label>
                                                    <Input
                                                        placeholder="Abandoned"
                                                        className="bg-white h-10 border-slate-200"
                                                        value={form.abandonedSheetName || ''}
                                                        onChange={(e) => setForm({ ...form, abandonedSheetName: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[10px] text-slate-400">
                                                Tab names must match EXACTLY what is in your Google Sheet.
                                            </p>

                                            <div className="flex items-center gap-3 py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <Switch
                                                    id="sheet-default"
                                                    checked={form.isDefault}
                                                    onCheckedChange={(checked) => setForm({ ...form, isDefault: checked })}
                                                    className="data-[state=checked]:bg-emerald-500"
                                                />
                                                <Label htmlFor="sheet-default" className="text-xs font-medium text-slate-700 cursor-pointer flex-1">
                                                    Use as default sheet for all forms
                                                </Label>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 pt-2">
                                            <Button
                                                className="w-full bg-gradient-to-r from-[#0F9D58] to-[#0B8548] hover:from-[#0B8548] hover:to-[#086637] text-white shadow-lg shadow-emerald-100 h-11 text-sm font-medium rounded-xl mt-2"
                                                onClick={handleSave}
                                            >
                                                {view === 'add' ? 'Connect Sheet' : 'Save Changes'}
                                            </Button>

                                            {view === 'edit' && editingSheet && (
                                                <Button
                                                    variant="ghost"
                                                    className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 h-10 text-xs font-medium rounded-xl"
                                                    onClick={() => handleDelete(editingSheet.id)}
                                                >
                                                    Delete Sheet
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="guide" className="mt-0 p-6">
                                <div className="space-y-6">
                                    <Step num={1} title="Create Script">
                                        <p>Open your Google Sheet, go to <span className="font-semibold text-slate-900">Extensions {'>'} Apps Script</span>.</p>
                                        <div className="relative group mt-2">
                                            <div className="bg-slate-900 text-slate-50 p-2.5 rounded-lg text-[10px] font-mono border border-slate-800 h-32 overflow-auto custom-scroll max-w-full">
                                                <pre className="whitespace-pre-wrap break-all">{appScriptCode}</pre>
                                            </div>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="absolute top-2 right-2 h-6 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600"
                                                onClick={() => copyToClipboard(appScriptCode)}
                                            >
                                                <Copy size={10} className="mr-1" /> Copy Code
                                            </Button>
                                        </div>
                                    </Step>

                                    <Step num={2} title="Deploy Web App">
                                        <ul className="list-disc list-outside ml-3 space-y-1 pl-1 marker:text-emerald-400">
                                            <li>Click <span className="font-semibold text-blue-600">Deploy</span> {'>'} <span className="font-semibold">New Deployment</span></li>
                                            <li>Select type: <span className="font-semibold">Web App</span></li>
                                            <li>Who has access: <span className="font-semibold text-emerald-600 bg-emerald-50 px-1 rounded">Anyone</span> (Critical!)</li>
                                            <li>Click <span className="font-semibold">Deploy</span> and copy the URL.</li>
                                        </ul>
                                    </Step>
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </SheetContent>
            </Sheet>
        </div>
    );
}
