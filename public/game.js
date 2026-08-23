// Game Client for Canary Card Games (Envido & Tute)
const socket = io();

// Client State
let myName = '';
let mySeat = null;
let myTeam = null;
let myRole = ''; // 'director' or 'teammate' (for Envido)
let selectedCard = null;
let roomState = null;
let roomId = '';

// DOM Elements
const lobbyScreen = document.getElementById('lobby-screen');
const gameScreen = document.getElementById('game-screen');
const playerNameInput = document.getElementById('player-name');
const roomLinkInput = document.getElementById('room-link');
const btnCopyLink = document.getElementById('btn-copy-link');
const selectGameType = document.getElementById('select-game-type');
const selectEnvidoPlayers = document.getElementById('select-envido-players');
const envidoPlayersGroup = document.getElementById('envido-players-group');
const seatsContainer = document.getElementById('seats-container');
const btnStartGame = document.getElementById('btn-start-game');

// Game screen elements
const btnLeaveRoom = document.getElementById('btn-leave-room');
const infoGameType = document.getElementById('info-game-type');
const teamBadge = document.getElementById('team-badge');
const infoTeam = document.getElementById('info-team');
const turnIndicator = document.getElementById('turn-indicator');
const viraCardSlot = document.getElementById('vira-card');
const deckCountLabel = document.getElementById('deck-count');
const tableSeatsContainer = document.getElementById('table-seats');
const pokerTable = document.querySelector('.poker-table');

// Scores
const scoreboardEnvido = document.getElementById('scoreboard-envido');
const scoreEnvidoA = document.getElementById('score-envido-a');
const scoreEnvidoB = document.getElementById('score-envido-b');
const scoreboardTute = document.getElementById('scoreboard-tute');
const tuteScoresList = document.getElementById('tute-scores-list');

// Signs Panel
const signsPanel = document.getElementById('signs-panel');
const directorNameLabel = document.getElementById('director-name');
const isDirectorLabel = document.getElementById('is-director-label');
const playerSignsControls = document.getElementById('player-signs-controls');
const directorControls = document.getElementById('director-controls');
const teamSecretLog = document.getElementById('team-secret-log');

// Tute Panel
const tuteDeclarationsPanel = document.getElementById('tute-declarations-panel');
const btnTute40 = document.getElementById('btn-tute-40');
const btnTute20 = document.getElementById('btn-tute-20');
const btnTuteDeclare = document.getElementById('btn-tute-declarar');

// Chat & Log
const gameLog = document.getElementById('game-log');
const chatInput = document.getElementById('chat-input');
const btnSendChat = document.getElementById('btn-send-chat');

// Player Hand
const playerHandContainer = document.getElementById('player-hand');
const btnPlayCard = document.getElementById('btn-play-card');
const playerRoleIndicator = document.getElementById('player-role-indicator');

// INITIALIZE ROOM ID FROM URL
function initRoom() {
  const urlParams = new URLSearchParams(window.location.search);
  let room = urlParams.get('room');
  if (!room) {
    // Generate a random 5-letter room code
    room = Math.random().toString(36).substring(2, 7).toUpperCase();
    window.history.replaceState({}, '', '?room=' + room);
  }
  roomId = room.toUpperCase();
  roomLinkInput.value = window.location.href;

  // Retrieve saved name
  const savedName = localStorage.getItem('cartas_player_name');
  if (savedName) {
    playerNameInput.value = savedName;
    myName = savedName;
  } else {
    // Generate a guest name
    myName = `Jugador_${Math.floor(Math.random() * 900) + 100}`;
    playerNameInput.value = myName;
  }

  // Join Room via websocket
  socket.emit('join_room', { roomId, name: myName });
}

// SAVE NAME AND UPDATE LOBBY
playerNameInput.addEventListener('change', () => {
  const name = playerNameInput.value.trim();
  if (name.length > 0) {
    myName = name;
    localStorage.setItem('cartas_player_name', name);
    // If sitting down, re-announce seat
    if (mySeat !== null) {
      socket.emit('take_seat', { roomId, name: myName, seatIndex: mySeat });
    }
  }
});

