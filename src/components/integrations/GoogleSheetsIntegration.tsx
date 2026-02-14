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
import { AlertCircle, Check, ChevronRight, Copy, ExternalLink, FileSpreadsheet, GripVertical, Lock, Pin, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useGoogleSheets, GoogleSheetConfig } from '../../lib/firebase/sheetsHooks';
import { DEFAULT_FORM_CONFIG } from '../../config/defaults';

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
    const defaultColumns = DEFAULT_FORM_CONFIG.addons.sheetColumns;
    const defaultPinnedCount = DEFAULT_FORM_CONFIG.addons.sheetPinnedCount;
    const [form, setForm] = useState({
        name: '',
        webhookUrl: '',
        sheetName: 'Orders',
        isDefault: false,
        columns: [...defaultColumns],
        pinnedCount: defaultPinnedCount,
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
            isDefault: false,
            columns: [...defaultColumns],
            pinnedCount: defaultPinnedCount,
        });
    };

    const startAddSheet = () => {
        setEditingSheet(null);
        setForm({
            name: '',
            webhookUrl: '',
            sheetName: 'Orders',
            isDefault: sheets.length === 0,
            columns: [...defaultColumns],
            pinnedCount: defaultPinnedCount,
        });
        setView('add');
    };

    const startEditSheet = (sheet: GoogleSheetConfig) => {
        setEditingSheet(sheet);
        setForm({
            name: sheet.name,
            webhookUrl: sheet.webhookUrl,
            sheetName: sheet.sheetName || 'Orders',
            isDefault: sheet.isDefault,
            columns: sheet.columns?.length > 0 ? sheet.columns : [...defaultColumns],
            pinnedCount: sheet.pinnedCount ?? defaultPinnedCount,
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
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var output = ContentService.createTextOutput();
    output.setMimeType(ContentService.MimeType.JSON);

    if (!e || !e.postData) {
      return output.setContent(JSON.stringify({ result: "error", message: "No data" }));
    }

    var data = JSON.parse(e.postData.contents);
    var sheetName = data.sheetName || "Orders";
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    var isNewSheet = false;
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      isNewSheet = true;
    }

    // --- METADATA KEYS (never shown as columns) ---
    var metaKeys = ['sheetName', 'abandonedSheetName', '_orderedColumns', '_updateExistingOrderId', '_pinnedCount', 'orderStatus', 'submittedAt'];

    // --- DETERMINE COLUMN ORDER & LABELS ---
    var orderedCols = data._orderedColumns || null;
    var colIds = [];
    var colLabels = {};

    if (orderedCols && orderedCols.length > 0) {
      for (var i = 0; i < orderedCols.length; i++) {
        var col = orderedCols[i];
        if (typeof col === 'object' && col.id) {
          colIds.push(col.id);
          colLabels[col.id] = col.label || col.id;
        } else {
          colIds.push(col);
          colLabels[col] = col;
        }
      }
    } else {
      colIds = Object.keys(data).filter(function(k) {
        return metaKeys.indexOf(k) === -1;
      });
      for (var j = 0; j < colIds.length; j++) {
        colLabels[colIds[j]] = colIds[j];
      }
    }

    // --- HEADER MANAGEMENT ---
    var lastCol = sheet.getLastColumn();
    var headers = []; // These are LABELS displayed in the sheet
    var headerIds = []; // These are IDs for data mapping
    if (lastCol > 0) {
      headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return h.toString(); });
      // Build reverse map: label -> id
      headerIds = headers.slice(); // default: assume headers equal IDs
    }

    if (headers.length === 0 || isNewSheet) {
      // Write labels as headers
      headers = colIds.map(function(id) { return colLabels[id]; });
      headerIds = colIds.slice();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      formatHeaderRow(sheet, headers.length, data._pinnedCount || 3);
    } else {
      // Check for new columns not yet in headers
      var newHeaderLabels = [];
      var newHeaderIds = [];
      for (var k = 0; k < colIds.length; k++) {
        var label = colLabels[colIds[k]];
        if (headers.indexOf(label) === -1) {
          newHeaderLabels.push(label);
          newHeaderIds.push(colIds[k]);
        }
      }
      if (newHeaderLabels.length > 0) {
        sheet.getRange(1, headers.length + 1, 1, newHeaderLabels.length).setValues([newHeaderLabels]);
        headers = headers.concat(newHeaderLabels);
        headerIds = headerIds.concat(newHeaderIds);
        formatHeaderRow(sheet, headers.length, data._pinnedCount || 3);
      }
    }

    // Build label-to-id map for data lookup
    var labelToId = {};
    for (var m = 0; m < colIds.length; m++) {
      labelToId[colLabels[colIds[m]]] = colIds[m];
    }

    // --- BUILD ROW VALUES ---
    var row = headers.map(function(header) {
      var id = labelToId[header] || header;
      var val = data[id];
      if (val && typeof val === 'object') return JSON.stringify(val);
      return val !== undefined && val !== null ? val : "";
    });

    // --- UPDATE EXISTING OR APPEND ---
    var updateId = data._updateExistingOrderId || null;
    var targetRow = -1;

    if (updateId) {
      // Find existing row with matching orderId
      var orderIdLabel = colLabels['orderId'] || 'orderId';
      var orderIdCol = headers.indexOf(orderIdLabel);
      if (orderIdCol > -1 && sheet.getLastRow() > 1) {
        var allData = sheet.getRange(2, orderIdCol + 1, sheet.getLastRow() - 1, 1).getValues();
        for (var r = 0; r < allData.length; r++) {
          if (allData[r][0].toString() == updateId.toString()) {
            targetRow = r + 2; // +2 for 1-index + header row
            break;
          }
        }
      }
    }

    if (targetRow > 0) {
      // Update existing row in-place
      sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
      formatDataRow(sheet, targetRow, headers, labelToId);
    } else {
      // Append new row
      var newRow = sheet.getLastRow() + 1;
      sheet.getRange(newRow, 1, 1, row.length).setValues([row]);
      formatDataRow(sheet, newRow, headers, labelToId);
    }

    return output.setContent(JSON.stringify({ result: "success" }));

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", error: err.toString() })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ═══════════════════════════════════
// STATUS CONFIG
// ═══════════════════════════════════

