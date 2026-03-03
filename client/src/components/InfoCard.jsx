import React from 'react';

const InfoCard = ({ icon, title, value, action, className = "" }) => {
  return (
    <div className={`bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-blue-100 overflow-hidden flex flex-col h-full min-h-[120px] group ${className}`}>
      <div className="p-4 sm:p-5 flex flex-col h-full">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-600 flex-shrink-0">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2">{title}</div>
            <div className="text-sm font-semibold text-gray-900 break-words leading-tight">
              {value}
            </div>
          </div>
        </div>
        {action && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoCard;