// COPY LINK TO CLIPBOARD
btnCopyLink.addEventListener('click', () => {
  roomLinkInput.select();
  roomLinkInput.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(roomLinkInput.value)
    .then(() => {
      btnCopyLink.innerText = 'Copiado';
      setTimeout(() => btnCopyLink.innerText = 'Copiar', 2000);
    });
});

function updateLobbyConfigUI(gameType, maxPlayers) {
  selectGameType.value = gameType;
  
  // Re-populate player count options dynamically
  selectEnvidoPlayers.innerHTML = '';
  if (gameType === 'envido') {
    selectEnvidoPlayers.innerHTML = `
      <option value="4">4 Jugadores (2 vs 2)</option>
      <option value="6">6 Jugadores (3 vs 3)</option>
    `;
  } else {
    selectEnvidoPlayers.innerHTML = `
      <option value="2">2 Jugadores</option>
      <option value="3">3 Jugadores</option>
    `;
  }
  
  selectEnvidoPlayers.value = maxPlayers;
}

// CONFIG CHANGE HANDLERS
selectGameType.addEventListener('change', () => {
  const gameType = selectGameType.value;
  const maxPlayers = gameType === 'envido' ? 4 : 2; // Default to 2 for Tute, 4 for Envido
  
  updateLobbyConfigUI(gameType, maxPlayers);
  socket.emit('change_config', { 
    roomId, 
    gameType, 
    maxPlayers 
  });
});

selectEnvidoPlayers.addEventListener('change', () => {
  const gameType = selectGameType.value;
  const maxPlayers = selectEnvidoPlayers.value;
  
  socket.emit('change_config', { 
    roomId, 
    gameType, 
    maxPlayers 
  });
});

// RENDER SEATS IN LOBBY
function renderLobbySeats(maxPlayers, players) {
  seatsContainer.innerHTML = '';
  for (let i = 0; i < maxPlayers; i++) {
    const player = players[i];
    const seatBtn = document.createElement('button');
    seatBtn.className = 'seat-btn';
    
    let label = `Asiento ${i + 1}`;
    let sub = 'Vacío - Haz clic para sentarte';
    let teamName = '';

    if (player) {
      seatBtn.classList.add('taken');
      label = player.name;
      sub = player.socketId === socket.id ? 'Tú (Listo)' : 'Listo';
      
      if (player.team) {
        seatBtn.classList.add(player.team === 'A' ? 'team-a' : 'team-b');
        teamName = `Equipo ${player.team}`;
        if (player.isDirector) {
          teamName += ' - Director';
        }
      }

      if (player.socketId === socket.id) {
        seatBtn.classList.add('my-seat');
        mySeat = i;
        myTeam = player.team;
        myRole = player.isDirector ? 'director' : 'teammate';
      }
    }

    seatBtn.innerHTML = `
      <span class="seat-label">${label}</span>
      <span class="role-desc">${sub}</span>
      ${teamName ? `<span class="team-name">${teamName}</span>` : ''}
    `;

    // Click to sit
    if (!player) {
      seatBtn.addEventListener('click', () => {
        const name = playerNameInput.value.trim() || myName;
        socket.emit('take_seat', { roomId, name, seatIndex: i });
      });
    }

    seatsContainer.appendChild(seatBtn);
  }

  // Manage Start Game button
  const fullSeats = players.filter(p => p !== null).length;
  btnStartGame.disabled = (fullSeats !== maxPlayers);
  if (fullSeats === maxPlayers) {
    btnStartGame.innerText = 'Comenzar Partida';
    btnStartGame.classList.add('ready');
  } else {
    btnStartGame.innerText = `Esperando jugadores (${fullSeats}/${maxPlayers})...`;
    btnStartGame.classList.remove('ready');
  }
}

// START GAME BUTTON CLICK
btnStartGame.addEventListener('click', () => {
  socket.emit('start_game', { roomId });
});

// LEAVE GAME ROOM
btnLeaveRoom.addEventListener('click', () => {
  window.location.reload();
});

// LOG MESSAGE PRINTER
function logMsg(text, type = 'chat') {
  const msgDiv = document.createElement('div');
  msgDiv.className = `log-msg ${type}`;
  msgDiv.innerText = text;
  gameLog.appendChild(msgDiv);
  gameLog.scrollTop = gameLog.scrollHeight;
}

