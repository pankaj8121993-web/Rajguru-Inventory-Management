/**
 * Line icons, drawn inline so nothing depends on an external font or CDN.
 * 16px grid, 1.6 stroke — chosen to sit quietly beside 13.5px nav labels.
 */

const PATHS: Record<string, string> = {
  home: 'M3 9.5 10 4l7 5.5V16a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1z',
  search: 'M12.5 12.5 17 17M14 8.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z',
  alert: 'M10 3.5 17.5 16.5H2.5zM10 8v4M10 14.2v.1',
  scale: 'M10 3v14M4 7h12M6.5 7 4 12.5h5zM13.5 7 11 12.5h5z',
  grid: 'M3 3h14v14H3zM3 7.5h14M3 12h14M8 3v14M13 3v14',
  download: 'M10 3v9m0 0 3.5-3.5M10 12 6.5 8.5M3.5 15.5h13',
  upload: 'M10 13V4m0 0 3.5 3.5M10 4 6.5 7.5M3.5 15.5h13',
  layers: 'M10 3 3 6.5 10 10l7-3.5zM3 11l7 3.5 7-3.5',
  box: 'M3 6.5 10 3l7 3.5v7L10 17l-7-3.5zM3 6.5 10 10l7-3.5M10 10v7',
  help: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.2 7.8a1.9 1.9 0 0 1 3.7.6c0 1.3-1.9 1.6-1.9 2.9M10 13.8v.1',
  target: 'M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14zm0-3.2a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6zm0-2.8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  transfer: 'M3 7.5h12m0 0-3-3m3 3-3 3M17 12.5H5m0 0 3-3m-3 3 3 3',
  split: 'M4 4v4a3 3 0 0 0 3 3h9m0 0-3-3m3 3-3 3M4 16v-1',
  map: 'M3 5.5 7.5 4 12.5 6 17 4.5v10L12.5 16 7.5 14 3 15.5zM7.5 4v10M12.5 6v10',
  lock: 'M5.5 9V7a4.5 4.5 0 0 1 9 0v2M4 9h12v7.5H4z',
  swap: 'M4 7h9m0 0-2.5-2.5M13 7l-2.5 2.5M16 13H7m0 0 2.5-2.5M7 13l2.5 2.5',
  flask: 'M8 3h4v4l3.5 7A1.5 1.5 0 0 1 14 16H6a1.5 1.5 0 0 1-1.5-2L8 7zM6 12h8',
  shield: 'M10 3 4.5 5v5c0 3.3 2.3 5.8 5.5 7 3.2-1.2 5.5-3.7 5.5-7V5z',
  check: 'M4 10.5 8 14.5l8-9',
  delta: 'M10 4l6.5 12h-13zM7 12.5h6',
  umbrella: 'M10 3v1.5M3.5 11a6.5 6.5 0 0 1 13 0zM10 11v4a1.8 1.8 0 0 1-3.6 0',
  building: 'M4 17V4h8v13M12 8h4v9M6.5 7h3M6.5 10h3M6.5 13h3',
  wheat: 'M10 17V7M10 7c0-2 1.4-3.5 3-4 .3 1.9-.7 3.6-3 4zm0 0c0-2-1.4-3.5-3-4-.3 1.9.7 3.6 3 4zm0 4c0-2 1.4-3.5 3-4 .3 1.9-.7 3.6-3 4zm0 0c0-2-1.4-3.5-3-4-.3 1.9.7 3.6 3 4z',
  users: 'M7.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM3 16.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4M13 4.6a2.5 2.5 0 0 1 0 4.8M14.5 12.8c1.6.5 2.5 1.8 2.5 3.7',
  tag: 'M9.5 3H16v6.5L9 16.5 2.5 10zM12.5 6.5v.1',
  key: 'M12.5 3a4.5 4.5 0 0 1 1.9 8.6L13 13v2h-2v2H7.5l-1-1 6-6A4.5 4.5 0 0 1 12.5 3zM14 6.5v.1',
  stamp: 'M6 16.5h8M7 13.5h6l-.7-4.2A2 2 0 0 0 10.3 7.5h-.6a2 2 0 0 0-2 1.8z',
  report: 'M5 3h7l3 3v11H5zM12 3v3h3M7.5 10h5M7.5 13h5',
};

export default function Icon({ name, className = 'rail-ico' }: { name: string; className?: string }) {
  const d = PATHS[name] ?? PATHS.box;
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
