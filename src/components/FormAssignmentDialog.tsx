import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useConnectedStores, useFormAssignments, useSavedForms } from '@/lib/firebase/hooks';
import { cn } from '@/lib/utils';
import {
    CheckCircle2,
    FileText,
    Loader2,
    Package,
    Search,
    Store,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface FormAssignmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    initialFormId?: string;
    initialStoreId?: string;
}

export function FormAssignmentDialog({
    open,
    onOpenChange,
    userId,
    initialFormId,
    initialStoreId,
}: FormAssignmentDialogProps) {
    const { forms, loading: formsLoading } = useSavedForms(userId);
    const { stores, loading: storesLoading } = useConnectedStores(userId);
    const { assignments, assignForm, deleteAssignment, loading: assignmentsLoading } = useFormAssignments(userId);

    const [selectedFormId, setSelectedFormId] = useState<string>(initialFormId || '');
    const [assignmentType, setAssignmentType] = useState<'store' | 'product'>('store');
    const [selectedStoreId, setSelectedStoreId] = useState<string>(initialStoreId || '');
    const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
    const [productSearch, setProductSearch] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter only published forms
    const publishedForms = forms.filter(f => f.status === 'published');

    // Mock products - in production, fetch from IndexedDB/API
    const mockProducts = [
        { id: 'prod-1', title: 'Product A', handle: 'product-a' },
        { id: 'prod-2', title: 'Product B', handle: 'product-b' },
        { id: 'prod-3', title: 'Product C', handle: 'product-c' },
        { id: 'prod-4', title: 'Product D', handle: 'product-d' },
        { id: 'prod-5', title: 'Product E', handle: 'product-e' },
    ];

    const filteredProducts = mockProducts.filter(p =>
        p.title.toLowerCase().includes(productSearch.toLowerCase())
    );

    const selectedStore = stores.find(s => s.id === selectedStoreId);
    const selectedForm = forms.find(f => f.id === selectedFormId);

    const toggleProduct = (productId: string) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleAssign = async () => {
        if (!selectedFormId || !selectedStoreId) {
            toast.error('Please select a form and store');
            return;
        }

        if (assignmentType === 'product' && selectedProductIds.length === 0) {
            toast.error('Please select at least one product');
            return;
        }

        setIsSubmitting(true);
        try {
            if (assignmentType === 'store') {
                await assignForm(selectedFormId, selectedStoreId);
            } else {
                // Assign to multiple products
                const promises = selectedProductIds.map(productId =>
                    assignForm(selectedFormId, selectedStoreId, productId)
                );
                await Promise.all(promises);
            }

            toast.success(`Form assigned successfully to ${assignmentType === 'store' ? 'store' : selectedProductIds.length + ' products'}!`);
            onOpenChange(false);

            // Reset but keep context if passed via props? Maybe full reset is safer.
            if (!initialFormId) setSelectedFormId('');
            if (!initialStoreId) setSelectedStoreId('');
            setSelectedProductIds([]);
            setAssignmentType('store');
        } catch (error) {
            console.error(error);
            toast.error('Failed to assign form');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ... (keep handleRemoveAssignment)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[600px] flex flex-col">
                <DialogHeader className="shrink-0">
                    <DialogTitle>Assign Form to Store</DialogTitle>
                    <DialogDescription>
                        Assign a published form to an entire store or to specific products.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="assign" className="flex-1 flex flex-col min-h-0 mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="assign">New Assignment</TabsTrigger>
                        <TabsTrigger value="active">
                            Active ({assignments.length})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="assign" className="space-y-4 mt-4">
                        {/* Select Form */}
                        <div className="space-y-2">
                            <Label>Select Published Form</Label>
                            <Select value={selectedFormId} onValueChange={setSelectedFormId} disabled={!!initialFormId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a form..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {publishedForms.length === 0 ? (
                                        <div className="p-2 text-xs text-slate-500 text-center">No published forms found</div>
                                    ) : (
                                        publishedForms.map(form => (
                                            <SelectItem key={form.id} value={form.id}>
                                                <div className="flex items-center gap-2">
                                                    <FileText size={14} className="text-slate-400" />
                                                    {form.name}
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                            {publishedForms.length === 0 && (
                                <p className="text-xs text-amber-600">Only published forms can be assigned.</p>
                            )}
                        </div>

                        {/* Select Store */}
                        <div className="space-y-2">
                            <Label>Select Store</Label>
                            <Select value={selectedStoreId} onValueChange={setSelectedStoreId} disabled={!!initialStoreId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a store..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {stores.map(store => (
                                        <SelectItem key={store.id} value={store.id}>
                                            <div className="flex items-center gap-2">
                                                <Store size={14} className="text-slate-400" />
                                                {store.name}
                                                {!store.loaderInstalled && (
                                                    <Badge variant="outline" className="text-[10px] ml-2 text-amber-600 border-amber-200">
                                                        No Loader
                                                    </Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Assignment Type */}
                        <div className="space-y-2">
                            <Label>Apply To</Label>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant={assignmentType === 'store' ? 'default' : 'outline'}
                                    className="flex-1"
                                    onClick={() => setAssignmentType('store')}
                                >
                                    <Store size={16} className="mr-2" />
                                    Entire Store
                                </Button>
                                <Button
                                    type="button"
                                    variant={assignmentType === 'product' ? 'default' : 'outline'}
                                    className="flex-1"
                                    onClick={() => setAssignmentType('product')}
                                >
                                    <Package size={16} className="mr-2" />
                                    Specific Products
                                </Button>
                            </div>
                            <p className="text-xs text-slate-500">
                                {assignmentType === 'store'
                                    ? 'Form will appear on all products in the store (unless overridden)'
                                    : 'Form will only appear on the selected products'}
                            </p>
                        </div>

                        {/* Product Selection (if product type) */}
                        {assignmentType === 'product' && (
                            <div className="space-y-2">
                                <Label>Select Products {selectedProductIds.length > 0 && `(${selectedProductIds.length})`}</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <Input
                                        placeholder="Search products..."
                                        value={productSearch}
                                        onChange={e => setProductSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <ScrollArea className="h-40 border rounded-lg">
                                    <div className="p-2 space-y-1">
                                        {filteredProducts.map(product => {
                                            const isSelected = selectedProductIds.includes(product.id);
                                            return (
                                                <div
                                                    key={product.id}
                                                    className={cn(
                                                        'flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-slate-50 transition-colors',
                                                        isSelected && 'bg-indigo-50 border border-indigo-200'
                                                    )}
                                                    onClick={() => toggleProduct(product.id)}
                                                >
                                                    <div className={cn(
                                                        "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                                                        isSelected ? "bg-indigo-600 border-indigo-600" : "border-slate-300 bg-white"
                                                    )}>
                                                        {isSelected && <CheckCircle2 size={12} className="text-white" />}
                                                    </div>
                                                    <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center text-sm">
                                                        📦
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{product.title}</p>
                                                        <p className="text-xs text-slate-400">/{product.handle}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                        {/* Summary */}
                        {selectedFormId && selectedStoreId && (
                            <Card className="bg-slate-50 border-dashed">
                                <CardContent className="p-4">
                                    <p className="text-sm text-slate-600">
                                        Assigning <span className="font-semibold">{selectedForm?.name}</span>
                                        {' to '}
                                        <span className="font-semibold">{selectedStore?.name}</span>
                                        {assignmentType === 'product' && (
                                            <>
                                                {' on '}
                                                <span className="text-indigo-600 font-medium">
                                                    {selectedProductIds.length === 0
                                                        ? 'no products'
                                                        : selectedProductIds.length === 1
                                                            ? '1 product'
                                                            : `${selectedProductIds.length} products`
                                                    }
                                                </span>
                                            </>
                                        )}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="active" className="mt-4">
                        {/* ... (Active tab content same as before but referring to updated maps) */}
                        {assignmentsLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="animate-spin text-slate-400" />
                            </div>
                        ) : assignments.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <FileText className="mx-auto mb-2 text-slate-300" size={32} />
                                <p className="text-sm">No active assignments</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-64">
                                <div className="space-y-2">
                                    {assignments.map(assignment => {
                                        const form = forms.find(f => f.id === assignment.formId);
                                        const store = stores.find(s => s.id === assignment.storeId);
                                        return (
                                            <div
                                                key={assignment.id}
                                                className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium">{form?.name || 'Unknown Form'}</p>
                                                    <p className="text-xs text-slate-500">
                                                        {store?.name || 'Unknown Store'}
                                                        {assignment.productId && (
                                                            <Badge variant="secondary" className="ml-2 text-[10px]">
                                                                Product
                                                            </Badge>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {assignment.isActive ? (
                                                        <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">Active</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">Inactive</Badge>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                                                        onClick={() => handleRemoveAssignment(assignment.id)}
                                                    >
                                                        <X size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        )}
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleAssign} disabled={isSubmitting || !selectedFormId || !selectedStoreId}>
                        {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                        Assign Form
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