// TEAM SECRET LOG MESSAGE PRINTER
function teamLogMsg(text, type = 'secret') {
  const msgDiv = document.createElement('div');
  msgDiv.className = `log-msg ${type}`;
  msgDiv.innerText = text;
  teamSecretLog.appendChild(msgDiv);
  teamSecretLog.scrollTop = teamSecretLog.scrollHeight;
}

// WEBSOCKET LISTENERS FOR CHAT LOGS
socket.on('log_message', (msg) => {
  logMsg(msg.text, msg.type);
});

socket.on('team_log', (msg) => {
  teamLogMsg(msg.text, msg.type);
});

// SEND PUBLIC CHAT
function sendChat() {
  const message = chatInput.value.trim();
  if (message.length > 0) {
    socket.emit('chat_message', { roomId, message });
    chatInput.value = '';
  }
}
btnSendChat.addEventListener('click', sendChat);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChat();
});

// RECEIVING SIGNS & ORDERS (Envido only)
socket.on('receive_sign', ({ senderName, signName }) => {
  // Visual splash or alert for director
  alertFlash(`👀 Seña de ${senderName}: ¡${signName.toUpperCase()}!`);
});

socket.on('receive_order', ({ directorName, orderText }) => {
  // Visual banner for teammates
  alertFlash(`⚠️ Orden del Director (${directorName}): "${orderText.toUpperCase()}"`);
});

// Visual flash/notification alert overlay
function alertFlash(text) {
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = '10%';
  overlay.style.left = '50%';
  overlay.style.transform = 'translate(-50%, -50%)';
  overlay.style.background = 'rgba(0,0,0,0.85)';
  overlay.style.color = '#ffeb3b';
  overlay.style.padding = '12px 24px';
  overlay.style.borderRadius = '8px';
  overlay.style.border = '2px solid #ffeb3b';
  overlay.style.boxShadow = '0 0 15px rgba(255,235,59,0.5)';
  overlay.style.zIndex = '999';
  overlay.style.fontSize = '1.1rem';
  overlay.style.fontWeight = 'bold';
  overlay.style.pointerEvents = 'none';
  overlay.style.transition = 'all 0.3s';
  overlay.innerText = text;
  
  document.body.appendChild(overlay);
  
  setTimeout(() => {
    overlay.style.opacity = '0';
    setTimeout(() => overlay.remove(), 300);
  }, 2500);
}

// Get readable Spanish card name (with point values for Tute)
function getCardNameSpanish(card) {
  if (!card) return '';
  const suitNames = {
    oros: 'Oros',
    copas: 'Copas',
    espadas: 'Espadas',
    bastos: 'Bastos'
  };
  const numberNames = {
    1: 'As',
    2: 'Dos',
    3: 'Tres',
    4: 'Cuatro',
    5: 'Cinco',
    6: 'Seis',
    7: 'Siete',
    10: 'Sota',
    11: 'Caballo',
    12: 'Rey'
  };
  
  let ptsStr = '';
  if (roomState && roomState.gameType === 'tute') {
    let pts = 0;
    if (roomState.maxPlayers === 2) {
      if (card.number === 1) pts = 11;
      else if (card.number === 2) pts = 10;
      else if (card.number === 12) pts = 4;
      else if (card.number === 11) pts = 3;
      else if (card.number === 10) pts = 2;
    } else {
      if (card.number === 1) pts = 11;
      else if (card.number === 3) pts = 10;
      else if (card.number === 12) pts = 4;
      else if (card.number === 11) pts = 3;
      else if (card.number === 10) pts = 2;
    }
    ptsStr = ` (${pts} pts)`;
  }
  
  const numName = numberNames[card.number] || card.number;
  const suitName = suitNames[card.suit.toLowerCase()] || card.suit;
  return `${numName} de ${suitName}${ptsStr}`;
}

