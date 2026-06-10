import React from 'react';
export default function IARecommendations({ data }) {
    // Acepta tanto el objeto completo como el array directamente
    const predictions = Array.isArray(data) ? data : data?.predictions;

    if (!predictions || !Array.isArray(predictions)) {
        console.log("IA Component: Esperando datos válidos...");
        return null;
    }

    return (
        <div className="mb-6 p-4 border border-blue-200 rounded-lg">
            <h3 className="font-bold mb-2">Sugerencias de IA</h3>
            <ul>
                {predictions.map((p, i) => (
                    <li key={i}>{p.supplier}: ${p.price.toLocaleString()}</li>
                ))}
            </ul>
        </div>
    );
}