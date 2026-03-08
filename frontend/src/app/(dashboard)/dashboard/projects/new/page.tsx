'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@/lib/zod-resolver';
import { useRouter } from 'next/navigation';
import {
  Globe, ShoppingBag, Package, Smartphone, CreditCard,
  Calendar, DollarSign, Clock, Plus, X, Sparkles, Check,
  AlertCircle, Building2,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useCreateProject } from '@/hooks/use-projects';
import { projectSchema, type ProjectFormData } from '@/schemas/project.schema';

// ─── Package catalog ──────────────────────────────────────────────────────────

type Pkg = {
  id: string; name: string; icon: React.ElementType;
  color: string; bg: string; desc: string;
  budget: number; category: string; skills: string[];
  title: string; description: string;
};

const PACKAGES: Pkg[] = [
  {
    id: 'landing',
    name: 'Landing Page',
    icon: Globe,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-200',
    desc: 'Página web de presentación',
    budget: 350,
    category: 'Web',
    skills: ['HTML/CSS', 'JavaScript', 'Diseño UI'],
    title: 'Diseño y desarrollo de landing page profesional',
    description:
      'Necesito una landing page profesional para mi negocio. Debe incluir secciones de presentación de servicios, testimonios de clientes, información de contacto y formulario de consulta. Diseño moderno, responsivo y optimizado para dispositivos móviles.',
  },
  {
    id: 'ecommerce',
    name: 'Tienda Online',
    icon: ShoppingBag,
    color: 'text-purple-600',
    bg: 'bg-purple-50 border-purple-200',
    desc: 'E-commerce con carrito y pagos',
    budget: 1500,
    category: 'E-commerce',
    skills: ['WooCommerce', 'PHP', 'Pasarela de pagos'],
    title: 'Tienda online con carrito de compras y pasarela de pagos',
    description:
      'Desarrollo de tienda online completa con catálogo de productos, carrito de compras, integración con pasarela de pagos local (Culqi o similar), gestión de pedidos y panel administrativo para inventario y ventas.',
  },
  {
    id: 'inventory',
    name: 'Control de Stock',
    icon: Package,
    color: 'text-amber-600',
    bg: 'bg-amber-50 border-amber-200',
    desc: 'Sistema de inventario y ventas',
    budget: 800,
    category: 'Web',
    skills: ['React', 'Node.js', 'PostgreSQL'],
    title: 'Sistema de gestión de inventario y control de stock',
    description:
      'Sistema web para control de inventario con registro de entrada/salida de productos, alertas de stock bajo, reportes de ventas por período y gestión de proveedores. Acceso para múltiples usuarios con roles diferenciados.',
  },
  {
    id: 'pos',
    name: 'Punto de Venta',
    icon: CreditCard,
    color: 'text-green-600',
    bg: 'bg-green-50 border-green-200',
    desc: 'Sistema POS para negocio local',
    budget: 600,
    category: 'Web',
    skills: ['React', 'Node.js'],
    title: 'Sistema de punto de venta (POS) para negocio local',
    description:
      'Sistema de punto de venta para negocio local. Registro rápido de ventas, gestión de productos y precios, cierre de caja diario, emisión de comprobantes de pago e integración con impresora de tickets. Funciona sin internet.',
  },
  {
    id: 'mobile',
    name: 'App Móvil',
    icon: Smartphone,
    color: 'text-cyan-600',
    bg: 'bg-cyan-50 border-cyan-200',
    desc: 'Aplicación Android e iOS',
    budget: 2500,
    category: 'Mobile',
    skills: ['React Native', 'Node.js', 'Firebase'],
    title: 'Aplicación móvil para Android e iOS',
    description:
      'Desarrollo de aplicación móvil para Android e iOS con autenticación de usuarios, notificaciones push y sincronización de datos en tiempo real. Incluye panel administrativo web para gestionar contenido y usuarios.',
  },
  {
    id: 'custom',
    name: 'Otro / Personalizado',
    icon: Sparkles,
    color: 'text-gray-600',
    bg: 'bg-gray-50 border-gray-200',
    desc: 'Cuéntanos tu necesidad',
    budget: 0,
    category: '',
    skills: [],
    title: '',
    description: '',
  },
];

const CATEGORIES = ['Web', 'Mobile', 'E-commerce', 'SaaS', 'API / Backend', 'Data / Analytics', 'Automatización', 'Diseño UI/UX', 'Otro'];

type FormData = ProjectFormData;

// ─── Project preview card ─────────────────────────────────────────────────────

