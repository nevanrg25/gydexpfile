import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function EchoAidDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
      {/* Navigation Tabs */}
      <div className="border-b bg-gray-50">
        <nav className="flex space-x-8 px-6">
          {[
            { id: "overview", label: "System Overview", icon: "📊" },
            { id: "calls", label: "Call Management", icon: "📞" },
            { id: "services", label: "Service Providers", icon: "🏢" },
            { id: "schemes", label: "Welfare Schemes", icon: "📋" },
            { id: "analytics", label: "Analytics", icon: "📈" },
            { id: "architecture", label: "System Architecture", icon: "🏗️" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "overview" && <SystemOverview />}
        {activeTab === "calls" && <CallManagement />}
        {activeTab === "services" && <ServiceProviders />}
        {activeTab === "schemes" && <WelfareSchemes />}
        {activeTab === "analytics" && <Analytics />}
        {activeTab === "architecture" && <SystemArchitecture />}
      </div>
    </div>
  );
}

function SystemOverview() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Sessions"
          value="127"
          change="+12%"
          icon="👥"
          color="blue"
        />
        <StatCard
          title="Successful Connections"
          value="89%"
          change="+5%"
          icon="✅"
          color="green"
        />
        <StatCard
          title="Languages Supported"
          value="7"
          change="stable"
          icon="🌐"
          color="purple"
        />
        <StatCard
          title="Service Providers"
          value="342"
          change="+8%"
          icon="🏢"
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🎯 Core Features</h3>
          <div className="space-y-3">
            <FeatureItem
              title="Multilingual Voice Processing"
              description="Speech-to-text in Hindi, Tamil, Bengali, Telugu, Marathi, Kannada, and English"
              status="active"
            />
            <FeatureItem
              title="Intent Recognition"
              description="AI-powered understanding of natural speech patterns and needs"
              status="active"
            />
            <FeatureItem
              title="Needs-Based Routing"
              description="Smart matching of user requests to appropriate services"
              status="active"
            />
            <FeatureItem
              title="Flexible Identity Verification"
              description="Multiple verification methods without requiring Aadhaar"
              status="active"
            />
            <FeatureItem
              title="Live Call Transfer"
              description="Seamless connection to verified NGOs and helplines"
              status="active"
            />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📱 Access Methods</h3>
          <div className="space-y-3">
            <AccessMethod
              title="IVR System"
              description="Basic phone call access via toll-free number"
              availability="24/7"
            />
            <AccessMethod
              title="WhatsApp Voice"
              description="Voice messages through WhatsApp"
              availability="24/7"
            />
            <AccessMethod
              title="Missed Call Callback"
              description="Automatic callback system for missed calls"
              availability="24/7"
            />
            <AccessMethod
              title="SMS Integration"
              description="Text-based interaction for basic queries"
              availability="24/7"
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">🎯 Target Demographics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <DemographicCard title="Migrant Workers" count="45%" icon="👷" />
          <DemographicCard title="Homeless Individuals" count="23%" icon="🏠" />
          <DemographicCard title="Trans Community" count="12%" icon="🏳️‍⚧️" />
          <DemographicCard title="Undocumented Citizens" count="20%" icon="📄" />
        </div>
      </div>
    </div>
  );
}