// MAIN ROOM STATE SYNCHRONIZATION
socket.on('room_state', ({ gameType, maxPlayers, players, gameState }) => {
  roomState = { gameType, maxPlayers, players, gameState };
  
  // Find self seat in players array
  const me = players.find(p => p && p.socketId === socket.id);
  if (me) {
    mySeat = me.seat;
    myTeam = me.team;
    myRole = me.isDirector ? 'director' : 'teammate';
  } else {
    mySeat = null;
    myTeam = null;
    myRole = '';
  }

  // LOBBY VS GAME SCREEN
  if (gameState.status === 'lobby') {
    lobbyScreen.classList.remove('hidden');
    gameScreen.classList.add('hidden');
    
    // Config elements editable
    selectGameType.disabled = false;
    selectEnvidoPlayers.disabled = false;
    updateLobbyConfigUI(gameType, maxPlayers);

    renderLobbySeats(maxPlayers, players);
  } else {
    // IN GAME!
    lobbyScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');

    renderGameBoard(gameType, maxPlayers, players, gameState);
  }
});

// RENDERING GAMEPLAY BOARD
function renderGameBoard(gameType, maxPlayers, players, gameState) {
  // 1. Setup Header labels
  infoGameType.innerText = gameType === 'envido' ? `Envido Canario (${maxPlayers} jug.)` : `Tute (${maxPlayers} jugadores)`;
  
  if (myTeam) {
    teamBadge.style.display = 'inline-block';
    infoTeam.innerText = `Equipo ${myTeam} - ${myRole === 'director' ? 'Director' : 'Jugador'}`;
  } else {
    teamBadge.style.display = 'none';
  }

  // 2. Scoreboards
  if (gameType === 'envido') {
    scoreboardEnvido.style.display = 'flex';
    scoreboardTute.style.display = 'none';
    scoreEnvidoA.innerText = gameState.scores.teamA;
    scoreEnvidoB.innerText = gameState.scores.teamB;
  } else {
    scoreboardEnvido.style.display = 'none';
    scoreboardTute.style.display = 'flex';
    
    tuteScoresList.innerHTML = '';
    players.forEach(p => {
      if (!p) return;
      const scoreItem = document.createElement('div');
      scoreItem.className = 'tute-score-item';
      
      const matchDeafeats = gameState.tuteMatchPoints[p.seat] || 0;
      const roundScore = gameState.tuteRoundScores[p.seat] || 0;
      
      // Draw red dots/crosses for defeat points (porotos)
      let defeatsStr = '⚪⚪⚪';
      if (matchDeafeats === 1) defeatsStr = '🔴⚪⚪';
      if (matchDeafeats === 2) defeatsStr = '🔴🔴⚪';
      if (matchDeafeats >= 3) defeatsStr = '🔴🔴🔴';

      scoreItem.innerHTML = `
        <span class="tute-score-name">${p.name}</span>
        <span class="tute-score-pts">${roundScore} pts</span>
        <span style="font-size: 0.65rem;">${defeatsStr}</span>
      `;
      tuteScoresList.appendChild(scoreItem);
    });
  }

  // 3. Turn Indicator
  const currentTurnPlayer = players[gameState.currentTurn];
  if (gameState.status === 'game_end') {
    turnIndicator.innerText = 'Partida Finalizada';
    turnIndicator.style.background = '#d84315';
  } else {
    if (gameState.currentTurn === mySeat) {
      turnIndicator.innerText = '★ ¡TU TURNO! ★';
      turnIndicator.style.background = '#e65100';
    } else {
      turnIndicator.innerText = currentTurnPlayer ? `Turno de: ${currentTurnPlayer.name}` : 'Esperando...';
      turnIndicator.style.background = '#1b5e20';
    }
  }

  // 4. Center Cards (Deck & Vira)
  deckCountLabel.innerText = gameState.deckCount || 0;
  
  if (gameState.viraCard) {
    viraCardSlot.innerHTML = window.createCardSVG(gameState.viraCard.suit, gameState.viraCard.number);
    const viraSvg = viraCardSlot.firstElementChild;
    if (viraSvg) {
      viraSvg.style.cursor = 'pointer';
      viraSvg.addEventListener('click', () => {
        alertFlash(`📢 Triunfo (Vira): ${getCardNameSpanish(gameState.viraCard)}`);
      });
    }
  } else {
    viraCardSlot.innerHTML = '';
  }

  // 5. Render Seating spots and played cards
  pokerTable.className = `poker-table players-${maxPlayers}`;
  tableSeatsContainer.innerHTML = '';

  for (let i = 0; i < maxPlayers; i++) {
    const player = players[i];
    if (!player) continue;

    const isTurn = (gameState.currentTurn === i && gameState.status === 'playing');
    const played = gameState.playedCards.find(pc => pc.seat === i);

    const spotDiv = document.createElement('div');
    spotDiv.className = `player-spot spot-${i}`;
    if (isTurn) spotDiv.classList.add('current-turn');
    if (player.team) spotDiv.classList.add(player.team === 'A' ? 'team-a' : 'team-b');

    // Initials
    const initials = player.name.substring(0, 2).toUpperCase();
    
    // Director/team role badge text
    let roleBadge = '';
    if (gameType === 'envido' && player.team) {
      roleBadge = player.isDirector ? `<span class="role-tag">Dir</span>` : `<span class="role-tag">Jug</span>`;
    }

    // Check if player has won any tricks in this round (helpful for Tute cantos)
    const wonTricksCount = gameState.tricks.filter(t => t.winnerSeat === i).length;
    const trickWinsBadge = wonTricksCount > 0 ? `<div style="font-size:0.65rem; color:#ffd54f;">Bazas: ${wonTricksCount}</div>` : '';

    spotDiv.innerHTML = `
      <div class="player-avatar">
        ${initials}
        ${roleBadge}
      </div>
      <div class="player-name">${player.name}</div>
      ${trickWinsBadge}
      <div class="played-card-slot" id="played-card-seat-${i}">
        <!-- Played card rendered here -->
      </div>
    `;

    tableSeatsContainer.appendChild(spotDiv);

    // If player played a card in this trick, render it
    if (played) {
      const slot = document.getElementById(`played-card-seat-${i}`);
      if (slot) {
        slot.innerHTML = window.createCardSVG(played.card.suit, played.card.number);
        const playedSvg = slot.firstElementChild;
        if (playedSvg) {
          playedSvg.style.cursor = 'pointer';
          playedSvg.addEventListener('click', () => {
            alertFlash(`🃏 Carta de ${player.name}: ${getCardNameSpanish(played.card)}`);
          });
        }
      }
    }
  }

  // 6. Sidebar Panels toggle
  // Envido signs
  if (gameType === 'envido' && myTeam !== null) {
    signsPanel.classList.remove('hidden');
    
    const partnerDirector = players.find(p => p && p.team === myTeam && p.isDirector);
    directorNameLabel.innerText = partnerDirector ? partnerDirector.name : 'Ninguno';

    if (myRole === 'director') {
      isDirectorLabel.classList.remove('hidden');
      directorControls.classList.remove('hidden');
      playerSignsControls.classList.add('hidden');
    } else {
      isDirectorLabel.classList.add('hidden');
      directorControls.classList.add('hidden');
      playerSignsControls.classList.remove('hidden');
    }
  } else {
    signsPanel.classList.add('hidden');
  }

  // Tute declarations
  if (gameType === 'tute' && mySeat !== null) {
    tuteDeclarationsPanel.classList.remove('hidden');
    checkTuteCantoOptions(gameState);
  } else {
    tuteDeclarationsPanel.classList.add('hidden');
  }

  // 7. Render Player Hand
  renderPlayerHand(gameState);
}

