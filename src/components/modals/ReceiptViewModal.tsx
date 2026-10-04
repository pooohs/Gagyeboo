import React from 'react';
import { X, Download } from 'lucide-react';

interface ReceiptViewModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ReceiptViewModal: React.FC<ReceiptViewModalProps> = ({
  imageUrl,
  onClose,
}) => {
  if (!imageUrl) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700"
      >
        <div className="p-3 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between text-white">
          <span className="text-xs font-semibold">영수증 원본 사진</span>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download="receipt_image.png"
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
              title="다운로드"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto bg-slate-950">
          <img
            src={imageUrl}
            alt="영수증 원본"
            className="max-h-[70vh] w-auto object-contain rounded-lg"
          />
        </div>
      </div>
    </div>
  );
};