function CallManagement() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Call Management System</h2>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            📞 Simulate Call
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            📊 View Reports
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📞 Sample Voice Interaction Flow</h3>
          <div className="space-y-4">
            <InteractionStep
              step={1}
              speaker="User"
              message="मुझे काम की जरूरत है। मैं दिल्ली में हूं।"
              translation="I need work. I am in Delhi."
              language="Hindi"
            />
            <InteractionStep
              step={2}
              speaker="EchoAid"
              message="मैं समझ गया। आप रोजगार की तलाश में हैं। आपका कौन सा काम का अनुभव है?"
              translation="I understand. You are looking for employment. What work experience do you have?"
              language="Hindi"
            />
            <InteractionStep
              step={3}
              speaker="User"
              message="मैं निर्माण का काम करता था। अब कोई काम नहीं मिल रहा।"
              translation="I used to do construction work. Now I can't find any work."
              language="Hindi"
            />
            <InteractionStep
              step={4}
              speaker="EchoAid"
              message="मैं आपको दिल्ली में निर्माण कामगारों के लिए योजनाओं से जोड़ता हूं। कृपया लाइन पर रुकें।"
              translation="I'm connecting you to schemes for construction workers in Delhi. Please stay on the line."
              language="Hindi"
            />
            <InteractionStep
              step={5}
              speaker="System"
              message="🔄 Transferring to Delhi Construction Workers Union..."
              translation=""
              language="System"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold mb-3">🌐 Language Distribution</h4>
            <div className="space-y-2">
              <LanguageBar language="Hindi" percentage={45} />
              <LanguageBar language="English" percentage={20} />
              <LanguageBar language="Tamil" percentage={12} />
              <LanguageBar language="Bengali" percentage={10} />
              <LanguageBar language="Telugu" percentage={8} />
              <LanguageBar language="Marathi" percentage={3} />
              <LanguageBar language="Kannada" percentage={2} />
            </div>
          </div>

          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-semibold mb-3">📊 Call Outcomes</h4>
            <div className="space-y-2">
              <OutcomeBar label="Successfully Connected" percentage={78} color="green" />
              <OutcomeBar label="Scheduled Callback" percentage={15} color="blue" />
              <OutcomeBar label="Information Provided" percentage={5} color="yellow" />
              <OutcomeBar label="Failed/Dropped" percentage={2} color="red" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceProviders() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Service Provider Network</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          ➕ Add Provider
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProviderCard
          name="Aajeevika Delhi"
          type="Employment NGO"
          services={["Job Placement", "Skill Training", "Counseling"]}
          location="New Delhi"
          rating={4.8}
          availability="24/7"
          capacity="85%"
          languages={["Hindi", "English", "Punjabi"]}
          verified={true}
        />
        <ProviderCard
          name="Goonj Shelter Network"
          type="Shelter Provider"
          services={["Emergency Shelter", "Night Stay", "Meals"]}
          location="Mumbai"
          rating={4.6}
          availability="24/7"
          capacity="92%"
          languages={["Hindi", "Marathi", "English"]}
          verified={true}
        />
        <ProviderCard
          name="SEWA Support Center"
          type="Women's NGO"
          services={["Legal Aid", "Healthcare", "Microfinance"]}
          location="Ahmedabad"
          rating={4.9}
          availability="9 AM - 6 PM"
          capacity="67%"
          languages={["Hindi", "Gujarati", "English"]}
          verified={true}
        />
      </div>
    </div>
  );
}

function WelfareSchemes() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Government Welfare Schemes</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          ➕ Add Scheme
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SchemeCard
          name="MGNREGA"
          category="Employment"
          description="Guaranteed 100 days of employment for rural households"
          eligibility={["Rural household", "Adult member", "Willing to do manual work"]}
          coverage="National"
          languages={["Hindi", "English", "Regional languages"]}
        />
        <SchemeCard
          name="PM-KISAN"
          category="Agriculture"
          description="Direct income support to farmer families"
          eligibility={["Small & marginal farmers", "Landholding up to 2 hectares"]}
          coverage="National"
          languages={["Hindi", "English", "Regional languages"]}
        />
        <SchemeCard
          name="Ayushman Bharat"
          category="Healthcare"
          description="Health insurance coverage up to ₹5 lakh per family"
          eligibility={["SECC database families", "Rural & urban poor"]}
          coverage="National"
          languages={["Hindi", "English", "Regional languages"]}
        />
        <SchemeCard
          name="Pradhan Mantri Awas Yojana"
          category="Housing"
          description="Affordable housing for economically weaker sections"
          eligibility={["EWS/LIG families", "No pucca house", "First-time buyer"]}
          coverage="National"
          languages={["Hindi", "English", "Regional languages"]}
        />
      </div>
    </div>
  );
}

