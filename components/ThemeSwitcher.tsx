
import React, { useState } from 'react';
import { Palette, Sun, Moon, Droplets, Snowflake, Check, MoonStar, Terminal } from 'lucide-react';
import { Theme } from '../types';
import { useClickOutside } from '../hooks/useClickOutside';

interface ThemeSwitcherProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  direction?: 'up' | 'down';
}

const themeOptions: { id: Theme; name: string; icon: React.FC<any> }[] = [
  { id: 'light', name: 'Light', icon: Sun },
  { id: 'dark', name: 'VS Code', icon: Moon },
  { id: 'solarized', name: 'Solarized', icon: Droplets },
  { id: 'nord', name: 'Nord', icon: Snowflake },
  { id: 'dracula', name: 'Dracula', icon: MoonStar },
  { id: 'monokai', name: 'Monokai', icon: Terminal },
];

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, setTheme, direction = 'down' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setIsOpen(false);
  };

  const menuClasses = direction === 'up' 
    ? 'bottom-full right-0 mb-2' 
    : 'top-full right-0 mt-2';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-text-secondary hover:text-accent hover:bg-accent-soft-bg rounded-lg transition-all"
        title="Change theme"
        aria-label="Change theme"
      >
        <Palette size={20} />
      </button>
      {isOpen && (
        <div className={`absolute w-48 bg-background border border-border-color rounded-lg shadow-2xl z-50 animate-in fade-in duration-150 ${menuClasses}`}>
          <div className="p-2">
            {themeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleThemeChange(option.id)}
                className={`w-full flex items-center justify-between text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  theme === option.id
                    ? 'bg-accent-soft-bg text-accent-soft-text font-semibold'
                    : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
                }`}
              >
                <div className="flex items-center">
                  <option.icon size={14} className="mr-2" />
                  <span>{option.name}</span>
                </div>
                {theme === option.id && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
