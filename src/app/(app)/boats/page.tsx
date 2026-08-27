"use client";

import { useState, useEffect } from "react";
import { useBoatStore } from "@/stores/boatStore";
import { useT } from "@/lib/i18n";
import { Ship, Plus, Trash2, Edit2 } from "lucide-react";

export default function BoatsPage() {
  const t = useT();
  const { boats, load, primaryBoatId, setPrimaryBoat, addBoat, updateBoat } =
    useBoatStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "Motorsegelyacht",
    length_m: 10,
    beam_m: 3,
    draft_m: 1.2,
    fuel_capacity_liters: 200,
    fuel_consumption_liter_per_hour: 5,
    engine_hp: 27,
    motor_type: "Diesel",
  });

  useEffect(() => {
    load();
  }, []);

  function handleAddBoat() {
    if (!form.name.trim()) return;

    addBoat({
      id: Date.now().toString(),
      name: form.name,
      type: form.type,
      length_m: form.length_m,
      beam_m: form.beam_m,
      draft_m: form.draft_m,
      fuel_capacity_liters: form.fuel_capacity_liters,
      fuel_consumption_liter_per_hour: form.fuel_consumption_liter_per_hour,
      engine_hp: form.engine_hp,
      motor_type: form.motor_type,
    });

    setForm({
      name: "",
      type: "Motorsegelyacht",
      length_m: 10,
      beam_m: 3,
      draft_m: 1.2,
      fuel_capacity_liters: 200,
      fuel_consumption_liter_per_hour: 5,
      engine_hp: 27,
      motor_type: "Diesel",
    });
    setShowForm(false);
  }

  return (
    <div className="space-y-6 p-4 pb-28">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-mist">Mina Båtar</h1>
          <p className="text-mist/60 text-sm">Hantera dina fartyg</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-3 bg-sonar/25 hover:bg-sonar/35 rounded-full text-sonar transition"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* ADD FORM */}
      {showForm && (
        <div className="bg-sonar/10 border border-sonar/20 rounded-xl p-4 space-y-3">
          <input
            type="text"
            placeholder="Båtnamn"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-white/5 border border-sonar/20 rounded-lg px-3 py-2 text-sm text-mist placeholder:text-mist/40"
          />

          <input
            type="text"
            placeholder="Typ (t.ex. Motorsegelyacht)"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full bg-white/5 border border-sonar/20 rounded-lg px-3 py-2 text-sm text-mist placeholder:text-mist/40"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Längd (m)"
              value={form.length_m}
              onChange={(e) =>
                setForm({ ...form, length_m: parseFloat(e.target.value) })
              }
              className="bg-white/5 border border-sonar/20 rounded-lg px-3 py-2 text-sm text-mist"
            />
            <input
              type="number"
              placeholder="Bredd (m)"
              value={form.beam_m}
              onChange={(e) =>
                setForm({ ...form, beam_m: parseFloat(e.target.value) })
              }
              className="bg-white/5 border border-sonar/20 rounded-lg px-3 py-2 text-sm text-mist"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Bränsletank (L)"
              value={form.fuel_capacity_liters}
              onChange={(e) =>
                setForm({
                  ...form,
                  fuel_capacity_liters: parseFloat(e.target.value),
                })
              }
              className="bg-white/5 border border-sonar/20 rounded-lg px-3 py-2 text-sm text-mist"
            />
            <input
              type="number"
              placeholder="Förbrukning (L/h)"
              value={form.fuel_consumption_liter_per_hour}
              onChange={(e) =>
                setForm({
                  ...form,
                  fuel_consumption_liter_per_hour: parseFloat(e.target.value),
                })
              }
              className="bg-white/5 border border-sonar/20 rounded-lg px-3 py-2 text-sm text-mist"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddBoat}
              className="flex-1 px-4 py-2 bg-sonar/25 hover:bg-sonar/35 text-sonar rounded-lg font-semibold text-sm transition"
            >
              Lägg Till
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-mist/60 rounded-lg text-sm transition"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* BOATS LIST */}
      {boats.length === 0 ? (
        <div className="text-center py-12">
          <Ship size={48} className="mx-auto text-sonar/20 mb-3" />
          <p className="text-mist/60">Inga båtar ännu. Lägg till din första!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {boats.map((b) => (
            <div
              key={b.id}
              className={
                b.id === primaryBoatId
                  ? "holo-panel p-4"
                  : "bg-sonar/5 border border-sonar/20 p-4 rounded-lg"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Ship size={20} className="text-sonar" strokeWidth={1.6} />
                  <div>
                    <h3 className="font-semibold text-mist">{b.name}</h3>
                    <p className="text-xs text-mist/60">{b.type}</p>
                  </div>
                </div>
                {b.id !== primaryBoatId && (
                  <button
                    onClick={() => setPrimaryBoat(b.id)}
                    className="text-xs px-2 py-1 bg-sonar/20 text-sonar rounded hover:bg-sonar/30 transition"
                  >
                    Välj
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
                <div className="bg-white/5 rounded p-2">
                  <p className="text-mist/50">Längd</p>
                  <p className="text-mist font-semibold">{b.length_m}m</p>
                </div>
                <div className="bg-white/5 rounded p-2">
                  <p className="text-mist/50">Bredd</p>
                  <p className="text-mist font-semibold">{b.beam_m}m</p>
                </div>
                <div className="bg-white/5 rounded p-2">
                  <p className="text-mist/50">Tank</p>
                  <p className="text-mist font-semibold">{b.fuel_capacity_liters}L</p>
                </div>
                <div className="bg-white/5 rounded p-2">
                  <p className="text-mist/50">Motor</p>
                  <p className="text-mist font-semibold">{b.engine_hp}hk</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
