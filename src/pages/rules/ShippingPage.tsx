import { PageHeader } from '@/components/GlobalHeader/PageHeader';
import { GoogleUser } from '@/lib/authGoogle';
import { Truck } from 'lucide-react';
import React from 'react';

interface ShippingPageProps {
    userId: string;
}

const ShippingPage: React.FC<ShippingPageProps> = ({ userId }) => {
    return (
        <div className="max-w-[1600px] mx-auto w-full space-y-6 h-full flex flex-col pt-2 md:pt-4 pb-24">
            <PageHeader
                title="Shipping"
                breadcrumbs={[{ label: 'Rules' }, { label: 'Shipping' }]}
                icon={Truck}
            />

            <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                    <Truck size={32} className="text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Configure Shipping Rules</h3>
                <p className="text-slate-500 max-w-md mb-6">
                    Define shipping zones, rates, and free shipping thresholds to use across your forms.
                </p>
                <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm">
                    Add Shipping Zone
                </button>
            </div>
        </div>
    );
};

export default ShippingPage;
