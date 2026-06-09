import React, { useState, useEffect } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import Card from './Card';

// 1. Configuración de Mock Data para cuando no haya servidor IA
const MOCK_DATA = {
    predictions: [
        { supplier: "Sup01", price: 258852.83, price_low: 220014.45, price_high: 297691.21 },
        { supplier: "Sup02", price: 256448.52, price_low: 217970.88, price_high: 294926.15 },
        { supplier: "Sup03", price: 254529.02, price_low: 216339.39, price_high: 292718.66 }
    ]
};

export default function IARecommendations({ rfqId }) {
    const [suggestions, setSuggestions] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isMocking, setIsMocking] = useState(false); // Para saber si estamos en modo offline
    const [error, setError] = useState(null);

    // 2. Fetch robusto con lógica de Fallback
    const fetchPredictions = async () => {
        const USE_MOCK_DATA = false; // <--- CAMBIA A 'true' SI QUIERES FORZAR DATOS HARDCODEADOS
        
        if (USE_MOCK_DATA) {
            console.warn("IA: Usando modo MOCK (Hardcodeado)");
            setSuggestions(MOCK_DATA.predictions);
            setIsMocking(true);
            setLoading(false);
            return;
        }

        try {
            const userData = JSON.parse(localStorage.getItem('user'));
            const token = userData?.access;

            if (!token) throw new Error("No autenticado");

            const response = await fetch(`http://127.0.0.1:8000/api/rfqs/${rfqId}/ia-recomendaciones/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: Conexión fallida`);
            }

            const data = await response.json();
            setSuggestions(data.predictions.sort((a, b) => a.price - b.price));
            
        } catch (err) {
            console.error("Fallo al conectar IA, usando datos de respaldo:", err);
            // Si falla la API real, activamos el modo Mock automáticamente
            setSuggestions(MOCK_DATA.predictions);
            setIsMocking(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (rfqId) fetchPredictions();
    }, [rfqId]);

    if (loading) return <div className="p-4 text-sm animate-pulse text-gray-400">Analizando con IA...</div>;

    return (
        <Card className={`border ${isMocking ? 'border-amber-300' : 'border-purple-200'} shadow-sm`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className={isMocking ? "text-amber-500" : "text-purple-600"} size={20} />
                    <h3 className="font-bold text-gray-800">
                        {isMocking ? "IA (Datos de Respaldo)" : "IA: Proveedores Sugeridos"}
                    </h3>
                </div>
            </div>
            
            {isMocking && (
                <div className="mb-3 flex items-center gap-2 p-2 bg-amber-50 text-amber-700 text-[10px] rounded">
                    <AlertCircle size={12} />
                    <span>Servidor de IA no disponible, mostrando datos de referencia.</span>
                </div>
            )}

            <div className="space-y-2">
                {suggestions?.map((sup, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                        <span className="font-semibold text-sm">{sup.supplier}</span>
                        <div className="text-right">
                            <span className="font-bold text-sm block">${sup.price.toLocaleString()}</span>
                            <span className="text-[10px] text-gray-400">Rango: {Math.round(sup.price_low/1000)}k - {Math.round(sup.price_high/1000)}k</span>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}