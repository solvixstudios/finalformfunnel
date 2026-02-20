import { useState, useEffect } from 'react';
import { Commune, fetchCommunes, fetchWilayas, Wilaya } from '@/lib/location';

export function useLocationData(selectedWilayaId?: string) {
    const [wilayasList, setWilayasList] = useState<Wilaya[]>([]);
    const [communesList, setCommunesList] = useState<Commune[]>([]);
    const [loadingCommunes, setLoadingCommunes] = useState(false);
    const [clientIp, setClientIp] = useState('');

    useEffect(() => {
        fetchWilayas().then(data => setWilayasList(data));
        fetch('https://api.ipify.org?format=json')
            .then(r => r.json())
            .then(d => setClientIp(d.ip || ''))
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (selectedWilayaId) {
            setLoadingCommunes(true);
            fetchCommunes(selectedWilayaId).then(data => {
                setCommunesList(data);
                setLoadingCommunes(false);
            });
        } else {
            setCommunesList([]);
        }
    }, [selectedWilayaId]);

    const getWilayaRawName = (wilayaId: string) => {
        const selectedWilayaObj = wilayasList.find(w => w.id === wilayaId);
        return selectedWilayaObj ? selectedWilayaObj.rawName : wilayaId;
    };

    return {
        wilayasList,
        communesList,
        loadingCommunes,
        clientIp,
        getWilayaRawName
    };
}
