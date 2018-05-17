import React, { Component } from 'react';
import { Stage, Layer, Rect, Text } from 'react-konva';
import Konva from 'konva';

class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {  }
  }
  render() { 
    const surfaceWidth = window.innerWidth;
    const surfaceHeight = window.innerHeight - 100;
    const scaleX = surfaceWidth / 100;
    const scaleY = surfaceHeight / 100;
    return ( 
      <Stage width={surfaceWidth} height={surfaceHeight}>
        <Layer width={100} height={100} scale={{x: scaleX, y: scaleY}}>
          <Rect x={0} y={0} width={100} height={100} fill={'grey'}/>
          <Rect x={1} y={95 - this.props.p0Position} width={1} height={10} fill={'black'}/>
          <Rect x={98} y={95 - this.props.p1Position} width={1} height={10} fill={'black'}/>
          <Rect x={this.props.ball.x} y={this.props.ball.y} width={10/scaleX} height={10/scaleY} fill={'black'} />
        </Layer>
      </Stage>
     )
  }
}
 
export default Game;