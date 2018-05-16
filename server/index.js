const express = require('express')
const SocketServer = require('ws').Server;

const PORT = process.env.PORT || 3001;

const server = express()
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new SocketServer({ server });

const totalClients = (wss) => wss.clients.size;
// totalClients = totalClients.bind(wss)

wss.on('connection', (ws) => {
  console.log(`New connection -> ${totalClients(wss)} client(s) connected`)
  ws.send('Hello from server')
  ws.on('close', () => console.log(`Client disconnected -> ${totalClients(wss)} client(s) connected`))
  
})