// RENDER PLAYER HAND CARDS
function renderPlayerHand(gameState) {
  playerHandContainer.innerHTML = '';
  
  const hand = gameState.hands[socket.id] || [];
  
  if (mySeat !== null) {
    playerRoleIndicator.innerText = `Tu Asiento: ${mySeat + 1}`;
  } else {
    playerRoleIndicator.innerText = 'Espectador';
  }

  if (hand.length === 0 && gameState.status === 'playing') {
    playerHandContainer.innerHTML = '<span style="color:#666;">Sin cartas en mano</span>';
    btnPlayCard.disabled = true;
    return;
  }

  hand.forEach(card => {
    const cardWrapper = document.createElement('div');
    cardWrapper.style.width = '120px';
    cardWrapper.style.height = '180px';
    
    const isSelected = (selectedCard && selectedCard.suit === card.suit && selectedCard.number === card.number);
    
    cardWrapper.innerHTML = window.createCardSVG(card.suit, card.number, { selected: isSelected });
    
    const svgEl = cardWrapper.firstElementChild;
    
    // Select Card Click
    svgEl.addEventListener('click', () => {
      if (gameState.status !== 'playing') return;
      selectedCard = card;
      renderPlayerHand(gameState); // Redraw hand to show selection border
      alertFlash(`🃏 Has seleccionado: ${getCardNameSpanish(card)}`);
    });

    // Play Card Double-Click
    svgEl.addEventListener('dblclick', () => {
      if (gameState.status !== 'playing' || gameState.currentTurn !== mySeat) return;
      selectedCard = card;
      playSelectedCard();
    });

    playerHandContainer.appendChild(cardWrapper);
  });

  // Enable/Disable Play Card button
  const isMyTurn = (gameState.currentTurn === mySeat && gameState.status === 'playing');
  btnPlayCard.disabled = (!isMyTurn || !selectedCard);
}