var STATUS_LIST = [
  'Nouvelle commande',
  'En attente',
  'Confirmée',
  'En préparation',
  'Expédiée',
  'Livrée',
  'Échouée 1',
  'Échouée 2',
  'Échouée 3',
  'Annulée',
  'Retournée',
  'Panier abandonné'
];

var STATUS_COLORS = {
  'Nouvelle commande':  { bg: '#dbeafe', fg: '#1e40af' },
  'En attente':         { bg: '#e0e7ff', fg: '#4338ca' },
  'Confirmée':          { bg: '#d1fae5', fg: '#065f46' },
  'En préparation':     { bg: '#fef3c7', fg: '#92400e' },
  'Expédiée':           { bg: '#e0e7ff', fg: '#3730a3' },
  'Livrée':             { bg: '#bbf7d0', fg: '#14532d' },
  'Échouée 1':          { bg: '#fef2f2', fg: '#dc2626' },
  'Échouée 2':          { bg: '#fee2e2', fg: '#b91c1c' },
  'Échouée 3':          { bg: '#fecaca', fg: '#991b1b' },
  'Annulée':            { bg: '#fee2e2', fg: '#991b1b' },
  'Retournée':          { bg: '#fce7f3', fg: '#9d174d' },
  'Panier abandonné':   { bg: '#f1f5f9', fg: '#64748b' }
};

// ═══════════════════════════════════
// FORMATTING
// ═══════════════════════════════════

function formatHeaderRow(sheet, colCount, pinnedCount) {
  var hr = sheet.getRange(1, 1, 1, colCount);
  hr.setBackground('#0f172a')
    .setFontColor('#f8fafc')
    .setFontWeight('bold')
    .setFontSize(10)
    .setFontFamily('Inter, Arial, sans-serif')
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  hr.setBorder(null, null, true, null, null, null, '#334155', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);

  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(pinnedCount || 3);

  for (var i = 1; i <= colCount; i++) {
    sheet.autoResizeColumn(i);
    var w = sheet.getColumnWidth(i);
    if (w < 110) sheet.setColumnWidth(i, 110);
    if (w > 250) sheet.setColumnWidth(i, 250);
  }
}

