import { useState } from 'react';
import { Input, Menu, MenuTrigger, MenuContent, MenuItem, Button, Avatar, AvatarFallback, Popover, PopoverTrigger, PopoverContent } from '@heroui/react';
import { SunIcon, MoonIcon, SearchIcon } from './icons';

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
          {suggestions && suggestions.flat && suggestions.flat.length > 0 && query.length >= 2 && (
            <Popover>
              <PopoverTrigger />
              <PopoverContent className="header-search__suggestions" placement="bottom-start">
                {suggestions.flat.map((item, i) => (
                  <MenuItem key={i} onSelect={() => onSearch(item.title || item.value || '')} className="header-search__suggestion">
                    {item.imageUrl && <img src={item.imageUrl} alt={item.title} />}
                    <strong>{item.title}</strong>
                    {item.subtitle && <small>{item.subtitle}</small>}
                  </MenuItem>
                ))}
              </PopoverContent>
            </Popover>
          )}
        </div>

        <div className="app-header__actions">
          <Menu>
            <MenuTrigger className="icon-button" aria-label="Más opciones">
              {/* Tres puntos */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" />
                <circle cx="17" cy="12" r="1" />
                <circle cx="7" cy="12" r="1" />
              </svg>
            </MenuTrigger>
            <MenuContent>
              <MenuItem onSelect={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? '☀️ Modo claro' : '🌙 Modo oscuro'}
              </MenuItem>
              <MenuItem onSelect={onHome}>🏠 Inicio</MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </div>
    </header>
  );
}