// PLAY SELECTED CARD TRIGGER
function playSelectedCard() {
  if (selectedCard && roomState) {
    socket.emit('play_card', { roomId: roomId, card: selectedCard });
    selectedCard = null;
  }
}
btnPlayCard.addEventListener('click', playSelectedCard);

// SIGN SEND TRIGGERS (Envido)
document.querySelectorAll('.btn-sign').forEach(button => {
  button.addEventListener('click', () => {
    const sign = button.getAttribute('data-sign');
    socket.emit('send_sign', { roomId, signName: sign });
  });
});

// ORDER SEND TRIGGERS (Envido Director)
document.querySelectorAll('.btn-order').forEach(button => {
  button.addEventListener('click', () => {
    const orderText = button.getAttribute('data-order');
    socket.emit('send_order', { roomId, orderText });
  });
});

// TUTE CANTOS VALIDATION & TRIGGERS
function checkTuteCantoOptions(gameState) {
  btnTute40.disabled = true;
  btnTute20.disabled = true;
  btnTuteDeclare.disabled = true;

  const hand = gameState.hands[socket.id] || [];
  if (hand.length === 0) return;

  const mySeatIndex = mySeat;
  if (mySeatIndex === null) return;

  // Has player won at least one trick?
  const wonTrick = gameState.tricks.some(t => t.winnerSeat === mySeatIndex);
  if (!wonTrick) return;

  const trumpSuit = gameState.viraCard.suit;

  // Analyze hand for Kings (12) and Knights (11)
  const kings = hand.filter(c => c.number === 12);
  const knights = hand.filter(c => c.number === 11);

  // Check if player has King & Knight of same suit
  const pairSuits = [];
  kings.forEach(k => {
    if (knights.some(kn => kn.suit === k.suit)) {
      pairSuits.push(k.suit);
    }
  });

  // Check already declared suits
  const declaredCantos = gameState.tuteCantos[mySeatIndex] || [];
  const declaredSuits = declaredCantos.map(c => c.suit);

  pairSuits.forEach(suit => {
    if (!declaredSuits.includes(suit)) {
      if (suit === trumpSuit) {
        btnTute40.disabled = false;
        btnTute40.onclick = () => socket.emit('tute_canto', { roomId, cantoType: '40', suit });
      } else {
        btnTute20.disabled = false;
        btnTute20.onclick = () => socket.emit('tute_canto', { roomId, cantoType: '20', suit });
      }
    }
  });

  // Check for Tute (4 Kings or 4 Knights) - only check at start, but can be checked as long as they hold them
  const allKings = hand.filter(c => c.number === 12).length;
  const allKnights = hand.filter(c => c.number === 11).length;

  if (allKings === 4) {
    btnTuteDeclare.disabled = false;
    btnTuteDeclare.onclick = () => socket.emit('tute_declare_victory', { roomId, type: 'reyes' });
  } else if (allKnights === 4) {
    btnTuteDeclare.disabled = false;
    btnTuteDeclare.onclick = () => socket.emit('tute_declare_victory', { roomId, type: 'caballos' });
  }
}

// WEBRTC PEER-TO-PEER VOICE CHAT LOGIC
let voiceStream = null;
const peerConnections = {};
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const btnLobbyVoice = document.getElementById('btn-lobby-voice');
const btnGameVoice = document.getElementById('btn-game-voice');

