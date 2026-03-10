'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Upload, X, RefreshCw, Check, ImageIcon } from 'lucide-react';
import { useUploadAvatar } from '@/hooks/use-upload';

// ─── Default avatar presets ───────────────────────────────────────────────────

const GRADIENTS = [
  ['from-violet-500', 'to-purple-700'],
  ['from-blue-500',   'to-cyan-600'],
  ['from-emerald-500','to-teal-700'],
  ['from-rose-500',   'to-pink-700'],
  ['from-amber-500',  'to-orange-600'],
  ['from-slate-600',  'to-gray-800'],
  ['from-sky-500',    'to-indigo-600'],
  ['from-green-500',  'to-lime-600'],
];

// DiceBear styles for generated avatars (public CDN, no API key)
const DICEBEAR_STYLES = [
  { id: 'avataaars',    label: 'Avatar' },
  { id: 'bottts',       label: 'Robot' },
  { id: 'fun-emoji',    label: 'Emoji' },
  { id: 'adventurer',   label: 'Aventurero' },
  { id: 'lorelei',      label: 'Lorelei' },
  { id: 'micah',        label: 'Micah' },
];

function dicebearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface AvatarPickerProps {
  current: string;        // current avatarUrl value
  name: string;           // used for initials + seed
  onConfirm: (url: string) => void;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AvatarPicker({ current, name, onConfirm, onClose }: AvatarPickerProps) {
  const [tab, setTab] = useState<'upload' | 'generate'>('upload');
  const [preview, setPreview] = useState<string>(current);
  const [dragging, setDragging] = useState(false);
  const [seed, setSeed] = useState(name || 'user');
  const [selectedStyle, setSelectedStyle] = useState(DICEBEAR_STYLES[0].id);
  const fileRef = useRef<HTMLInputElement>(null);
  const { upload, uploading, error } = useUploadAvatar();

  const initial = (name || '?').charAt(0).toUpperCase();

  // ── File handling ───────────────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    // Show local preview instantly
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
    // Upload to server
    const url = await upload(file);
    if (url) setPreview(url);
  }, [upload]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // ── Generate handling ───────────────────────────────────────────────────────

  const generatedUrl = dicebearUrl(selectedStyle, seed);

  const handleSelectGenerated = () => setPreview(generatedUrl);

  // ── Gradient avatar ─────────────────────────────────────────────────────────

  const handleSelectGradient = (g: string[]) => {
    // Store a special gradient key that the profile page can render as an SVG
    setPreview(`gradient:${g[0]}:${g[1]}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Cambiar foto de perfil</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center pt-6 pb-4 bg-gray-50">
          <div className="relative">
            {preview && !preview.startsWith('gradient:') ? (
              <img
                src={preview}
                alt="Preview"
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : preview.startsWith('gradient:') ? (
              (() => {
                const [, from, to] = preview.split(':');
                return (
                  <div className={`w-24 h-24 rounded-full bg-linear-to-br ${from} ${to} flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg`}>
                    {initial}
                  </div>
                );
              })()
            ) : (
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-white shadow-lg">
                {initial}
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">Vista previa</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {(['upload', 'generate'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                tab === t ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'upload' ? '📁 Subir archivo' : '✨ Generar avatar'}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-5">
          {tab === 'upload' ? (
            <div className="space-y-3">
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragging ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                }`}
              >
                <ImageIcon size={28} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-700">Arrastra una imagen aquí</p>
                <p className="text-xs text-gray-400 mt-1">o haz clic para seleccionar</p>
                <p className="text-xs text-gray-300 mt-2">JPG, PNG, WEBP · máx. 5 MB</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Style selector */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Estilo</p>
                <div className="flex flex-wrap gap-2">
                  {DICEBEAR_STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedStyle(s.id); setPreview(dicebearUrl(s.id, seed)); }}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                        selectedStyle === s.id
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seed input */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1.5">Semilla (cambia el diseño)</p>
                <div className="flex gap-2">
                  <input
                    value={seed}
                    onChange={(e) => { setSeed(e.target.value); }}
                    className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    placeholder="Tu nombre o cualquier texto"
                  />
                  <button
                    onClick={() => { setSeed(Math.random().toString(36).slice(2, 8)); }}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 cursor-pointer"
                    title="Aleatoria"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {/* Preview grid */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Variaciones rápidas</p>
                <div className="grid grid-cols-4 gap-2">
                  {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((suffix) => {
                    const s = seed + suffix;
                    const url = dicebearUrl(selectedStyle, s);
                    return (
                      <button
                        key={suffix}
                        onClick={() => { setSeed(s); setPreview(url); }}
                        className={`rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                          preview === url ? 'border-primary-500 shadow-sm' : 'border-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-14 object-cover" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Gradient initials */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Inicial con color</p>
                <div className="flex flex-wrap gap-2">
                  {GRADIENTS.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectGradient(g)}
                      className={`w-10 h-10 rounded-full bg-linear-to-br ${g[0]} ${g[1]} flex items-center justify-center text-white font-bold text-sm border-2 transition-all cursor-pointer ${
                        preview === `gradient:${g[0]}:${g[1]}` ? 'border-primary-500 scale-110 shadow' : 'border-transparent hover:scale-105'
                      }`}
                    >
                      {initial}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSelectGenerated}
                className="w-full text-xs text-primary-600 hover:underline text-center cursor-pointer"
              >
                Aplicar avatar generado actual al preview ↑
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onConfirm(preview); onClose(); }}
            disabled={uploading || !preview}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Check size={15} /> Usar esta foto
          </button>
        </div>
      </div>
    </div>
  );
}
