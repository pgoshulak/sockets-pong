import React, { Component } from 'react';
import './App.css';

const SOCKET_ADDRESS = 'ws://localhost:3001'

class App extends Component {
  constructor() {
    super();
    this.state = {
      player1Pos: 0,
      player2Pos: 0,
      currentPlayer: -1,
      player1Score: 0,
      player2Score: 0,
      ball: {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0
      }
    }
  }

  handleServerMessage = (message) => {
    console.log('Received message from server:', message.data)
  }

  sendNewServerMessage = (data) => {
    this.socket.send(JSON.stringify(data));
  }
  
  componentDidMount() {
    this.socket = new WebSocket(SOCKET_ADDRESS)
    this.socket.onmessage = this.handleServerMessage
  }

  render() {
    return (
      <div className="App">
        Hello
        <button onClick={() => this.sendNewServerMessage('hello from button')}>send hello</button>
      </div>
    );
  }
}

export default App;
