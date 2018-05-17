import React, { Component } from 'react';
import './App.css';
import Game from './Game';

const SOCKET_ADDRESS = 'ws://localhost:3001'

const PlayerCounter = ({count}) => {
  return <div>Count is {count}</div>
}

class App extends Component {
  constructor() {
    super();
    this.state = {
      playerPos: [0,0],
      currentPlayer: -1,
      playerScore: [0,0],
      ball: {
        x: 0,
        y: 0,
        dx: 0,
        dy: 0
      }
    }
  }

  handleServerMessage = (message) => {
    const data = JSON.parse(message.data)
    if (data.type === 'ASSIGN_PLAYER') {
      this.setState({ currentPlayer: data.content })
    } else if (data.type === 'P0') {
      this.setPlayerPos(0, data.content)
    } else if (data.type === 'P1') {
      this.setPlayerPos(1, data.content)
    }
  }

  setPlayerPos = (player, pos, cb) => {
    if (player === 0) {
      this.setState({
        playerPos: [
          pos,
          this.state.playerPos[1]
        ]
      }, cb)
    } else if (player === 1) {
      this.setState({
        playerPos: [
          this.state.playerPos[0],
          pos
        ]
      }, cb)
    }
  }

  incrementPlayerPos = (player, inc, cb) => {
    if (player === 0) {
      this.setState({
        playerPos: [
          this.state.playerPos[0] + inc,
          this.state.playerPos[1]
        ]
      }, cb)
    } else if (player === 1) {
      this.setState({
        playerPos: [
          this.state.playerPos[0],
          this.state.playerPos[1] + inc
        ]
      }, cb)
    }
  }

  sendCurrentPlayerPos = () => {
    const player = this.state.currentPlayer
    this.sendNewServerMessage({
      type: `P${player}`,
      content: this.state.playerPos[player]
    })
  }

  onKeyDown = (event) => {
    // Keyboard Up arrow
    if (event.key === 'ArrowUp') {
      this.incrementPlayerPos(this.state.currentPlayer, 1, this.sendCurrentPlayerPos)
      // Keyboard Down arrow
    } else if (event.key === 'ArrowDown') {
      this.incrementPlayerPos(this.state.currentPlayer, -1, this.sendCurrentPlayerPos)
    }
  }

  sendNewServerMessage = (data) => {
    this.socket.send(JSON.stringify(data));
  }
  
  componentDidMount() {
    this.socket = new WebSocket(SOCKET_ADDRESS)
    this.socket.onmessage = this.handleServerMessage

    document.addEventListener('keydown', this.onKeyDown)
  }

  render() {
    return (
      <div className="App">
        Hello player { this.state.currentPlayer }
        <PlayerCounter count={ this.state.playerPos[0] } />
        <PlayerCounter count={ this.state.playerPos[1] } />
        <Game p0Position={this.state.playerPos[0]} p1Position={this.state.playerPos[1]}/>
      </div>
    );
  }
}

export default App;
