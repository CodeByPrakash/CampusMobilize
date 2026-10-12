"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LanguagesIcon,
  CheckIcon,
  ChevronDownIcon,
  SparklesIcon,
  GlobeIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

export interface LanguageOption {
  code: string;
  name: string;
  native: string;
  region?: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", native: "English", region: "Primary" },
  { code: "hi", name: "Hindi", native: "हिन्दी", region: "Official" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", region: "Odisha / State" },
  { code: "bn", name: "Bengali", native: "বাংলা", region: "Eastern" },
  { code: "te", name: "Telugu", native: "తెలుగు", region: "Southern" },
  { code: "ta", name: "Tamil", native: "தமிழ்", region: "Southern" },
  { code: "mr", name: "Marathi", native: "मराठी", region: "Western" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", region: "Western" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", region: "Southern" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", region: "Southern" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", region: "Northern" },
  { code: "ur", name: "Urdu", native: "اردو", region: "Northern" },
  { code: "fr", name: "French", native: "Français", region: "Global" },
  { code: "es", name: "Spanish", native: "Español", region: "Global" },
  { code: "de", name: "German", native: "Deutsch", region: "Global" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentCode, setCurrentCode] = React.useState("en");
  const [searchQuery, setSearchQuery] = React.useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Read existing cookie if set
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const match = document.cookie.match(/googtrans=\/en\/([a-zA-Z]+)/i);
      if (match && match[1]) {
        setCurrentCode(match[1].toLowerCase());
      }
    }
  }, []);

  // Initialize Google Translate Script once
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if script already exists
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);

      (window as any).googleTranslateElementInit = () => {
        if ((window as any).google?.translate?.TranslateElement) {
          new (window as any).google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages:
                "en,hi,or,bn,te,ta,mr,gu,kn,ml,pa,ur,fr,es,de",
              autoDisplay: false,
            },
            "google_translate_element"
          );
        }
      };
    }
  }, []);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [isOpen]);

  const handleSelectLanguage = (lang: LanguageOption) => {
    setCurrentCode(lang.code);
    setIsOpen(false);

    if (lang.code === "en") {
      // Clear cookies to restore original English text
      document.cookie =
        "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      toast.success("Language reset to English (Original)");
    } else {
      // Set Google Translate cookie
      document.cookie = `googtrans=/en/${lang.code}; path=/;`;
      document.cookie = `googtrans=/en/${lang.code}; path=/; domain=${window.location.hostname};`;
      toast.success(`Language set to ${lang.name} (${lang.native})`);
    }

    // Attempt to trigger the native select element
    const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
    if (combo) {
      combo.value = lang.code;
      combo.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      // Smooth reload to apply translate cookie
      setTimeout(() => {
        window.location.reload();
      }, 300);
    }
  };

  const selectedLang =
    LANGUAGES.find((l) => l.code === currentCode) || LANGUAGES[0];

  const filteredLanguages = LANGUAGES.filter(
    (l) =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.native.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`relative inline-block ${className || ""}`} ref={dropdownRef}>
      {/* Hidden container for Google Translate widget */}
      <div id="google_translate_element" className="hidden" aria-hidden="true" />

      {/* Main Switcher Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 text-xs px-2.5 gap-1.5 border-border bg-background hover:bg-accent/40 shadow-2xs text-foreground font-medium"
        title="Change Language (Google Translate)"
      >
        <GlobeIcon className="size-3.5 text-primary" />
        <span className="font-semibold">{selectedLang.native}</span>
        {currentCode !== "en" && (
          <Badge
            variant="secondary"
            className="text-[9px] px-1 py-0 h-3.5 font-mono uppercase bg-primary/10 text-primary border-transparent"
          >
            {selectedLang.code}
          </Badge>
        )}
        <ChevronDownIcon className="size-3 text-muted-foreground ml-0.5" />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 w-72 rounded-xl border border-border bg-popover p-2 shadow-xl animate-in fade-in-0 zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-2 px-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <LanguagesIcon className="size-3.5 text-primary" />
              <span>Select Language</span>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono gap-1 py-0 px-1.5">
              <SparklesIcon className="size-2.5 text-primary" />
              Google Translate
            </Badge>
          </div>

          {/* Quick Search */}
          <div className="relative my-2">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search (e.g. Hindi, Odia, বাংলা)..."
              className="w-full h-7 rounded-md border border-input bg-muted/40 pl-7 pr-7 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <XIcon className="size-3" />
              </button>
            )}
          </div>

          {/* Language Options List */}
          <div className="max-h-64 overflow-y-auto space-y-1 pr-0.5">
            {filteredLanguages.map((lang) => {
              const isSelected = currentCode === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang)}
                  className={`w-full flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors text-left ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                      : "hover:bg-accent/60 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium leading-none">
                      {lang.native}
                    </span>
                    <span
                      className={`text-[11px] truncate ${
                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                      }`}
                    >
                      ({lang.name})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {lang.region && (
                      <span
                        className={`text-[9px] px-1 py-0 rounded ${
                          isSelected
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {lang.region}
                      </span>
                    )}
                    {isSelected && <CheckIcon className="size-3.5 stroke-[2.5]" />}
                  </div>
                </button>
              );
            })}

            {filteredLanguages.length === 0 && (
              <p className="p-3 text-center text-xs text-muted-foreground">
                No languages found matching &quot;{searchQuery}&quot;
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="border-t pt-2 mt-2 px-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Powered by Google Neural MT</span>
            {currentCode !== "en" && (
              <button
                type="button"
                onClick={() =>
                  handleSelectLanguage({
                    code: "en",
                    name: "English",
                    native: "English",
                  })
                }
                className="text-primary hover:underline font-medium"
              >
                Reset to English
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
