"use client";

import { useState, useEffect } from "react";

const DEFAULT_CATEGORIES = [
  "Consultas",
  "Tratamientos",
  "Ortodoncia",
  "Implantes",
  "Higiene",
  "Alquiler",
  "Servicios",
  "Suministros",
  "Nómina",
  "Material dental",
  "Supermercado",
  "Transporte",
  "Seguros",
  "Marketing",
  "Mantenimiento",
  "Inversiones",
  "Otro"
];

export function CategorySelector() {
  const [selected, setSelected] = useState<string | null>(null);
  const [otherValue, setOtherValue] = useState("");

  const isOther = selected === "Otro";

  useEffect(() => {
    const hidden = document.getElementById("category-value") as HTMLInputElement | null;
    if (!hidden) return;
    if (isOther) {
      hidden.value = otherValue.trim();
    } else {
      hidden.value = selected || "";
    }
  }, [selected, otherValue, isOther]);

  return (
    <div className="space-y-3">
      <label className="text-xs text-slate-300">Categoría (opcional)</label>
      <input type="hidden" name="category" id="category-value" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {DEFAULT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelected(cat)}
            className={`rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
              selected === cat
                ? "border-primary bg-primary/20 text-primary-foreground"
                : "border-slate-800 bg-slate-950/60 text-slate-200 hover:border-slate-600"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      {isOther && (
        <div className="pt-1">
          <label className="text-[11px] text-slate-400">Escribe tu categoría</label>
          <input
            type="text"
            value={otherValue}
            onChange={(e) => setOtherValue(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-slate-600"
            placeholder="Ej. Otro concepto..."
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
