// src/components/AddOrderModal.jsx
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { opsApi, meApi, companiesApi } from "../services/api";
import { parseDRFError } from "../utils/drfErrors";

export default function AddOrderModal({ open, onClose, onCreated }) {
  const { isAuthenticated } = useAuth();
  const empresasQ = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => {
      const { data } = await opsApi.listCompanies(); // tu función real
      return data;
    },
    enabled: isAuthenticated,   // <— clave
  });
  const [form, setForm] = useState({
    empresa: "",                 // ID numérico (se fija solo si no-staff)
    excursion: "",
    fecha_inicio: "",
    fecha_fin: "",
    estado: "pendiente_pago",
    // valores EXACTOS del modelo:
    tipo_servicio: "mediodia",   // mediodia | dia_Completo | circuito | crucero
    lugar_entrega: "",
    lugar_recogida: "",
    notas: "",
    bono: "",
    emisores: "",
    pax: "",
    guia: "",
    // UI-only:
    hora_mediodia: "",           // HH:MM (solo cuando tipo_servicio = mediodia)
  });

  const [errors, setErrors] = useState(null);
  const [banner, setBanner] = useState(null);

  // --- auth + empresa del usuario ---
  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await meApi.getMe()).data,
    staleTime: 60_000,
    enabled: open,
  });
  const isStaff = !!meQ.data?.is_staff;
  const myEmpresaId = meQ.data?.empresa_id;
  const myEmpresaName = meQ.data?.empresa_name || "";

  // --- listado de empresas (solo staff) ---
  const empresasStaffQ = useQuery({
    queryKey: ["empresas"],
    queryFn: async () => (await companiesApi.list()).data,
    enabled: open && isStaff,
    staleTime: 60_000,
  });

  // Evitar scroll en móvil con modal abierto
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev || "");
  }, [open]);

  // Si NO es staff, fijamos empresa al valor del usuario (cuando llegue)
  useEffect(() => {
    if (!open) return;
    if (!isStaff && myEmpresaId && !form.empresa) {
      setForm((f) => ({ ...f, empresa: String(myEmpresaId) }));
    }
  }, [open, isStaff, myEmpresaId, form.empresa]);

  // Mostrar input de hora sólo si es mediodía
  const pideHora = useMemo(() => form.tipo_servicio === "mediodia", [form.tipo_servicio]);

  const createMut = useMutation({
    mutationFn: async () => {
      // Antes de enviar: si es mediodía y hay hora, la guardamos “aparte” en notas
      let notas = form.notas || "";
      if (pideHora && form.hora_mediodia) {
        const tag = `HORA_INICIO: ${form.hora_mediodia}`;
        const sinTagsPrevios = notas.replace(/(^|\n)HORA_INICIO:\s*\d{1,2}:\d{2}\s*/gi, "").trim();
        notas = [sinTagsPrevios, tag].filter(Boolean).join("\n");
      }

      const payload = {
        empresa: form.empresa,                 // ID (el interceptor lo fuerza a number)
        excursion: form.excursion,
        fecha_inicio: form.fecha_inicio,       // <input type="date" /> → YYYY-MM-DD
        fecha_fin: form.fecha_fin || null,     // opcional
        estado: form.estado,
        tipo_servicio: form.tipo_servicio,     // EXACTO del modelo
        lugar_entrega: form.lugar_entrega,
        lugar_recogida: form.lugar_recogida,
        notas,
        bono: form.bono,
        emisores: form.emisores,               // numérico opcional
        pax: form.pax,                         // numérico
        guia: form.guia,
        // hora_mediodia no viaja (la inyectamos en notas)
      };

      return opsApi.createOrder(payload);
    },
    onSuccess: () => {
      setErrors(null);
      setBanner({ kind: "ok", msg: "Pedido creado correctamente" });
      // Reset amigable: si no-staff, mantenemos su empresa fijada; si staff, vaciamos
      setForm((f) => ({
        empresa: isStaff ? "" : (myEmpresaId ? String(myEmpresaId) : ""),
        excursion: "",
        fecha_inicio: "",
        fecha_fin: "",
        estado: "pendiente_pago",
        tipo_servicio: "mediodia",
        lugar_entrega: "",
        lugar_recogida: "",
        notas: "",
        bono: "",
        emisores: "",
        pax: "",
        guia: "",
        hora_mediodia: "",
      }));
      onCreated?.();
    },
    onError: (err) => {
      setErrors(parseDRFError(err));
      setBanner({ kind: "err", msg: "Revisa los campos marcados" });
    },
  });

  if (!open) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // inputs accesibles en móvil (>=16px)
  const inputCls = "w-full border rounded p-3 text-base";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-xl shadow-lg flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Crear pedido estándar</h3>
            <button
              className="text-slate-500 hover:text-slate-800 text-xl leading-none"
              onClick={onClose}
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
          {banner && (
            <div
              className={`mt-3 rounded p-2 ${
                banner.kind === "ok"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {banner.msg}
            </div>
          )}
        </div>

        {/* Contenido desplazable */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMut.mutate();
          }}
          className="flex-1 overflow-y-auto px-4 py-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Empresa: select para staff, etiqueta fija para no-staff */}
            <label className="text-sm">
              Empresa
              {isStaff ? (
                <select
                  className={inputCls}
                  value={form.empresa}
                  onChange={set("empresa")}
                  required
                >
                  <option value="">
                    {empresasStaffQ.isLoading ? "Cargando empresas…" : "Selecciona empresa…"}
                  </option>
                  {(empresasStaffQ.data || []).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    className={inputCls}
                    value={myEmpresaName || (form.empresa ? `#${form.empresa}` : "")}
                    disabled
                    readOnly
                  />
                  {/* Mantener el ID en estado (ya lo hacemos), pero por si acaso: */}
                  <input type="hidden" value={form.empresa} />
                </>
              )}
              {errors?.empresa && (
                <p className="text-rose-600 text-xs mt-1">{errors.empresa}</p>
              )}
            </label>

            <label className="text-sm">
              Excursión
              <input
                className={inputCls}
                value={form.excursion}
                onChange={set("excursion")}
                autoComplete="off"
              />
              {errors?.excursion && (
                <p className="text-rose-600 text-xs mt-1">{errors.excursion}</p>
              )}
            </label>

            <label className="text-sm">
              Fecha inicio
              <input
                type="date"
                className={inputCls}
                value={form.fecha_inicio}
                onChange={set("fecha_inicio")}
                required
              />
              {errors?.fecha_inicio && (
                <p className="text-rose-600 text-xs mt-1">{errors.fecha_inicio}</p>
              )}
            </label>

            <label className="text-sm">
              Fecha fin (opcional)
              <input
                type="date"
                className={inputCls}
                value={form.fecha_fin}
                onChange={set("fecha_fin")}
              />
              {errors?.fecha_fin && (
                <p className="text-rose-600 text-xs mt-1">{errors.fecha_fin}</p>
              )}
            </label>

            <label className="text-sm">
              Estado
              <select className={inputCls} value={form.estado} onChange={set("estado")}>
                <option value="pendiente_pago">Pendiente de pago</option>
                <option value="pagado">Pagado</option>
                <option value="aprobado">Aprobado</option>
                <option value="entregado">Entregado</option>
                <option value="recogido">Recogido</option>
              </select>
              {errors?.estado && (
                <p className="text-rose-600 text-xs mt-1">{errors.estado}</p>
              )}
            </label>

            <label className="text-sm">
              Tipo de servicio
              <select
                className={inputCls}
                value={form.tipo_servicio}
                onChange={set("tipo_servicio")}
              >
                <option value="mediodia">Medio día</option>
                <option value="dia_Completo">Día completo</option>
                <option value="circuito">Circuito</option>
                <option value="crucero">Crucero</option>
              </select>
              {errors?.tipo_servicio && (
                <p className="text-rose-600 text-xs mt-1">{errors.tipo_servicio}</p>
              )}
            </label>

            {/* Hora solo cuando es mediodía */}
            {pideHora && (
              <label className="text-sm">
                Hora (solo mediodía)
                <input
                  type="time"
                  className={inputCls}
                  value={form.hora_mediodia}
                  onChange={set("hora_mediodia")}
                  required={pideHora}
                />
                {/* No se envía como DateField. Se guardará en notas con tag. */}
              </label>
            )}

            <label className="text-sm">
              PAX
              <input
                type="number"
                className={inputCls}
                value={form.pax}
                onChange={set("pax")}
                required
                inputMode="numeric"
              />
              {errors?.pax && <p className="text-rose-600 text-xs mt-1">{errors.pax}</p>}
            </label>

            <label className="text-sm">
              Bono
              <input
                className={inputCls}
                value={form.bono}
                onChange={set("bono")}
                autoComplete="off"
              />
              {errors?.bono && (
                <p className="text-rose-600 text-xs mt-1">{errors.bono}</p>
              )}
            </label>

            <label className="text-sm">
              Guía
              <input
                className={inputCls}
                value={form.guia}
                onChange={set("guia")}
                autoComplete="off"
              />
              {errors?.guia && (
                <p className="text-rose-600 text-xs mt-1">{errors.guia}</p>
              )}
            </label>

            <label className="text-sm md:col-span-2">
              Notas
              <textarea
                className={`${inputCls} min-h-24`}
                rows={3}
                value={form.notas}
                onChange={set("notas")}
              />
              {errors?.notas && (
                <p className="text-rose-600 text-xs mt-1">{errors.notas}</p>
              )}
            </label>

            <label className="text-sm">
              Lugar de entrega
              <input
                className={inputCls}
                value={form.lugar_entrega}
                onChange={set("lugar_entrega")}
                autoComplete="off"
              />
              {errors?.lugar_entrega && (
                <p className="text-rose-600 text-xs mt-1">{errors.lugar_entrega}</p>
              )}
            </label>

            <label className="text-sm">
              Lugar de recogida
              <input
                className={inputCls}
                value={form.lugar_recogida}
                onChange={set("lugar_recogida")}
                autoComplete="off"
              />
              {errors?.lugar_recogida && (
                <p className="text-rose-600 text-xs mt-1">{errors.lugar_recogida}</p>
              )}
            </label>

            <label className="text-sm">
              Emisores (opcional)
              <input
                type="number"
                className={inputCls}
                value={form.emisores}
                onChange={set("emisores")}
                inputMode="numeric"
              />
              {errors?.emisores && (
                <p className="text-rose-600 text-xs mt-1">{errors.emisores}</p>
              )}
            </label>
          </div>
        </form>

        {/* Footer fijo (botones siempre visibles en móvil) */}
        <div className="px-4 py-3 border-t bg-white sticky bottom-0 z-10 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-3 rounded border text-base"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              onClick={(e) => {
                const formEl = e.currentTarget
                  .closest("[role='dialog']")
                  ?.querySelector("form");
                formEl?.requestSubmit();
              }}
              className="px-4 py-3 rounded bg-[#005dab] text-white text-base disabled:opacity-50"
              disabled={createMut.isPending}
            >
              {createMut.isPending ? "Creando…" : "Crear pedido"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
