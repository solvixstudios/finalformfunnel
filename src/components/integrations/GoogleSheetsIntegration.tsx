import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { GuideStep, VideoPlaceholder, CopyButton, TestConnectionButton } from './GuideUI';
import {
    Check,
    ChevronRight,
    Copy,
    Edit3,
    ExternalLink,
    FileSpreadsheet,
    Lock,
    MoreHorizontal,
    Pin,
    Plus,
    Trash2,
    HelpCircle
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useGoogleSheets, GoogleSheetConfig } from '../../lib/firebase/sheetsHooks';
import { DEFAULT_FORM_CONFIG } from '../../config/defaults';
import { useFormStore } from '../../stores';
import { cn } from '@/lib/utils';

interface GoogleSheetsIntegrationProps {
    userId: string;
    onBack?: () => void;
    hideTrigger?: boolean; // Kept for backwards compatibility but not used in full page
}

// --- Helper Components ---

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
    var headers = []; 
    var headerIds = []; 
    if (lastCol > 0) {
      headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return h.toString(); });
      headerIds = headers.slice();
    }

    if (headers.length === 0 || isNewSheet) {
      headers = colIds.map(function(id) { return colLabels[id]; });
      headerIds = colIds.slice();
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      formatHeaderRow(sheet, headers.length, data._pinnedCount || 3);
    } else {
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
      var orderIdLabel = colLabels['orderId'] || 'orderId';
      var orderIdCol = headers.indexOf(orderIdLabel);
      if (orderIdCol > -1 && sheet.getLastRow() > 1) {
        var allData = sheet.getRange(2, orderIdCol + 1, sheet.getLastRow() - 1, 1).getValues();
        for (var r = 0; r < allData.length; r++) {
          if (allData[r][0].toString() == updateId.toString()) {
            targetRow = r + 2; 
            break;
          }
        }
      }
    }

    if (targetRow > 0) {
      sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
      formatDataRow(sheet, targetRow, headers, labelToId);
    } else {
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

// FORMATTING STATUS
var STATUS_LIST = [
  'Nouvelle commande', 'En attente', 'Confirmée', 'En préparation', 'Expédiée', 'Livrée',
  'Échouée 1', 'Échouée 2', 'Échouée 3', 'Annulée', 'Retournée', 'Panier abandonné'
];

var STATUS_COLORS = {
  'Nouvelle commande':  { bg: '#dbeafe', fg: '#1d4ed8' },
  'En attente':         { bg: '#e0f2fe', fg: '#0369a1' },
  'Panier abandonné':   { bg: '#f1f5f9', fg: '#64748b' },
  'Confirmée':          { bg: '#dcfce7', fg: '#15803d' },
  'Livrée':             { bg: '#bbf7d0', fg: '#166534' },
  'En préparation':     { bg: '#fef3c7', fg: '#b45309' },
  'Expédiée':           { bg: '#ffedd5', fg: '#c2410c' },
  'Échouée 1':          { bg: '#fef2f2', fg: '#dc2626' },
  'Échouée 2':          { bg: '#fee2e2', fg: '#b91c1c' },
  'Échouée 3':          { bg: '#fecaca', fg: '#991b1b' },
  'Annulée':            { bg: '#f5f5f4', fg: '#78716c' },
  'Retournée':          { bg: '#fae8ff', fg: '#a21caf' }
};

function formatHeaderRow(sheet, colCount, pinnedCount) {
  var hr = sheet.getRange(1, 1, 1, colCount);
  hr.setBackground('#0f172a').setFontColor('#f8fafc').setFontWeight('bold').setFontSize(10)
    .setFontFamily('Inter, Arial, sans-serif').setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true);
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
  var statusLabel = null;
  for (var key in labelToId) if (labelToId[key] === 'status') { statusLabel = key; break; }
  var statusIdx = statusLabel ? headers.indexOf(statusLabel) : -1;
  var statusVal = statusIdx > -1 ? sheet.getRange(rowNum, statusIdx + 1).getValue().toString() : '';

  var rowColor = STATUS_COLORS[statusVal];
  rowRange.setBackground(rowColor ? rowColor.bg : (rowNum % 2 === 0 ? '#f8fafc' : '#ffffff'));
  rowRange.setFontSize(10).setFontFamily('Inter, Arial, sans-serif').setVerticalAlignment('middle').setWrap(false);
  sheet.setRowHeight(rowNum, 32);
  rowRange.setBorder(null, null, true, null, null, null, '#e2e8f0', SpreadsheetApp.BorderStyle.SOLID);

  var phoneLabel = null;
  for (var pk in labelToId) if (labelToId[pk] === 'phone') { phoneLabel = pk; break; }
  var phoneIdx = phoneLabel ? headers.indexOf(phoneLabel) : -1;
  if (phoneIdx > -1) {
    var phoneCell = sheet.getRange(rowNum, phoneIdx + 1);
    phoneCell.setNumberFormat('@');
    var phoneVal = phoneCell.getValue().toString();
    if (phoneVal && !isNaN(phoneVal)) phoneCell.setValue(phoneVal);
  }

  if (statusIdx > -1) {
    var statusCell = sheet.getRange(rowNum, statusIdx + 1);
    var rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUS_LIST, true).setAllowInvalid(false).build();
    statusCell.setDataValidation(rule);
    statusCell.setFontWeight('bold').setHorizontalAlignment('center');
    if (rowColor) statusCell.setFontColor(rowColor.fg);
  }
}