function formatDataRow(sheet, rowNum, headers, labelToId) {
  var colCount = headers.length;
  var rowRange = sheet.getRange(rowNum, 1, 1, colCount);

  // --- Find status ---
  var statusLabel = null;
  for (var key in labelToId) {
    if (labelToId[key] === 'status') { statusLabel = key; break; }
  }
  var statusIdx = statusLabel ? headers.indexOf(statusLabel) : -1;
  var statusVal = '';
  if (statusIdx > -1) {
    statusVal = sheet.getRange(rowNum, statusIdx + 1).getValue().toString();
  }

  // --- ROW BACKGROUND based on status ---
  var rowColor = STATUS_COLORS[statusVal];
  if (rowColor) {
    rowRange.setBackground(rowColor.bg);
  } else {
    // Alternating if no status match
    rowRange.setBackground(rowNum % 2 === 0 ? '#f8fafc' : '#ffffff');
  }

  rowRange
    .setFontSize(10)
    .setFontFamily('Inter, Arial, sans-serif')
    .setVerticalAlignment('middle')
    .setWrap(false);

  sheet.setRowHeight(rowNum, 32);
  rowRange.setBorder(null, null, true, null, null, null, '#e2e8f0', SpreadsheetApp.BorderStyle.SOLID);

  // --- PHONE COLUMN: text format ---
  var phoneLabel = null;
  for (var pk in labelToId) {
    if (labelToId[pk] === 'phone') { phoneLabel = pk; break; }
  }
  var phoneIdx = phoneLabel ? headers.indexOf(phoneLabel) : -1;
  if (phoneIdx > -1) {
    var phoneCell = sheet.getRange(rowNum, phoneIdx + 1);
    phoneCell.setNumberFormat('@'); // Force text
    // Re-set value as string to preserve leading 0
    var phoneVal = phoneCell.getValue().toString();
    if (phoneVal && !isNaN(phoneVal)) {
      phoneCell.setValue(phoneVal);
    }
  }

  // --- STATUS COLUMN: dropdown + bold + color ---
  if (statusIdx > -1) {
    var statusCell = sheet.getRange(rowNum, statusIdx + 1);

    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(STATUS_LIST, true)
      .setAllowInvalid(false)
      .build();
    statusCell.setDataValidation(rule);

    statusCell.setFontWeight('bold').setHorizontalAlignment('center');
    if (rowColor) {
      statusCell.setFontColor(rowColor.fg);
    }
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

                                            <div className="space-y-2">
                                                <Label className="text-xs font-semibold text-slate-700">Tab Name</Label>
                                                <Input
                                                    placeholder="Orders"
                                                    className="bg-white h-10 border-slate-200"
                                                    value={form.sheetName}
                                                    onChange={(e) => setForm({ ...form, sheetName: e.target.value })}
                                                />
                                                <p className="text-[10px] text-slate-400">
                                                    Tab name must match your Google Sheet. Orders & abandoned orders go to the same tab.
                                                </p>
                                            </div>

                                            {/* Column Configuration */}
                                            <div className="pt-3 border-t border-slate-100 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <Label className="text-xs font-semibold text-slate-700 uppercase flex items-center gap-1.5">
                                                        Colonnes
                                                        {view === 'edit' && (
                                                            <span className="text-[9px] font-normal text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                                <Lock size={8} /> Verrouillé
                                                            </span>
                                                        )}
                                                    </Label>
                                                    <span className="text-[9px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                                                        Glisser pour réordonner
                                                    </span>
                                                </div>

                                                {/* Pinned columns selector */}
                                                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                                    <Pin size={12} className="text-indigo-500 shrink-0" />
                                                    <span className="text-[10px] font-medium text-indigo-700 flex-1">Colonnes épinglées</span>
                                                    <select
                                                        value={form.pinnedCount}
                                                        onChange={(e) => !editingSheet && setForm({ ...form, pinnedCount: Number(e.target.value) })}
                                                        disabled={!!editingSheet}
                                                        className="text-[10px] font-bold bg-white border border-indigo-200 text-indigo-700 rounded px-2 py-1 disabled:opacity-50"
                                                    >
                                                        <option value={0}>Aucune</option>
                                                        <option value={1}>1 colonne</option>
                                                        <option value={2}>2 colonnes</option>
                                                        <option value={3}>3 colonnes</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-1 max-h-[240px] overflow-y-auto custom-scroll pr-1">
                                                    {form.columns.map((col, index) => (
                                                        <div
                                                            key={col.id}
                                                            className={`flex items-center gap-2 p-2 rounded-md border transition-colors group ${index < form.pinnedCount
                                                                ? 'border-indigo-200 bg-indigo-50/50'
                                                                : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100'
                                                                } ${editingSheet ? 'opacity-70' : ''}`}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={col.enabled}
                                                                disabled={!!editingSheet}
                                                                onChange={(e) => {
                                                                    const newCols = [...form.columns];
                                                                    newCols[index] = { ...newCols[index], enabled: e.target.checked };
                                                                    setForm({ ...form, columns: newCols });
                                                                }}
                                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 shrink-0"
                                                            />
                                                            {index < form.pinnedCount && (
                                                                <Pin size={10} className="text-indigo-400 shrink-0" />
                                                            )}
                                                            <span className={`text-[11px] font-medium flex-1 ${col.enabled ? 'text-slate-700' : 'text-slate-400'
                                                                }`}>
                                                                {col.label}
                                                            </span>

                                                            {!editingSheet && (
                                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        disabled={index === 0}
                                                                        onClick={() => {
                                                                            const newCols = [...form.columns];
                                                                            [newCols[index - 1], newCols[index]] = [newCols[index], newCols[index - 1]];
                                                                            setForm({ ...form, columns: newCols });
                                                                        }}
                                                                        className="p-1 hover:bg-white rounded disabled:opacity-30 text-slate-400 hover:text-slate-600"
                                                                    >
                                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                                                    </button>
                                                                    <button
                                                                        disabled={index === form.columns.length - 1}
                                                                        onClick={() => {
                                                                            const newCols = [...form.columns];
                                                                            [newCols[index + 1], newCols[index]] = [newCols[index], newCols[index + 1]];
                                                                            setForm({ ...form, columns: newCols });
                                                                        }}
                                                                        className="p-1 hover:bg-white rounded disabled:opacity-30 text-slate-400 hover:text-slate-600"
                                                                    >
                                                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

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
