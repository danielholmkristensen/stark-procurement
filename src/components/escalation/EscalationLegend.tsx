export function EscalationLegend() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-xs font-semibold text-stark-navy uppercase tracking-wider mb-4">
        Visual Hierarchy
      </h3>
      <div className="grid grid-cols-5 gap-4 text-xs">
        <div className="text-center">
          <div className="w-3 h-3 rounded-full bg-stark-navy mx-auto mb-2" />
          <div className="text-stark-navy font-medium">Ambient</div>
          <div className="text-gray-400 mt-1">New/unread</div>
        </div>
        <div className="text-center">
          <div className="w-6 h-5 rounded bg-stark-navy text-white text-[10px] flex items-center justify-center mx-auto mb-2">
            3
          </div>
          <div className="text-stark-navy font-medium">Awareness</div>
          <div className="text-gray-400 mt-1">Items pending</div>
        </div>
        <div className="text-center">
          <div className="w-full h-1 border-l-2 border-stark-orange mx-auto mb-2 mt-1" />
          <div className="text-stark-navy font-medium">Attention</div>
          <div className="text-gray-400 mt-1">Needs review</div>
        </div>
        <div className="text-center">
          <div className="px-3 py-1 rounded bg-stark-orange text-white text-[10px] font-medium mx-auto mb-2 inline-block">
            Action
          </div>
          <div className="text-stark-navy font-medium">Action</div>
          <div className="text-gray-400 mt-1">Do this now</div>
        </div>
        <div className="text-center">
          <div className="w-3 h-3 rounded-full bg-stark-orange pulse-urgent mx-auto mb-2" />
          <div className="text-stark-navy font-medium">Urgent</div>
          <div className="text-gray-400 mt-1">Time-critical</div>
        </div>
      </div>
    </div>
  );
}
