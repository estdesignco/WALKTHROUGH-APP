import React, { useState } from 'react';
import { FileText, Download, X, Check } from 'lucide-react';

const PDFReportGenerator = ({ project, onClose }) => {
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState('full');
  const [includeImages, setIncludeImages] = useState(true);
  const [includePricing, setIncludePricing] = useState(true);
  const [includeStatus, setIncludeStatus] = useState(true);
  const [selectedRooms, setSelectedRooms] = useState(new Set(project?.rooms?.map(r => r.id) || []));
  const [downloadUrl, setDownloadUrl] = useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const BACKEND_URL = window.ENV?.REACT_APP_BACKEND_URL || window.location.origin;
      
      const response = await fetch(`${BACKEND_URL}/api/reports/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          report_type: reportType,
          include_images: includeImages,
          include_pricing: includePricing,
          include_status: includeStatus,
          room_ids: Array.from(selectedRooms)
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setDownloadUrl(url);
        
        // Auto-download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.replace(/\s+/g, '_')}_Report.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report');
    } finally {
      setGenerating(false);
    }
  };

  const toggleRoom = (roomId) => {
    const newSelected = new Set(selectedRooms);
    if (newSelected.has(roomId)) {
      newSelected.delete(roomId);
    } else {
      newSelected.add(roomId);
    }
    setSelectedRooms(newSelected);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl w-full max-w-lg overflow-hidden border border-[#D4A574]/30">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#D4A574]/30 flex justify-between items-center"
             style={{ background: 'linear-gradient(135deg, rgba(212, 165, 116, 0.15) 0%, rgba(180, 155, 126, 0.1) 100%)' }}>
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-[#D4A574]" />
            <h2 className="text-xl font-bold text-[#D4A574]">Generate PDF Report</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Type */}
          <div>
            <label className="text-[#D4A574] text-sm font-medium mb-2 block">Report Type</label>
            <div className="space-y-2">
              {[
                { value: 'full', label: 'Full Project Report', desc: 'All rooms, categories, and items' },
                { value: 'checklist', label: 'Checklist Only', desc: 'Selection checklist with status' },
                { value: 'ffe', label: 'FF&E Schedule', desc: 'Furniture, fixtures, and equipment list' },
                { value: 'budget', label: 'Budget Summary', desc: 'Cost breakdown by room/category' }
              ].map(opt => (
                <label key={opt.value} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 cursor-pointer border border-transparent hover:border-[#B49B7E]/30">
                  <input
                    type="radio"
                    name="reportType"
                    value={opt.value}
                    checked={reportType === opt.value}
                    onChange={(e) => setReportType(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-white font-medium text-sm">{opt.label}</div>
                    <div className="text-gray-400 text-xs">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <label className="text-[#D4A574] text-sm font-medium mb-2 block">Include</label>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'images', label: 'Images', state: includeImages, setter: setIncludeImages },
                { key: 'pricing', label: 'Pricing', state: includePricing, setter: setIncludePricing },
                { key: 'status', label: 'Status', state: includeStatus, setter: setIncludeStatus }
              ].map(opt => (
                <label key={opt.key} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={opt.state}
                    onChange={(e) => opt.setter(e.target.checked)}
                  />
                  <span className="text-white text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Room Selection */}
          <div>
            <label className="text-[#D4A574] text-sm font-medium mb-2 block">
              Rooms ({selectedRooms.size} selected)
            </label>
            <div className="max-h-32 overflow-y-auto space-y-1 bg-slate-800/30 rounded-lg p-2">
              {project?.rooms?.map(room => (
                <label key={room.id} className="flex items-center gap-2 px-2 py-1 hover:bg-slate-700/50 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRooms.has(room.id)}
                    onChange={() => toggleRoom(room.id)}
                  />
                  <span className="text-white text-sm">{room.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || selectedRooms.size === 0}
            className="w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #D4A574 0%, #B49B7E 100%)' }}
          >
            {generating ? (
              <>
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Generate & Download PDF
              </>
            )}
          </button>

          {downloadUrl && (
            <div className="flex items-center gap-2 text-green-400 text-sm justify-center">
              <Check className="w-4 h-4" />
              Report generated successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFReportGenerator;
