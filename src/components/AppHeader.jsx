import { useState } from 'react';
import { Input, Button, Menu, MenuTrigger, MenuContent, MenuItem, Popover, PopoverTrigger, PopoverContent } from '@heroui/react';
import { SearchIcon } from './icons';

export default function AppHeader({
  appName = 'TapeFlix',
  tagline = '',
  sessionUser = null,
  onLogout,
  onLoginClick,
  onSearch,
  onSearchPreview,
  suggestions,
  onOpenMenu,
  onHome,
  theme,
  onThemeChange,
  filters,
  navGenres,
  active,
  onApplyFilter,
}) {
  const [query, setQuery] = useState('');

  return (
    <header className="app-header">
      <div className="app-header__bar">
        <Button
          className="app-header__brand"
          variant="ghost"
          onClick={onHome}
        >
          <span>{appName}</span>
          <span className="app-header__tagline">{tagline}</span>
        </Button>

        <div className="header-search">
          <Input
            placeholder="Buscar película o serie…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearchPreview(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onSearch(query);
              }
            }}
            startContent={<SearchIcon size={16} />}
          />
        </div>

        <div className="app-header__actions">
          <Button
            className="icon-button"
            variant="ghost"
            onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Tema"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </Button>
        </div>
      </div>
    </header>
  );
}
