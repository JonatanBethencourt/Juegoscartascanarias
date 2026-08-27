// SVG Card Generator for Spanish Deck (Baraja Española) - Castilian Pattern
// Exports window.createCardSVG(suit, number, options)

(function () {
  // Suit graphics definition
  const SUITS = {
    oros: {
      color: '#d4af37',
      // Traditional gold coin: Gold gradient with red relief ring, inner star and classical face
      getSymbol: (scale = 1) => `
        <g transform="scale(${scale})">
          <!-- Main Coin outer circle -->
          <circle cx="50" cy="50" r="42" fill="url(#goldGradient)" stroke="#b8860b" stroke-width="1.8" />
          
          <!-- Inner red decorative ring -->
          <circle cx="50" cy="50" r="35" fill="none" stroke="#d50000" stroke-width="1.5" />
          <circle cx="50" cy="50" r="30" fill="none" stroke="#ffd54f" stroke-width="1" stroke-dasharray="2,2" />
          
          <!-- 8-pointed star in the center -->
          <path d="M 50 18 L 53 38 L 74 38 L 57 51 L 64 72 L 50 59 L 36 72 L 43 51 L 26 38 L 47 38 Z" fill="#ffd54f" stroke="#b8860b" stroke-width="1" />
          
          <!-- Sun face / efigie in central medallion -->
          <circle cx="50" cy="48" r="9" fill="url(#goldGradient)" stroke="#b8860b" stroke-width="0.8" />
          <!-- Efigie profile silhouette -->
          <path d="M 47 54 C 47 51, 44 49, 43 47 C 42 45, 43 44, 45 43 Q 43 40, 45 37 C 47 35, 52 35, 54 39 C 56 42, 55 46, 54 49 C 53 52, 53 54, 54 56 Z" fill="#8b6508" />
        </g>
      `
    },
    copas: {
      color: '#e23d3d',
      // Traditional Copas: Detailed goblet, red interior bowl, lid with green and red accents
      getSymbol: (scale = 1) => `
        <g transform="scale(${scale}) translate(50, 50) scale(1.25) translate(-50, -50)">
          <!-- Goblet Base -->
          <path d="M 28 85 L 72 85 L 65 74 L 35 74 Z" fill="#ffca28" stroke="#5d4037" stroke-width="1.5" />
          <path d="M 33 74 C 33 74, 50 78, 67 74 L 67 77 C 67 77, 50 81, 33 77 Z" fill="#d32f2f" />
          
          <!-- Goblet Stem and Ring -->
          <path d="M 45 74 L 55 74 L 53 54 L 47 54 Z" fill="#ffca28" stroke="#5d4037" stroke-width="1.5" />
          <ellipse cx="50" cy="64" rx="8" ry="6" fill="#ffca28" stroke="#5d4037" stroke-width="1" />
          
          <!-- Goblet Bowl (Yellow base, bright red center) -->
          <path d="M 20 25 C 20 56, 80 56, 80 25 Z" fill="#ffca28" stroke="#5d4037" stroke-width="1.5" />
          <path d="M 25 25 C 25 48, 75 48, 75 25 Z" fill="#d32f2f" stroke="#b71c1c" stroke-width="1" />
          <circle cx="50" cy="38" r="4" fill="#ffca28" />
          
          <!-- Decorative Handles -->
          <path d="M 20 30 Q 8 40, 20 48" fill="none" stroke="#ffca28" stroke-width="2.5" stroke-linecap="round" />
          <path d="M 80 30 Q 92 40, 80 48" fill="none" stroke="#ffca28" stroke-width="2.5" stroke-linecap="round" />
          
          <!-- Goblet Lid (Tapa) with green bands and red knob -->
          <path d="M 18 25 C 18 25, 20 12, 50 12 C 80 12, 82 25, 82 25 Z" fill="#ffca28" stroke="#5d4037" stroke-width="1.5" />
          <path d="M 30 18 Q 50 24 70 18" fill="none" stroke="#2e7d32" stroke-width="2" />
          <circle cx="50" cy="7" r="4.5" fill="#d32f2f" stroke="#5d4037" />
        </g>
      `
    },
    espadas: {
      color: '#1976d2',
      // Traditional Espada: Blue-steel rapier, gold curved hilt, red wrapped handle, pommel
      getSymbol: (scale = 1) => `
        <g transform="scale(${scale})">
          <!-- Pommel (Gold with red gem center) -->
          <circle cx="50" cy="95" r="5.5" fill="#ffca28" stroke="#5d4037" stroke-width="1" />
          <circle cx="50" cy="95" r="2.2" fill="#d32f2f" />
          
          <!-- Handle (Red-wire wrapped) -->
          <path d="M 45 81 L 55 81 L 53 93 L 47 93 Z" fill="#d32f2f" stroke="#5d4037" stroke-width="1" />
          <line x1="46" y1="84" x2="54" y2="84" stroke="#ffca28" stroke-width="0.8" />
          <line x1="47" y1="87" x2="53" y2="87" stroke="#ffca28" stroke-width="0.8" />
          <line x1="48" y1="90" x2="52" y2="90" stroke="#ffca28" stroke-width="0.8" />
          
          <!-- Guard (Golden curved crossbar) -->
          <path d="M 22 75 C 22 75, 50 78, 78 75 C 84 75, 84 81, 78 81 C 50 83, 22 81, 22 81 C 16 81, 16 75, 22 75 Z" fill="#ffca28" stroke="#5d4037" stroke-width="1.2" />
          
          <!-- Blade (Polished steel blue with reflection) -->
          <path d="M 46 75 L 47 16 L 50 3 L 53 16 L 54 75 Z" fill="#e3f2fd" stroke="#1976d2" stroke-width="1.5" />
          <path d="M 50 75 L 50 6 L 53 16 L 54 75 Z" fill="#bbdefb" opacity="0.75" /> <!-- Reflection -->
          <line x1="50" y1="75" x2="50" y2="10" stroke="#1976d2" stroke-width="1.2" />
        </g>
      `
    },
    bastos: {
      color: '#4caf50',
      // Traditional Basto: Brown wooden club, wood grain lines, cut knots, green leaves
      getSymbol: (scale = 1) => `
        <g transform="scale(${scale}) translate(50, 50) scale(1.28) translate(-50, -50)">
          <!-- Main Wooden Cudgel Trunk -->
          <path d="M 45 88 C 45 88, 36 38, 41 20 C 43 12, 57 12, 59 20 C 64 38, 55 88, 55 88 Z" fill="#8d6e63" stroke="#4e342e" stroke-width="2" />
          <path d="M 45 88 C 45 88, 39 38, 44 20 C 45 15, 50 15, 52 20 C 55 38, 55 88, 55 88 Z" fill="#a1887f" opacity="0.65" /> <!-- Inner wood light shading -->
          
          <!-- Rings representing cut branch nodes -->
          <ellipse cx="43" cy="44" rx="5" ry="3.5" fill="#d7ccc8" stroke="#5d4037" stroke-width="1.2" />
          <ellipse cx="57" cy="62" rx="5" ry="3.5" fill="#d7ccc8" stroke="#5d4037" stroke-width="1.2" />
          <ellipse cx="44" cy="74" rx="5" ry="3.5" fill="#d7ccc8" stroke="#5d4037" stroke-width="1.2" />
          <ellipse cx="55" cy="30" rx="4.5" ry="3" fill="#d7ccc8" stroke="#5d4037" stroke-width="1.2" />
          
          <!-- Sprouting green leaves -->
          <path d="M 37 32 Q 22 34, 34 23 Z" fill="#4caf50" stroke="#1b5e20" stroke-width="1" />
          <path d="M 63 50 Q 78 52, 66 41 Z" fill="#4caf50" stroke="#1b5e20" stroke-width="1" />
          <path d="M 38 64 Q 23 66, 35 54 Z" fill="#4caf50" stroke="#1b5e20" stroke-width="1" />
          <!-- Leaf highlights -->
          <path d="M 37 32 Q 28 33, 34 27 Z" fill="#81c784" opacity="0.7" />
          <path d="M 63 50 Q 72 51, 66 45 Z" fill="#81c784" opacity="0.7" />
          <path d="M 38 64 Q 29 65, 35 59 Z" fill="#81c784" opacity="0.7" />
        </g>
      `
    }
  };

  // Upright, column-based layouts (standard for Oros and Copas, and As of all suits)
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

  // Traditional crossed & angled layouts for Espadas and Bastos numbers (2 to 7)
  function getLayout(suit, number) {
    const s = suit.toLowerCase();
    const num = parseInt(number);
    
    // For Oros, Copas, or Aces: use standard upright grid layouts
    if (num === 1 || s === 'oros' || s === 'copas') {
      return LAYOUTS[num] || [];
    }

    // For Espadas and Bastos (2 to 7): use traditional crossed/angled layouts
    if (num === 2) {
      return [
        { cx: 100, cy: 150, r: 30, s: 0.8 },
        { cx: 100, cy: 150, r: -30, s: 0.8 }
      ];
    }
    if (num === 3) {
      return [
        { cx: 100, cy: 150, r: 30, s: 0.75 },
        { cx: 100, cy: 150, r: -30, s: 0.75 },
        { cx: 100, cy: 150, r: 0, s: 0.75 }
      ];
    }
    if (num === 4) {
      return [
        { x: 25, y: 45, s: 0.7, r: 25 },
        { x: 95, y: 45, s: 0.7, r: -25 },
        { x: 25, y: 175, s: 0.7, r: -25 },
        { x: 95, y: 175, s: 0.7, r: 25 }
      ];
    }
    if (num === 5) {
      return [
        { x: 25, y: 45, s: 0.65, r: 25 },
        { x: 95, y: 45, s: 0.65, r: -25 },
        { cx: 100, cy: 150, r: 0, s: 0.65 },
        { x: 25, y: 175, s: 0.65, r: -25 },
        { x: 95, y: 175, s: 0.65, r: 25 }
      ];
    }
    if (num === 6) {
      return [
        { x: 25, y: 45, s: 0.65, r: 15 },
        { x: 95, y: 45, s: 0.65, r: -15 },
        { x: 25, y: 110, s: 0.65, r: 15 },
        { x: 95, y: 110, s: 0.65, r: -15 },
        { x: 25, y: 175, s: 0.65, r: -15 },
        { x: 95, y: 175, s: 0.65, r: 15 }
      ];
    }
    if (num === 7) {
      return [
        { x: 25, y: 45, s: 0.65, r: 15 },
        { x: 95, y: 45, s: 0.65, r: -15 },
        { x: 25, y: 110, s: 0.65, r: 15 },
        { x: 95, y: 110, s: 0.65, r: -15 },
        { cx: 100, cy: 112, r: 0, s: 0.65 },
        { x: 25, y: 175, s: 0.65, r: -15 },
        { x: 95, y: 175, s: 0.65, r: 15 }
      ];
    }
    
    return LAYOUTS[num] || [];
  }

  // Human figure silhouettes for Court cards (Sota, Caballo, Rey)
  const COURT_GRAPHICS = {
    10: { // Sota (Standing Page)
      name: 'SOTA',
      getGraphic: (color, suit) => {
        const symbol = SUITS[suit.toLowerCase()].getSymbol(1);
        return `
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
            
            <!-- Arms (one on hip, one holding symbol) -->
            <path d="M -16 -12 C -24 0, -20 10, -14 14" fill="none" stroke="#37474f" stroke-width="4.5" stroke-linecap="round" />
            <path d="M 16 -12 C 24 -10, 26 12, 16 12" fill="none" stroke="#37474f" stroke-width="4.5" stroke-linecap="round" />
            
            <!-- Neck & Face -->
            <rect x="-3" y="-17" width="6" height="6" fill="#ffe0b2" />
            <circle cx="0" cy="-24" r="8" fill="#ffe0b2" stroke="#e0f2f1" stroke-width="0.5" />
            <!-- Hair (Blond/Brown) -->
            <path d="M -8 -26 C -8 -30, 8 -30, 8 -26 C 9 -22, -9 -22, -8 -26 Z" fill="#ffb74d" />
            
            <!-- Feathered Hat -->
            <path d="M -11 -28 C -11 -34, 11 -34, 11 -28 Z" fill="#263238" />
            <path d="M 4 -34 Q 18 -46, 12 -33 Z" fill="#e23d3d" /> <!-- Red feather -->
            
            <!-- Suit Symbol in hand -->
            <g transform="translate(14, -8) scale(0.55)">
              ${symbol}
            </g>
          </g>
        `;
      }
    },
    11: { // Caballo (Majestic Horse Head profile)
      name: 'CABALLO',
      getGraphic: (color, suit) => {
        const symbol = SUITS[suit.toLowerCase()].getSymbol(1);
        return `
          <g transform="translate(100, 142) scale(1.15)">
            <!-- Horse Neck & Head (Facing Left) -->
            <path d="M 22 45 L 22 -15 C 22 -15, 16 -25, 10 -22 C 4 -19, -20 -8, -30 2 C -32 4, -31 8, -27 10 C -22 12, -18 8, -12 8 C -5 20, -10 35, -12 45 Z" fill="#8d6e63" stroke="#4e342e" stroke-width="2" />
            
            <!-- Ears -->
            <path d="M 12 -23 L 17 -40 Q 14 -35, 7 -25 Z" fill="#8d6e63" stroke="#4e342e" stroke-width="1.5" />
            <path d="M 4 -22 L 8 -37 Q 5 -32, -1 -24 Z" fill="#705247" stroke="#4e342e" stroke-width="1.2" />

            <!-- Mane (Hair on back of neck) -->
            <path d="M 22 -15 C 28 -5, 32 15, 30 35 C 30 40, 26 42, 22 42 C 21 20, 18 0, 10 -22 Z" fill="#4e342e" />
            <path d="M 10 -22 Q -2 -18, 5 -12" fill="none" stroke="#4e342e" stroke-width="2.5" /> <!-- Forelock -->

            <!-- Nostril -->
            <ellipse cx="-26" cy="4" rx="2.5" ry="1.5" fill="#4e342e" />

            <!-- Mouth line -->
            <path d="M -28 7 Q -22 9 -18 7" fill="none" stroke="#4e342e" stroke-width="1.5" />

            <!-- Eye -->
            <ellipse cx="-6" cy="-12" rx="4.5" ry="3" fill="white" stroke="#4e342e" stroke-width="1.2" />
            <circle cx="-5" cy="-12" r="2.2" fill="#4e342e" />
            <circle cx="-6" cy="-13" r="0.8" fill="white" />

            <!-- Elegant Bridle and Reins in Gold -->
            <path d="M -23 -1 L -15 -9" stroke="#ffd54f" stroke-width="2" fill="none" /> <!-- Noseband -->
            <path d="M -15 -9 L 7 -19" stroke="#ffd54f" stroke-width="2" fill="none" /> <!-- Cheekpiece -->
            <circle cx="-15" cy="-9" r="2" fill="#cfd8dc" stroke="#455a64" stroke-width="0.8" /> <!-- Bit ring -->
            <path d="M -15 -9 C -12 15, 10 32, 22 18" stroke="#ffd54f" stroke-width="1.5" fill="none" /> <!-- Reins -->

            <!-- Suit Symbol - Placed to the right of the head at scale 0.65 -->
            <g transform="translate(18, -25) scale(0.65)">
              ${symbol}
            </g>
          </g>
        `;
      }
    },
    12: { // Rey (Standing King with scepter and crown)
      name: 'REY',
      getGraphic: (color, suit) => {
        const symbol = SUITS[suit.toLowerCase()].getSymbol(1);
        return `
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
            
            <!-- Crown (Golden with spikes and jewels) -->
            <path d="M -10 -22 L 10 -22 L 8 -18 L -8 -18 Z" fill="#ffd54f" stroke="#b8860b" stroke-width="1" /> <!-- Crown Band -->
            <path d="M -8 -22 L -12 -33 L -3 -25 L 0 -38 L 3 -25 L 12 -33 L 8 -22 Z" fill="#ffd54f" stroke="#b8860b" stroke-width="1.5" /> <!-- Spikes -->
            <circle cx="-12" cy="-33" r="2" fill="#e23d3d" stroke="#b8860b" stroke-width="0.5" /> <!-- Left Red Gem -->
            <circle cx="0" cy="-38" r="2.5" fill="#1976d2" stroke="#b8860b" stroke-width="0.5" /> <!-- Center Blue Gem -->
            <circle cx="12" cy="-33" r="2" fill="#e23d3d" stroke="#b8860b" stroke-width="0.5" /> <!-- Right Red Gem -->
            <circle cx="-4" cy="-20" r="1.2" fill="#2e7d32" /> <!-- Green band gem -->
            <circle cx="4" cy="-20" r="1.2" fill="#e23d3d" /> <!-- Red band gem -->
            
            <!-- Head and Beard -->
            <circle cx="0" cy="-15" r="7" fill="#ffe0b2" />
            <path d="M -7 -13 Q 0 -4 7 -13 L 5 -3 L -5 -3 Z" fill="#ffffff" stroke="#cfd8dc" stroke-width="0.8" /> <!-- White Beard -->
            <path d="M -8 -16 Q 0 -10 8 -16" fill="none" stroke="#ffb74d" stroke-width="2.5" /> <!-- Hair locks -->
            
            <!-- Arms (one holding scepter, one holding symbol) -->
            <path d="M -20 -8 Q -28 10 -20 25" fill="none" stroke="#ffd54f" stroke-width="4.5" stroke-linecap="round" />
            <path d="M 20 -8 Q 28 10 18 18" fill="none" stroke="#ffd54f" stroke-width="4.5" stroke-linecap="round" />
            
            <!-- Scepter / Wand -->
            <line x1="-24" y1="30" x2="-14" y2="-5" stroke="#ffd54f" stroke-width="2.5" stroke-linecap="round" />
            <path d="M -14 -5 C -17 -8, -11 -8, -14 -5 Z" fill="#ffeb3b" stroke="#b8860b" />
            <circle cx="-14" cy="-5" r="3" fill="#e23d3d" />
            
            <!-- Suit Symbol held by King -->
            <g transform="translate(14, 0) scale(0.6)">
              ${symbol}
            </g>
          </g>
        `;
      }
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
          // Central background medallion to provide figure contrast
          content += `
            <!-- Central Medallion for Court Figures -->
            <circle cx="100" cy="142" r="54" fill="#fafafa" stroke="#e0e0e0" stroke-width="1.2" />
            <circle cx="100" cy="142" r="49" fill="none" stroke="#cfd8dc" stroke-width="0.8" stroke-dasharray="2,2" />
          `;
          content += court.getGraphic(color, suit);
          
          // Label at the bottom center
          content += `
            <text x="100" y="260" font-family="'Courier New', monospace" font-weight="bold" font-size="12" fill="${color}" text-anchor="middle" opacity="0.8">${court.name}</text>
          `;
        }
      } else {
        // Number card layouts (1 to 7) - uses crossed layout if Espadas/Bastos
        const layouts = getLayout(suit, number);
        if (layouts) {
          layouts.forEach(layout => {
            if (layout.cx !== undefined) {
              const rotStr = layout.r ? `rotate(${layout.r})` : '';
              content += `
                <g transform="translate(${layout.cx}, ${layout.cy}) ${rotStr} scale(${layout.s}) translate(-50, -50)">
                  ${suitInfo.getSymbol(1)}
                </g>
              `;
            } else {
              // Standard layout using x, y
              const rotStr = layout.r ? `rotate(${layout.r} 50 50)` : (layout.rotate ? `rotate(${layout.rotate} 50 50)` : '');
              content += `
                <g transform="translate(${layout.x}, ${layout.y}) ${rotStr}">
                  ${suitInfo.getSymbol(layout.s)}
                </g>
              `;
            }
          });
        }
      }
    }

    // Interactive selections style
    const selectedStyle = isSelected ? 'box-shadow: 0 0 20px #ffeb3b; transform: translateY(-18px); transition: all 0.25s;' : 'transition: all 0.25s;';
    const borderHighlight = isSelected ? 'stroke="#ffeb3b" stroke-width="4"' : '';

    const suitNames = { oros: 'Oros', copas: 'Copas', espadas: 'Espadas', bastos: 'Bastos' };
    const numberNames = {
      1: 'As', 2: 'Dos', 3: 'Tres', 4: 'Cuatro', 5: 'Cinco', 6: 'Seis', 7: 'Siete',
      10: 'Sota', 11: 'Caballo', 12: 'Rey'
    };
    const sName = suitNames[suit.toLowerCase()] || suit;
    const nName = numberNames[number] || number;
    const cardTitle = isFlipped ? 'Carta boca abajo' : `${nName} de ${sName}`;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" class="card-svg ${customClass} ${isSelected ? 'selected' : ''}" style="width: 100%; height: 100%; display: block; ${selectedStyle}" title="${cardTitle}">
        <title>${cardTitle}</title>
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

  // Helper: Get standalone SVG markup for a suit symbol
  function getSuitSVG(suit, size = 30) {
    const suitInfo = SUITS[suit.toLowerCase()];
    if (!suitInfo) return '';
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="${size}" height="${size}" style="display: inline-block; vertical-align: middle;">
        <defs>
          <radialGradient id="goldGradientSuit" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
            <stop offset="0%" stop-color="#fffde7" />
            <stop offset="60%" stop-color="#ffd54f" />
            <stop offset="100%" stop-color="#ffb300" />
          </radialGradient>
        </defs>
        ${suitInfo.getSymbol(1).replace(/url\(#goldGradient\)/g, 'url(#goldGradientSuit)')}
      </svg>
    `;
  }

  // Play Nine (Golf) card SVG generator
  function createPlayNineCardSVG(value, revealed, options = {}) {
    const isSelected = options.selected || false;
    const customClass = options.class || '';
    let content = '';

    if (!revealed) {
      // Play Nine Card Back
      content = `
        <!-- Card Back -->
        <rect x="2" y="2" width="196" height="296" rx="14" ry="14" fill="#2e7d32" stroke="#1b5e20" stroke-width="3" />
        <!-- Green grid/golf pattern -->
        <rect x="10" y="10" width="180" height="280" rx="10" ry="10" fill="none" stroke="#a5d6a7" stroke-width="1.5" stroke-dasharray="8,6" />
        <!-- Golf ball and tee in center -->
        <g transform="translate(100, 150) scale(1.2)">
          <!-- Tee -->
          <path d="M -4 15 L 4 15 L 2 30 L -2 30 Z" fill="#cfd8dc" stroke="#90a4ae" stroke-width="1" />
          <path d="M -8 15 C -8 10, 8 10, 8 15 Z" fill="#b0bec5" stroke="#90a4ae" stroke-width="1" />
          <!-- Ball -->
          <circle cx="0" cy="-6" r="18" fill="#ffffff" stroke="#cfd8dc" stroke-width="1" />
          <!-- Ball dimples -->
          <circle cx="-8" cy="-12" r="1.5" fill="#cfd8dc" />
          <circle cx="0" cy="-15" r="1.5" fill="#cfd8dc" />
          <circle cx="8" cy="-12" r="1.5" fill="#cfd8dc" />
          <circle cx="-10" cy="-4" r="1.5" fill="#cfd8dc" />
          <circle cx="-2" cy="-6" r="1.5" fill="#cfd8dc" />
          <circle cx="6" cy="-4" r="1.5" fill="#cfd8dc" />
          <circle cx="-6" cy="4" r="1.5" fill="#cfd8dc" />
          <circle cx="2" cy="2" r="1.5" fill="#cfd8dc" />
          <circle cx="8" cy="4" r="1.5" fill="#cfd8dc" />
        </g>
      `;
    } else {
      if (value === -5) {
        // Hole-in-One (-5)
        content = `
          <rect x="2" y="2" width="196" height="296" rx="14" ry="14" fill="#e8f5e9" stroke="#2e7d32" stroke-width="3" />
          <rect x="10" y="10" width="180" height="280" rx="10" ry="10" fill="none" stroke="#2e7d32" stroke-width="1.5" />
          <text x="25" y="32" font-family="'Georgia', serif" font-weight="bold" font-size="20" fill="#2e7d32" text-anchor="middle">-5</text>
          <text x="175" y="278" font-family="'Georgia', serif" font-weight="bold" font-size="20" fill="#2e7d32" text-anchor="middle" transform="rotate(180 175 272)">-5</text>
          <g transform="translate(100, 130) scale(1.1)">
            <ellipse cx="0" cy="40" rx="22" ry="7" fill="#37474f" stroke="#263238" stroke-width="1.5" />
            <line x1="-3" y1="40" x2="-3" y2="-40" stroke="#78909c" stroke-width="2.5" stroke-linecap="round" />
            <path d="M -3 -40 L 22 -28 L -3 -16 Z" fill="#d50000" stroke="#b71c1c" stroke-width="1" />
            <circle cx="10" cy="36" r="6" fill="#ffffff" stroke="#cfd8dc" stroke-width="0.8" />
          </g>
          <text x="100" y="225" font-family="'Courier New', monospace" font-weight="bold" font-size="13" fill="#1b5e20" text-anchor="middle">HOLE IN ONE</text>
          <text x="100" y="265" font-family="'Georgia', serif" font-weight="bold" font-size="34" fill="#d50000" text-anchor="middle">-5</text>
        `;
      } else if (value === 0) {
        // Mulligan (0)
        content = `
          <rect x="2" y="2" width="196" height="296" rx="14" ry="14" fill="#fffde7" stroke="#fbc02d" stroke-width="3" />
          <rect x="10" y="10" width="180" height="280" rx="10" ry="10" fill="none" stroke="#fbc02d" stroke-width="1.5" />
          <text x="25" y="32" font-family="'Georgia', serif" font-weight="bold" font-size="20" fill="#f57f17" text-anchor="middle">0</text>
          <text x="175" y="278" font-family="'Georgia', serif" font-weight="bold" font-size="20" fill="#f57f17" text-anchor="middle" transform="rotate(180 175 272)">0</text>
          <g transform="translate(100, 130) scale(1.1)">
            <path d="M -22 18 L 22 18 L 22 5 L 12 5 L 8 -13 L -12 -13 L -17 5 L -22 5 Z" fill="#cfd8dc" stroke="#90a4ae" stroke-width="1.5" />
            <line x1="-10" y1="-13" x2="-10" y2="-25" stroke="#37474f" stroke-width="1.8" />
            <line x1="6" y1="-13" x2="6" y2="-25" stroke="#37474f" stroke-width="1.8" />
            <path d="M -16 -25 L 12 -25 L 8 -29 L -12 -29 Z" fill="#ffb74d" stroke="#f57c00" stroke-width="1.2" />
            <circle cx="-12" cy="18" r="7" fill="#37474f" stroke="#212121" stroke-width="0.8" />
            <circle cx="12" cy="18" r="7" fill="#37474f" stroke="#212121" stroke-width="0.8" />
            <circle cx="-12" cy="18" r="2.5" fill="#ffffff" />
            <circle cx="12" cy="18" r="2.5" fill="#ffffff" />
          </g>
          <text x="100" y="225" font-family="'Courier New', monospace" font-weight="bold" font-size="13" fill="#f57f17" text-anchor="middle">MULLIGAN</text>
          <text x="100" y="265" font-family="'Georgia', serif" font-weight="bold" font-size="34" fill="#f57f17" text-anchor="middle">0</text>
        `;
      } else {
        // Values 1 to 12
        let numColor = '#2e7d32'; // Green for 1-4
        if (value >= 5 && value <= 8) numColor = '#ef6c00'; // Orange for 5-8
        else if (value >= 9) numColor = '#c62828'; // Red for 9-12

        // Helper to draw mini balls
        let ballsHTML = '';
        const cols = Math.min(value, 6);
        const rows = Math.ceil(value / 6);
        const spacing = 16;
        const startX = -((cols - 1) * spacing) / 2;
        const startY = -((rows - 1) * spacing) / 2;
        for (let i = 0; i < value; i++) {
          const row = Math.floor(i / 6);
          const col = i % 6;
          const x = startX + col * spacing;
          const y = startY + row * spacing;
          ballsHTML += `
            <circle cx="${x}" cy="${y}" r="5" fill="#ffffff" stroke="#b0bec5" stroke-width="0.8" />
            <circle cx="${x - 1}" cy="${y - 1}" r="0.8" fill="#b0bec5" />
          `;
        }

        content = `
          <rect x="2" y="2" width="196" height="296" rx="14" ry="14" fill="#ffffff" stroke="#cfd8dc" stroke-width="2.5" />
          <rect x="10" y="10" width="180" height="280" rx="10" ry="10" fill="none" stroke="${numColor}" stroke-width="1.5" />
          <text x="25" y="32" font-family="'Georgia', serif" font-weight="bold" font-size="20" fill="${numColor}" text-anchor="middle">${value}</text>
          <text x="175" y="278" font-family="'Georgia', serif" font-weight="bold" font-size="20" fill="${numColor}" text-anchor="middle" transform="rotate(180 175 272)">${value}</text>
          <text x="100" y="140" font-family="'Georgia', serif" font-weight="bold" font-size="64" fill="${numColor}" text-anchor="middle">${value}</text>
          <g transform="translate(100, 195)">
            ${ballsHTML}
          </g>
        `;
      }
    }

    const selectedStyle = isSelected ? 'box-shadow: 0 0 20px #ffeb3b; transform: translateY(-18px); transition: all 0.25s;' : 'transition: all 0.25s;';
    const borderHighlight = isSelected ? 'stroke="#ffeb3b" stroke-width="4"' : '';
    const cardTitle = !revealed ? 'Carta boca abajo' : `Carta de valor ${value}`;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 300" class="card-svg ${customClass} ${isSelected ? 'selected' : ''}" style="width: 100%; height: 100%; display: block; ${selectedStyle}" title="${cardTitle}">
        <title>${cardTitle}</title>
        ${content}
        ${borderHighlight ? `<rect x="2" y="2" width="196" height="296" rx="14" ry="14" fill="none" ${borderHighlight} />` : ''}
      </svg>
    `;
  }

  // Attach to window global scope
  window.createCardSVG = createCardSVG;
  window.createPlayNineCardSVG = createPlayNineCardSVG;
  window.getSuitSVG = getSuitSVG;
})();
