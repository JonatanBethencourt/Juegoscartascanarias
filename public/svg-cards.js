// SVG Card Generator for Spanish Deck (Baraja Española) - Castilian Pattern
// Exports window.createCardSVG(suit, number, options)

(function () {
  // Suit graphics definition
  const SUITS = {
    oros: {
      color: '#d4af37',
      // Castilian Oro: Gold coin with relief circles and profile efigie in center
      getSymbol: (scale = 1) => `
        <g transform="scale(${scale})">
          <!-- Main Coin body -->
          <circle cx="50" cy="50" r="40" fill="url(#goldGradient)" stroke="#d4af37" stroke-width="2" />
          <circle cx="50" cy="50" r="34" fill="none" stroke="#8b6508" stroke-width="1.2" stroke-dasharray="2,2" />
          <circle cx="50" cy="50" r="28" fill="none" stroke="#8b6508" stroke-width="1" />
          
          <!-- Side profile silhouette (Roman emperor efigie) -->
          <path d="M 45 64 C 45 64, 46 58, 44 56 C 41 55, 37 53, 35 50 C 33 47, 34 45, 36 44 C 38 43, 40 44, 40 44 C 38 42, 35 41, 34 38 C 33 35, 35 33, 37 32 L 35 27 C 35 27, 37 24, 42 24 C 47 24, 51 26, 54 30 C 57 34, 58 39, 57 43 C 56 49, 55 55, 57 61 C 58 64, 55 65, 52 65 Z" fill="#8b6508" />
          
          <!-- Laurel wreath -->
          <path d="M 39 35 Q 44 26, 53 31 M 42 32 Q 47 27, 51 31" fill="none" stroke="#ffd54f" stroke-width="1.5" stroke-linecap="round" />
        </g>
      `
    },
    copas: {
      color: '#e23d3d',
      // Castilian Copa: Goblin/cup with lid, handles, and gold/red/green bands
      getSymbol: (scale = 1) => `
        <g transform="scale(${scale})">
          <!-- Base -->
          <path d="M 30 85 L 70 85 L 66 74 L 34 74 Z" fill="#d4af37" stroke="#8b6508" stroke-width="1.5" />
          <path d="M 34 74 L 66 74 L 66 78 L 34 78 Z" fill="#4caf50" /> <!-- Green stripe -->
          
          <!-- Stem -->
          <path d="M 45 74 L 55 74 L 54 56 L 46 56 Z" fill="#c59b27" stroke="#8b6508" stroke-width="1.5" />
          <circle cx="50" cy="65" r="7" fill="#d4af37" stroke="#8b6508" stroke-width="1" />
          
          <!-- Bowl -->
          <path d="M 23 28 C 23 58, 77 58, 77 28 Z" fill="#d4af37" stroke="#8b6508" stroke-width="1.5" />
          <path d="M 23 35 C 23 48, 77 48, 77 35 Z" fill="none" stroke="#e23d3d" stroke-width="3" /> <!-- Red band -->
          
          <!-- Handles -->
          <path d="M 23 32 Q 13 40, 23 48" fill="none" stroke="#d4af37" stroke-width="2.5" />
          <path d="M 77 32 Q 87 40, 77 48" fill="none" stroke="#d4af37" stroke-width="2.5" />
          
          <!-- Lid (Tapa) -->
          <path d="M 20 28 C 20 28, 20 18, 50 18 C 80 18, 80 28, 80 28 Z" fill="#d4af37" stroke="#8b6508" stroke-width="1.5" />
          <path d="M 20 25 L 80 25 L 80 28 L 20 28 Z" fill="#4caf50" />
          <!-- Lid Knob -->
          <circle cx="50" cy="14" r="5" fill="#d4af37" stroke="#8b6508" />
        </g>
      `
    },
    espadas: {
      color: '#4682b4',
      // Castilian Espada: Straight sword with crossguard, wire handle, and steel blade
      getSymbol: (scale = 1) => `
        <g transform="scale(${scale})">
          <!-- Pommel (Gold) -->
          <circle cx="50" cy="94" r="5.5" fill="#d4af37" stroke="#8b6508" />
          
          <!-- Handle (Brown wire wrap) -->
          <path d="M 46 80 L 54 80 L 52 92 L 48 92 Z" fill="#8b4513" stroke="#5c2d16" stroke-width="1" />
          <line x1="47" y1="83" x2="53" y2="83" stroke="#ffd54f" stroke-width="0.8" />
          <line x1="48" y1="86" x2="52" y2="86" stroke="#ffd54f" stroke-width="0.8" />
          <line x1="48" y1="89" x2="52" y2="89" stroke="#ffd54f" stroke-width="0.8" />
          
          <!-- Guard (Golden curved crossbar) -->
          <path d="M 20 74 C 20 74, 50 78, 80 74 C 80 74, 50 82, 20 74 Z" fill="#d4af37" stroke="#8b6508" stroke-width="1.2" />
          <circle cx="20" cy="74" r="2.5" fill="#8b6508" />
          <circle cx="80" cy="74" r="2.5" fill="#8b6508" />
          
          <!-- Blade (Tapered steel) -->
          <path d="M 46 74 L 47 16 L 50 4 L 53 16 L 54 74 Z" fill="#c6d7e7" stroke="#4682b4" stroke-width="1.5" />
          <!-- Blade Ridge / fuller -->
          <line x1="50" y1="72" x2="50" y2="12" stroke="#4682b4" stroke-width="1.2" />
        </g>
      `
    },
    bastos: {
      color: '#4caf50',
      // Castilian Basto: Brown wooden club with texture, light knots, and leaves
      getSymbol: (scale = 1) => `
        <g transform="scale(${scale})">
          <!-- Main Wooden Trunk -->
          <path d="M 45 88 C 45 88, 37 40, 42 22 C 44 14, 56 14, 58 22 C 63 40, 55 88, 55 88 Z" fill="#8b4513" stroke="#4e342e" stroke-width="2.2" />
          
          <!-- Wood grain rings / knots -->
          <ellipse cx="44" cy="45" rx="5.5" ry="4" fill="#d7ccc8" stroke="#5d4037" stroke-width="1" />
          <ellipse cx="56" cy="62" rx="5.5" ry="4" fill="#d7ccc8" stroke="#5d4037" stroke-width="1" />
          <ellipse cx="45" cy="74" rx="5.5" ry="4" fill="#d7ccc8" stroke="#5d4037" stroke-width="1" />
          <ellipse cx="55" cy="32" rx="4.5" ry="3" fill="#d7ccc8" stroke="#5d4037" stroke-width="1" />
          
          <!-- Bark lines -->
          <path d="M 48 85 C 48 85, 45 60, 49 52" fill="none" stroke="#4e342e" stroke-width="1.5" />
          <path d="M 52 85 C 52 85, 54 70, 52 66" fill="none" stroke="#4e342e" stroke-width="1.5" />
          
          <!-- Sprouting green leaves -->
          <path d="M 37 32 Q 23 35, 35 24 Z" fill="#4caf50" stroke="#2e7d32" stroke-width="1" />
          <circle cx="31" cy="29" r="1.5" fill="#81c784" />
          
          <path d="M 63 50 Q 77 53, 65 42 Z" fill="#4caf50" stroke="#2e7d32" stroke-width="1" />
          <circle cx="70" cy="47" r="1.5" fill="#81c784" />
          
          <path d="M 38 62 Q 24 66, 37 54 Z" fill="#4caf50" stroke="#2e7d32" stroke-width="1" />
          <circle cx="30" cy="60" r="1.5" fill="#81c784" />
        </g>
      `
    }
  };

  // Symbols placement positions (normalized for scale=0.8, center=100,150)
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
      { x: 60, y: 77, s: 0.65 },
      { x: 25, y: 175, s: 0.65, rotate: 180 },
      { x: 95, y: 175, s: 0.65, rotate: 180 }
    ]
  };

  // Human figure silhouettes for Court cards (Sota, Caballo, Rey)
  const COURT_GRAPHICS = {
    10: { // Sota (Standing Page)
      name: 'SOTA',
      getGraphic: (color, suit) => `
        <g transform="translate(100, 145) scale(1.15)">
          <!-- Cloak back -->
          <path d="M -15 20 C -25 35, -20 50, -5 50 M 15 20 C 25 35, 20 50, 5 50" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.5" />
          
          <!-- Legs and Boots -->
          <path d="M -8 15 L -8 42 L -15 42 L -13 47 L -2 47 L -4 15 Z" fill="#37474f" stroke="#263238" stroke-width="0.8" />
          <path d="M 8 15 L 8 42 L 15 42 L 13 47 L 2 47 L 4 15 Z" fill="#37474f" stroke="#263238" stroke-width="0.8" />
          
          <!-- Tunic/Jacket -->
          <path d="M -16 -12 L 16 -12 L 14 18 L -14 18 Z" fill="${color}" stroke="#212121" stroke-width="1.2" />
          <!-- Belt with gold buckle -->
          <rect x="-15" y="4" width="30" height="4.5" fill="#37474f" />
          <rect x="-4" y="2" width="8" height="8" fill="#ffd54f" stroke="#b8860b" stroke-width="1" rx="1.5" />
          
          <!-- Arms -->
          <path d="M -16 -12 C -24 0, -20 10, -14 14" fill="none" stroke="#37474f" stroke-width="4.5" stroke-linecap="round" />
          <path d="M 16 -12 C 24 0, 20 10, 14 14" fill="none" stroke="#37474f" stroke-width="4.5" stroke-linecap="round" />
          
          <!-- Neck & Face -->
          <rect x="-3" y="-17" width="6" height="6" fill="#ffe0b2" />
          <circle cx="0" cy="-24" r="8" fill="#ffe0b2" stroke="#e0f2f1" stroke-width="0.5" />
          <!-- Hair (Blond/Brown) -->
          <path d="M -8 -26 C -8 -30, 8 -30, 8 -26 C 9 -22, -9 -22, -8 -26 Z" fill="#ffb74d" />
          
          <!-- Feathered Hat -->
          <path d="M -11 -28 C -11 -34, 11 -34, 11 -28 Z" fill="#263238" />
          <path d="M 4 -34 Q 18 -46, 12 -33 Z" fill="#e23d3d" /> <!-- Red feather -->
        </g>
      `
    },
    11: { // Caballo (Knight riding a rearing horse)
      name: 'CABALLO',
      getGraphic: (color, suit) => `
        <g transform="translate(100, 140) scale(0.95)">
          <!-- Horse Tail -->
          <path d="M -30 22 C -45 35, -35 55, -28 65" fill="none" stroke="#4e342e" stroke-width="5" stroke-linecap="round" />
          
          <!-- Rearing Horse Body -->
          <path d="M -26 45 C -26 35, -20 28, -22 15 C -24 -2, -18 -18, 5 -18 C 18 -18, 28 -10, 24 15 C 22 28, 26 40, 22 45 L 14 45 L 16 28 L -14 28 L -16 45 Z" fill="#8d6e63" stroke="#4e342e" stroke-width="2" />
          
          <!-- Horse Head and Neck -->
          <path d="M 5 -18 C 12 -28, 25 -32, 28 -20 C 30 -10, 22 -6, 16 -12 C 12 -16, 5 -18, 5 -18 Z" fill="#8d6e63" stroke="#4e342e" stroke-width="1.8" />
          <path d="M 24 -24 Q 28 -34, 20 -28" fill="none" stroke="#4e342e" stroke-width="2.5" /> <!-- Ears -->
          <!-- Mane -->
          <path d="M 5 -18 Q 18 -12, 12 5 M 8 -8 Q 18 -2, 14 12" fill="none" stroke="#4e342e" stroke-width="2" />
          
          <!-- Front Legs (Raised) -->
          <path d="M 22 -3 Q 36 -6, 32 6 L 27 2" fill="none" stroke="#8d6e63" stroke-width="6.5" stroke-linecap="round" />
          <path d="M 18 -8 Q 32 -10, 28 2 L 23 -2" fill="none" stroke="#8d6e63" stroke-width="6.5" stroke-linecap="round" />
          
          <!-- Hind Legs -->
          <path d="M -22 35 L -26 58 L -34 58 L -30 63 L -18 63 L -16 35 Z" fill="#705247" stroke="#4e342e" stroke-width="1" />
          <path d="M 20 35 L 16 58 L 8 58 L 12 63 L 26 63 L 22 35 Z" fill="#705247" stroke="#4e342e" stroke-width="1" />
          
          <!-- Rider (Knight) -->
          <!-- Torso -->
          <path d="M -6 -8 L 8 -8 L 5 -25 L -9 -25 Z" fill="${color}" stroke="#212121" stroke-width="1" />
          <!-- Knight Helmet -->
          <circle cx="-1" cy="-30" r="6" fill="#cfd8dc" stroke="#455a64" stroke-width="1" />
          <path d="M -7 -30 L 5 -30 L 3 -26 L -5 -26 Z" fill="#ffd54f" /> <!-- Visor -->
          <path d="M -1 -36 Q 8 -46, 2 -35 Z" fill="#ff9800" /> <!-- Plume -->
          <!-- Legs of Rider -->
          <path d="M -10 -8 Q -16 6 -8 24" fill="none" stroke="#37474f" stroke-width="5" stroke-linecap="round" />
        </g>
      `
    },
    12: { // Rey (Standing King with scepter and crown)
      name: 'REY',
      getGraphic: (color, suit) => `
        <g transform="translate(100, 150) scale(1.12)">
          <!-- Royal Mantle (Back) -->
          <path d="M -25 -10 L 25 -10 C 35 25, 30 50, 22 52 L -22 52 C -30 50, -35 25, -25 -10 Z" fill="#3e2723" opacity="0.75" stroke="#271c19" stroke-width="1" />
          <path d="M -25 -10 L 25 -10 L 25 -6 L -25 -6 Z" fill="#ffd54f" /> <!-- Fur collar -->
          
          <!-- Royal Robe / Tunic -->
          <path d="M -20 -8 C -20 -8, -25 20, -18 50 L 18 50 C 25 20, 20 -8, 20 -8 Z" fill="${color}" stroke="#111" stroke-width="1.2" />
          <!-- Gold central trim with details -->
          <path d="M -4 -8 L 4 -8 L 5 50 L -5 50 Z" fill="#ffd54f" />
          <circle cx="0" cy="5" r="2" fill="#e23d3d" />
          <circle cx="0" cy="20" r="2" fill="#4caf50" />
          <circle cx="0" cy="35" r="2" fill="#e23d3d" />
          
          <!-- Crown (Golden with spikes) -->
          <path d="M -14 -27 L 14 -27 L 11 -18 L 0 -30 L -11 -18 Z" fill="#ffd54f" stroke="#b8860b" stroke-width="1.5" />
          <circle cx="-14" cy="-27" r="1.5" fill="#e23d3d" />
          <circle cx="0" cy="-30" r="2" fill="#ffeb3b" />
          <circle cx="14" cy="-27" r="1.5" fill="#e23d3d" />
          
          <!-- Head and Beard -->
          <circle cx="0" cy="-15" r="7" fill="#ffe0b2" />
          <path d="M -7 -13 Q 0 -4 7 -13 L 5 -3 L -5 -3 Z" fill="#ffffff" stroke="#cfd8dc" stroke-width="0.8" /> <!-- White Beard -->
          <path d="M -8 -16 Q 0 -10 8 -16" fill="none" stroke="#ffb74d" stroke-width="2.5" /> <!-- Hair locks -->
          
          <!-- Arms -->
          <path d="M -20 -8 Q -28 10 -20 25" fill="none" stroke="#ffd54f" stroke-width="4.5" stroke-linecap="round" />
          <path d="M 20 -8 Q 28 10 20 25" fill="none" stroke="#ffd54f" stroke-width="4.5" stroke-linecap="round" />
          
          <!-- Scepter / Wand -->
          <line x1="-24" y1="30" x2="-14" y2="-5" stroke="#ffd54f" stroke-width="2.5" stroke-linecap="round" />
          <path d="M -14 -5 C -17 -8, -11 -8, -14 -5 Z" fill="#ffeb3b" stroke="#b8860b" />
          <circle cx="-14" cy="-5" r="3" fill="#e23d3d" />
        </g>
      `
    }
  };

  // Helper: Generates traditional "La Pinta" border breaks
  function createPintaBorder(suit) {
    const s = suit.toLowerCase();
    
    // Left & Right lines are always solid
    let paths = `
      <!-- Left & Right solid border frames -->
      <line x1="10" y1="20" x2="10" y2="280" stroke="#b0bec5" stroke-width="1.5" />
      <line x1="190" y1="20" x2="190" y2="280" stroke="#b0bec5" stroke-width="1.5" />
      <!-- Rounded Corners -->
      <path d="M 10 20 Q 10 10 20 10" fill="none" stroke="#b0bec5" stroke-width="1.5" />
      <path d="M 190 20 Q 190 10 180 10" fill="none" stroke="#b0bec5" stroke-width="1.5" />
      <path d="M 10 280 Q 10 290 20 290" fill="none" stroke="#b0bec5" stroke-width="1.5" />
      <path d="M 190 280 Q 190 290 180 290" fill="none" stroke="#b0bec5" stroke-width="1.5" />
    `;

    if (s === 'oros') {
      // OROS: Solid frame (no breaks)
      paths += `
        <line x1="20" y1="10" x2="180" y2="10" stroke="#b0bec5" stroke-width="1.5" />
        <line x1="20" y1="290" x2="180" y2="290" stroke="#b0bec5" stroke-width="1.5" />
      `;
    } else if (s === 'copas') {
      // COPAS: 1 break in the middle of top and bottom
      paths += `
        <!-- Top with 1 break -->
        <line x1="20" y1="10" x2="85" y2="10" stroke="#b0bec5" stroke-width="1.5" />
        <line x1="115" y1="10" x2="180" y2="10" stroke="#b0bec5" stroke-width="1.5" />
        <!-- Bottom with 1 break -->
        <line x1="20" y1="290" x2="85" y2="290" stroke="#b0bec5" stroke-width="1.5" />
        <line x1="115" y1="290" x2="180" y2="290" stroke="#b0bec5" stroke-width="1.5" />
      `;
    } else if (s === 'espadas') {
      // ESPADAS: 2 breaks
      paths += `
        <!-- Top with 2 breaks -->
        <line x1="20" y1="10" x2="60" y2="10" stroke="#b0bec5" stroke-width="1.5" />
        <line x1="85" y1="10" x2="115" y2="10" stroke="#b0bec5" stroke-width="1.5" />
        <line x1="140" y1="10" x2="180" y2="10" stroke="#b0bec5" stroke-width="1.5" />
        <!-- Bottom with 2 breaks -->
        <line x1="20" y1="290" x2="60" y2="290" stroke="#b0bec5" stroke-width="1.5" />
        <line x1="85" y1="290" x2="115" y2="290" stroke="#b0bec5" stroke-width="1.5" />
        <line x1="140" y1="290" x2="180" y2="290" stroke="#b0bec5" stroke-width="1.5" />
      `;
    } else if (s === 'bastos') {
      // BASTOS: 3 breaks
      paths += `
        <!-- Top with 3 breaks -->
        <line x1="20" y1="10" x2="45" y2="10" stroke="#b0bec5" stroke-width="1.5" />
        <line x1="60" y1="10" x2="90" y2="10" stroke="#b0bec5" stroke-width="1.5" />
        <line x1="110" y1="10" x2="140" y2="10" stroke="#b0bec5" stroke-width="1.5" />
        <line x1="155" y1="10" x2="180" y2="10" stroke="#b0bec5" stroke-width="1.5" />
        <!-- Bottom with 3 breaks -->
        <line x1="20" y1="290" x2="45" y2="290" stroke="#b0bec5" stroke-width="1.5" />
        <line x1="60" y1="290" x2="90" y2="290" stroke="#b0bec5" stroke-width="1.5" />
        <line x1="110" y1="290" x2="140" y2="290" stroke="#b0bec5" stroke-width="1.5" />
        <line x1="155" y1="290" x2="180" y2="290" stroke="#b0bec5" stroke-width="1.5" />
      `;
    }
    return paths;
  }

  // Master function to generate card SVG markup
  function createCardSVG(suit, number, options = {}) {
    const isFlipped = options.flipped || false;
    const isSelected = options.selected || false;
    const customClass = options.class || '';

    let content = '';

    if (isFlipped) {
      // Card Back (Traditional green diamond grid)
      content = `
        <!-- Card Back -->
        <rect x="2" y="2" width="196" height="296" rx="14" ry="14" fill="#1b5e20" stroke="#0c2510" stroke-width="3" />
        <!-- Intricate pattern -->
        <rect x="10" y="10" width="180" height="280" rx="10" ry="10" fill="none" stroke="#81c784" stroke-width="1.8" stroke-dasharray="6,4" />
        <!-- Center diamond badge -->
        <path d="M 100 80 L 150 150 L 100 220 L 50 150 Z" fill="#2e7d32" stroke="#81c784" stroke-width="2" />
        <circle cx="100" cy="150" r="15" fill="#81c784" />
        <circle cx="100" cy="150" r="6" fill="#1b5e20" />
      `;
    } else {
      const suitInfo = SUITS[suit.toLowerCase()];
      if (!suitInfo) return '';

      const color = suitInfo.color;
      const suitSymbol = suitInfo.getSymbol(1);

      // Card Face Base
      content = `
        <!-- Card Base -->
        <rect x="2" y="2" width="196" height="296" rx="14" ry="14" fill="#ffffff" stroke="#cfd8dc" stroke-width="2.5" />
        <!-- La Pinta border breaks -->
        ${createPintaBorder(suit)}
      `;

      // Top-Left Corner Index
      content += `
        <g transform="translate(18, 22)">
          <text x="0" y="10" font-family="Georgia, serif" font-weight="bold" font-size="22" fill="${color}" text-anchor="middle">${number}</text>
          <g transform="translate(-10, 16) scale(0.2)">
            ${suitSymbol}
          </g>
        </g>
      `;

      // Bottom-Right Corner Index (Rotated)
      content += `
        <g transform="translate(182, 278) rotate(180)">
          <text x="0" y="10" font-family="Georgia, serif" font-weight="bold" font-size="22" fill="${color}" text-anchor="middle">${number}</text>
          <g transform="translate(-10, 16) scale(0.2)">
            ${suitSymbol}
          </g>
        </g>
      `;

      // Center Elements
      if (number >= 10) {
        // Court Card (Sota, Caballo, Rey) with custom graphics
        const court = COURT_GRAPHICS[number];
        if (court) {
          content += court.getGraphic(color, suit);
          
          // Label at the bottom center
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

    // Interactive selections style
    const selectedStyle = isSelected ? 'box-shadow: 0 0 20px #ffeb3b; transform: translateY(-18px); transition: all 0.25s;' : 'transition: all 0.25s;';
    const borderHighlight = isSelected ? 'stroke="#ffeb3b" stroke-width="4"' : '';

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" class="card-svg ${customClass} ${isSelected ? 'selected' : ''}" style="width: 100%; height: 100%; display: block; ${selectedStyle}">
        <defs>
          <radialGradient id="goldGradient" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
            <stop offset="0%" stop-color="#fffde7" />
            <stop offset="60%" stop-color="#ffd54f" />
            <stop offset="100%" stop-color="#ffb300" />
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
