// SVG Card Generator for Spanish Deck (Baraja Española)
// Exports window.createCardSVG(suit, number, options)

(function () {
  const SUITS = {
    oros: {
      color: '#d4af37',
      // Dynamic SVG path for Oros (Gold coin)
      getSymbol: (scale = 1) => `
        <g transform="scale(${scale})">
          <circle cx="50" cy="50" r="40" fill="url(#goldGradient)" stroke="#d4af37" stroke-width="2" />
          <circle cx="50" cy="50" r="32" fill="none" stroke="#b8860b" stroke-width="1.5" stroke-dasharray="3,2" />
          <path d="M 50 20 L 54 38 L 72 32 L 58 46 L 75 50 L 58 54 L 72 68 L 54 62 L 50 80 L 46 62 L 28 68 L 42 54 L 25 50 L 42 46 L 28 32 L 46 38 Z" fill="#b8860b" />
          <circle cx="50" cy="50" r="8" fill="#d4af37" stroke="#8b6508" stroke-width="1" />
        </g>
      `
    },
    copas: {
      color: '#e23d3d',
      // Dynamic SVG path for Copas (Cups/Chalice)
      getSymbol: (scale = 1) => `
        <g transform="scale(${scale})">
          <!-- Base -->
          <path d="M 30 85 L 70 85 L 65 75 L 35 75 Z" fill="#d4af37" stroke="#8b6508" stroke-width="1.5" />
          <!-- Stem -->
          <path d="M 45 75 L 55 75 L 55 58 L 45 58 Z" fill="#c59b27" stroke="#8b6508" stroke-width="1.5" />
          <circle cx="50" cy="65" r="8" fill="#d4af37" stroke="#8b6508" stroke-width="1" />
          <!-- Bowl -->
          <path d="M 25 25 C 25 58, 75 58, 75 25 Z" fill="#d4af37" stroke="#8b6508" stroke-width="1.5" />
          <!-- Rim/Decorations -->
          <path d="M 23 25 L 77 25 L 77 30 L 23 30 Z" fill="#e23d3d" stroke="#8b0000" stroke-width="1" />
          <circle cx="50" cy="42" r="5" fill="#e23d3d" />
          <circle cx="37" cy="38" r="3" fill="#ffeb3b" />
          <circle cx="63" cy="38" r="3" fill="#ffeb3b" />
        </g>
      `
    },
    espadas: {
      color: '#4682b4',
      // Dynamic SVG path for Espadas (Swords)
      getSymbol: (scale = 1) => `
        <g transform="scale(${scale})">
          <!-- Guard (Golden) -->
          <path d="M 25 70 L 75 70 C 75 75, 65 75, 55 75 L 55 80 L 45 80 L 45 75 C 35 75, 25 75, 25 70 Z" fill="#d4af37" stroke="#8b6508" stroke-width="1.5" />
          <!-- Handle -->
          <path d="M 46 80 L 54 80 L 52 93 L 48 93 Z" fill="#8b4513" stroke="#5c2d16" stroke-width="1" />
          <circle cx="50" cy="94" r="4" fill="#d4af37" stroke="#8b6508" />
          <!-- Blade (Steel blue) -->
          <path d="M 45 70 L 46 20 L 50 8 L 54 20 L 55 70 Z" fill="#c6d7e7" stroke="#4682b4" stroke-width="2" />
          <!-- Fuller (Groove in blade) -->
          <line x1="50" y1="65" x2="50" y2="18" stroke="#4682b4" stroke-width="1.5" stroke-dasharray="5,2" />
        </g>
      `
    },
    bastos: {
      color: '#4caf50',
      // Dynamic SVG path for Bastos (Clubs)
      getSymbol: (scale = 1) => `
        <g transform="scale(${scale})">
          <!-- Main Wooden Club (Brown) -->
          <path d="M 44 88 C 44 88, 38 45, 41 28 C 43 18, 57 18, 59 28 C 62 45, 56 88, 56 88 Z" fill="#8b4513" stroke="#5c2d16" stroke-width="2" />
          <!-- Bark Knobs -->
          <circle cx="43" cy="42" r="5" fill="#5c2d16" />
          <circle cx="57" cy="55" r="5" fill="#5c2d16" />
          <circle cx="44" cy="68" r="5" fill="#5c2d16" />
          <circle cx="56" cy="35" r="4" fill="#5c2d16" />
          <!-- Leaves sprouting (Green) -->
          <path d="M 37 32 Q 25 32, 36 24 Z" fill="#4caf50" stroke="#2e7d32" stroke-width="1" />
          <path d="M 63 48 Q 75 48, 64 40 Z" fill="#4caf50" stroke="#2e7d32" stroke-width="1" />
          <path d="M 38 60 Q 28 64, 38 52 Z" fill="#4caf50" stroke="#2e7d32" stroke-width="1" />
        </g>
      `
    }
  };

  // Coordinates for the layout of card symbols (normalized for scale=0.8, center=100,150)
  // Inside a 200x300 canvas
  const LAYOUTS = {
    1: [{ x: 60, y: 110, s: 0.8 }],
    2: [
      { x: 60, y: 55, s: 0.8 },
      { x: 60, y: 165, s: 0.8, rotate: 180 }
    ],
    3: [
      { x: 60, y: 40, s: 0.7 },
      { x: 60, y: 110, s: 0.7 },
      { x: 60, y: 180, s: 0.7, rotate: 180 }
    ],
    4: [
      { x: 25, y: 45, s: 0.7 },
      { x: 95, y: 45, s: 0.7 },
      { x: 25, y: 175, s: 0.7, rotate: 180 },
      { x: 95, y: 175, s: 0.7, rotate: 180 }
    ],
    5: [
      { x: 25, y: 45, s: 0.65 },
      { x: 95, y: 45, s: 0.65 },
      { x: 60, y: 110, s: 0.65 },
      { x: 25, y: 175, s: 0.65, rotate: 180 },
      { x: 95, y: 175, s: 0.65, rotate: 180 }
    ],
    6: [
      { x: 25, y: 45, s: 0.65 },
      { x: 95, y: 45, s: 0.65 },
      { x: 25, y: 110, s: 0.65 },
      { x: 95, y: 110, s: 0.65 },
      { x: 25, y: 175, s: 0.65, rotate: 180 },
      { x: 95, y: 175, s: 0.65, rotate: 180 }
    ],
    7: [
      { x: 25, y: 45, s: 0.65 },
      { x: 95, y: 45, s: 0.65 },
      { x: 25, y: 110, s: 0.65 },
      { x: 95, y: 110, s: 0.65 },
      { x: 60, y: 77, s: 0.65 }, // middle top
      { x: 25, y: 175, s: 0.65, rotate: 180 },
      { x: 95, y: 175, s: 0.65, rotate: 180 }
    ]
  };

  // Custom vector graphics for Court cards (Sota, Caballo, Rey)
  const COURT_GRAPHICS = {
    10: { // Sota (Page / Helper) - Stylized Helmet & Shield
      name: 'SOTA',
      getGraphic: (color) => `
        <g transform="translate(100, 150)">
          <!-- Banner / Shield -->
          <path d="M -30 -30 L 30 -30 L 35 15 C 35 35, -35 35, -35 15 Z" fill="${color}" opacity="0.15" />
          <path d="M -25 -25 L 25 -25 L 30 15 C 30 30, -30 30, -30 15 Z" fill="none" stroke="${color}" stroke-width="2.5" />
          <!-- Page Helmet -->
          <path d="M -20 -10 C -20 -30, 20 -30, 20 -10 L 20 15 L -20 15 Z" fill="#a0b2c6" stroke="#4682b4" stroke-width="2" />
          <path d="M -25 15 L 25 15 L 20 20 L -20 20 Z" fill="#d4af37" stroke="#8b6508" stroke-width="1" />
          <!-- Plume -->
          <path d="M 0 -30 Q 30 -50, 40 -35 Q 25 -25, 0 -30 Z" fill="#ff4500" />
          <!-- Spear / Halberd diagonal -->
          <line x1="-40" y1="40" x2="40" y2="-40" stroke="#795548" stroke-width="3.5" />
          <path d="M 40 -40 L 45 -35 L 53 -53 L 35 -45 Z" fill="#e0e0e0" stroke="#424242" stroke-width="1.5" />
        </g>
      `
    },
    11: { // Caballo (Knight / Horse) - Stylized Horse Profile
      name: 'CABALLO',
      getGraphic: (color) => `
        <g transform="translate(100, 150)">
          <!-- Horseshoe background -->
          <path d="M -30 30 C -45 10, -45 -30, 0 -35 C 45 -30, 45 10, 30 30" fill="none" stroke="${color}" stroke-width="4.5" stroke-dasharray="35 5 15 5" opacity="0.3" />
          <!-- Horse Head -->
          <path d="M -15 35 C -15 35, -25 20, -25 0 C -25 -20, -10 -35, 10 -35 C 25 -35, 30 -25, 25 -10 C 22 -3, 10 -5, 5 -10 C 2 -15, -8 -15, -10 -5 C -12 5, -8 15, -2 20 C 5 25, 5 35, 5 35 Z" fill="#d7ccc8" stroke="#5d4037" stroke-width="2" />
          <!-- Mane -->
          <path d="M 10 -35 Q 30 -30, 25 -15 M 8 -25 Q 25 -20, 20 -5 M 5 -15 Q 20 -10, 15 5" fill="none" stroke="#5d4037" stroke-width="2.5" />
          <!-- Eye -->
          <circle cx="-10" cy="-20" r="2.5" fill="#3e2723" />
          <!-- Bridle (Rein) -->
          <path d="M -18 -5 L -2 -13 M -12 -5 C -12 -5, -8 5, -2 0" fill="none" stroke="#e23d3d" stroke-width="1.5" />
        </g>
      `
    },
    12: { // Rey (King) - Crown & Scepter
      name: 'REY',
      getGraphic: (color) => `
        <g transform="translate(100, 150)">
          <!-- Royal mantle outline -->
          <path d="M -40 35 L 40 35 L 30 -20 C 30 -20, 0 -30, -30 -20 Z" fill="${color}" opacity="0.15" />
          <!-- Crown -->
          <path d="M -25 -15 L -25 5 L 25 5 L 25 -15 L 12 -5 L 0 -22 L -12 -5 Z" fill="#d4af37" stroke="#8b6508" stroke-width="2" />
          <circle cx="-25" cy="-15" r="3" fill="#e23d3d" />
          <circle cx="0" cy="-22" r="3" fill="#ffeb3b" />
          <circle cx="25" cy="-15" r="3" fill="#e23d3d" />
          <rect x="-15" y="-3" width="30" height="4" fill="#ffeb3b" rx="2" />
          <!-- Scepter / Wand -->
          <line x1="-35" y1="30" x2="-20" y2="-5" stroke="#d4af37" stroke-width="3" />
          <circle cx="-20" cy="-5" r="6" fill="#e23d3d" stroke="#8b6508" />
        </g>
      `
    }
  };

  // Master function to generate SVG string
  function createCardSVG(suit, number, options = {}) {
    const isFlipped = options.flipped || false;
    const isSelected = options.selected || false;
    const customClass = options.class || '';

    let content = '';

    if (isFlipped) {
      // Draw card back
      content = `
        <!-- Card Back -->
        <rect x="2" y="2" width="196" height="296" rx="14" ry="14" fill="#2e7d32" stroke="#1b5e20" stroke-width="3" />
        <!-- Intricate pattern -->
        <rect x="10" y="10" width="180" height="280" rx="10" ry="10" fill="none" stroke="#a5d6a7" stroke-width="2" stroke-dasharray="6,4" />
        <!-- Center Emblem -->
        <circle cx="100" cy="150" r="40" fill="none" stroke="#a5d6a7" stroke-width="3" />
        <path d="M 100 100 L 100 200 M 50 150 L 150 150 M 65 115 L 135 185 M 65 185 L 135 115" stroke="#a5d6a7" stroke-width="2" opacity="0.7" />
        <circle cx="100" cy="150" r="10" fill="#a5d6a7" />
      `;
    } else {
      const suitInfo = SUITS[suit.toLowerCase()];
      if (!suitInfo) return '';

      const color = suitInfo.color;
      const suitSymbol = suitInfo.getSymbol(1);

      // Card Face Base
      content = `
        <!-- Card Base -->
        <rect x="2" y="2" width="196" height="296" rx="14" ry="14" fill="#ffffff" stroke="#dddddd" stroke-width="2" />
        <!-- Inner Border Border -->
        <rect x="10" y="10" width="180" height="280" rx="10" ry="10" fill="none" stroke="#efefef" stroke-width="1.5" />
      `;

      // Top-Left Corner Index
      content += `
        <g transform="translate(18, 22)">
          <text x="0" y="10" font-family="Arial, sans-serif" font-weight="bold" font-size="22" fill="${color}" text-anchor="middle">${number}</text>
          <g transform="translate(-10, 16) scale(0.2)">
            ${suitSymbol}
          </g>
        </g>
      `;

      // Bottom-Right Corner Index (Rotated)
      content += `
        <g transform="translate(182, 278) rotate(180)">
          <text x="0" y="10" font-family="Arial, sans-serif" font-weight="bold" font-size="22" fill="${color}" text-anchor="middle">${number}</text>
          <g transform="translate(-10, 16) scale(0.2)">
            ${suitSymbol}
          </g>
        </g>
      `;

      // Center Elements
      if (number >= 10) {
        // Court Card (Sota, Caballo, Rey)
        const court = COURT_GRAPHICS[number];
        if (court) {
          content += court.getGraphic(color);
          // Label at the bottom center of index frame
          content += `
            <text x="100" y="260" font-family="'Courier New', monospace" font-weight="bold" font-size="12" fill="${color}" text-anchor="middle" opacity="0.8">${court.name}</text>
          `;
        }
      } else {
        // Number card layouts (1 to 7)
        const layouts = LAYOUTS[number];
        if (layouts) {
          layouts.forEach(layout => {
            const rotStr = layout.rotate ? `rotate(${layout.rotate} 50 50)` : '';
            content += `
              <g transform="translate(${layout.x}, ${layout.y}) ${rotStr}">
                ${suitInfo.getSymbol(layout.s)}
              </g>
            `;
          });
        }
      }
    }

    // Wrap in standard SVG container
    const selectedStyle = isSelected ? 'box-shadow: 0 0 15px #ffeb3b; transform: translateY(-15px); transition: all 0.2s;' : 'transition: all 0.2s;';
    const borderHighlight = isSelected ? 'stroke="#ffeb3b" stroke-width="4"' : '';

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" class="card-svg ${customClass} ${isSelected ? 'selected' : ''}" style="width: 100%; height: 100%; display: block; ${selectedStyle}">
        <defs>
          <radialGradient id="goldGradient" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
            <stop offset="0%" stop-color="#fff9c4" />
            <stop offset="70%" stop-color="#fbc02d" />
            <stop offset="100%" stop-color="#f57f17" />
          </radialGradient>
        </defs>
        ${content}
        ${borderHighlight ? `<rect x="2" y="2" width="196" height="296" rx="14" ry="14" fill="none" ${borderHighlight} />` : ''}
      </svg>
    `;
  }

  // Attach to window global scope
  window.createCardSVG = createCardSVG;
})();