function ProjectPreview({
  title, description, budget, deadline, category, skills, companyName,
}: {
  title: string; description: string; budget: number; deadline: string;
  category: string; skills: string[]; companyName: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-md select-none">
      {/* company header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold flex-shrink-0">
          {companyName.charAt(0).toUpperCase()}
        </div>
        <span className="text-xs text-gray-500 truncate">{companyName}</span>
      </div>

      {/* category + status */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {category && (
          <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full">{category}</span>
        )}
        <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium">Abierto</span>
      </div>

      {/* title */}
      <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">
        {title || <span className="text-gray-300 italic font-normal">Título del proyecto…</span>}
      </h3>

      {/* description */}
      <p className="text-xs text-gray-500 line-clamp-3 mb-3 leading-relaxed">
        {description || <span className="text-gray-300 italic">Descripción del proyecto…</span>}
      </p>

      {/* skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {skills.slice(0, 4).map((s) => (
            <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
          ))}
          {skills.length > 4 && <span className="text-xs text-gray-400">+{skills.length - 4}</span>}
        </div>
      )}

      <div className="border-t border-gray-100 pt-3 flex items-center justify-between flex-wrap gap-2">
        <span className="flex items-center gap-1 text-sm font-semibold text-gray-800">
          <DollarSign size={13} className="text-gray-400" />
          {budget > 0 ? `$${budget.toLocaleString()}` : <span className="text-gray-300 font-normal text-xs italic">Sin presupuesto</span>}
        </span>
        {deadline && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar size={11} />
            {new Date(deadline + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewProjectPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const companyName = (user as unknown as { company?: { name?: string } })?.company?.name ?? user?.email ?? 'Tu empresa';

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [selectedPkg, setSelectedPkg] = useState<string | null>(null);
  const [noTech, setNoTech] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<FormData>({ resolver: zodResolver(projectSchema) });

  const watched = watch();

  const applyPackage = (pkg: Pkg) => {
    setSelectedPkg(pkg.id);
    if (pkg.title)       setValue('title', pkg.title,             { shouldValidate: true });
    if (pkg.description) setValue('description', pkg.description, { shouldValidate: true });
    if (pkg.budget > 0)  setValue('budget', pkg.budget,           { shouldValidate: true });
    if (pkg.category)    setValue('category', pkg.category);
    setSkills([...pkg.skills]);
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills((prev) => [...prev, s]);
    setSkillInput('');
  };

  const mutation = useCreateProject();
  const handleCreate = (data: FormData) =>
    mutation.mutateAsync({ ...data, skills: noTech ? [] : skills }).then((res) =>
      router.push(`/dashboard/projects/${res.id}`),
    );

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Publicar proyecto</h1>
        <p className="text-sm text-gray-500 mt-1">
          Elige un paquete como punto de partida o describe tu necesidad libremente.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Package selector + form (comes first on mobile) ── */}
        <div className="flex-1 min-w-0 space-y-5 lg:order-2">

          {/* Package selector */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              ¿Qué necesitas? Elige un paquete y autocompletamos el formulario
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PACKAGES.map((pkg) => {
                const Icon = pkg.icon;
                const active = selectedPkg === pkg.id;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => applyPackage(pkg)}
                    className={`relative flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all ${
                      active
                        ? `${pkg.bg} ${pkg.color} border-current shadow-sm`
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-white'
                    }`}
                  >
                    {active && (
                      <span className="absolute top-2 right-2">
                        <Check size={11} className="text-current" />
                      </span>
                    )}
                    <Icon size={18} className={active ? pkg.color : 'text-gray-400'} />
                    <span className="text-xs font-semibold leading-tight">{pkg.name}</span>
                    <span className="text-xs opacity-70 leading-tight">{pkg.desc}</span>
                    {pkg.budget > 0 && (
                      <span className="text-xs font-bold mt-0.5">desde ${pkg.budget}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Detalle del proyecto</p>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                <input
                  {...register('title')}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                  placeholder="Ej: App móvil para gestión de pedidos"
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción <span className="text-gray-400 font-normal">(mín. 50 caracteres)</span>
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                  placeholder="Describe qué necesitas, funcionalidades clave, cómo lo usarás…"
                />
                {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>}
              </div>

              {/* Budget + Deadline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <DollarSign size={13} className="text-gray-400" /> Presupuesto (USD)
                  </label>
                  <input
                    {...register('budget')}
                    type="number" min="1"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                    placeholder="500"
                  />
                  {errors.budget && <p className="mt-1 text-xs text-red-500">{errors.budget.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                    <Clock size={13} className="text-gray-400" /> Fecha límite
                    <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    {...register('deadline')}
                    type="date"
                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <select
                  {...register('category')}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                >
                  <option value="">Sin categoría específica</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Skills */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Tecnologías requeridas <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setNoTech(!noTech)}
                    className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                      noTech
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {noTech ? '⚠ No sé qué tecnología' : 'No sé qué tecnología'}
                  </button>
                </div>

                {noTech ? (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
                    <p className="text-xs text-amber-700">
                      Los developers verán tu proyecto y te sugerirán la tecnología más adecuada.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
                        placeholder="Ej: React, Node.js, PostgreSQL"
                      />
                      <button
                        type="button" onClick={addSkill}
                        className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        <Plus size={13} /> Agregar
                      </button>
                    </div>
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {skills.map((s) => (
                          <span key={s} className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs px-2.5 py-1 rounded-full">
                            {s}
                            <button type="button" onClick={() => setSkills(skills.filter((x) => x !== s))}>
                              <X size={10} className="hover:text-primary-900" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {mutation.isError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
                <AlertCircle size={14} />
                Error al crear el proyecto. Verificá los campos e intentá de nuevo.
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button" onClick={() => router.back()}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit" disabled={mutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
              >
                {mutation.isPending ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creando...</>
                ) : (
                  <><Building2 size={14} />Publicar proyecto</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── Live preview (comes second on mobile, left on desktop) ── */}
        <div className="w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-6 lg:order-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Vista previa</p>
          <ProjectPreview
            title={watched.title ?? ''}
            description={watched.description ?? ''}
            budget={Number(watched.budget) || 0}
            deadline={watched.deadline ?? ''}
            category={watched.category ?? ''}
            skills={noTech ? [] : skills}
            companyName={companyName}
          />
          <p className="text-xs text-gray-400 mt-2 text-center">Así verán tu proyecto los developers</p>
        </div>
      </div>
    </div>
  );
}
