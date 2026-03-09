'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle, MapPin, Globe, Github, Linkedin, Code, Star,
  Pencil, Check, X, Plus, Shield, GraduationCap, Clock,
  DollarSign, Phone, AlertCircle, Wallet, Building2,
  BadgeCheck, BadgeX, ClipboardList, Upload, ExternalLink,
} from 'lucide-react';
import { Camera } from 'lucide-react';
import { defaultAvatar } from '@/lib/avatar';
import { useAuthStore } from '@/store/auth.store';
import { useMe, useUpdateProfile } from '@/hooks/use-profile';
import { DevCard, Tip, Stars, BADGES } from '@/components/ui/dev-card';
import { AvatarPicker } from '@/components/ui/avatar-picker';
import { useUploadDocument } from '@/hooks/use-upload';
import { useSubmitDeveloperVerification, useSubmitCompanyVerification, useValidateRuc } from '@/hooks/use-verification';
import type { User, VerificationStatus } from '@/types';

const PAYMENT_OPTIONS = ['Yape / Plin', 'PagoEfectivo', 'Culqi / Tarjeta', 'Niubiz', 'Transferencia'];

const TECH_SUGGESTIONS = [
  // Frontend
  'React','Next.js','Vue.js','Angular','Svelte','HTML','CSS','JavaScript','TypeScript',
  'Tailwind CSS','Bootstrap','SASS','jQuery','Astro','Remix','Nuxt.js','Vite',
  // Backend
  'Node.js','NestJS','Express.js','Django','FastAPI','Laravel','Spring Boot','Flask',
  'Ruby on Rails','.NET','PHP','Go','Rust','Bun','Hono',
  // Mobile
  'React Native','Flutter','Swift','Kotlin','Expo','Ionic',
  // Bases de datos
  'PostgreSQL','MySQL','MongoDB','SQLite','Redis','Firebase','Supabase','Prisma',
  'DynamoDB','Elasticsearch',
  // Cloud / DevOps
  'AWS','GCP','Azure','Docker','Kubernetes','Linux','Nginx','GitHub Actions','CI/CD','Vercel','Railway',
  // Otros
  'GraphQL','REST API','WebSockets','Stripe','OAuth','JWT','Figma','OpenAI API',
];

const PERU_UNIVERSITIES = [
  // Lima
  'Universidad Nacional Mayor de San Marcos (UNMSM)',
  'Pontificia Universidad Católica del Perú (PUCP)',
  'Universidad de Lima',
  'Universidad Peruana de Ciencias Aplicadas (UPC)',
  'Universidad San Martín de Porres (USMP)',
  'Universidad Nacional de Ingeniería (UNI)',
  'Universidad del Pacífico',
  'Universidad Ricardo Palma (URP)',
  'Universidad ESAN',
  'Universidad Privada del Norte (UPN)',
  'Universidad César Vallejo (UCV)',
  'Universidad Inca Garcilaso de la Vega',
  'Universidad Científica del Sur',
  'Universidad Antonio Ruiz de Montoya',
  'Universidad Peruana Cayetano Heredia (UPCH)',
  'Universidad Nacional Agraria La Molina (UNALM)',
  'Universidad Nacional Federico Villarreal (UNFV)',
  'Universidad Tecnológica del Perú (UTP)',
  'Universidad Le Cordon Bleu',
  'Universidad Norbert Wiener',
  'Universidad Alas Peruanas',
  'Universidad Autónoma del Perú',
  // Regiones
  'Universidad Nacional de Trujillo (UNT)',
  'Universidad Privada Antenor Orrego (UPAO)',
  'Universidad Nacional de Piura (UNP)',
  'Universidad Nacional de San Agustín (UNSA)',
  'Universidad Católica de Santa María',
  'Universidad Nacional del Altiplano (UNAP)',
  'Universidad Nacional de San Antonio Abad del Cusco (UNSAAC)',
  'Universidad Nacional Hermilio Valdizán (UNHEVAL)',
  'Universidad Nacional de Huancavelica (UNH)',
  'Universidad Nacional del Centro del Perú (UNCP)',
  'Universidad Nacional de Cajamarca (UNC)',
  'Universidad Nacional Toribio Rodríguez de Mendoza (UNTRM)',
  'Universidad Nacional de la Amazonía Peruana (UNAP)',
  'Universidad Nacional Intercultural de la Amazonía (UNIA)',
  'Universidad Nacional José Faustino Sánchez Carrión (UNJFSC)',
  'Universidad Nacional Santiago Antúnez de Mayolo (UNASAM)',
  'Universidad Nacional de Moquegua (UNAM)',
  'Universidad Nacional de Tumbes (UNTUMBES)',
  'Universidad Nacional de Ucayali (UNU)',
  // Institutos tecnológicos reconocidos
  'Tecsup',
  'SENATI',
  'CIBERTEC',
  'IDAT',
  'SISE',
  'Toulouse Lautrec',
  'Certus',
  'Instituto de Educación Superior Continental',
];

