import { useSettings } from "@/lib/store";
import { User, Globe, Zap } from "lucide-react";

const languages = [
  { code: "", name: "All Languages" },
  { code: "en", name: "English" },
  { code: "hi", name: "Hindi" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "pt", name: "Portuguese" },
  { code: "it", name: "Italian" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "th", name: "Thai" },
  { code: "tr", name: "Turkish" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "ml", name: "Malayalam" },
  { code: "bn", name: "Bengali" },
  { code: "mr", name: "Marathi" },
];

export default function ProfilePage() {
  const [settings, updateSettings] = useSettings();

  return (
    <div className="px-4 sm:px-8 py-6 pb-20 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
        <User className="w-6 h-6" /> Profile
      </h1>

      <div className="space-y-6">
        {/* Language */}
        <div className="bg-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Original Language Filter</h2>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Filter content by original language across the entire app.</p>
          <select
            value={settings.language}
            onChange={e => updateSettings({ ...settings, language: e.target.value })}
            className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
          >
            {languages.map(l => (
              <option key={l.code} value={l.code}>{l.name}</option>
            ))}
          </select>
        </div>

        {/* Data Saver */}
        <div className="bg-card rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-sm font-semibold text-foreground">Data Saver</h2>
                <p className="text-xs text-muted-foreground">Load lower resolution images to save data.</p>
              </div>
            </div>
            <button
              onClick={() => updateSettings({ ...settings, dataSaver: !settings.dataSaver })}
              className={`w-10 h-5 rounded-full transition-colors relative ${settings.dataSaver ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${settings.dataSaver ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
