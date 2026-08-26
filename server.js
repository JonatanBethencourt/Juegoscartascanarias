const express = require('express');
const http = require('http');
const https = require('https');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3001;

// Metered TURN Server API Configuration
const METERED_SECRET_KEY = process.env.METERED_SECRET_KEY || 'QJJl2tewZkHYKjroweVqkXmywaJHcsS-A3pVrlXIdFF8YmQi';
const METERED_API_URL = process.env.METERED_API_URL || 'https://jonymaike.metered.live/api/v1/turn/credentials';

let cachedIceServers = null;
let lastFetchTime = 0;

function getIceServers() {
  const defaultServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  if (!METERED_SECRET_KEY) {
    return Promise.resolve(defaultServers);
  }

  const now = Date.now();
  if (cachedIceServers && (now - lastFetchTime < 30 * 60 * 1000)) {
    return Promise.resolve(cachedIceServers);
  }

  return new Promise((resolve) => {
    https.get(`${METERED_API_URL}?apiKey=${METERED_SECRET_KEY}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed)) {
            cachedIceServers = [...defaultServers, ...parsed];
          } else {
            cachedIceServers = defaultServers;
          }
          lastFetchTime = now;
          resolve(cachedIceServers);
        } catch (e) {
          console.error("Error al procesar credenciales de TURN:", e);
          resolve(defaultServers);
        }
      });
    }).on('error', (err) => {
      console.error("Error al obtener credenciales de TURN desde Metered:", err);
      resolve(defaultServers);
    });
  });
}

// Serve static client files
app.use(express.static(path.join(__dirname, 'public')));

// Global state for game rooms
const rooms = {};

// Helper: Create a standard 40-card Spanish deck
function createDeck() {
  const suits = ['oros', 'copas', 'espadas', 'bastos'];
  const numbers = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  const deck = [];
  
  for (const suit of suits) {
    for (const number of numbers) {
      deck.push({ suit, number });
    }
  }
  return deck;
}

// Helper: Shuffle deck (Fisher-Yates)
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Light shuffle: simulates stacking and light shuffling to keep runs together
function lightShuffle(deck) {
  // 1. Perform 3 random cuts
  for (let i = 0; i < 3; i++) {
    const cutIndex = Math.floor(Math.random() * (deck.length - 10)) + 5; // Cut between index 5 and 35
    const part1 = deck.slice(0, cutIndex);
    const part2 = deck.slice(cutIndex);
    deck = [...part2, ...part1];
  }
  
  // 2. Perform light adjacent swaps (25% chance) to mix slightly
  for (let i = 0; i < deck.length - 1; i++) {
    if (Math.random() < 0.25) {
      const temp = deck[i];
      deck[i] = deck[i + 1];
      deck[i + 1] = temp;
    }
  }
  
  return deck;
}

// Card Rank comparison helpers
function getCardRankEnvido(card, trumpSuit, ledSuit) {
  if (card.suit === trumpSuit) {
    switch (card.number) {
      case 2: return 100; // La Mala
      case 12: return 90; // Rey
      case 11: return 80; // Caballo
      case 10: return 70; // Sota
      case 1: return 60;  // As (Uno)
      case 7: return 50;
      case 6: return 40;
      case 5: return 30;
      case 4: return 20;
      case 3: return 10;
      default: return 0;
    }
  }
  if (card.suit === ledSuit) {
    switch (card.number) {
      case 12: return 9;
      case 11: return 8;
      case 10: return 7;
      case 1: return 6;
      case 7: return 5;
      case 6: return 4;
      case 5: return 3;
      case 4: return 2;
      case 3: return 1;
      case 2: return 0; // standard 2 of non-trump
      default: return 0;
    }
  }
  return -1; // Discard (different suit, not trump)
}

function getCardRankTute(card, trumpSuit, ledSuit) {
  // Raw ranks: As(1)>2>12>11>10>7>6>5>4>3
  const rawRanks = { 1: 10, 2: 9, 12: 8, 11: 7, 10: 6, 7: 5, 6: 4, 5: 3, 4: 2, 3: 1 };
  const rank = rawRanks[card.number] || 0;

  if (card.suit === trumpSuit) {
    return rank + 100;
  }
  if (card.suit === ledSuit) {
    return rank;
  }
  return -1; // Discard
}

// Points for Tute scoring
function getCardPointsTute(card) {
  switch (card.number) {
    case 1: return 11;
    case 2: return 10; // 2 is worth 10 points (second highest)
    case 12: return 4;
    case 11: return 3;
    case 10: return 2;
    default: return 0;
  }
}

// Custom 2-player Tute rank and points
function getCardRankTute2(card, trumpSuit, ledSuit) {
  // Raw ranks for 2-player Tute: As(1)>2>12>11>10>7>6>5>4>3
  const rawRanks = { 1: 10, 2: 9, 12: 8, 11: 7, 10: 6, 7: 5, 6: 4, 5: 3, 4: 2, 3: 1 };
  const rank = rawRanks[card.number] || 0;

  if (card.suit === trumpSuit) {
    return rank + 100;
  }
  if (card.suit === ledSuit) {
    return rank;
  }
  return -1; // Discard
}

function getCardPointsTute2(card) {
  switch (card.number) {
    case 1: return 11;
    case 2: return 10; // 2 is worth 10 points
    case 12: return 4;
    case 11: return 3;
    case 10: return 2;
    default: return 0;
  }
}

// Validate play for Tute (obligaciones de asistir, montar, fallar, pisar)
function validateTutePlay(playerHand, playedCard, playedCardsOnTable, trumpSuit, maxPlayers, deckCount) {
  // Card must exist in player hand
  const hasCard = playerHand.some(c => c.suit === playedCard.suit && c.number === playedCard.number);
  if (!hasCard) return false;

  // First card played in trick is always valid
  if (playedCardsOnTable.length === 0) return true;

  // In 2-player Tute, play restrictions only apply when the draw pile is empty!
  if (maxPlayers === 2 && deckCount > 0) {
    return true; // Free play during Phase 1
  }

  const firstCard = playedCardsOnTable[0].card;
  const ledSuit = firstCard.suit;

  // Find the highest card played on the table so far
  let highestTableCard = null;
  let highestTableRank = -999;
  for (const p of playedCardsOnTable) {
    const r = maxPlayers === 2
      ? getCardRankTute2(p.card, trumpSuit, ledSuit)
      : getCardRankTute(p.card, trumpSuit, ledSuit);
    if (r > highestTableRank) {
      highestTableRank = r;
      highestTableCard = p.card;
    }
  }

  const isHighestTrump = (highestTableCard.suit === trumpSuit);
  const playerHasLedSuit = playerHand.some(c => c.suit === ledSuit);

  if (playerHasLedSuit) {
    // Player MUST play led suit (asistir)
    if (playedCard.suit !== ledSuit) return false;

    // Can player beat highest card of led suit on table?
    if (!isHighestTrump) {
      // Check if player has a higher led suit card
      const highestLedSuitOnTableRank = maxPlayers === 2
        ? getCardRankTute2(highestTableCard, trumpSuit, ledSuit)
        : getCardRankTute(highestTableCard, trumpSuit, ledSuit);
      const betterLedSuitCards = playerHand.filter(c => c.suit === ledSuit && (
        maxPlayers === 2
          ? getCardRankTute2(c, trumpSuit, ledSuit) > highestLedSuitOnTableRank
          : getCardRankTute(c, trumpSuit, ledSuit) > highestLedSuitOnTableRank
      ));
      
      if (betterLedSuitCards.length > 0) {
        // Player MUST play a higher led suit card (montar)
        const playedCardRank = maxPlayers === 2
          ? getCardRankTute2(playedCard, trumpSuit, ledSuit)
          : getCardRankTute(playedCard, trumpSuit, ledSuit);
        if (playedCardRank <= highestLedSuitOnTableRank) {
          return false;
        }
      }
    }
    return true;
  } else {
    // Player doesn't have led suit. Must trump if possible (fallar/pisar)
    const playerHasTrump = playerHand.some(c => c.suit === trumpSuit);
    if (playerHasTrump) {
      if (playedCard.suit !== trumpSuit) return false;

      // If highest card is a trump, player must over-trump if possible (pisar)
      if (isHighestTrump) {
        const betterTrumps = playerHand.filter(c => c.suit === trumpSuit && (
          maxPlayers === 2
            ? getCardRankTute2(c, trumpSuit, ledSuit) > highestTableRank
            : getCardRankTute(c, trumpSuit, ledSuit) > highestTableRank
        ));
        if (betterTrumps.length > 0) {
          // Must play a higher trump
          const playedCardRank = maxPlayers === 2
            ? getCardRankTute2(playedCard, trumpSuit, ledSuit)
            : getCardRankTute(playedCard, trumpSuit, ledSuit);
          if (playedCardRank <= highestTableRank) {
            return false;
          }
        }
      }
      return true;
    }
    // No led suit and no trumps: can play any card (discard)
    return true;
  }
}

// Start a new round of cards
function startNewRound(room) {
  const gs = room.gameState;
  gs.status = 'playing';
  gs.playedCards = [];
  gs.tricks = [];
  
  // Set turn to player next to dealer (rotates every round)
  gs.dealerSeat = (gs.dealerSeat + 1) % room.maxPlayers;
  gs.firstHandSeat = (gs.dealerSeat + 1) % room.maxPlayers;
  gs.currentTurn = gs.firstHandSeat;
  gs.leadPlayerSeat = gs.firstHandSeat;

  // Create and shuffle deck
  let deck;
  let isLightShuffle = false;

  if (room.gameType === 'tute' && room.maxPlayers === 3 && gs.tricks && gs.tricks.length > 0) {
    const gathered = [];
    gs.tricks.forEach(trick => {
      if (trick.playedCards) {
        trick.playedCards.forEach(p => {
          if (p.card) gathered.push(p.card);
        });
      }
    });
    if (gs.discardedCard) {
      gathered.push(gs.discardedCard);
    }
    if (gs.monteCard) {
      gathered.push(gs.monteCard);
    }

    if (gathered.length === 40) {
      deck = lightShuffle(gathered);
      isLightShuffle = true;
    }
  }

  if (!deck) {
    deck = createDeck();
    deck = shuffle(deck);
  }

  if (isLightShuffle) {
    io.to(room.id).emit('log_message', {
      text: `🔄 Las cartas de la ronda anterior se han recogido y mezclado ligeramente`,
      type: 'system'
    });
  }

  if (room.gameType === 'envido' || (room.gameType === 'tute' && room.maxPlayers === 2)) {
    // Vira (Trump Card)
    // Drawn first, suit determines trump.
    gs.viraCard = deck.pop();
    gs.trumpSuit = gs.viraCard.suit;
  } else {
    gs.viraCard = null;
    gs.trumpSuit = null;
  }

  if (room.gameType === 'envido') {
    gs.envidoRoundScore = { teamA: 0, teamB: 0 };
    // Deal 3 cards to each player
    room.players.forEach(p => {
      gs.hands[p.socketId] = [deck.pop(), deck.pop(), deck.pop()];
    });
  } else if (room.gameType === 'tute') {
    gs.tuteRoundScores = {};
    gs.tuteCantos = {};
    
    if (room.maxPlayers === 2) {
      room.players.forEach(p => {
        gs.tuteRoundScores[p.seat] = 0;
        gs.tuteCantos[p.seat] = [];
        
        gs.hands[p.socketId] = [];
        for (let i = 0; i < 3; i++) {
          gs.hands[p.socketId].push(deck.pop());
        }
      });
      // Store deck for 2-player Tute drawing
      gs.deck = deck;
    } else if (room.maxPlayers === 3) {
      room.players.forEach(p => {
        gs.tuteRoundScores[p.seat] = 0;
        gs.tuteCantos[p.seat] = [];
        
        gs.hands[p.socketId] = [];
        for (let i = 0; i < 13; i++) {
          gs.hands[p.socketId].push(deck.pop());
        }
      });
      // Remaining 1 card goes to monte
      gs.monteCard = deck.pop();
      gs.deck = []; // empty deck
      
      // Initialize subasta state
      gs.status = 'auction';
      gs.auctionHighestBid = 0;
      gs.auctionHighestBidder = null;
      gs.auctionCurrentTurn = gs.firstHandSeat;
      gs.auctionPassed = [false, false, false];
      gs.auctionBidHistory = [];
      gs.discardedCard = null;
    }
  }

  // Set deck count
  if (room.gameType === 'tute' && room.maxPlayers === 3) {
    gs.deckCount = 1; // The monte card count
  } else {
    gs.deckCount = deck.length;
  }
}

// Clean up player state
function disconnectPlayer(socketId) {
  for (const roomId in rooms) {
    const room = rooms[roomId];
    const playerIndex = room.players.findIndex(p => p && p.socketId === socketId);
    if (playerIndex !== -1) {
      const player = room.players[playerIndex];
      room.players[playerIndex] = null; // empty the seat
      
      // Reset game if it was running
      if (room.gameState.status !== 'lobby') {
        room.gameState.status = 'lobby';
        room.gameState.hands = {};
        room.gameState.playedCards = [];
      }
      return { roomId, name: player.name };
    }
  }
  return null;
}

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // JOIN ROOM
  socket.on('join_room', ({ roomId, name }) => {
    if (!roomId || !name) return;
    
    socket.join(roomId);
    
    // Create room if it doesn't exist
    if (!rooms[roomId]) {
      rooms[roomId] = {
        id: roomId,
        gameType: 'envido', // default
        maxPlayers: 4,      // default
        players: Array(4).fill(null),
        gameState: {
          status: 'lobby',
          dealerSeat: -1,
          currentTurn: 0,
          viraCard: null,
          hands: {},
          playedCards: [],
          tricks: [],
          scores: { teamA: 0, teamB: 0 },
          tuteMatchPoints: {}
        }
      };
    }

    const room = rooms[roomId];
    
    // Notify clients of current room state
    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: room.gameState
    });
    
    socket.emit('log_message', { text: `Te has unido a la sala ${roomId}.`, type: 'system' });
    socket.to(roomId).emit('log_message', { text: `${name} se ha unido a la sala.`, type: 'system' });
    getIceServers().then((iceServers) => {
      socket.emit('webrtc_config', { iceServers });
    });
  });

  // CHANGE GAME CONFIG (only in lobby)
  socket.on('change_config', ({ roomId, gameType, maxPlayers }) => {
    const room = rooms[roomId];
    if (!room || room.gameState.status !== 'lobby') return;

    room.gameType = gameType;
    room.maxPlayers = parseInt(maxPlayers);
    room.players = Array(room.maxPlayers).fill(null);
    
    // Reset scores
    if (gameType === 'envido') {
      room.gameState.scores = { teamA: 0, teamB: 0 };
    } else {
      room.gameState.tuteMatchPoints = { 0: 0, 1: 0, 2: 0 };
    }

    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: room.gameState
    });

    io.to(roomId).emit('log_message', { 
      text: `Configuracion cambiada: ${gameType === 'envido' ? 'Envido' : 'Tute'} (${maxPlayers} jugadores)`, 
      type: 'system' 
    });
  });

  // TAKE A SEAT
  socket.on('take_seat', ({ roomId, name, seatIndex }) => {
    const room = rooms[roomId];
    if (!room) return;

    const seat = parseInt(seatIndex);
    if (seat < 0 || seat >= room.maxPlayers) return;

    // Check if player is already seated elsewhere
    const currentSeatIndex = room.players.findIndex(p => p && p.socketId === socket.id);
    if (currentSeatIndex !== -1) {
      room.players[currentSeatIndex] = null; // vacate previous seat
    }

    // Check if target seat is taken
    if (room.players[seat] !== null) {
      socket.emit('log_message', { text: `El asiento ${seat + 1} ya esta ocupado.`, type: 'system' });
      return;
    }

    // Determine team (alternating)
    let team = null;
    let isDirector = false;
    if (room.gameType === 'envido') {
      team = (seat % 2 === 0) ? 'A' : 'B';
      // Default director is the last player of each team (seat 2 and 3 in 4-player, 4 and 5 in 6-player)
      const lastTeamASeat = room.maxPlayers - 2;
      const lastTeamBSeat = room.maxPlayers - 1;
      if (seat === lastTeamASeat || seat === lastTeamBSeat) {
        isDirector = true;
      }
    }

    // Place player in seat
    room.players[seat] = {
      socketId: socket.id,
      name,
      seat,
      team,
      isDirector
    };

    // Update directors if seating changed
    if (room.gameType === 'envido') {
      const teamAPlayers = room.players.filter(p => p && p.team === 'A');
      const teamBPlayers = room.players.filter(p => p && p.team === 'B');
      
      // Reset directors
      room.players.forEach(p => { if (p) p.isDirector = false; });

      // Designate director to the one with the highest seat in each team
      let maxSeatA = -1, directorA = null;
      let maxSeatB = -1, directorB = null;

      room.players.forEach(p => {
        if (!p) return;
        if (p.team === 'A' && p.seat > maxSeatA) { maxSeatA = p.seat; directorA = p; }
        if (p.team === 'B' && p.seat > maxSeatB) { maxSeatB = p.seat; directorB = p; }
      });

      if (directorA) directorA.isDirector = true;
      if (directorB) directorB.isDirector = true;
    }

    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: room.gameState
    });

    io.to(roomId).emit('log_message', { 
      text: `${name} se sento en el Asiento ${seat + 1} ${team ? `(Equipo ${team}${room.players[seat].isDirector ? ' - Director' : ''})` : ''}`, 
      type: 'system' 
    });
  });

  // START GAME
  socket.on('start_game', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.gameState.status !== 'lobby') return;

    // Check if all seats are full
    const fullSeats = room.players.filter(p => p !== null).length;
    if (fullSeats !== room.maxPlayers) {
      socket.emit('log_message', { text: `No se puede iniciar hasta que se ocupen todos los asientos.`, type: 'system' });
      return;
    }

    // Initialize scores
    if (room.gameType === 'envido') {
      room.gameState.scores = { teamA: 0, teamB: 0 };
    } else {
      room.gameState.tuteMatchPoints = {};
      room.players.forEach(p => {
        room.gameState.tuteMatchPoints[p.seat] = 0;
      });
      if (room.maxPlayers === 3) {
        room.gameState.dealerSeat = 1;
      }
    }

    startNewRound(room);

    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: room.gameState
    });

    io.to(roomId).emit('log_message', { text: `¡La partida ha comenzado! Distribuyendo cartas...`, type: 'system' });
    if (room.gameState.viraCard) {
      io.to(roomId).emit('log_message', { text: `La vira es el ${room.gameState.viraCard.number} de ${room.gameState.viraCard.suit.toUpperCase()}`, type: 'system' });
    } else if (room.maxPlayers === 3 && room.gameType === 'tute') {
      io.to(roomId).emit('log_message', { text: `¡Comienza la subasta para el Tute! Mínimo 60 puntos.`, type: 'system' });
    }
  });

  // PLAY CARD
  socket.on('play_card', ({ roomId, card }) => {
    const room = rooms[roomId];
    if (!room || room.gameState.status !== 'playing') return;

    const gs = room.gameState;
    
    // Find player seat
    const player = room.players.find(p => p && p.socketId === socket.id);
    if (!player) return;

    // Check if it's player's turn
    if (gs.currentTurn !== player.seat) {
      socket.emit('log_message', { text: `No es tu turno.`, type: 'system' });
      return;
    }

    const playerHand = gs.hands[socket.id];
    const cardIndex = playerHand.findIndex(c => c.suit === card.suit && c.number === card.number);
    if (cardIndex === -1) return;

    // Validate play for Tute
    if (room.gameType === 'tute') {
      const isValid = validateTutePlay(playerHand, card, gs.playedCards, gs.trumpSuit, room.maxPlayers, gs.deckCount);
      if (!isValid) {
        socket.emit('log_message', { text: `¡Jugada invalida! En el Tute debes asistir, montar o fallar segun corresponda.`, type: 'system' });
        return;
      }
    }

    // Remove card from hand
    playerHand.splice(cardIndex, 1);

    // Place card on table
    gs.playedCards.push({
      seat: player.seat,
      playerId: socket.id,
      card
    });

    io.to(roomId).emit('log_message', { text: `${player.name} jugo el ${card.number} de ${card.suit}`, type: 'chat' });

    // Sync room state
    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });

    // Check if all players have played a card in this trick
    if (gs.playedCards.length === room.maxPlayers) {
      // Evaluate trick winner after a short delay so players can see the cards
      setTimeout(() => {
        evaluateTrick(room);
      }, 1500);
    } else {
      // Move turn to next player
      gs.currentTurn = (gs.currentTurn + 1) % room.maxPlayers;
      io.to(roomId).emit('room_state', {
        gameType: room.gameType,
        maxPlayers: room.maxPlayers,
        players: room.players,
        gameState: gs
      });
    }
  });

  // SWAP VIRA (Tute 2 players)
  socket.on('swap_vira', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) {
      socket.emit('log_message', { text: `⚠️ Error al cambiar la vira: sala no encontrada.`, type: 'system' });
      return;
    }
    const gs = room.gameState;
    if (room.gameType !== 'tute' || room.maxPlayers !== 2) {
      socket.emit('log_message', { text: `⚠️ El intercambio de vira solo está permitido en Tute de 2 jugadores.`, type: 'system' });
      return;
    }
    if (gs.status !== 'playing') {
      socket.emit('log_message', { text: `⚠️ No puedes cambiar la vira ahora (estado: ${gs.status}).`, type: 'system' });
      return;
    }
    if (!gs.viraCard) {
      socket.emit('log_message', { text: `⚠️ No hay vira en la mesa para cambiar.`, type: 'system' });
      return;
    }
    if (gs.deckCount === 0) {
      socket.emit('log_message', { text: `⚠️ El mazo está vacío, no se puede cambiar la vira.`, type: 'system' });
      return;
    }

    const player = room.players.find(p => p && p.socketId === socket.id);
    if (!player) {
      socket.emit('log_message', { text: `⚠️ Error: jugador no identificado en esta sala.`, type: 'system' });
      return;
    }

    // Check if player has won at least one trick
    const wonTricks = (gs.tricks || []).filter(t => t.winnerSeat === player.seat).length;
    if (wonTricks === 0) {
      socket.emit('log_message', { text: `No puedes cambiar la vira hasta que ganes al menos una baza.`, type: 'system' });
      return;
    }

    const hand = gs.hands[socket.id];
    if (!hand) {
      socket.emit('log_message', { text: `⚠️ Error: no se encontró tu mano en el servidor.`, type: 'system' });
      return;
    }
    const trumpSuit = gs.trumpSuit;
    const viraNum = gs.viraCard.number;

    let swapCardIndex = -1;
    let cardToExchange = null;

    if ([1, 3, 10, 11, 12].includes(viraNum)) {
      // Must have the 7 of trump
      swapCardIndex = hand.findIndex(c => c.suit === trumpSuit && c.number === 7);
      if (swapCardIndex !== -1) cardToExchange = hand[swapCardIndex];
    } else if ([7, 6, 5, 4, 2].includes(viraNum)) {
      // Must have the 2 or 3 of trump
      swapCardIndex = hand.findIndex(c => c.suit === trumpSuit && c.number === 2);
      if (swapCardIndex === -1) {
        swapCardIndex = hand.findIndex(c => c.suit === trumpSuit && c.number === 3);
      }
      if (swapCardIndex !== -1) cardToExchange = hand[swapCardIndex];
    }

    if (swapCardIndex === -1 || !cardToExchange) {
      socket.emit('log_message', { text: `No tienes la carta requerida (${[1, 3, 10, 11, 12].includes(viraNum) ? '7' : '2 o 3'} de ${trumpSuit}) para cambiar la vira.`, type: 'system' });
      return;
    }

    // Do the swap!
    const oldVira = gs.viraCard;
    gs.viraCard = cardToExchange;
    hand[swapCardIndex] = oldVira;

    io.to(roomId).emit('log_message', {
      text: `🔄 ${player.name} ha cambiado la vira: entrega el ${cardToExchange.number} de ${cardToExchange.suit} y se queda con el ${oldVira.number} de ${oldVira.suit}.`,
      type: 'system'
    });

    // Broadcast updated state to all clients
    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });
  });

  // TUTE BID (Tute Subastado)
  socket.on('tute_bid', ({ roomId, value }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'tute' || room.maxPlayers !== 3) return;
    const gs = room.gameState;
    if (gs.status !== 'auction') return;

    const player = room.players.find(p => p && p.socketId === socket.id);
    if (!player || gs.auctionCurrentTurn !== player.seat) return;
    if (gs.auctionPassed[player.seat]) return;

    const minBid = Math.max(60, gs.auctionHighestBid + 5);
    if (value < minBid || value % 5 !== 0) {
      socket.emit('log_message', { text: `⚠️ La puja debe ser de al menos ${minBid} y ser múltiplo de 5.`, type: 'system' });
      return;
    }

    // Bid accepted!
    gs.auctionHighestBid = value;
    gs.auctionHighestBidder = player.seat;
    gs.auctionBidHistory.push({ seat: player.seat, action: 'bid', value: value });

    io.to(roomId).emit('log_message', {
      text: `🙋‍♂️ ${player.name} puja ${value} puntos.`,
      type: 'system'
    });

    // Move to next player
    moveToNextAuctionTurn(room);
  });

  // TUTE PASS (Tute Subastado)
  socket.on('tute_pass', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'tute' || room.maxPlayers !== 3) return;
    const gs = room.gameState;
    if (gs.status !== 'auction') return;

    const player = room.players.find(p => p && p.socketId === socket.id);
    if (!player || gs.auctionCurrentTurn !== player.seat) return;
    if (gs.auctionPassed[player.seat]) return;

    // Pass accepted!
    gs.auctionPassed[player.seat] = true;
    gs.auctionBidHistory.push({ seat: player.seat, action: 'pass' });

    io.to(roomId).emit('log_message', {
      text: `❌ ${player.name} pasa.`,
      type: 'system'
    });

    // Move to next player
    moveToNextAuctionTurn(room);
  });

  // SELECT TRUMP & MONTE DECISION (Tute Subastado)
  socket.on('select_trump_discard', ({ roomId, suit, wantsMonte }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'tute' || room.maxPlayers !== 3) return;
    const gs = room.gameState;
    if (gs.status !== 'selection') return;

    const player = room.players.find(p => p && p.socketId === socket.id);
    if (!player || gs.auctionHighestBidder !== player.seat) return;

    if (!['oros', 'copas', 'espadas', 'bastos'].includes(suit)) {
      socket.emit('log_message', { text: `⚠️ Palo de triunfo no válido.`, type: 'system' });
      return;
    }

    gs.trumpSuit = suit;

    if (wantsMonte) {
      // Transition to discard phase: player must discard 1 of their 13 original cards
      gs.status = 'discard';
      io.to(roomId).emit('log_message', {
        text: `📢 ${player.name} elige como triunfo el palo de ${suit.toUpperCase()} y decide coger el monte. Ahora debe realizar su descarte.`,
        type: 'system'
      });
    } else {
      // Transition directly to playing: player keeps their 13 original cards, monte is left face down
      gs.discardedCard = null;
      gs.status = 'playing';
      gs.currentTurn = gs.firstHandSeat;
      gs.leadPlayerSeat = gs.currentTurn;
      io.to(roomId).emit('log_message', {
        text: `📢 ${player.name} elige como triunfo el palo de ${suit.toUpperCase()} y deja el monte boca abajo en la mesa. ¡Comienza el juego!`,
        type: 'system'
      });
    }

    // Broadcast updated state to all clients
    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });
  });

  // CONFIRM DISCARD (Tute Subastado)
  socket.on('confirm_discard', ({ roomId, card }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'tute' || room.maxPlayers !== 3) return;
    const gs = room.gameState;
    if (gs.status !== 'discard') return;

    const player = room.players.find(p => p && p.socketId === socket.id);
    if (!player || gs.auctionHighestBidder !== player.seat) return;

    const hand = gs.hands[socket.id];
    const cardIndex = hand.findIndex(c => c.suit === card.suit && c.number === card.number);
    if (cardIndex === -1) {
      socket.emit('log_message', { text: `⚠️ Error: la carta seleccionada para descartar no está en tu mano.`, type: 'system' });
      return;
    }

    // Do the swap:
    // 1. Remove the discarded card from hand
    gs.discardedCard = hand[cardIndex];
    hand.splice(cardIndex, 1); // hand goes to 12 cards

    // 2. Add the monte card to the hand (revealing it to the subastador)
    hand.push(gs.monteCard);
    
    // 3. Clear monte Card from table
    gs.monteCard = null;
    gs.deckCount = 0;

    // 4. Start playing phase
    gs.status = 'playing';
    gs.currentTurn = gs.firstHandSeat;
    gs.leadPlayerSeat = gs.currentTurn;

    io.to(roomId).emit('log_message', {
      text: `📢 ${player.name} ha realizado su descarte boca abajo y recibe la carta del monte. ¡Comienza el juego!`,
      type: 'system'
    });

    // Broadcast updated state to all clients
    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });
  });

  // PRIVATE SIGN ROUTING (Envido only)
  socket.on('send_sign', ({ roomId, signName }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'envido') return;

    const sender = room.players.find(p => p && p.socketId === socket.id);
    if (!sender) return;

    // Find the Director of the same team
    const director = room.players.find(p => p && p.team === sender.team && p.isDirector);
    if (!director) return;

    // Send sign only to the Director
    io.to(director.socketId).emit('receive_sign', {
      senderName: sender.name,
      senderSeat: sender.seat,
      signName
    });

    // Acknowledge to sender
    socket.emit('team_log', { text: `Le hiciste la seña (${signName}) a tu director ${director.name}.`, type: 'secret' });
    io.to(director.socketId).emit('team_log', { text: `${sender.name} te hace seña de: ${signName.toUpperCase()}`, type: 'secret' });
  });

  // DIRECTIVE/ORDER ROUTING (Envido only)
  socket.on('send_order', ({ roomId, orderText }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'envido') return;

    const director = room.players.find(p => p && p.socketId === socket.id && p.isDirector);
    if (!director) return;

    // Send to all teammates
    room.players.forEach(p => {
      if (p && p.team === director.team) {
        io.to(p.socketId).emit('receive_order', {
          directorName: director.name,
          orderText
        });
        io.to(p.socketId).emit('team_log', { text: `[DIRECTOR] ${director.name} ordena: ${orderText}`, type: 'secret' });
      }
    });
  });

  // TUTE CANTOS (Declarations)
  socket.on('tute_canto', ({ roomId, cantoType, suit }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'tute') return;

    const player = room.players.find(p => p && p.socketId === socket.id);
    if (!player) return;

    const gs = room.gameState;
    
    // In 3-player Tute Subastado, only the subastador can declare cantos
    if (room.maxPlayers === 3 && gs.auctionHighestBidder !== player.seat) {
      socket.emit('log_message', { text: `En el Tute Subastado solo el subastador tiene permitido cantar.`, type: 'system' });
      return;
    }

    // Validate that they have won at least one trick
    const playerWonTrick = gs.tricks.some(t => t.winnerSeat === player.seat);
    if (!playerWonTrick) {
      socket.emit('log_message', { text: `No puedes cantar hasta ganar una baza.`, type: 'system' });
      return;
    }

    const points = cantoType === '40' ? 40 : 20;
    
    // Register canto
    gs.tuteCantos[player.seat].push({ cantoType, suit, points });
    
    io.to(roomId).emit('log_message', { 
      text: `📢 ¡${player.name} canta las ${cantoType} en ${suit.toUpperCase()}! (+${points} puntos)`, 
      type: 'system' 
    });

    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });
  });

  // TUTE DECLARE IMMEDIATELY (4 Kings or 4 Knights)
  socket.on('tute_declare_victory', ({ roomId, type }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'tute') return;

    const player = room.players.find(p => p && p.socketId === socket.id);
    if (!player) return;

    const gs = room.gameState;
    
    // In 3-player Tute Subastado, only the subastador can declare Tute
    if (room.maxPlayers === 3 && gs.auctionHighestBidder !== player.seat) {
      socket.emit('log_message', { text: `En el Tute Subastado solo el subastador puede declarar Tute.`, type: 'system' });
      return;
    }
    
    io.to(roomId).emit('log_message', { 
      text: `🏆 ¡${player.name} DECLARA TUTE DE ${type.toUpperCase()} Y GANA LA PARTIDA INSTANTÁNEAMENTE!`, 
      type: 'system' 
    });

    gs.status = 'game_end';
    
    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });
  });

  // WEBRTC VOICE SIGNAL RELAY
  socket.on('webrtc_signal', ({ to, signal }) => {
    io.to(to).emit('webrtc_signal', { from: socket.id, signal });
  });

  socket.on('voice_ready', ({ roomId }) => {
    socket.to(roomId).emit('voice_player_ready', { socketId: socket.id });
  });

  // COUNT POINTS FOR TUTE (Triggered manually by players clicking "Contar")
  socket.on('count_points', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'tute') return;
    const gs = room.gameState;
    if (gs.status !== 'round_end_counting') return;

    // 10 extra points for the winner of the last trick
    const lastTrickWinner = gs.tricks[gs.tricks.length - 1].winnerSeat;
    gs.tuteRoundScores[lastTrickWinner] += 10;
    
    io.to(room.id).emit('log_message', { 
      text: `✨ ${room.players.find(p=>p.seat === lastTrickWinner).name} gana las diez de últimas (+10 pts).`, 
      type: 'system' 
    });

    // Add cantos to round scores
    room.players.forEach(p => {
      const cantos = gs.tuteCantos[p.seat] || [];
      cantos.forEach(c => {
        gs.tuteRoundScores[p.seat] += c.points;
      });
    });

    if (room.maxPlayers === 2) {
      // List scores
      const playerScores = room.players.map(p => ({
        seat: p.seat,
        name: p.name,
        score: gs.tuteRoundScores[p.seat]
      }));

      io.to(room.id).emit('log_message', { 
        text: `📊 Puntuaciones de esta ronda: ${playerScores[0].name}: ${playerScores[0].score} | ${playerScores[1].name}: ${playerScores[1].score}`, 
        type: 'system' 
      });

      let loserSeat;
      let loserName;
      if (playerScores[0].score === playerScores[1].score) {
        loserSeat = lastTrickWinner === 0 ? 1 : 0;
        const loserPlayer = room.players.find(p => p.seat === loserSeat);
        loserName = loserPlayer ? loserPlayer.name : `Asiento ${loserSeat + 1}`;
        io.to(room.id).emit('log_message', { text: `¡Empate a puntos! Desempata el ganador de las diez de últimas.`, type: 'system' });
      } else {
        const sorted = [...playerScores].sort((a, b) => a.score - b.score);
        loserSeat = sorted[0].seat;
        loserName = sorted[0].name;
      }

      gs.tuteMatchPoints[loserSeat]++;
      io.to(room.id).emit('log_message', { text: `💀 ${loserName} tiene menos puntos y pierde esta ronda (Suma 1 punto de derrota).`, type: 'system' });

      // Check match end (3 defeat points)
      let gameEnded = false;
      room.players.forEach(p => {
        if (gs.tuteMatchPoints[p.seat] >= 3) {
          gameEnded = true;
        }
      });

      if (gameEnded) {
        gs.status = 'game_end';
        io.to(room.id).emit('log_message', { 
          text: `🏆 ¡Fin de la partida! Alguien alcanzó 3 puntos de derrota.`, 
          type: 'system' 
        });
      } else {
        gs.status = 'round_results';
      }

    } else if (room.maxPlayers === 3) {
      // Tute Subastado (3 Players)
      
      const subastadorSeat = gs.auctionHighestBidder;
      const subastadorPlayer = room.players.find(p => p && p.seat === subastadorSeat);
      const subastadorName = subastadorPlayer ? subastadorPlayer.name : `Subastador`;

      // 1. Calculate discard points and opponents combined score
      let discardPoints = 0;
      if (gs.discardedCard) {
        discardPoints = getCardPointsTute(gs.discardedCard);
      }

      const subastadorScore = gs.tuteRoundScores[subastadorSeat];
      const opponents = room.players.filter(p => p && p.seat !== subastadorSeat);
      
      // Combine opponents' scores and add the discard card points to their team score
      const opponentsBaseScore = gs.tuteRoundScores[opponents[0].seat] + gs.tuteRoundScores[opponents[1].seat];
      const opponentsCombinedScore = opponentsBaseScore + discardPoints;

      // Update both opponents' tuteRoundScores to show their combined team score
      gs.tuteRoundScores[opponents[0].seat] = opponentsCombinedScore;
      gs.tuteRoundScores[opponents[1].seat] = opponentsCombinedScore;

      io.to(room.id).emit('log_message', { 
        text: `📊 Puntuaciones de esta ronda: Subastador (${subastadorName}): ${subastadorScore} pts (Pujó: ${gs.auctionHighestBid}) | Equipo Oponente: ${opponentsCombinedScore} pts (incluye ${discardPoints} pts del descarte)`, 
        type: 'system' 
      });

      // 2. Evaluate bid success
      const bidValue = gs.auctionHighestBid;
      const success = (subastadorScore >= bidValue);

      if (success) {
        gs.tuteMatchPoints[subastadorSeat] += bidValue;
        io.to(room.id).emit('log_message', {
          text: `🎉 ¡${subastadorName} cumple su subasta de ${bidValue} (hizo ${subastadorScore}) y suma +${bidValue} puntos!`,
          type: 'system'
        });
      } else {
        gs.tuteMatchPoints[subastadorSeat] -= bidValue;
        opponents.forEach(opp => {
          gs.tuteMatchPoints[opp.seat] += bidValue;
        });
        io.to(room.id).emit('log_message', {
          text: `💀 ¡${subastadorName} NO cumple su subasta de ${bidValue} (hizo ${subastadorScore})! Pierde -${bidValue} puntos. Los oponentes suman +${bidValue} puntos.`,
          type: 'system'
        });
      }

      // Check match end (300 points)
      let gameEnded = false;
      let winnerName = '';
      let highestMatchPoints = -9999;
      
      room.players.forEach(p => {
        if (gs.tuteMatchPoints[p.seat] >= 300) {
          gameEnded = true;
        }
        if (gs.tuteMatchPoints[p.seat] > highestMatchPoints) {
          highestMatchPoints = gs.tuteMatchPoints[p.seat];
          winnerName = p.name;
        }
      });

      if (gameEnded) {
        gs.status = 'game_end';
        io.to(room.id).emit('log_message', { 
          text: `🏆 ¡Fin de la partida! El ganador es ${winnerName} con ${highestMatchPoints} puntos.`, 
          type: 'system' 
        });
      } else {
        gs.status = 'round_results';
      }
    }

    io.to(room.id).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });
  });

  // GO TO NEXT ROUND (Tute)
  socket.on('next_round', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room || room.gameType !== 'tute') return;
    const gs = room.gameState;
    if (gs.status !== 'round_results') return;

    startNewRound(room);
    
    io.to(room.id).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });
  });

  // RESET GAME TO LOBBY (Nueva Partida)
  socket.on('reset_game', ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    room.gameState = {
      status: 'lobby',
      deck: [],
      hands: {},
      playedCards: [],
      viraCard: null,
      trumpSuit: null,
      currentTurn: 0,
      leadPlayerSeat: 0,
      tricks: [],
      scores: { teamA: 0, teamB: 0 },
      envidoRoundScore: { teamA: 0, teamB: 0 },
      tuteRoundScores: room.players.map(() => 0),
      tuteMatchPoints: room.players.map(() => 0),
      tuteCantos: room.players.map(() => []),
      deckCount: 0
    };

    room.players.forEach(p => {
      if (p) {
        p.isDirector = false;
        p.team = null;
      }
    });

    io.to(roomId).emit('log_message', { text: `🔄 La partida ha sido reiniciada. Se ha vuelto al lobby.`, type: 'system' });
    
    io.to(roomId).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: room.gameState
    });
  });

  // CHAT MESSAGE
  socket.on('chat_message', ({ roomId, message }) => {
    const player = rooms[roomId]?.players.find(p => p && p.socketId === socket.id);
    const name = player ? player.name : 'Espectador';
    io.to(roomId).emit('log_message', { text: `${name}: ${message}`, type: 'chat' });
  });

  // DISCONNECT
  socket.on('disconnect', () => {
    const data = disconnectPlayer(socket.id);
    if (data) {
      io.to(data.roomId).emit('disconnect_peer_voice', { socketId: socket.id });
      io.to(data.roomId).emit('log_message', { text: `${data.name} se ha desconectado. El juego volvera al lobby.`, type: 'system' });
      const room = rooms[data.roomId];
      if (room) {
        io.to(data.roomId).emit('room_state', {
          gameType: room.gameType,
          maxPlayers: room.maxPlayers,
          players: room.players,
          gameState: room.gameState
        });
      }
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Helper to advance the auction turn in Tute Subastado
function moveToNextAuctionTurn(room) {
  const gs = room.gameState;
  const passedCount = gs.auctionPassed.filter(p => p).length;

  if (passedCount === 3) {
    // Case 1: All 3 players passed without any bid!
    io.to(room.id).emit('log_message', {
      text: `🔄 Todos los jugadores han pasado. Se vuelven a repartir las cartas...`,
      type: 'system'
    });
    startNewRound(room);
    
    io.to(room.id).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });
    return;
  }

  if (passedCount === 2 && gs.auctionHighestBid > 0) {
    // Case 2: 2 players passed and there is a high bid!
    const winnerPlayer = room.players.find(p => p && p.seat === gs.auctionHighestBidder);
    io.to(room.id).emit('log_message', {
      text: `🏆 ¡Subasta finalizada! ${winnerPlayer.name} gana la subasta con una apuesta de ${gs.auctionHighestBid} puntos.`,
      type: 'system'
    });

    // Transition to selection phase!
    gs.status = 'selection';
    // Keep monteCard tapada on the table, deckCount remains 1 until wantsMonte is true

    io.to(room.id).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });
    return;
  }

  // Find next active player turn
  let nextTurn = (gs.auctionCurrentTurn + 1) % 3;
  while (gs.auctionPassed[nextTurn]) {
    nextTurn = (nextTurn + 1) % 3;
  }
  gs.auctionCurrentTurn = nextTurn;

  io.to(room.id).emit('room_state', {
    gameType: room.gameType,
    maxPlayers: room.maxPlayers,
    players: room.players,
    gameState: gs
  });
}

// Evaluate who wins the trick
function evaluateTrick(room) {
  const gs = room.gameState;
  const trumpSuit = gs.trumpSuit;
  const firstCardPlayed = gs.playedCards[0].card;
  const ledSuit = firstCardPlayed.suit;

  let winnerSeat = -1;
  let highestRank = -999;

  gs.playedCards.forEach(p => {
    let rank;
    if (room.gameType === 'envido') {
      rank = getCardRankEnvido(p.card, trumpSuit, ledSuit);
    } else if (room.maxPlayers === 2) {
      rank = getCardRankTute2(p.card, trumpSuit, ledSuit);
    } else {
      rank = getCardRankTute(p.card, trumpSuit, ledSuit);
    }

    if (rank > highestRank) {
      highestRank = rank;
      winnerSeat = p.seat;
    }
  });

  const winnerPlayer = room.players.find(p => p && p.seat === winnerSeat);
  
  // Save trick history
  gs.tricks.push({
    winnerSeat,
    winnerName: winnerPlayer ? winnerPlayer.name : `Asiento ${winnerSeat + 1}`,
    playedCards: [...gs.playedCards]
  });

  io.to(room.id).emit('log_message', { 
    text: `✨ ${winnerPlayer ? winnerPlayer.name : `Asiento ${winnerSeat + 1}`} gana la baza.`, 
    type: 'system' 
  });

  // If Tute: count points for the winner of the trick
  if (room.gameType === 'tute') {
    let trickPoints = 0;
    gs.playedCards.forEach(p => {
      if (room.maxPlayers === 2) {
        trickPoints += getCardPointsTute2(p.card);
      } else {
        trickPoints += getCardPointsTute(p.card);
      }
    });
    gs.tuteRoundScores[winnerSeat] += trickPoints;
  }

  // Draw cards if 2-player Tute
  if (room.gameType === 'tute' && room.maxPlayers === 2) {
    const totalRemaining = (gs.deck ? gs.deck.length : 0) + (gs.viraCard ? 1 : 0);
    if (totalRemaining > 0) {
      const winnerPlayerObj = room.players.find(p => p && p.seat === winnerSeat);
      const loserPlayerObj = room.players.find(p => p && p.seat !== winnerSeat);
      
      if (winnerPlayerObj && loserPlayerObj) {
        // 1. Winner draws first card
        let cardW = null;
        if (gs.deck && gs.deck.length > 0) {
          cardW = gs.deck.pop();
        } else if (gs.viraCard) {
          cardW = gs.viraCard;
          gs.viraCard = null;
        }
        
        // 2. Loser draws second card
        let cardL = null;
        if (gs.deck && gs.deck.length > 0) {
          cardL = gs.deck.pop();
        } else if (gs.viraCard) {
          cardL = gs.viraCard;
          gs.viraCard = null;
        }
        
        if (cardW) gs.hands[winnerPlayerObj.socketId].push(cardW);
        if (cardL) gs.hands[loserPlayerObj.socketId].push(cardL);
      }
    }
    gs.deckCount = (gs.deck ? gs.deck.length : 0) + (gs.viraCard ? 1 : 0);
  }

  // Clear table cards
  gs.playedCards = [];

  // The winner of this trick leads the next trick
  gs.currentTurn = winnerSeat;
  gs.leadPlayerSeat = winnerSeat;

  // Check if round is over (3 tricks in Envido, 20 in 2-player Tute, 13 in 3-player Tute)
  const maxTricks = room.gameType === 'envido' ? 3 : (room.maxPlayers === 2 ? 20 : 13);
  if (gs.tricks.length === maxTricks) {
    if (room.gameType === 'envido') {
      evaluateRoundEnd(room);
    } else {
      // Tute: Transition to round_end_counting. Wait for a player to click the "Contar" button.
      gs.status = 'round_end_counting';
      io.to(room.id).emit('room_state', {
        gameType: room.gameType,
        maxPlayers: room.maxPlayers,
        players: room.players,
        gameState: gs
      });
      io.to(room.id).emit('log_message', { 
        text: '🏁 ¡Ronda finalizada! Haced clic en el botón "Contar Puntos" para revelar las puntuaciones.', 
        type: 'system' 
      });
    }
  } else {
    // Sync state for next trick
    io.to(room.id).emit('room_state', {
      gameType: room.gameType,
      maxPlayers: room.maxPlayers,
      players: room.players,
      gameState: gs
    });
  }
}

// Evaluate round end and update scores
function evaluateRoundEnd(room) {
  const gs = room.gameState;

  if (room.gameType === 'envido') {
    // Count how many tricks each team won
    let teamATricks = 0;
    let teamBTricks = 0;
    
    gs.tricks.forEach(t => {
      if (t.winnerSeat % 2 === 0) {
        teamATricks++;
      } else {
        teamBTricks++;
      }
    });

    let roundWinnerTeam = '';
    if (teamATricks > teamBTricks) {
      roundWinnerTeam = 'A';
      gs.scores.teamA++;
    } else {
      roundWinnerTeam = 'B';
      gs.scores.teamB++;
    }

    io.to(room.id).emit('log_message', { 
      text: `🎉 Equipo ${roundWinnerTeam} gana la ronda (${teamATricks} vs ${teamBTricks} bazas) y suma 1 piedra.`, 
      type: 'system' 
    });

    // Check if match is won (first to 3 rounds)
    if (gs.scores.teamA >= 3 || gs.scores.teamB >= 3) {
      gs.status = 'game_end';
      const winningTeam = gs.scores.teamA >= 3 ? 'A' : 'B';
      io.to(room.id).emit('log_message', { 
        text: `🏆 ¡EL EQUIPO ${winningTeam} HA GANADO LA PARTIDA AL GANAR 3 RONDAS!`, 
        type: 'system' 
      });
    } else {
      // Setup for next round
      startNewRound(room);
    }
  }

  // Broadcast state
  io.to(room.id).emit('room_state', {
    gameType: room.gameType,
    maxPlayers: room.maxPlayers,
    players: room.players,
    gameState: gs
  });
}

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