function Analytics() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">System Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📈 Usage Trends</h3>
          <div className="space-y-3">
            <TrendItem label="Daily Active Users" value="2,847" trend="+15%" />
            <TrendItem label="Average Call Duration" value="4.2 min" trend="+8%" />
            <TrendItem label="Success Rate" value="89.3%" trend="+2%" />
            <TrendItem label="User Satisfaction" value="4.6/5" trend="+0.3" />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🎯 Top Service Categories</h3>
          <div className="space-y-3">
            <CategoryBar category="Employment" percentage={35} />
            <CategoryBar category="Healthcare" percentage={22} />
            <CategoryBar category="Shelter" percentage={18} />
            <CategoryBar category="Food Security" percentage={12} />
            <CategoryBar category="Legal Aid" percentage={8} />
            <CategoryBar category="Education" percentage={5} />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🌍 Geographic Distribution</h3>
          <div className="space-y-3">
            <RegionBar region="North India" percentage={28} />
            <RegionBar region="West India" percentage={24} />
            <RegionBar region="South India" percentage={22} />
            <RegionBar region="East India" percentage={16} />
            <RegionBar region="Central India" percentage={10} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SystemArchitecture() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">System Architecture</h2>
      
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">🏗️ Technical Stack</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TechStackCard
            category="Frontend"
            technologies={["React", "TypeScript", "Tailwind CSS", "Vite"]}
            icon="🎨"
          />
          <TechStackCard
            category="Backend"
            technologies={["Convex", "Node.js", "Real-time DB", "Auth System"]}
            icon="⚙️"
          />
          <TechStackCard
            category="AI/ML"
            technologies={["OpenAI Whisper", "GPT-4", "Intent Recognition", "NLP"]}
            icon="🤖"
          />
          <TechStackCard
            category="Voice Processing"
            technologies={["Speech-to-Text", "Text-to-Speech", "Audio Storage", "Multi-language"]}
            icon="🎙️"
          />
          <TechStackCard
            category="Communication"
            technologies={["Twilio", "WhatsApp API", "SMS Gateway", "IVR System"]}
            icon="📞"
          />
          <TechStackCard
            category="Data & Analytics"
            technologies={["Real-time Analytics", "Call Logs", "User Sessions", "Performance Metrics"]}
            icon="📊"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🔄 Data Flow</h3>
          <div className="space-y-4">
            <FlowStep step={1} title="Voice Input" description="User calls via phone/WhatsApp" />
            <FlowStep step={2} title="Speech Processing" description="Convert speech to text using Whisper" />
            <FlowStep step={3} title="Intent Recognition" description="Analyze user needs with GPT-4" />
            <FlowStep step={4} title="Service Matching" description="Find appropriate providers/schemes" />
            <FlowStep step={5} title="Connection" description="Transfer call or provide information" />
            <FlowStep step={6} title="Follow-up" description="Schedule callbacks if needed" />
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🔐 Security & Privacy</h3>
          <div className="space-y-3">
            <SecurityFeature
              title="Data Encryption"
              description="End-to-end encryption for all voice data"
              status="active"
            />
            <SecurityFeature
              title="Identity Protection"
              description="No Aadhaar requirement, flexible verification"
              status="active"
            />
            <SecurityFeature
              title="Call Privacy"
              description="No permanent storage of sensitive conversations"
              status="active"
            />
            <SecurityFeature
              title="Access Control"
              description="Role-based access for service providers"
              status="active"
            />
            <SecurityFeature
              title="Audit Logging"
              description="Complete audit trail for all interactions"
              status="active"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function StatCard({ title, value, change, icon, color }: {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: string;
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
    orange: "bg-orange-50 text-orange-600 border-orange-200"
  };

  return (
    <div className={`p-6 rounded-lg border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm opacity-75">{change}</p>
        </div>
        <div className="text-2xl">{icon}</div>
      </div>
    </div>
  );
}

function FeatureItem({ title, description, status }: {
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="flex items-start space-x-3">
      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function AccessMethod({ title, description, availability }: {
  title: string;
  description: string;
  availability: string;
}) {
  return (
    <div className="flex items-start space-x-3">
      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h4 className="font-medium">{title}</h4>
          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">{availability}</span>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function DemographicCard({ title, count, icon }: {
  title: string;
  count: string;
  icon: string;
}) {
  return (
    <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-lg font-semibold text-blue-800">{count}</div>
      <div className="text-sm text-blue-600">{title}</div>
    </div>
  );
}

function InteractionStep({ step, speaker, message, translation, language }: {
  step: number;
  speaker: string;
  message: string;
  translation: string;
  language: string;
}) {
  const isUser = speaker === "User";
  const isSystem = speaker === "System";
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
        isUser ? 'bg-blue-100 text-blue-900' : 
        isSystem ? 'bg-gray-100 text-gray-700' : 
        'bg-green-100 text-green-900'
      }`}>
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-xs font-semibold">{speaker}</span>
          <span className="text-xs opacity-75">Step {step}</span>
        </div>
        <p className="text-sm font-medium">{message}</p>
        {translation && (
          <p className="text-xs opacity-75 mt-1 italic">{translation}</p>
        )}
      </div>
    </div>
  );
}

