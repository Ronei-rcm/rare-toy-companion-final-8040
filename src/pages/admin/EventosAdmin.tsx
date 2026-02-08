import React, { useState } from 'react';
import { EventosList } from "@/components/admin/EventosList";
import GoogleCalendarConfig from "@/components/admin/GoogleCalendarConfig";
import ApiConfigPanel from "@/components/admin/ApiConfigPanel";

const EventosAdmin = () => {
  const [activeTab, setActiveTab] = useState('eventos');

  const tabs = [
    { id: 'eventos', label: 'Eventos' },
    { id: 'api-config', label: 'Configuração da API' },
    { id: 'google-calendar', label: 'Google Calendar' }
  ];

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="-mb-px flex space-x-8 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'eventos' && <EventosList />}
        {activeTab === 'api-config' && <ApiConfigPanel />}
        {activeTab === 'google-calendar' && <GoogleCalendarConfig />}
      </div>
    </div>
  );
};

export default EventosAdmin;