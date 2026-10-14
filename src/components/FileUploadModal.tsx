import React, { useState, useRef } from 'react';
import { parseActivityFile } from '../services/garminParser';
import { Activity } from '../types/activity';
import confetti from 'canvas-confetti';
import { UploadCloud, AlertCircle, X, Watch, Laptop, CheckCircle2 } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivityImported: (activity: Activity) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onActivityImported,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | File[]) => {
    setErrorMsg(null);
    setIsLoading(true);

    let imported = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const activity = await parseActivityFile(file);
        onActivityImported(activity);
        imported++;
      }

      setSuccessCount(imported);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#00F0FF', '#00E676', '#FF2D55', '#FFB800'],
      });

      setTimeout(() => {
        onClose();
        setSuccessCount(0);
        setIsLoading(false);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to process file. Make sure it is a valid Garmin FIT, GPX, or TCX file.');
      setIsLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-dark-surface border border-dark-border rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-dark-card border border-dark-border text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Watch className="w-6 h-6 text-[#00F0FF]" />
            Import Garmin Workout
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Processed 100% locally in your browser. No files are ever sent to any remote server.
          </p>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#00F0FF] bg-[#00F0FF]/10 scale-[1.01]'
              : 'border-dark-border hover:border-slate-500 bg-dark-card/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".fit,.gpx,.tcx,.json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
              }
            }}
          />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-4">
              <div className="w-10 h-10 border-3 border-[#00F0FF] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-slate-200">
                {successCount > 0 ? `Successfully imported ${successCount} activities!` : 'Decoding Garmin data streams...'}
              </p>
            </div>
          ) : successCount > 0 ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-4 text-[#00E676]">
              <CheckCircle2 className="w-12 h-12" />
              <p className="text-base font-bold">Import Successful!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#00F0FF]/10 text-[#00F0FF] flex items-center justify-center mx-auto border border-[#00F0FF]/30">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Drag and drop your Garmin <span className="text-[#00F0FF]">.FIT</span>, <span className="text-[#00E676]">.GPX</span>, or <span className="text-[#FF2D55]">.TCX</span> file
                </p>
                <p className="text-xs text-slate-400 mt-1">or click to browse your computer or mobile files</p>
              </div>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Instructions on where to find Garmin files */}
        <div className="bg-dark-card p-4 rounded-xl border border-dark-border space-y-2.5 text-xs text-slate-300">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Laptop className="w-4 h-4 text-[#00F0FF]" />
            Where to find your Garmin activity files:
          </span>
          <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
            <li>
              <strong className="text-slate-300">Direct from Watch (USB):</strong> Plug watch into PC, navigate to drive <code className="text-[#00F0FF]">GARMIN / ACTIVITY</code> and drag the <code className="text-slate-200">.FIT</code> file.
            </li>
            <li>
              <strong className="text-slate-300">Garmin Connect Web:</strong> Open activity on <span className="text-slate-300">connect.garmin.com</span>, click gear icon (⚙) at top right &rarr; <em>"Export Original (.FIT)"</em> or <em>"Export GPX"</em>.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
