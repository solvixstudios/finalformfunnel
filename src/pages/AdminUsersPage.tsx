/**
 * AdminUsersPage — View all platform users with subscription status and stats.
 */

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Users, Loader2, Search, Crown, CheckCircle2, Clock, XCircle, Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PRICING_PLANS } from '@/data/plans';
import type { Subscription } from '@/types/subscription';
import { Input } from '@/components/ui/input';

interface UserRecord {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt?: string;
  subscription?: Subscription | null;
  totalForms?: number;
  totalOrders?: number;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all users from the `users` collection
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(query(usersRef, orderBy('createdAt', 'desc')));

      const userRecords: UserRecord[] = [];

      for (const userDoc of snapshot.docs) {
        const data = userDoc.data();
        const userId = userDoc.id;

        // Fetch active subscription
        let subscription: Subscription | null = null;
        try {
          const subsRef = collection(db, 'users', userId, 'subscriptions');
          const subSnap = await getDocs(
            query(subsRef, where('status', 'in', ['active', 'pending']), orderBy('createdAt', 'desc'), limit(1))
          );
          if (!subSnap.empty) {
            subscription = { id: subSnap.docs[0].id, ...subSnap.docs[0].data() } as Subscription;
          }
        } catch { /* ignore — no subscriptions */ }

        // Count forms
        let totalForms = 0;
        try {
          const formsSnap = await getDocs(collection(db, 'users', userId, 'forms'));
          totalForms = formsSnap.size;
        } catch { /* ignore */ }

        // Count orders
        let totalOrders = 0;
        try {
          const ordersSnap = await getDocs(collection(db, 'users', userId, 'orders'));
          totalOrders = ordersSnap.size;
        } catch { /* ignore */ }

        userRecords.push({
          id: userId,
          displayName: data.displayName || 'Unnamed',
          email: data.email || '',
          photoURL: data.photoURL,
          createdAt: data.createdAt,
          subscription,
          totalForms,
          totalOrders,
        });
      }

      setUsers(userRecords);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = searchQuery
    ? users.filter(u =>
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : users;

  const activeCount = users.filter(u => u.subscription?.status === 'active').length;
  const pendingCount = users.filter(u => u.subscription?.status === 'pending').length;

  const getPlanBadge = (sub: Subscription | null | undefined) => {
    if (!sub || sub.status === 'expired' || sub.status === 'cancelled') {
      return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#F2EFE8] text-[#908878] text-[9px] font-bold border border-[#E2DCCF]"><Zap size={8} /> Free</span>;
    }
    const plan = PRICING_PLANS.find(p => p.id === sub.planId);
    if (sub.status === 'pending') {
      return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-200"><Clock size={8} /> {plan?.name || sub.planId}</span>;
    }
    return <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#E6F4EA] text-[#137333] text-[9px] font-bold border border-[#137333]/20"><Crown size={8} /> {plan?.name || sub.planId}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FF5A1F]/10 flex items-center justify-center">
            <Users className="text-[#FF5A1F]" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#4A443A] tracking-tight">Users</h1>
            <p className="text-sm text-[#908878] font-medium">{users.length} registered users · {activeCount} active · {pendingCount} pending</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A69D8A]" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="pl-8 border-[#E2DCCF] focus-visible:ring-[#FF5A1F] h-9 text-[12px]"
        />
      </div>

      {/* Users Table */}
      <Card className="rounded-2xl border-[#E2DCCF] shadow-sm bg-white overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="animate-spin text-[#908878]" size={24} />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-[#F2EFE8] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#E2DCCF]">
                <Users className="text-[#A69D8A]" size={22} />
              </div>
              <h3 className="text-sm font-bold text-[#4A443A]">{searchQuery ? 'No matches' : 'No users yet'}</h3>
              <p className="text-xs text-[#908878] mt-1">{searchQuery ? 'Try a different search.' : 'Users will appear here once they sign up.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-[#FAF9F6]">
                  <TableRow className="border-[#E2DCCF] hover:bg-transparent">
                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase pl-6 py-4">User</TableHead>
                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase py-4">Plan</TableHead>
                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase py-4 text-center">Forms</TableHead>
                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase py-4 text-center">Orders</TableHead>
                    <TableHead className="font-bold text-[#A69D8A] text-[11px] tracking-wider uppercase pr-6 py-4">Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-b border-[#E2DCCF]/60 last:border-0 hover:bg-[#FAF9F6] transition-colors">
                      <TableCell className="pl-6 py-3.5">
                        <div className="flex items-center gap-3">
                          {user.photoURL ? (
                            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-lg object-cover border border-[#E2DCCF]" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-[#F2EFE8] border border-[#E2DCCF] flex items-center justify-center text-[#A69D8A] text-xs font-bold">
                              {user.displayName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-[12px] font-bold text-[#4A443A]">{user.displayName}</p>
                            <p className="text-[10px] text-[#908878] font-medium">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">{getPlanBadge(user.subscription)}</TableCell>
                      <TableCell className="py-3.5 text-center">
                        <span className="text-[12px] font-bold text-[#4A443A]">{user.totalForms}</span>
                      </TableCell>
                      <TableCell className="py-3.5 text-center">
                        <span className="text-[12px] font-bold text-[#4A443A]">{user.totalOrders}</span>
                      </TableCell>
                      <TableCell className="pr-6 py-3.5">
                        <span className="text-[11px] text-[#7A7365] font-medium">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsersPage;
