import React, { Component } from 'react';
import './App.css';

const SOCKET_ADDRESS = 'ws://localhost:3001'

class App extends Component {
  constructor() {
    this.state = {
      player1Pos: 0,
      player2Pos: 0,
      currentPlayer: -1,
      player1Score: 0,
      player2Score: 0,
      ballX: 0,
      ballY: 0,
      ballDeltaY: 0,
      ballDeltaX: 0,
    }
  }

  handleServerMessage = (data) => {
    console.log('Received message from server:', data)
  }
  
  componentDidMount() {
    this.socket = new WebSocket(SOCKET_ADDRESS)
    console.log(this.socket)
    this.socket.onmessage = this.handleServerMessage
  }

  render() {
    return (
      <div className="App">
        Hello
      </div>
    );
  }
}

export default App;