const CYCLES = [
  '1er ciclo','2do ciclo','3er ciclo','4to ciclo','5to ciclo',
  '6to ciclo','7mo ciclo','8vo ciclo','9no ciclo','10mo ciclo',
  'Egresado / Egresada','Titulado / Titulada',
];

const PERU_LOCATIONS = [
  'Lima','Miraflores, Lima','San Isidro, Lima','Surco, Lima','San Borja, Lima',
  'Callao','Arequipa','Trujillo','Chiclayo','Piura','Cusco','Iquitos',
  'Huancayo','Tacna','Juliaca','Ica','Puno','Ayacucho','Cajamarca',
  'Chimbote','Huánuco','Tarapoto','Pucallpa','Tumbes','Moquegua',
];

const COMPANY_INDUSTRIES = [
  'Tecnología','Software / IT','E-commerce','Gastronomía','Retail','Salud',
  'Educación','Fintech','Logística','Turismo','Inmobiliaria','Manufactura',
  'Agro / Agroindustria','Marketing / Publicidad','Consultoría','Legal',
  'Construcción','Energía','Moda / Textil','Entretenimiento','ONG / Sector público',
];

// ─── Company preview card ─────────────────────────────────────────────────────

function CompanyCard({ c, email }: { c: ReturnType<typeof buildCompanyData>; email: string }) {
  const initial = c.name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <div className="relative rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md select-none overflow-hidden">
      {/* top */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {c.logoUrl ? (
            <img src={c.logoUrl} alt={c.name} className="w-16 h-16 rounded-xl object-cover border border-gray-100" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
              {initial}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold text-gray-900 text-base leading-tight truncate">{c.name || '—'}</span>
            {c.verified && (
              <Tip text="Empresa verificada por la plataforma">
                <CheckCircle size={15} className="text-blue-500 flex-shrink-0" fill="currentColor" />
              </Tip>
            )}
          </div>
          {c.industry && (
            <span className="mt-1 inline-block text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{c.industry}</span>
          )}
          {c.clientRating > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <Stars value={c.clientRating} />
              <Tip text="Reputación como cliente: cómo califican los devs su experiencia trabajando con esta empresa">
                <span className="text-xs text-gray-500 cursor-default">{c.clientRating.toFixed(1)} como cliente</span>
              </Tip>
            </div>
          )}
        </div>
      </div>

      <div className="my-3 border-t border-gray-100" />

      <div className="space-y-1.5 text-xs text-gray-500">
        {c.location && <div className="flex items-center gap-1.5"><MapPin size={11} />{c.location}</div>}
        {c.contactPerson && <div className="flex items-center gap-1.5"><Phone size={11} />{c.contactPerson}</div>}
        {c.size && <div className="flex items-center gap-1.5"><Building2 size={11} />{c.size} empleados</div>}
      </div>

      {(c.paymentMethods ?? []).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(c.paymentMethods ?? []).map((m) => (
            <span key={m} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">{m}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Inline editable field ────────────────────────────────────────────────────

type FieldType = 'text' | 'url' | 'number' | 'textarea';

function EditableField({
  label, fieldKey, value, type = 'text', placeholder,
  icon: Icon, isEditing, onStartEdit, onChange, onConfirm, onCancel,
}: {
  label: string;
  fieldKey: string;
  value: string;
  type?: FieldType;
  placeholder?: string;
  icon?: React.ElementType;
  isEditing: boolean;
  onStartEdit: () => void;
  onChange: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const displayVal = value || <span className="text-gray-300 italic">Sin completar</span>;

  return (
    <div className="group flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-24 sm:w-36 flex-shrink-0 flex items-center gap-1.5 pt-0.5">
        {Icon && <Icon size={13} className="text-gray-400 flex-shrink-0" />}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>

      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-start gap-2">
            {type === 'textarea' ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="flex-1 text-sm border border-primary-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400 resize-none"
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                onKeyDown={(e) => { if (e.key === 'Enter') onConfirm(); if (e.key === 'Escape') onCancel(); }}
                className="flex-1 text-sm border border-primary-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
            )}
            <button onClick={onConfirm} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex-shrink-0 cursor-pointer">
              <Check size={14} />
            </button>
            <button onClick={onCancel} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex-shrink-0 cursor-pointer">
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-h-[28px]">
            <span className="text-sm text-gray-800 break-all">{displayVal}</span>
            <button
              onClick={onStartEdit}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-opacity flex-shrink-0 cursor-pointer"
            >
              <Pencil size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Toggle field ─────────────────────────────────────────────────────────────

function ToggleField({ label, value, onChange, icon: Icon }: {
  label: string; value: boolean; onChange: (v: boolean) => void; icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={13} className="text-gray-400" />}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${value ? 'bg-primary-600' : 'bg-gray-200'}`}
      >
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

// ─── Autocomplete tag input (skills) ─────────────────────────────────────────

function AutocompleteTagInput({
  tags, onChange, suggestions, label, icon: Icon, placeholder,
}: {
  tags: string[]; onChange: (t: string[]) => void;
  suggestions: string[]; label: string;
  icon?: React.ElementType; placeholder?: string;
}) {
  const [input, setInput] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = suggestions
    .filter((s) => !tags.includes(s) && (input.length === 0 || s.toLowerCase().includes(input.toLowerCase())))
    .slice(0, input.length > 0 ? 30 : 12);

  const add = (s: string) => {
    const t = s.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showAddCustom = input.trim().length > 0 &&
    !suggestions.some((s) => s.toLowerCase() === input.trim().toLowerCase()) &&
    !tags.includes(input.trim());

  return (
    <div className="py-3 border-b border-gray-50" ref={containerRef}>
      <div className="flex items-center gap-1.5 mb-2">
        {Icon && <Icon size={13} className="text-gray-400" />}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map((s) => (
          <span key={s} className="flex items-center gap-1 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full border border-primary-200">
            {s}
            <button onClick={() => onChange(tags.filter((x) => x !== s))} className="hover:text-red-500 leading-none ml-0.5 cursor-pointer">×</button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-gray-300 italic text-xs">Sin agregar</span>}
      </div>
      <div className="relative">
        <input
          type="text" value={input}
          onChange={(e) => { setInput(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); if (input.trim()) add(input); }
            if (e.key === 'Escape') setOpen(false);
          }}
          placeholder={placeholder ?? 'Buscar o escribir…'}
          className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
        />
        {open && (filtered.length > 0 || showAddCustom) && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
            {filtered.map((s) => (
              <button key={s} type="button" onMouseDown={(e) => { e.preventDefault(); add(s); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-primary-50 hover:text-primary-700 transition-colors cursor-pointer">
                {s}
              </button>
            ))}
            {showAddCustom && (
              <button type="button" onMouseDown={(e) => { e.preventDefault(); add(input); }}
                className="w-full text-left px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 border-t border-gray-100 cursor-pointer">
                + Agregar «{input.trim()}»
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Autocomplete single-value field ──────────────────────────────────────────

function AutocompleteField({
  label, fieldKey, value, suggestions, icon: Icon, placeholder, isEditing,
  onStartEdit, onChange, onConfirm, onCancel, onSelect,
}: {
  label: string; fieldKey: string; value: string; suggestions: string[];
  icon?: React.ElementType; placeholder?: string;
  isEditing: boolean; onStartEdit: () => void;
  onChange: (v: string) => void; onConfirm: () => void; onCancel: () => void;
  onSelect: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { if (isEditing) { inputRef.current?.focus(); setOpen(true); } }, [isEditing]);

  const filtered = suggestions
    .filter((s) => value.length === 0 || s.toLowerCase().includes(value.toLowerCase()))
    .slice(0, value.length > 0 ? 30 : 8);

  return (
    <div className="group flex items-start gap-3 py-3 border-b border-gray-50 last:border-0" ref={containerRef}>
      <div className="w-24 sm:w-36 flex-shrink-0 flex items-center gap-1.5 pt-0.5">
        {Icon && <Icon size={13} className="text-gray-400 flex-shrink-0" />}
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="relative flex items-start gap-2">
            <div className="flex-1 relative">
              <input
                ref={inputRef} value={value}
                onChange={(e) => { onChange(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { setOpen(false); onConfirm(); }
                  if (e.key === 'Escape') { setOpen(false); onCancel(); }
                }}
                placeholder={placeholder}
                className="w-full text-sm border border-primary-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              {open && filtered.length > 0 && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                  {filtered.map((s) => (
                    <button key={s} type="button"
                      onMouseDown={(e) => { e.preventDefault(); setOpen(false); onSelect(s); }}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-primary-50 hover:text-primary-700 transition-colors cursor-pointer">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={() => { setOpen(false); onConfirm(); }} className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 flex-shrink-0 cursor-pointer"><Check size={14} /></button>
            <button onClick={() => { setOpen(false); onCancel(); }} className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 flex-shrink-0 cursor-pointer"><X size={14} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 min-h-[28px]">
            <span className="text-sm text-gray-800">{value || <span className="text-gray-300 italic">Sin completar</span>}</span>
            <button onClick={onStartEdit} className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-opacity flex-shrink-0 cursor-pointer">
              <Pencil size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Badge selector ───────────────────────────────────────────────────────────

function BadgeSelector({ selected, onChange }: { selected: string[]; onChange: (b: string[]) => void }) {
  const toggle = (key: string) =>
    onChange(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);

  return (
    <div className="py-3 border-b border-gray-50">
      <div className="flex items-center gap-1.5 mb-2">
        <Star size={13} className="text-gray-400" />
        <span className="text-xs font-medium text-gray-500">Medallas de especialidad</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(BADGES).map(([key, b]) => {
          const Icon = b.icon;
          const active = selected.includes(key);
          return (
            <Tip key={key} text={b.desc}>
              <button
                onClick={() => toggle(key)}
                className={`w-full flex items-center gap-2 text-xs px-3 py-2 rounded-xl border transition-all ${
                  active ? `${b.bg} ${b.color} border-current font-medium` : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                <Icon size={13} className="flex-shrink-0" />
                <span className="text-left leading-tight">{b.label}</span>
              </button>
            </Tip>
          );
        })}
      </div>
    </div>
  );
}

// ─── Payment methods selector ─────────────────────────────────────────────────

function PaymentSelector({ selected, onChange }: { selected: string[]; onChange: (m: string[]) => void }) {
  const toggle = (m: string) =>
    onChange(selected.includes(m) ? selected.filter((x) => x !== m) : [...selected, m]);

  return (
    <div className="py-3 border-b border-gray-50">
      <div className="flex items-center gap-1.5 mb-2">
        <Wallet size={13} className="text-gray-400" />
        <span className="text-xs font-medium text-gray-500">Métodos de pago preferidos</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {PAYMENT_OPTIONS.map((m) => {
          const active = selected.includes(m);
          return (
            <button
              key={m}
              onClick={() => toggle(m)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                active ? 'bg-green-50 text-green-700 border-green-300 font-medium' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
              }`}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Verification section ─────────────────────────────────────────────────────

const DOC_TYPES_DEV = ['DNI', 'Pasaporte', 'Carné de extranjería'];

function VerificationStatusBadge({ status, notes }: { status: VerificationStatus; notes?: string }) {
  if (status === 'APPROVED') return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-xl">
      <BadgeCheck size={16} className="text-green-600 shrink-0" />
      <span className="text-sm font-semibold text-green-700">Verificado</span>
    </div>
  );
  if (status === 'PENDING') return (
    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl">
      <ClipboardList size={16} className="text-blue-600 shrink-0" />
      <span className="text-sm font-medium text-blue-700">Solicitud en revisión — el equipo la procesará en 24-48 h</span>
    </div>
  );
  if (status === 'REJECTED') return (
    <div className="flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
      <BadgeX size={16} className="text-red-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-red-700">Solicitud rechazada</p>
        {notes && <p className="text-xs text-red-600 mt-0.5">Motivo: {notes}</p>}
        <p className="text-xs text-red-500 mt-0.5">Puedes enviar una nueva solicitud con documentación actualizada.</p>
      </div>
    </div>
  );
  return null;
}

function DeveloperVerificationSection({ user }: { user: User }) {
  const dev = user.developer!;
  const status = dev.verificationStatus ?? 'NONE';
  const [docType, setDocType] = useState(DOC_TYPES_DEV[0]);
  const [docUrl, setDocUrl] = useState('');
  const { upload, uploading, error: uploadError } = useUploadDocument();
  const submit = useSubmitDeveloperVerification();
  const fileRef = useRef<HTMLInputElement>(null);

  const canSubmit = status === 'NONE' || status === 'REJECTED';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) setDocUrl(url);
  };

  if (status === 'APPROVED') return (
    <div className="py-1">
      <VerificationStatusBadge status="APPROVED" />
    </div>
  );

  return (
    <div className="space-y-3 py-1">
      {status !== 'NONE' && <VerificationStatusBadge status={status} notes={dev.verificationNotes ?? undefined} />}

      {canSubmit && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Sube una foto o escaneo de tu documento de identidad. El equipo lo revisará y activará tu sello de verificación.
          </p>

          {/* Doc type */}
          <div className="flex flex-wrap gap-2">
            {DOC_TYPES_DEV.map((t) => (
              <button key={t} type="button" onClick={() => setDocType(t)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                  docType === t ? 'bg-primary-600 text-white border-primary-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                }`}>
                {t}
              </button>
            ))}
          </div>

          {/* Upload area */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-primary-300 hover:bg-gray-50 transition-colors"
          >
            {docUrl ? (
              <div className="flex items-center justify-center gap-2 text-sm text-green-700">
                <CheckCircle size={15} />
                <span>Archivo cargado</span>
                <a href={docUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                  className="text-primary-600 hover:underline flex items-center gap-0.5 cursor-pointer">
                  <ExternalLink size={11} />Ver
                </a>
              </div>
            ) : (
              <>
                <Upload size={22} className="mx-auto text-gray-300 mb-1.5" />
                <p className="text-sm text-gray-600 font-medium">Subir documento</p>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG o PDF · máx. 10 MB</p>
              </>
            )}
            {uploading && <p className="text-xs text-primary-600 mt-1">Subiendo…</p>}
            {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
          </div>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFile} />

          <button
            onClick={() => submit.mutate({ docUrl, docType })}
            disabled={!docUrl || submit.isPending}
            className="w-full py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {submit.isPending ? 'Enviando…' : 'Solicitar verificación'}
          </button>
        </div>
      )}
    </div>
  );
}

function CompanyVerificationSection({ user }: { user: User }) {
  const company = user.company!;
  const status = company.verificationStatus ?? 'NONE';
  const [ruc, setRuc] = useState(company.ruc ?? '');
  const [rucInfo, setRucInfo] = useState<{ valid: boolean; razonSocial?: string; estado?: string } | null>(null);
  const [docUrl, setDocUrl] = useState('');
  const { upload, uploading, error: uploadError } = useUploadDocument();
  const validateRuc = useValidateRuc();
  const submit = useSubmitCompanyVerification();
  const fileRef = useRef<HTMLInputElement>(null);

  const canSubmit = status === 'NONE' || status === 'REJECTED';

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) setDocUrl(url);
  };

  const handleValidate = async () => {
    const result = await validateRuc.mutateAsync(ruc);
    setRucInfo(result);
  };

  if (status === 'APPROVED') return (
    <div className="py-1">
      <VerificationStatusBadge status="APPROVED" />
    </div>
  );

  return (
    <div className="space-y-3 py-1">
      {status !== 'NONE' && <VerificationStatusBadge status={status} notes={company.verificationNotes ?? undefined} />}

      {canSubmit && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Puedes verificar tu empresa por RUC (consulta automática a SUNAT) y/o subiendo documentos. El equipo revisará y activará tu sello.
          </p>

          {/* RUC */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Verificación por RUC</p>
            <div className="flex gap-2">
              <input
                value={ruc}
                onChange={(e) => { setRuc(e.target.value); setRucInfo(null); }}
                placeholder="20XXXXXXXXX"
                maxLength={11}
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <button
                onClick={handleValidate}
                disabled={ruc.length !== 11 || validateRuc.isPending}
                className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {validateRuc.isPending ? 'Consultando…' : 'Validar'}
              </button>
            </div>
            {rucInfo && (
              <div className={`mt-2 px-3 py-2 rounded-lg text-xs ${rucInfo.valid ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                {rucInfo.valid ? (
                  <>
                    <p className="font-semibold">{rucInfo.razonSocial}</p>
                    {rucInfo.estado && <p className="mt-0.5">Estado: {rucInfo.estado}</p>}
                  </>
                ) : (
                  <p>RUC no encontrado en SUNAT. Verifica el número e intenta de nuevo.</p>
                )}
              </div>
            )}
          </div>

          {/* Optional doc upload */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Documento adicional (opcional)</p>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary-300 hover:bg-gray-50 transition-colors"
            >
              {docUrl ? (
                <div className="flex items-center justify-center gap-2 text-sm text-green-700">
                  <CheckCircle size={15} />
                  <span>Archivo cargado</span>
                  <a href={docUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="text-primary-600 hover:underline flex items-center gap-0.5 cursor-pointer">
                    <ExternalLink size={11} />Ver
                  </a>
                </div>
              ) : (
                <>
                  <Upload size={20} className="mx-auto text-gray-300 mb-1" />
                  <p className="text-xs text-gray-500">Ficha RUC, Vigencia de Poder, etc. · JPG/PNG/PDF · 10 MB</p>
                </>
              )}
              {uploading && <p className="text-xs text-primary-600 mt-1">Subiendo…</p>}
              {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFile} />
          </div>

          <button
            onClick={() => submit.mutate({ ruc: ruc.length === 11 ? ruc : undefined, docUrl: docUrl || undefined })}
            disabled={(!ruc || ruc.length !== 11) && !docUrl || submit.isPending}
            className="w-full py-2.5 text-sm font-semibold bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-60 transition-colors cursor-pointer"
          >
            {submit.isPending ? 'Enviando…' : 'Solicitar verificación'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{title}</h3>
      {children}
    </div>
  );
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

function buildDevData(user: User | undefined, pending: Record<string, unknown>) {
  const d = user?.developer;
  return {
    name:            (pending.name           as string  ?? d?.name            ?? ''),
    bio:             (pending.bio            as string  ?? d?.bio             ?? ''),
    avatarUrl:       (pending.avatarUrl      as string  ?? d?.avatarUrl       ?? ''),
    location:        (pending.location       as string  ?? d?.location        ?? ''),
    university:      (pending.university     as string  ?? d?.university      ?? ''),
    cycle:           (pending.cycle          as string  ?? d?.cycle           ?? ''),
    hourlyRate:      (pending.hourlyRate     as string  ?? (d?.hourlyRate != null ? String(d.hourlyRate) : '')),
    warrantyDays:    (pending.warrantyDays   as string  ?? (d?.warrantyDays   != null ? String(d.warrantyDays) : '')),
    portfolioUrl:    (pending.portfolioUrl   as string  ?? d?.portfolioUrl    ?? ''),
    githubUrl:       (pending.githubUrl      as string  ?? d?.githubUrl       ?? ''),
    linkedinUrl:     (pending.linkedinUrl    as string  ?? d?.linkedinUrl     ?? ''),
    ruc:             (pending.ruc            as string  ?? d?.ruc             ?? ''),
    available:       (pending.available      as boolean ?? d?.available       ?? true),
    skills:          (pending.skills         as string[] ?? d?.skills         ?? []),
    specialtyBadges: (pending.specialtyBadges as string[] ?? d?.specialtyBadges ?? []),
    rating:           d?.rating       ?? 0,
    reviewCount:      d?.reviewCount  ?? 0,
    trustPoints:      d?.trustPoints  ?? 0,
    verified:         d?.verified     ?? false,
  };
}

function buildCompanyData(user: User | undefined, pending: Record<string, unknown>) {
  const c = user?.company;
  return {
    name:            (pending.name            as string   ?? c?.name            ?? ''),
    description:     (pending.description     as string   ?? c?.description     ?? ''),
    industry:        (pending.industry        as string   ?? c?.industry        ?? ''),
    size:            (pending.size            as string   ?? c?.size            ?? ''),
    website:         (pending.website         as string   ?? c?.website         ?? ''),
    logoUrl:         (pending.logoUrl         as string   ?? c?.logoUrl         ?? ''),
    location:        (pending.location        as string   ?? c?.location        ?? ''),
    ruc:             (pending.ruc             as string   ?? c?.ruc             ?? ''),
    contactPerson:   (pending.contactPerson   as string   ?? c?.contactPerson   ?? ''),
    painDescription: (pending.painDescription as string   ?? c?.painDescription ?? ''),
    paymentMethods:  (pending.paymentMethods  as string[] ?? c?.paymentMethods  ?? []),
    verified:         c?.verified     ?? false,
    clientRating:     c?.clientRating ?? 0,
    clientReviewCount: c?.clientReviewCount ?? 0,
  };
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user: authUser } = useAuthStore();
  const isCompany = authUser?.role === 'COMPANY';

  const { data: user, isLoading } = useMe();

  // Pending changes (what the user has edited but not yet saved)
  const [pending, setPending] = useState<Record<string, unknown>>({});
  const hasPending = Object.keys(pending).length > 0;

  // Editing state: which fields are currently in edit mode
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  // Draft values while a field is in edit mode (before confirming)
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const mutation = useUpdateProfile(isCompany);
  const onMutationSuccess = () => { setPending({}); };
  const onMutationError = () => { /* toast handled in hook */ };

  const save = () => {
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(pending)) {
      if (typeof v === 'string') payload[k] = v === '' ? undefined : v;
      else payload[k] = v;
    }
    if (!isCompany && 'hourlyRate' in payload && payload.hourlyRate !== undefined)
      payload.hourlyRate = Number(payload.hourlyRate);
    if (!isCompany && 'warrantyDays' in payload && payload.warrantyDays !== undefined)
      payload.warrantyDays = Number(payload.warrantyDays);
    mutation.mutate(payload, { onSuccess: onMutationSuccess, onError: onMutationError });
  };

  // Helpers to start/confirm/cancel editing a text field
  const startEdit = (key: string, current: string) => {
    setDrafts((d) => ({ ...d, [key]: current }));
    setEditing((e) => ({ ...e, [key]: true }));
  };
  const confirmEdit = (key: string) => {
    setPending((p) => ({ ...p, [key]: drafts[key] ?? '' }));
    setEditing((e) => ({ ...e, [key]: false }));
  };
  const cancelEdit = (key: string, original: string) => {
    setDrafts((d) => ({ ...d, [key]: original }));
    setEditing((e) => ({ ...e, [key]: false }));
  };

  // Helpers for array / boolean fields (applied immediately to pending)
  const setPendingArray = (key: string, val: string[]) => setPending((p) => ({ ...p, [key]: val }));
  const setPendingBool  = (key: string, val: boolean) => setPending((p) => ({ ...p, [key]: val }));

  // Select a suggestion value directly — avoids drafts race condition
  const selectField = (key: string, val: string) => {
    setPending((p) => ({ ...p, [key]: val }));
    setDrafts((d) => ({ ...d, [key]: val }));
    setEditing((e) => ({ ...e, [key]: false }));
  };

  // Live preview data
  const devData     = buildDevData(user, pending);
  const companyData = buildCompanyData(user, pending);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Field shorthand for text/url/number fields ─────────────────────────────
  const F = (key: string, label: string, opts: { type?: FieldType; placeholder?: string; icon?: React.ElementType }) => {
    const current = isCompany
      ? (companyData as Record<string, unknown>)[key] as string ?? ''
      : (devData     as Record<string, unknown>)[key] as string ?? '';
    return (
      <EditableField
        key={key} fieldKey={key} label={label} type={opts.type} placeholder={opts.placeholder} icon={opts.icon}
        value={editing[key] ? (drafts[key] ?? current) : current}
        isEditing={!!editing[key]}
        onStartEdit={() => startEdit(key, current)}
        onChange={(v) => setDrafts((d) => ({ ...d, [key]: v }))}
        onConfirm={() => confirmEdit(key)}
        onCancel={() => cancelEdit(key, current)}
      />
    );
  };

  const handleAvatarConfirm = (url: string) => {
    setPending((p) => ({ ...p, avatarUrl: url }));
  };

  return (
    <div className="max-w-5xl">
      {showAvatarPicker && (
        <AvatarPicker
          current={(pending.avatarUrl as string | undefined) ?? user?.developer?.avatarUrl ?? ''}
          name={devData.name}
          onConfirm={handleAvatarConfirm}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mi perfil</h1>
          <p className="text-sm text-gray-500 mt-1">Toca un campo para editarlo.</p>
        </div>
        {hasPending && (
          <button
            onClick={save}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-60 shadow-sm whitespace-nowrap cursor-pointer"
          >
            <Check size={14} />
            {mutation.isPending ? 'Guardando…' : `Guardar ${Object.keys(pending).length} cambio${Object.keys(pending).length !== 1 ? 's' : ''}`}
          </button>
        )}
      </div>


      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── LEFT: Preview card ── */}
        <div className="w-full lg:w-72 lg:sticky lg:top-6 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Vista previa</p>
          {isCompany
            ? <CompanyCard c={companyData} email={user?.email ?? ''} />
            : <DevCard d={devData} />}
          <div className="mt-3 bg-gray-50 rounded-xl p-3 text-xs text-gray-400">
            <p className="font-medium text-gray-500 mb-1">Identidad</p>
            <p className="truncate">{user?.email}</p>
            <span className={`mt-1.5 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
              authUser?.role === 'COMPANY' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
            }`}>{authUser?.role}</span>
          </div>
        </div>

        {/* ── RIGHT: Editable sections ── */}
        <div className="flex-1 min-w-0">
          {isCompany ? (
            <>
              <Section title="Presentación">
                {F('name',        'Nombre',       { icon: Building2 })}
                {F('description', 'Descripción',  { type: 'textarea', icon: AlertCircle })}
                {F('logoUrl',     'Logo URL',     { type: 'url', placeholder: 'https://…', icon: Globe })}
                {F('website',     'Sitio web',    { type: 'url', placeholder: 'https://…', icon: Globe })}
              </Section>

              <Section title="Negocio">
                <AutocompleteField
                  label="Rubro" fieldKey="industry"
                  value={editing['industry'] ? (drafts['industry'] ?? companyData.industry) : companyData.industry}
                  suggestions={COMPANY_INDUSTRIES} placeholder="Seleccionar o escribir rubro…"
                  isEditing={!!editing['industry']}
                  onStartEdit={() => startEdit('industry', companyData.industry)}
                  onChange={(v) => setDrafts((d) => ({ ...d, industry: v }))}
                  onConfirm={() => confirmEdit('industry')}
                  onCancel={() => cancelEdit('industry', companyData.industry)}
                  onSelect={(v) => selectField('industry', v)}
                />
                {F('size',          'Tamaño',         { placeholder: 'Ej: 10-50 empleados' })}
                <AutocompleteField
                  label="Ubicación" fieldKey="location" icon={MapPin}
                  value={editing['location'] ? (drafts['location'] ?? companyData.location) : companyData.location}
                  suggestions={PERU_LOCATIONS} placeholder="Ciudad o distrito…"
                  isEditing={!!editing['location']}
                  onStartEdit={() => startEdit('location', companyData.location)}
                  onChange={(v) => setDrafts((d) => ({ ...d, location: v }))}
                  onConfirm={() => confirmEdit('location')}
                  onCancel={() => cancelEdit('location', companyData.location)}
                  onSelect={(v) => selectField('location', v)}
                />
                {F('contactPerson', 'Persona de contacto', { icon: Phone })}
                {F('ruc',          'RUC del negocio',  { placeholder: '20XXXXXXXXX' })}
              </Section>

              <Section title="¿Cuál es tu dolor?">
                {F('painDescription', 'Descripción', {
                  type: 'textarea', icon: AlertCircle,
                  placeholder: 'Ej: Tengo desorden en mi stock, necesito un sistema de ventas…',
                })}
              </Section>

              <Section title="Métodos de pago">
                <PaymentSelector
                  selected={(pending.paymentMethods as string[] | undefined) ?? user?.company?.paymentMethods ?? []}
                  onChange={(m) => setPendingArray('paymentMethods', m)}
                />
              </Section>

              <Section title="Verificación">
                {user && <CompanyVerificationSection user={user} />}
              </Section>
            </>
          ) : (
            <>
              <Section title="Presentación">
                {/* Avatar visual picker */}
                <div className="flex items-center gap-4 py-3 border-b border-gray-50">
                  <div className="w-24 sm:w-36 flex-shrink-0 flex items-center gap-1.5">
                    <Camera size={13} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-500">Foto de perfil</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {devData.avatarUrl?.startsWith('gradient:') ? (
                      (() => {
                        const [, from, to] = devData.avatarUrl.split(':');
                        return (
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center text-white font-bold text-sm border border-gray-200`}>
                            {devData.name?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                        );
                      })()
                    ) : (
                      <img
                        src={devData.avatarUrl || defaultAvatar(devData.name)}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 bg-gray-100"
                      />
                    )}
                    <button
                      onClick={() => setShowAvatarPicker(true)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors font-medium cursor-pointer"
                    >
                      Cambiar foto
                    </button>
                  </div>
                </div>
                {F('name',      'Nombre',     {})}
                {F('bio',       'Bio',         { type: 'textarea' })}
                <AutocompleteField
                  label="Ubicación" fieldKey="location" icon={MapPin}
                  value={editing['location'] ? (drafts['location'] ?? devData.location) : devData.location}
                  suggestions={PERU_LOCATIONS} placeholder="Ciudad o distrito…"
                  isEditing={!!editing['location']}
                  onStartEdit={() => startEdit('location', devData.location)}
                  onChange={(v) => setDrafts((d) => ({ ...d, location: v }))}
                  onConfirm={() => confirmEdit('location')}
                  onCancel={() => cancelEdit('location', devData.location)}
                  onSelect={(v) => selectField('location', v)}
                />
                <ToggleField
                  label="Disponible para proyectos"
                  value={(pending.available as boolean | undefined) ?? user?.developer?.available ?? true}
                  onChange={(v) => setPendingBool('available', v)}
                />
              </Section>

              <Section title="Información académica">
                <AutocompleteField
                  label="Universidad / Instituto" fieldKey="university" icon={GraduationCap}
                  value={editing['university'] ? (drafts['university'] ?? devData.university) : devData.university}
                  suggestions={PERU_UNIVERSITIES} placeholder="Buscar universidad o instituto…"
                  isEditing={!!editing['university']}
                  onStartEdit={() => startEdit('university', devData.university)}
                  onChange={(v) => setDrafts((d) => ({ ...d, university: v }))}
                  onConfirm={() => confirmEdit('university')}
                  onCancel={() => cancelEdit('university', devData.university)}
                  onSelect={(v) => selectField('university', v)}
                />
                <AutocompleteField
                  label="Ciclo actual" fieldKey="cycle" icon={Clock}
                  value={editing['cycle'] ? (drafts['cycle'] ?? devData.cycle) : devData.cycle}
                  suggestions={CYCLES} placeholder="Seleccionar o escribir ciclo…"
                  isEditing={!!editing['cycle']}
                  onStartEdit={() => startEdit('cycle', devData.cycle)}
                  onChange={(v) => setDrafts((d) => ({ ...d, cycle: v }))}
                  onConfirm={() => confirmEdit('cycle')}
                  onCancel={() => cancelEdit('cycle', devData.cycle)}
                  onSelect={(v) => selectField('cycle', v)}
                />
              </Section>

              <Section title="Profesional">
                <AutocompleteTagInput
                  label="Stack tecnológico"
                  icon={Code}
                  tags={(pending.skills as string[] | undefined) ?? user?.developer?.skills ?? []}
                  onChange={(s) => setPendingArray('skills', s)}
                  suggestions={TECH_SUGGESTIONS}
                  placeholder="Buscar tecnología o escribir…"
                />
                {F('hourlyRate',   'Tarifa/hora (USD)', { type: 'number', icon: DollarSign, placeholder: 'Ej: 50' })}
                {F('warrantyDays', 'Días de garantía',  { type: 'number', icon: Shield,     placeholder: 'Ej: 15' })}
              </Section>

              <Section title="Medallas de especialidad">
                <BadgeSelector
                  selected={(pending.specialtyBadges as string[] | undefined) ?? user?.developer?.specialtyBadges ?? []}
                  onChange={(b) => setPendingArray('specialtyBadges', b)}
                />
              </Section>

              <Section title="Links">
                {F('portfolioUrl', 'Portfolio', { type: 'url', icon: Globe,    placeholder: 'https://…' })}
                {F('githubUrl',    'GitHub',    { type: 'url', icon: Github,   placeholder: 'https://github.com/…' })}
                {F('linkedinUrl',  'LinkedIn',  { type: 'url', icon: Linkedin, placeholder: 'https://linkedin.com/in/…' })}
              </Section>

              <Section title="Facturación">
                {F('ruc', 'RUC (Cuarta Categoría)', { placeholder: '10XXXXXXXXX' })}
              </Section>

              <Section title="Verificación de identidad">
                {user && <DeveloperVerificationSection user={user} />}
              </Section>
            </>
          )}

          {hasPending && (
            <div className="sticky bottom-4 mt-2">
              <button
                onClick={save}
                disabled={mutation.isPending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 disabled:opacity-60 shadow-lg text-sm cursor-pointer"
              >
                <Check size={15} />
                {mutation.isPending ? 'Guardando…' : `Guardar ${Object.keys(pending).length} cambio${Object.keys(pending).length !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