// Helper to resolve player names for voice status logs
function getPlayerNameBySocketId(socketId) {
  if (roomState && roomState.players) {
    const p = roomState.players.find(player => player && player.socketId === socketId);
    return p ? p.name : 'Jugador';
  }
  return 'Jugador';
}

async function connectVoiceChat() {
  if (voiceStream) return;
  try {
    // Request both camera and microphone
    voiceStream = await navigator.mediaDevices.getUserMedia({ 
      audio: true, 
      video: { width: 240, height: 180, frameRate: 15 } 
    });
    logMsg("🎙️/📷 Cámara y micrófono activados. Te has unido al canal de video.", "system");
    setupLocalVideo();
    
    // Update button visual status
    const buttons = [btnLobbyVoice, btnGameVoice];
    buttons.forEach(btn => {
      if (btn) {
        btn.innerText = '🎙️/📷 Conectado';
        btn.style.background = '#4caf50';
        btn.style.color = 'white';
        btn.disabled = true;
      }
    });

    // Add local tracks to existing peer connections
    for (const peerId in peerConnections) {
      const pc = peerConnections[peerId];
      voiceStream.getTracks().forEach(track => {
        const senders = pc.getSenders();
        const alreadyAdded = senders.some(s => s.track === track);
        if (!alreadyAdded) {
          pc.addTrack(track, voiceStream);
        }
      });
      // Trigger renegotiation
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_signal', { to: peerId, signal: { type: 'offer', sdp: offer.sdp } });
      } catch (e) {
        console.error("Error al renegociar tracks:", e);
      }
    }
    
    socket.emit('voice_ready', { roomId });
  } catch (err) {
    console.warn("Cámara no disponible, intentando solo micrófono:", err);
    try {
      // Fallback: request only microphone
      voiceStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      logMsg("🎙️ Micrófono activado. Te has unido al canal de voz.", "system");
      setupLocalVideo(); // Displays a placeholder/avatar in the video box instead of raw feed
      
      const buttons = [btnLobbyVoice, btnGameVoice];
      buttons.forEach(btn => {
        if (btn) {
          btn.innerText = '🎙️ Voz Conectada';
          btn.style.background = '#4caf50';
          btn.style.color = 'white';
          btn.disabled = true;
        }
      });
      
      for (const peerId in peerConnections) {
        const pc = peerConnections[peerId];
        voiceStream.getTracks().forEach(track => {
          const senders = pc.getSenders();
          const alreadyAdded = senders.some(s => s.track === track);
          if (!alreadyAdded) {
            pc.addTrack(track, voiceStream);
          }
        });
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc_signal', { to: peerId, signal: { type: 'offer', sdp: offer.sdp } });
        } catch (e) {
          console.error("Error al renegociar tracks:", e);
        }
      }
      
      socket.emit('voice_ready', { roomId });
    } catch (err2) {
      console.error("Error al activar micrófono:", err2);
      logMsg("⚠️ Error de permisos: No se pudo acceder al micrófono ni a la cámara.", "system");
    }
  }
}

function setupLocalVideo() {
  const container = document.getElementById('video-container');
  if (!container) return;
  
  const existing = document.getElementById('local-video-wrapper');
  if (existing) existing.remove();
  
  const wrapper = document.createElement('div');
  wrapper.id = 'local-video-wrapper';
  wrapper.className = 'video-wrapper local-video';
  
  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true; // Mute self to prevent echo feedback!
  video.setAttribute('playsinline', 'true');
  video.srcObject = voiceStream;
  
  const label = document.createElement('div');
  label.className = 'video-label';
  label.innerText = `${myName} (Tú)`;
  
  wrapper.appendChild(video);
  wrapper.appendChild(label);
  container.appendChild(wrapper);
}

if (btnLobbyVoice) btnLobbyVoice.addEventListener('click', connectVoiceChat);
if (btnGameVoice) btnGameVoice.addEventListener('click', connectVoiceChat);

