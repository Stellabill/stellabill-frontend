import React, { useEffect, useRef, useState } from 'react';
import { useBrandPackUploadState } from './useBrandPackUploadState';
import LogoUsageSection from './LogoUsageSection';
import ColorSection from './ColorSection';
import TypographySection from './TypographySection';
import { usePageTitle } from '../hooks/usePageTitle';
import Icon from '../components/Branding/Icon';
import { EmptyDashboard, NoTransactions } from '../components/Branding/Illustrations';

const BrandPack: React.FC = () => {
  usePageTitle('Brand Pack');
  const icons = ['Users', 'TrendingUp', 'Activity', 'Shield', 'Settings', 'Zap'] as const;
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadState, previewUrl, selectedFile, imageMeta, cropFrame, errorMessage, resetUploader, handleChange, handleDrop, handleCropKeyDown } = useBrandPackUploadState(inputRef);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);


  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 p-8 md:p-12 font-sans">
      <div className="mx-auto max-w-6xl space-y-16">
        <section className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-white">Stellabill Brand Pack</h1>
          <p className="max-w-2xl text-lg text-slate-400">
            A comprehensive set of visual guidelines and reusable components to ensure consistency across the Stellabill ecosystem.
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-slate-950/50 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Merchant brand asset uploader</p>
              <h2 className="text-3xl font-semibold text-white">Upload, crop, and preview logos across every touchpoint</h2>
              <p className="text-sm leading-7 text-slate-400">
                The uploader supports drag and drop, browse, a crop stage with safe-area overlay, and per-usage preview tiles for header, receipt, and social share surfaces. It validates transparent PNG and SVG assets, and it keeps the experience accessible for keyboard and screen-reader users.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-400">
              <p className="font-medium text-slate-200">Requirements</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-400">
                <li>• Transparent PNG or SVG only</li>
                <li>• Minimum 512x512 pixels</li>
                <li>• Keyboard-friendly crop handles</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div
              className={`rounded-3xl border p-5 transition-all ${dragActive ? 'border-cyan-400 bg-cyan-400/10' : 'border-slate-800 bg-slate-950/70'}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/svg+xml"
                className="sr-only"
                onChange={handleChange}
                data-testid="brandpack-file-input"
              />

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-200">Drop a logo here</p>
                  <p className="text-sm text-slate-400">Browse your device or drag an asset into the drop zone.</p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
                  onClick={() => inputRef.current?.click()}
                >
                  Browse files
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-900/80 p-6 text-center text-slate-400">
                <p className="text-sm">Transparent PNG or SVG</p>
                <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">Safe-area overlay • crop guide • keyboard support</p>
              </div>

              {uploadState === 'processing' && (
                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
                  Validating the asset and preparing the crop view…
                </div>
              )}

              {uploadState === 'error' && errorMessage && (
                <div className="mt-5 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200" role="alert">
                  {errorMessage}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
              <p className="text-sm font-medium text-slate-200">Usage notes</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>• Prefer generous clear space around the mark for header and receipt layouts.</li>
                <li>• Keep the icon centered for social share thumbnails and avatars.</li>
                <li>• Use the preview tiles to verify legibility on both dark and light surfaces.</li>
              </ul>
              <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Preview tiles</p>
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                    <p className="text-sm font-medium text-slate-200">Header</p>
                    <p className="text-xs text-slate-500">Wide layouts need balanced spacing.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                    <p className="text-sm font-medium text-slate-200">Receipt</p>
                    <p className="text-xs text-slate-500">Favor a compact, centered composition.</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                    <p className="text-sm font-medium text-slate-200">Social share</p>
                    <p className="text-xs text-slate-500">Keep the mark readable in a square crop.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {uploadState === 'ready' && selectedFile && imageMeta && (
            <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/75 p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">Crop stage</p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Crop your logo</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Align the mark inside the safe-area overlay and use the keyboard to nudge the crop handles.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
                  onClick={resetUploader}
                >
                  Start over
                </button>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_50%),linear-gradient(135deg,#020617,#0f172a)]">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Uploaded brand asset"
                        className="absolute inset-0 h-full w-full object-contain"
                      />
                    )}
                    <div className="absolute inset-0 bg-slate-950/20" />
                    <div className="absolute inset-0 rounded-2xl border border-white/10" />
                    <div
                      className="absolute rounded-[1.75rem] border-2 border-cyan-300/90 shadow-[0_0_0_9999px_rgba(2,6,23,0.72)]"
                      style={{ left: `${cropFrame.x}%`, top: `${cropFrame.y}%`, width: `${cropFrame.width}%`, height: `${cropFrame.height}%` }}
                    >
                      <div className="absolute -left-2 -top-2 h-4 w-4 rounded-full border-2 border-cyan-300 bg-slate-950" />
                      <div className="absolute -right-2 -top-2 h-4 w-4 rounded-full border-2 border-cyan-300 bg-slate-950" />
                      <div className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full border-2 border-cyan-300 bg-slate-950" />
                      <div className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full border-2 border-cyan-300 bg-slate-950" />
                    </div>
                    <div className="pointer-events-none absolute inset-x-[12%] top-[18%] h-[64%] rounded-[2rem] border border-dashed border-cyan-400/50" />
                    <div className="pointer-events-none absolute inset-x-[10%] top-[16%] h-[68%] rounded-[2rem] border border-white/10" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(['tl', 'tr', 'bl', 'br'] as const).map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        className="rounded-full border border-slate-700 bg-slate-900/90 px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-300"
                        aria-label={`Adjust ${handle} crop handle`}
                        onKeyDown={(event) => handleCropKeyDown(event, handle)}
                      >
                        {handle}
                      </button>
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-slate-400">Safe-area overlay keeps the logo readable while preserving a clear frame for the mark.</p>
                </div>

                <div className="space-y-4">
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-sm font-medium text-slate-200">Asset details</p>
                    <dl className="mt-3 space-y-3 text-sm text-slate-400">
                      <div className="flex items-center justify-between">
                        <dt>File</dt>
                        <dd className="font-medium text-slate-200">{selectedFile?.name}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Size</dt>
                        <dd className="font-medium text-slate-200">{imageMeta.width}×{imageMeta.height}</dd>
                      </div>
                      <div className="flex items-center justify-between">
                        <dt>Format</dt>
                        <dd className="font-medium text-slate-200">{imageMeta.type.toUpperCase()}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-sm font-medium text-slate-200">Preview tiles</p>
                    <div className="mt-4 grid gap-3">
                      {[
                        { label: 'Header', className: 'rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-slate-300', tone: 'wide' },
                        { label: 'Receipt', className: 'rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-slate-300', tone: 'stacked' },
                        { label: 'Social share', className: 'rounded-2xl border border-slate-700 bg-slate-950/80 p-3 text-sm text-slate-300', tone: 'square' },
                      ].map((tile) => (
                        <div key={tile.label} className={tile.className}>
                          <div className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-500">{tile.label}</div>
                          <div className="relative h-20 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                            {previewUrl && (
                              <div
                                className="absolute inset-0"
                                style={{
                                  backgroundImage: `url(${previewUrl})`,
                                  backgroundSize: 'contain',
                                  backgroundPosition: `${cropFrame.x + cropFrame.width / 2}% ${cropFrame.y + cropFrame.height / 2}%`,
                                  backgroundRepeat: 'no-repeat',
                                  backgroundColor: '#020617',
                                }}
                              />
                            )}
                            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <LogoUsageSection />

        <ColorSection />

        <TypographySection />

        <section className="space-y-8">
          <h2 className="border-b border-slate-800 pb-2 text-2xl font-semibold">Iconography</h2>
          <div className="flex flex-wrap gap-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-10">
            {icons.map((icon) => (
              <div key={icon} className="flex flex-col items-center gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-cyan-400 transition-all hover:border-cyan-500/50">
                  <Icon name={icon} size={28} />
                </div>
                <span className="text-xs font-mono text-slate-500">{icon}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <h2 className="border-b border-slate-800 pb-2 text-2xl font-semibold">Illustration Style</h2>
          <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
            <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-800 bg-slate-950 p-12 shadow-2xl">
              <EmptyDashboard size={240} />
              <div className="text-center">
                <h4 className="font-semibold text-slate-200">Empty Dashboard Pattern</h4>
                <p className="mt-1 text-xs text-slate-500">Orbital and diamond geometric forms</p>
              </div>
            </div>
            <div className="flex flex-col items-center gap-6 rounded-2xl border border-slate-800 bg-slate-950 p-12 shadow-2xl">
              <NoTransactions size={240} />
              <div className="text-center">
                <h4 className="font-semibold text-slate-200">No Transactions Pattern</h4>
                <p className="mt-1 text-xs text-slate-500">Schematic and technical UI elements</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BrandPack;
