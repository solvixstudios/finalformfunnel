import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { GoogleUser } from '@/lib/authGoogle';
import { Tag } from 'lucide-react';
import React from 'react';

interface OffersPageProps {
    userId: string;
}

const OffersPage: React.FC<OffersPageProps> = ({ userId }) => {
    return (
        <div className="max-w-[1600px] mx-auto w-full space-y-6 h-full flex flex-col pt-2 md:pt-4 pb-24">
            <PageHeader
                title="Offers"
                breadcrumbs={[{ label: 'Rules' }, { label: 'Offers' }]}
                icon={Tag}
            />

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <Tag size={32} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">No Offers Yet</h3>
                <p className="text-slate-500 max-w-md mb-6">
                    Create global offers and discounts that can be applied across multiple forms automatically.
                </p>
                <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm">
                    Create Offer
                </button>
            </div>
        </div>
    );
};

export default OffersPage;
