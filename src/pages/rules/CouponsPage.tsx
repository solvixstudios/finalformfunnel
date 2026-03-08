import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { GoogleUser } from '@/lib/authGoogle';
import { Ticket } from 'lucide-react';
import React from 'react';

interface CouponsPageProps {
    userId: string;
}

const CouponsPage: React.FC<CouponsPageProps> = ({ userId }) => {
    return (
        <div className="max-w-[1600px] mx-auto w-full space-y-6 h-full flex flex-col pt-2 md:pt-4 pb-24">
            <PageHeader
                title="Coupons"
                breadcrumbs={[{ label: 'Rules' }, { label: 'Coupons' }]}
                icon={Ticket}
            />

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <Ticket size={32} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Manage Coupons</h3>
                <p className="text-slate-500 max-w-md mb-6">
                    Create promo codes with specific usage limits, expirations, and discount amounts.
                </p>
                <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm">
                    Create Coupon
                </button>
            </div>
        </div>
    );
};

export default CouponsPage;