function onEdit(e) {
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  var row = e.range.getRow();
  var col = e.range.getColumn();
  if (row <= 1) return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var headerVal = headers[col - 1];
  if (!headerVal) return;
  var statusLabels = ['Statut', 'Status', 'statut', 'status'];
  if (statusLabels.indexOf(headerVal.toString()) === -1) return;

  var newStatus = e.range.getValue().toString();
  var colCount = headers.length;
  var rowRange = sheet.getRange(row, 1, 1, colCount);
  var statusCell = e.range;

  var match = STATUS_COLORS[newStatus];
  if (match) {
    rowRange.setBackground(match.bg);
    statusCell.setFontWeight('bold').setFontColor(match.fg);
  } else {
    rowRange.setBackground(row % 2 === 0 ? '#f8fafc' : '#ffffff');
    statusCell.setFontWeight('bold').setFontColor('#334155');
  }
}`;

export function GoogleSheetsIntegration({ userId, onBack }: GoogleSheetsIntegrationProps) {
    const {
        sheets,
        addSheet,
        updateSheet,
        deleteSheet,
        loading
    } = useGoogleSheets(userId);

    const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
    const [addTab, setAddTab] = useState<'setup' | 'guide'>('setup');
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

    const [searchParams, setSearchParams] = useSearchParams();
    const formConfig = useFormStore(state => state.formConfig);
    const setFormConfig = useFormStore(state => state.setFormConfig);

    // Deep Linking Logic
    useEffect(() => {
        const sheetIdParam = searchParams.get('sheetId');
        const openParam = searchParams.get('open');

        if (openParam === 'google-sheets' && !loading) {
            if (sheetIdParam && sheets.length > 0) {
                const targetSheet = sheets.find(s => s.id === sheetIdParam);
                if (targetSheet) {
                    startEditSheet(targetSheet);
                } else if (sheetIdParam === 'new') {
                    startAddSheet();
                }
            } else if (sheetIdParam === 'new') {
                startAddSheet();
            } else if (sheets.length === 0) {
                startAddSheet();
            } else {
                setView('list');
            }
        }
    }, [searchParams, sheets, loading]);

    const handleCancel = () => {
        setView('list');
        setEditingSheet(null);
        setForm({
            name: '',
            webhookUrl: 'https://script.google.com/macros/s/AKfycbybwobgDvyHVx0za1xZy5oPO0BgD8A9_MTfn2nVRdkrPwaf-x9kUqUDWhTrq0ERSd_B/exec',
            sheetName: 'Orders',
            isDefault: false,
            columns: [...defaultColumns],
            pinnedCount: defaultPinnedCount,
        });

        // Clean URL if we are going back
        const params = new URLSearchParams(searchParams);
        if (params.has('open') || params.has('sheetId')) {
            params.delete('open');
            params.delete('sheetId');
            setSearchParams(params, { replace: true });
        }
    };

    const startAddSheet = () => {
        setEditingSheet(null);
        setForm({
            name: '',
            webhookUrl: 'https://script.google.com/macros/s/AKfycbybwobgDvyHVx0za1xZy5oPO0BgD8A9_MTfn2nVRdkrPwaf-x9kUqUDWhTrq0ERSd_B/exec',
            sheetName: 'Orders',
            isDefault: sheets.length === 0,
            columns: [...defaultColumns],
            pinnedCount: defaultPinnedCount,
        });
        setView('add');
        setAddTab('setup');
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
        setAddTab('setup');
    };

    const handleSave = async () => {
        if (!form.name || !form.webhookUrl || !form.sheetName) {
            toast.error('Le Nom, l\'URL du Webhook et le Nom de l\'Onglet sont requis.');
            return;
        }

        try {
            if (view === 'add') {
                const newId = await addSheet(form);
                toast.success('Google Sheet connecté avec succès!');

                const currentIds = formConfig.addons?.selectedSheetIds || [];
                setFormConfig({
                    ...formConfig,
                    addons: {
                        ...formConfig.addons,
                        selectedSheetIds: [...currentIds, newId],
                    },
                });

                handleCancel();
            } else if (view === 'edit' && editingSheet) {
                await updateSheet(editingSheet.id, form);
                toast.success('Configuration mise à jour!');
                handleCancel();
            }
        } catch (e: any) {
            toast.error(e.message || 'Une erreur est survenue');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Voulez-vous vraiment supprimer cette intégration ?')) {
            try {
                await deleteSheet(id);
                toast.success('Intégration supprimée');
                handleCancel();
            } catch (e: any) {
                toast.error(e.message || 'Une erreur est survenue');
            }
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success('Copié dans le presse-papiers');
    };

    // --- EDITOR VIEW (Add & Edit) ---
    if (view === 'add' || view === 'edit') {
        const isEditing = view === 'edit';
        return (
            <div className="flex-1 flex flex-col h-full bg-slate-50/50">
                <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
                    <PageHeader
                        title={isEditing ? 'Modifier la configuration Sheet' : 'Connecter un Google Sheet'}
                        breadcrumbs={[
                            { label: 'Intégrations', href: '/integrations', onClick: onBack },
                            { label: 'Google Sheets', href: '#', onClick: handleCancel },
                            { label: isEditing ? 'Modification' : 'Nouveau', href: '#' }
                        ]}
                        icon={() => <FileSpreadsheet className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />}
                        onBack={handleCancel}
                        actions={
                            <div className="flex items-center gap-2">
                                <Sheet>
                                    <SheetTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8 rounded-lg text-xs font-bold px-4 bg-white text-slate-700 shadow-sm border-slate-200"
                                        >
                                            <HelpCircle size={13} className="mr-1.5" />
                                            Guide d'intégration
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
                                        <SheetHeader className="mb-6">
                                            <SheetTitle className="text-xl font-bold text-slate-900">Guide d'intégration Google Sheets</SheetTitle>
                                            <p className="text-sm text-slate-500 mt-2 text-left">Suivez ces étapes pour connecter votre tableau Google Sheets via un script Apps Script.</p>
                                        </SheetHeader>
                                        <div className="space-y-6 text-sm text-slate-600 pb-8">
                                            <VideoPlaceholder title="Connecter un Google Sheet à Final Form" thumbnailUrl="https://images.unsplash.com/photo-1544396821-4dd40b938ad3?q=80&w=2000&auto=format&fit=crop" />

                                            <GuideStep number={1} title="Ouvrir votre fichier Google Sheets">
                                                <p>
                                                    Créez ou ouvrez le fichier dans lequel vous souhaitez recevoir les commandes. Allez dans le menu <strong>Extensions</strong> → <strong>Apps Script</strong>.
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Un nouvel onglet s'ouvrira avec l'éditeur de scripts Google.
                                                </p>
                                            </GuideStep>

                                            <GuideStep number={2} title="Coller le code Apps Script">
                                                <p>
                                                    Supprimez tout le contenu existant dans l'éditeur, puis collez le code ci-dessous. Ce script gère la réception des commandes et le formatage automatique du tableau.
                                                </p>
                                                <div className="relative group mt-3">
                                                    <div className="relative">
                                                        <textarea
                                                            readOnly
                                                            value={appScriptCode}
                                                            className="w-full bg-slate-900 text-slate-300 p-4 rounded-xl font-mono text-[10px] break-all h-48 custom-scroll border border-slate-800 shadow-inner leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                            onClick={(e) => e.currentTarget.select()}
                                                        />
                                                        <div className="absolute top-3 right-3">
                                                            <CopyButton text={appScriptCode} label="Copier le Code" className="bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-600 backdrop-blur-md" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </GuideStep>

                                            <GuideStep number={3} title="Sauvegarder et Déployer">
                                                <ol className="list-decimal list-outside ml-4 space-y-2">
                                                    <li>Cliquez sur l'icône <strong>💾 Disquette</strong> (ou <strong>Ctrl+S</strong>) pour sauvegarder le projet.</li>
                                                    <li>Allez dans <strong>Déployer</strong> → <strong>Nouveau Déploiement</strong>.</li>
                                                    <li>Cliquez sur le ⚙️, puis sélectionnez <strong>Application Web</strong>.</li>
                                                    <li>Cliquez sur <strong>Déployer</strong>.</li>
                                                </ol>
                                            </GuideStep>

                                            <GuideStep number={4} title="Définir les accès de sécurité">
                                                <p>
                                                    Lors du déploiement, dans la section <strong>«Qui a accès»</strong>, sélectionnez <strong>«N'importe qui» (Anyone)</strong>.
                                                </p>
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2 items-start mt-2 shadow-sm">
                                                    <span className="mt-0.5 text-base leading-none">⚠️</span>
                                                    <span>Si vous ne sélectionnez pas «N'importe qui», Final Form ne pourra pas envoyer les données au tableau.</span>
                                                </div>
                                            </GuideStep>

                                            <GuideStep number={5} title="Copier l'URL du déploiement">
                                                <p>
                                                    Après le déploiement, Google vous affichera l'<strong>URL de l'application web</strong>. Copiez-la et collez-la dans le champ <strong>«URL du Web App»</strong> du formulaire de connexion ci-contre.
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    L'URL ressemble à : <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono">https://script.google.com/macros/s/.../exec</code>
                                                </p>
                                            </GuideStep>

                                            <GuideStep number={6} title="Tester avant de sauvegarder">
                                                <p>
                                                    Utilisez le bouton <strong>«Tester la connexion»</strong> dans la barre d'actions pour vérifier que l'URL fonctionne correctement. Un test réussi confirme que les commandes arriveront dans votre tableau.
                                                </p>
                                            </GuideStep>
                                        </div>
                                    </SheetContent>
                                </Sheet>
                                <TestConnectionButton
                                    onTest={async () => {
                                        if (!form.webhookUrl) {
                                            throw new Error("Veuillez d'abord saisir l'URL du Web App.");
                                        }
                                        try {
                                            const res = await fetch(form.webhookUrl, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    sheetName: form.sheetName || 'TestConnection',
                                                    _testConnection: true,
                                                    orderId: 'TEST-' + Date.now(),
                                                    status: 'Test de connexion',
                                                    _orderedColumns: [
                                                        { id: 'orderId', label: 'N° Commande' },
                                                        { id: 'status', label: 'Statut' },
                                                    ],
                                                }),
                                            });
                                            // Google Apps Script returns a redirect, follow it
                                            const data = await res.json().catch(() => null);
                                            return data?.result === 'success' || res.ok;
                                        } catch {
                                            return false;
                                        }
                                    }}
                                    label="Tester la connexion"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCancel}
                                    className="h-8 rounded-lg text-xs font-bold px-4 bg-white text-slate-700 shadow-sm"
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    size="sm"
                                    className="h-8 rounded-lg text-xs font-bold px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                >
                                    {isEditing ? <Check size={13} className="mr-1.5" /> : <Plus size={13} className="mr-1.5" />}
                                    {isEditing ? 'Enregistrer' : 'Connecter Sheet'}
                                </Button>
                            </div>
                        }
                    />
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="space-y-6">
                            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">Détails de connexion</h3>
                                    <p className="text-sm text-slate-500">Saisissez les informations de votre script Google Apps pour envoyer les commandes au bon document.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Nom Interne</Label>
                                        <Input
                                            placeholder="ex. Fichier principal des commandes"
                                            className="bg-slate-50 h-11 border-slate-200 focus:bg-white transition-colors"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">URL du Web App (Apps Script)</Label>
                                        <Input
                                            placeholder="https://script.google.com/macros/s/..."
                                            className="font-mono text-xs bg-slate-50 h-11 border-slate-200 focus:bg-white transition-colors"
                                            value={form.webhookUrl}
                                            onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Nom de l'onglet (Tab Name)</Label>
                                        <Input
                                            placeholder="Orders"
                                            className="bg-slate-50 h-11 border-slate-200 focus:bg-white transition-colors"
                                            value={form.sheetName}
                                            onChange={(e) => setForm({ ...form, sheetName: e.target.value })}
                                        />
                                        <p className="text-[11px] text-slate-500">
                                            Le nom doit correspondre exactement au nom de l'onglet en bas du tableau Google Sheets.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 py-3 px-4 bg-slate-50 rounded-xl border border-slate-100 transition-colors focus-within:ring-2 ring-emerald-100">
                                        <Switch
                                            id="sheet-default"
                                            checked={form.isDefault}
                                            onCheckedChange={(checked) => setForm({ ...form, isDefault: checked })}
                                            className="data-[state=checked]:bg-emerald-500"
                                        />
                                        <Label htmlFor="sheet-default" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">
                                            Utiliser comme destination par défaut pour tous les formulaires
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
                                <div className="flex justify-between items-center mb-2">
                                    <Label className="text-sm font-bold text-slate-900 border-b border-transparent">
                                        Colonnes exportées
                                    </Label>
                                    {isEditing && (
                                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <Lock size={10} /> Verrouillé
                                        </span>
                                    )}
                                </div>

                                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                                    Sélectionnez et ordonnez les colonnes à envoyer vers le tableau.
                                </p>

                                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scroll pr-1">
                                    <div className="flex items-center gap-2 mb-3 bg-indigo-50/60 p-2.5 rounded-lg border border-indigo-100 px-3">
                                        <Pin size={14} className="text-indigo-600 shrink-0" />
                                        <span className="text-xs font-semibold text-indigo-900 flex-1">Épinglées par défaut:</span>
                                        <select
                                            value={form.pinnedCount}
                                            onChange={(e) => !isEditing && setForm({ ...form, pinnedCount: Number(e.target.value) })}
                                            disabled={isEditing}
                                            className="text-xs font-bold bg-white border border-indigo-200 text-indigo-700 rounded-md px-2 py-1 outline-none ring-0 disabled:opacity-60"
                                        >
                                            <option value={0}>0</option>
                                            <option value={1}>1</option>
                                            <option value={2}>2</option>
                                            <option value={3}>3</option>
                                        </select>
                                    </div>

                                    {form.columns.map((col, index) => (
                                        <div
                                            key={col.id}
                                            className={cn(
                                                "flex items-center gap-3 p-2 px-3 rounded-lg border transition-all group shadow-sm",
                                                index < form.pinnedCount
                                                    ? "border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50"
                                                    : "border-slate-200 bg-white hover:border-slate-300",
                                                isEditing ? "opacity-70" : ""
                                            )}
                                        >
                                            <div className="flex items-center h-full pt-0.5">
                                                <input
                                                    type="checkbox"
                                                    checked={col.enabled}
                                                    disabled={isEditing}
                                                    onChange={(e) => {
                                                        const newCols = [...form.columns];
                                                        newCols[index] = { ...newCols[index], enabled: e.target.checked };
                                                        setForm({ ...form, columns: newCols });
                                                    }}
                                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 shadow-sm"
                                                />
                                            </div>

                                            {index < form.pinnedCount && (
                                                <Pin size={12} className="text-indigo-400 shrink-0" />
                                            )}

                                            <span className={cn(
                                                "text-xs font-medium flex-1 truncate",
                                                col.enabled ? "text-slate-800" : "text-slate-400"
                                            )}>
                                                {col.label}
                                            </span>

                                            {!isEditing && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        disabled={index === 0}
                                                        onClick={() => {
                                                            const newCols = [...form.columns];
                                                            [newCols[index - 1], newCols[index]] = [newCols[index], newCols[index - 1]];
                                                            setForm({ ...form, columns: newCols });
                                                        }}
                                                        className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 text-slate-400 hover:text-slate-600"
                                                    >
                                                        <FontAwesomeIcon icon={faChevronUp} className="w-3 h-3 text-current" />
                                                    </button>
                                                    <button
                                                        disabled={index === form.columns.length - 1}
                                                        onClick={() => {
                                                            const newCols = [...form.columns];
                                                            [newCols[index + 1], newCols[index]] = [newCols[index], newCols[index + 1]];
                                                            setForm({ ...form, columns: newCols });
                                                        }}
                                                        className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 text-slate-400 hover:text-slate-600"
                                                    >
                                                        <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3 text-current" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- LIST VIEW ---
    const headerActions = (
        <Button
            size="sm"
            onClick={() => {
                setView('add');
                startAddSheet();
            }}
            className="h-8 rounded-lg text-xs font-bold px-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
        >
            <Plus size={13} className="mr-1.5" />
            Connecter un Sheet
        </Button>
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-slate-50/50">
            <div className="bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30">
                <PageHeader
                    title="Google Sheets"
                    breadcrumbs={[
                        { label: 'Intégrations', href: '/integrations', onClick: onBack },
                        { label: 'Google Sheets', href: '#' }
                    ]}
                    count={sheets.length}
                    icon={() => <FileSpreadsheet className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />}
                    onBack={onBack}
                    actions={headerActions}
                />
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                <div className="max-w-[1600px] mx-auto w-full">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                        </div>
                    ) : sheets.length === 0 ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                                <FileSpreadsheet size={32} />
                            </div>
                            <h3 className="text-base font-bold text-slate-700 mb-1">Aucun Google Sheet connecté</h3>
                            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto leading-relaxed">
                                Connectez un fichier Google Sheets pour synchroniser automatiquement toutes vos nouvelles commandes en temps réel.
                            </p>
                            <Button
                                onClick={() => {
                                    setView('add');
                                    startAddSheet();
                                }}
                                className="h-10 rounded-xl text-sm font-bold px-6 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-100"
                            >
                                <Plus size={16} className="mr-2" /> Ajouter un Google Sheet
                            </Button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-200">
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pl-5">Nom</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Onglet</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3">Statut</TableHead>
                                        <TableHead className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider py-3 pr-5 w-[60px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sheets.map((sheet) => (
                                        <TableRow
                                            key={sheet.id}
                                            className="group hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0 cursor-pointer"
                                            onClick={() => startEditSheet(sheet)}
                                        >
                                            <TableCell className="py-4 pl-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                                        <FileSpreadsheet className="text-emerald-600" size={20} />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 mb-0.5 flex items-center gap-2">
                                                            {sheet.name}
                                                            {sheet.isDefault && (
                                                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 font-semibold text-[9px] h-5 px-1.5 uppercase tracking-wide">
                                                                    Défaut
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-mono truncate max-w-[200px] md:max-w-xs" title={sheet.webhookUrl}>
                                                            {sheet.webhookUrl}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100/80 border border-slate-200 text-xs font-semibold text-slate-700">
                                                    {sheet.sheetName}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-100 border-green-200 font-semibold gap-1">
                                                    <Check size={12} /> Connecté
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-4 pr-5 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreHorizontal size={16} />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 rounded-xl">
                                                        <DropdownMenuItem className="text-xs font-medium" onClick={(e) => { e.stopPropagation(); startEditSheet(sheet); }}>
                                                            <Edit3 size={14} className="mr-2" /> Modifier la configuration
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-red-600 focus:text-red-700 focus:bg-red-50 text-xs font-medium"
                                                            onClick={(e) => { e.stopPropagation(); handleDelete(sheet.id); }}
                                                        >
                                                            <Trash2 size={14} className="mr-2" /> Supprimer l'intégration
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