function LanguageBar({ language, percentage }: {
  language: string;
  percentage: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{language}</span>
      <div className="flex items-center space-x-2">
        <div className="w-20 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-600">{percentage}%</span>
      </div>
    </div>
  );
}

function OutcomeBar({ label, percentage, color }: {
  label: string;
  percentage: number;
  color: string;
}) {
  const colorClasses = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    yellow: "bg-yellow-500",
    red: "bg-red-500"
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center space-x-2">
        <div className="w-20 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-600">{percentage}%</span>
      </div>
    </div>
  );
}

function ProviderCard({ name, type, services, location, rating, availability, capacity, languages, verified }: {
  name: string;
  type: string;
  services: string[];
  location: string;
  rating: number;
  availability: string;
  capacity: string;
  languages: string[];
  verified: boolean;
}) {
  return (
    <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{name}</h3>
          <p className="text-sm text-gray-600">{type}</p>
        </div>
        {verified && (
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            ✓ Verified
          </span>
        )}
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">📍</span>
          <span className="text-sm">{location}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">⭐</span>
          <span className="text-sm">{rating}/5</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">🕒</span>
          <span className="text-sm">{availability}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">📊</span>
          <span className="text-sm">Capacity: {capacity}</span>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm font-medium mb-1">Services:</p>
        <div className="flex flex-wrap gap-1">
          {services.map((service, index) => (
            <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
              {service}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-1">Languages:</p>
        <div className="flex flex-wrap gap-1">
          {languages.map((lang, index) => (
            <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
              {lang}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SchemeCard({ name, category, description, eligibility, coverage, languages }: {
  name: string;
  category: string;
  description: string;
  eligibility: string[];
  coverage: string;
  languages: string[];
}) {
  return (
    <div className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{name}</h3>
          <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">{category}</span>
        </div>
        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
          {coverage}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      <div className="mb-3">
        <p className="text-sm font-medium mb-2">Eligibility:</p>
        <ul className="text-sm text-gray-600 space-y-1">
          {eligibility.map((criteria, index) => (
            <li key={index} className="flex items-start space-x-2">
              <span className="text-green-500 mt-0.5">•</span>
              <span>{criteria}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-sm font-medium mb-1">Available in:</p>
        <div className="flex flex-wrap gap-1">
          {languages.map((lang, index) => (
            <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
              {lang}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrendItem({ label, value, trend }: {
  label: string;
  value: string;
  trend: string;
}) {
  const isPositive = trend.startsWith('+');
  
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <div className="text-right">
        <div className="text-sm font-semibold">{value}</div>
        <div className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend}
        </div>
      </div>
    </div>
  );
}

function CategoryBar({ category, percentage }: {
  category: string;
  percentage: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{category}</span>
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-indigo-600 h-2 rounded-full" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-600">{percentage}%</span>
      </div>
    </div>
  );
}

function RegionBar({ region, percentage }: {
  region: string;
  percentage: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{region}</span>
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full" 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-sm text-gray-600">{percentage}%</span>
      </div>
    </div>
  );
}

function TechStackCard({ category, technologies, icon }: {
  category: string;
  technologies: string[];
  icon: string;
}) {
  return (
    <div className="bg-white rounded-lg p-4 border border-blue-200">
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-xl">{icon}</span>
        <h4 className="font-semibold text-blue-800">{category}</h4>
      </div>
      <div className="space-y-1">
        {technologies.map((tech, index) => (
          <div key={index} className="text-sm text-gray-600 flex items-center space-x-2">
            <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
            <span>{tech}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlowStep({ step, title, description }: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start space-x-3">
      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
        {step}
      </div>
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function SecurityFeature({ title, description, status }: {
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="flex items-start space-x-3">
      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}
