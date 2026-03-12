/**
 * AdminDashboardPage
 * Full admin dashboard for managing subscription requests.
 * Shows pending requests, allows approve/reject, displays payment proof,
 * and lets admin cancel active subscriptions.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  CheckCircle2, XCircle, Clock, Loader2, Shield, Users,
  DollarSign, FileText, Eye, X, Calendar, StickyNote, Ban, Image,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  getAllRequests,
  approveRequest,
  rejectRequest,
  adminCancelSubscription,
} from '@/lib/subscriptionService';
import { ADMIN_EMAIL, PRICING_PLANS } from '@/data/plans';
import type { SubscriptionRequest, RequestStatus } from '@/types/subscription';
import { toast } from 'sonner';

type StatusFilter = 'all' | RequestStatus;

const AdminDashboardPage = () => {
  const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [selectedRequest, setSelectedRequest] = useState<SubscriptionRequest | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Override fields for approve modal
  const [overrideEndDate, setOverrideEndDate] = useState('');
  const [overrideOrderLimit, setOverrideOrderLimit] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const filter = statusFilter === 'all' ? undefined : statusFilter;
      const data = await getAllRequests(filter);
      setRequests(data);
    } catch (error) {
      console.error('Failed to load requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    setIsApproving(true);
    try {
      const overrides: Record<string, any> = {};
      if (overrideEndDate) overrides.endDate = new Date(overrideEndDate).toISOString();
      if (overrideOrderLimit) overrides.orderLimitOverride = parseInt(overrideOrderLimit, 10);
      if (adminNotes) overrides.adminNotes = adminNotes;

      await approveRequest(
        selectedRequest,
        ADMIN_EMAIL,
        Object.keys(overrides).length > 0 ? overrides : undefined
      );

      toast.success('Request approved!', {
        description: `${selectedRequest.userDisplayName}'s ${getPlanName(selectedRequest.planId)} plan has been activated.`,
      });

      setSelectedRequest(null);
      resetOverrides();
      await loadRequests();
    } catch (error: any) {
      toast.error('Failed to approve', { description: error.message });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    setIsRejecting(true);
    try {
      await rejectRequest(selectedRequest, ADMIN_EMAIL, adminNotes || undefined);

      toast.success('Request rejected', {
        description: `${selectedRequest.userDisplayName}'s request has been rejected.`,
      });

      setSelectedRequest(null);
      resetOverrides();
      await loadRequests();
    } catch (error: any) {
      toast.error('Failed to reject', { description: error.message });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleAdminCancel = async () => {
    if (!selectedRequest?.subscriptionId) return;
    setIsCancelling(true);
    try {
      await adminCancelSubscription(
        selectedRequest.userId,
        selectedRequest.subscriptionId,
        ADMIN_EMAIL,
        cancelReason || undefined
      );
      toast.success('Subscription cancelled', {
        description: `${selectedRequest.userDisplayName}'s subscription has been cancelled.`,
      });
      setSelectedRequest(null);
      resetOverrides();
      await loadRequests();
    } catch (error: any) {
      toast.error('Failed to cancel', { description: error.message });
    } finally {
      setIsCancelling(false);
    }
  };

  const resetOverrides = () => {
    setOverrideEndDate('');
    setOverrideOrderLimit('');
    setAdminNotes('');
    setCancelReason('');
  };

  const getPlanName = (planId: string) => {
    return PRICING_PLANS.find((p) => p.id === planId)?.name || planId;
  };

  // Stats
  const pendingCount = requests.filter((r) => r.status === 'pending').length;
  const approvedCount = requests.filter((r) => r.status === 'approved').length;
  const totalRevenue = requests
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.requestedAmount, 0);

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'all', label: 'All' },
  ];

  return (
    <div className="max-w-7xl mx-auto font-sans">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-[#FF5A1F]/10 flex items-center justify-center">
            <Shield className="text-[#FF5A1F]" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#4A443A] tracking-tight">Subscription Requests</h1>
            <p className="text-sm text-[#908878] font-medium">Manage and approve offline payment requests.</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="rounded-xl border-[#E2DCCF] shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200">
              <Clock className="text-amber-600" size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#A69D8A] uppercase tracking-widest">Pending</p>
              <p className="text-2xl font-black text-[#4A443A]">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-[#E2DCCF] shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#E6F4EA] flex items-center justify-center border border-[#137333]/20">
              <Users className="text-[#137333]" size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#A69D8A] uppercase tracking-widest">Approved</p>
              <p className="text-2xl font-black text-[#4A443A]">{approvedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-[#E2DCCF] shadow-sm bg-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-200">
              <DollarSign className="text-blue-600" size={18} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#A69D8A] uppercase tracking-widest">Total Revenue</p>
              <p className="text-2xl font-black text-[#4A443A]">{totalRevenue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={cn(
              "px-4 py-2 rounded-lg text-[12px] font-bold transition-all",
              statusFilter === opt.value
                ? "bg-[#4A443A] text-white shadow-sm"
                : "bg-white text-[#908878] border border-[#E2DCCF] hover:bg-[#F2EFE8] hover:text-[#4A443A]"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Requests Table */}
      <Card className="rounded-2xl border-[#E2DCCF] shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-[#908878]" size={24} />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-[#F2EFE8] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#E2DCCF]">
                <FileText className="text-[#A69D8A]" size={22} />
              </div>
              <h3 className="text-sm font-bold text-[#4A443A]">No requests found</h3>
              <p className="text-xs text-[#908878] mt-1">
                {statusFilter === 'pending' ? 'No pending requests to review.' : 'No requests match this filter.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#FAF9F6]">
                  <TableRow className="border-[#E2DCCF] hover:bg-transparent">
                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase pl-6 py-4">User</TableHead>
                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase py-4">Plan</TableHead>
                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase py-4">Billing</TableHead>
                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase py-4">Amount</TableHead>
                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase py-4">Payment</TableHead>
                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase py-4">Date</TableHead>
                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase py-4 text-center">Status</TableHead>
                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase pr-6 py-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((req) => (
                    <TableRow key={req.id} className="border-b border-[#E2DCCF]/60 last:border-0 hover:bg-[#FAF9F6] transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div>
                          <p className="text-[13px] font-bold text-[#4A443A]">{req.userDisplayName}</p>
                          <p className="text-[11px] text-[#908878] font-medium">{req.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-[#F2EFE8] text-[#4A443A] text-xs font-bold border border-[#E2DCCF]">
                          {getPlanName(req.planId)}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-[13px] font-medium text-[#7A7365] capitalize">{req.billingCycle}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="font-bold text-[#4A443A]">{req.requestedAmount.toLocaleString()} {req.currency}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className={cn(
                          "text-[11px] font-bold capitalize",
                          req.paymentMethod ? "text-[#4A443A]" : "text-[#A69D8A] italic"
                        )}>
                          {req.paymentMethod === 'ccp' ? 'CCP' : req.paymentMethod === 'baridi_pay' ? 'Baridi Pay' : req.paymentMethod === 'redotpay' ? 'RedotPay' : req.paymentMethod === 'usdt' ? 'USDT' : req.paymentMethod === 'whatsapp' ? 'WhatsApp' : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-[13px] font-medium text-[#7A7365]">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <span className={cn(
                          "inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest min-w-[70px]",
                          req.status === 'pending' ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : req.status === 'approved' ? "bg-[#E6F4EA] text-[#137333] border border-[#137333]/20"
                            : "bg-red-50 text-red-600 border border-red-200"
                        )}>
                          {req.status}
                        </span>
                      </TableCell>
                      <TableCell className="pr-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(req);
                            resetOverrides();
                          }}
                          className={cn(
                            "font-bold text-xs gap-1",
                            req.status === 'pending'
                              ? "text-[#FF5A1F] hover:text-[#E04D1A] hover:bg-[#FF5A1F]/10"
                              : "text-[#908878] hover:text-[#4A443A] hover:bg-[#F2EFE8]"
                          )}
                        >
                          <Eye size={14} /> {req.status === 'pending' ? 'Review' : 'View'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review / Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#E2DCCF]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2DCCF]">
              <div>
                <h2 className="text-lg font-bold text-[#4A443A]">
                  {selectedRequest.status === 'pending' ? 'Review Request' : 'Request Details'}
                </h2>
                <p className="text-xs text-[#908878] font-medium mt-0.5">
                  Submitted on {new Date(selectedRequest.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 rounded-lg text-[#908878] hover:text-[#4A443A] hover:bg-[#F2EFE8] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Request Info */}
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-[#A69D8A] uppercase tracking-widest mb-1">User</p>
                  <p className="text-sm font-bold text-[#4A443A]">{selectedRequest.userDisplayName}</p>
                  <p className="text-xs text-[#908878]">{selectedRequest.userEmail}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#A69D8A] uppercase tracking-widest mb-1">Plan</p>
                  <p className="text-sm font-bold text-[#4A443A]">{getPlanName(selectedRequest.planId)} Plan</p>
                  <p className="text-xs text-[#908878] capitalize">{selectedRequest.billingCycle} billing</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#A69D8A] uppercase tracking-widest mb-1">Amount</p>
                  <p className="text-lg font-black text-[#4A443A]">{selectedRequest.requestedAmount.toLocaleString()} {selectedRequest.currency}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#A69D8A] uppercase tracking-widest mb-1">Status</p>
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                    selectedRequest.status === 'pending' ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : selectedRequest.status === 'approved' ? "bg-[#E6F4EA] text-[#137333] border border-[#137333]/20"
                      : "bg-red-50 text-red-600 border border-red-200"
                  )}>
                    {selectedRequest.status === 'pending' && <Clock size={11} />}
                    {selectedRequest.status === 'approved' && <CheckCircle2 size={11} />}
                    {selectedRequest.status === 'rejected' && <XCircle size={11} />}
                    {selectedRequest.status}
                  </span>
                </div>
              </div>

              {/* Payment Proof Section */}
              {(selectedRequest.paymentMethod || selectedRequest.paymentProof) && (
                <div className="bg-[#FAF9F6] rounded-lg p-4 border border-[#E2DCCF] space-y-2">
                  <p className="text-[10px] font-bold text-[#A69D8A] uppercase tracking-widest">Payment Proof</p>
                  {selectedRequest.paymentMethod && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#7A7365]">Method</span>
                      <span className="text-xs font-bold text-[#4A443A] capitalize">
                        {selectedRequest.paymentMethod === 'ccp' ? 'CCP' : selectedRequest.paymentMethod === 'baridi_pay' ? 'Baridi Pay' : selectedRequest.paymentMethod === 'redotpay' ? 'RedotPay' : selectedRequest.paymentMethod === 'usdt' ? 'USDT' : 'WhatsApp'}
                      </span>
                    </div>
                  )}
                  {selectedRequest.paymentProof?.transactionId && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#7A7365]">Transaction ID</span>
                      <span className="text-xs font-bold text-[#4A443A] font-mono">{selectedRequest.paymentProof.transactionId}</span>
                    </div>
                  )}
                  {selectedRequest.paymentProof?.screenshotUrl && (
                    <div className="flex items-center gap-2 pt-1">
                      <Image size={14} className="text-[#908878]" />
                      <span className="text-xs text-[#7A7365]">Screenshot attached: <strong className="text-[#4A443A]">{selectedRequest.paymentProof.screenshotUrl}</strong></span>
                    </div>
                  )}
                </div>
              )}

              {/* Admin reviewed info */}
              {selectedRequest.reviewedAt && (
                <div className="bg-[#FAF9F6] rounded-lg p-3 border border-[#E2DCCF]">
                  <p className="text-[10px] font-bold text-[#A69D8A] uppercase tracking-widest mb-1">Reviewed</p>
                  <p className="text-xs text-[#7A7365]">
                    By {selectedRequest.reviewedBy} on {new Date(selectedRequest.reviewedAt).toLocaleString()}
                  </p>
                  {selectedRequest.adminNotes && (
                    <p className="text-xs text-[#908878] mt-1 italic">"{selectedRequest.adminNotes}"</p>
                  )}
                </div>
              )}

              {/* Override fields (only for pending requests) */}
              {selectedRequest.status === 'pending' && (
                <div className="space-y-4 pt-2 border-t border-[#E2DCCF]">
                  <p className="text-[10px] font-bold text-[#A69D8A] uppercase tracking-widest">Optional Overrides</p>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#4A443A] flex items-center gap-1.5">
                      <Calendar size={13} /> Custom End Date
                    </label>
                    <Input
                      type="date"
                      value={overrideEndDate}
                      onChange={(e) => setOverrideEndDate(e.target.value)}
                      className="border-[#E2DCCF] text-sm"
                      placeholder="Leave empty for default"
                    />
                    <p className="text-[10px] text-[#A69D8A]">Leave empty for default ({selectedRequest.billingCycle === 'annual' ? '12 months' : '1 month'} from now)</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#4A443A] flex items-center gap-1.5">
                      <FileText size={13} /> Custom Order Limit
                    </label>
                    <Input
                      type="number"
                      value={overrideOrderLimit}
                      onChange={(e) => setOverrideOrderLimit(e.target.value)}
                      className="border-[#E2DCCF] text-sm"
                      placeholder="Leave empty for plan default"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#4A443A] flex items-center gap-1.5">
                      <StickyNote size={13} /> Admin Notes
                    </label>
                    <Input
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      className="border-[#E2DCCF] text-sm"
                      placeholder="Optional internal notes..."
                    />
                  </div>
                </div>
              )}

              {/* Cancel section (for approved requests) */}
              {selectedRequest.status === 'approved' && selectedRequest.subscriptionId && (
                <div className="space-y-3 pt-2 border-t border-[#E2DCCF]">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Cancel This Subscription</p>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[#4A443A]">Reason (optional)</label>
                    <Input
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="border-[#E2DCCF] text-sm"
                      placeholder="E.g. refund issued, policy violation..."
                    />
                  </div>
                  <Button
                    onClick={handleAdminCancel}
                    disabled={isCancelling}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold text-xs gap-1 w-full shadow-sm"
                    size="sm"
                  >
                    {isCancelling ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
                    {isCancelling ? 'Cancelling…' : 'Cancel Subscription'}
                  </Button>
                </div>
              )}
            </div>

            {/* Modal Actions (only for pending) */}
            {selectedRequest.status === 'pending' && (
              <div className="flex items-center gap-3 px-6 py-4 border-t border-[#E2DCCF] bg-[#FAF9F6] rounded-b-2xl">
                <Button
                  onClick={handleReject}
                  disabled={isRejecting || isApproving}
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 font-bold text-xs gap-1 flex-1"
                >
                  {isRejecting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isApproving || isRejecting}
                  className="bg-[#137333] hover:bg-[#0F5C29] text-white font-bold text-xs gap-1 flex-1 shadow-sm"
                >
                  {isApproving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Approve & Activate
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