// Create peer connection with another client
function createPeerConnection(peerId, isInitiator) {
  const pc = new RTCPeerConnection(rtcConfig);
  pc.iceQueue = [];

  if (voiceStream) {
    voiceStream.getTracks().forEach(track => pc.addTrack(track, voiceStream));
  }
  
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('webrtc_signal', { to: peerId, signal: { type: 'candidate', candidate: event.candidate } });
    }
  };
  
  pc.ontrack = (event) => {
    let wrapper = document.getElementById(`video-wrapper-${peerId}`);
    let videoEl = document.getElementById(`video-peer-${peerId}`);
    const isNew = !wrapper;
    
    if (isNew) {
      const container = document.getElementById('video-container');
      if (container) {
        wrapper = document.createElement('div');
        wrapper.id = `video-wrapper-${peerId}`;
        wrapper.className = 'video-wrapper';
        
        videoEl = document.createElement('video');
        videoEl.id = `video-peer-${peerId}`;
        videoEl.autoplay = true;
        videoEl.setAttribute('playsinline', 'true');
        
        const label = document.createElement('div');
        label.className = 'video-label';
        label.innerText = getPlayerNameBySocketId(peerId);
        
        wrapper.appendChild(videoEl);
        wrapper.appendChild(label);
        container.appendChild(wrapper);
        
        const peerName = getPlayerNameBySocketId(peerId);
        logMsg(`🔊 Conexión multimedia establecida con ${peerName}.`, "system");
      }
    }
    
    if (videoEl) {
      if (event.streams && event.streams[0]) {
        videoEl.srcObject = event.streams[0];
      } else {
        if (!videoEl.srcObject) {
          videoEl.srcObject = new MediaStream();
        }
        videoEl.srcObject.addTrack(event.track);
      }
      
      // Explicitly trigger playback and handle browser restrictions
      videoEl.play().catch(err => {
        console.warn("Autoplay bloqueado por el navegador. Se reproducira al hacer click.", err);
        const playOnInteraction = () => {
          videoEl.play().catch(e => console.error("Fallo de reproduccion manual:", e));
        };
        document.body.addEventListener('click', playOnInteraction, { once: true });
      });
    }
  };
  
  if (isInitiator) {
    setTimeout(async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit('webrtc_signal', { to: peerId, signal: { type: 'offer', sdp: offer.sdp } });
      } catch (err) {
        console.error("Error al crear oferta SDP:", err);
      }
    }, 150);
  }
  
  return pc;
}

// Signaling socket events
socket.on('voice_player_ready', async ({ socketId }) => {
  if (socketId === socket.id) return;
  if (voiceStream) {
    const pc = createPeerConnection(socketId, true);
    peerConnections[socketId] = pc;
  }
});

socket.on('webrtc_signal', async ({ from, signal }) => {
  let pc = peerConnections[from];
  
  if (signal.type === 'offer') {
    if (!pc) {
      pc = createPeerConnection(from, false);
      peerConnections[from] = pc;
    }
    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('webrtc_signal', { to: from, signal: { type: 'answer', sdp: answer.sdp } });
    
    // Process queued candidates
    if (pc.iceQueue && pc.iceQueue.length > 0) {
      for (const cand of pc.iceQueue) {
        await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(e => console.error("Error al añadir candidato en cola:", e));
      }
      pc.iceQueue = [];
    }
    
  } else if (signal.type === 'answer') {
    if (pc) {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
      
      // Process queued candidates
      if (pc.iceQueue && pc.iceQueue.length > 0) {
        for (const cand of pc.iceQueue) {
          await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(e => console.error("Error al añadir candidato en cola:", e));
        }
        pc.iceQueue = [];
      }
    }
  } else if (signal.type === 'candidate') {
    if (pc) {
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)).catch(e => console.error("Error al añadir candidato ICE:", e));
      } else {
        pc.iceQueue.push(signal.candidate);
      }
    }
  }
});

socket.on('disconnect_peer_voice', ({ socketId }) => {
  if (peerConnections[socketId]) {
    peerConnections[socketId].close();
    delete peerConnections[socketId];
  }
  const wrapper = document.getElementById(`video-wrapper-${socketId}`);
  if (wrapper) wrapper.remove();
});

// JOIN INITIAL ROOM ON LOAD
window.onload = () => {
  initRoom();
};
