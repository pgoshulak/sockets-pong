const express = require('express')
const SocketServer = require('ws').Server;
const uuidv1 = require('uuid/v1')

const PORT = process.env.PORT || 3001;
const VERBOSE_LOGGING = true;

const log = (...messages) => {
  if (VERBOSE_LOGGING) console.log(...messages);
}

const server = express()
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new SocketServer({ server });

// Generate a unique ID
wss.getUniqueId = () => uuidv1();
// Assign player numbers (0, 1) to WS clients by UUID
wss.assignPlayers = () => {
  wss.playerNums = {}
  let playerNum = 0;
  wss.clients.forEach(function each(client) {
    wss.playerNums[client.id] = playerNum;
    playerNum++
  })
  log('wss.playerNums = ', wss.playerNums)
}

const totalClients = (wss) => wss.clients.size;

wss.on('connection', (ws) => {
  log(`New connection -> ${totalClients(wss)} client(s) connected`)
  // Assign unique id to the client
  ws.id = wss.getUniqueId();

  wss.assignPlayers();

  ws.send(JSON.stringify({
    type: 'ASSIGN_PLAYER',
    content: wss.playerNums[ws.id]
  }))
  ws.on('close', () => {
    wss.assignPlayers();
    log(`Client disconnected -> ${totalClients(wss)} client(s) connected`)
  })
  ws.on('message', (data) => {
    log(`Received message: `, JSON.parse(data))
    ws.send('Hello back from server')
  })
})