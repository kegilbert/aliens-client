import React, { useState, useEffect } from 'react';
import { Stage, Layer, Text, Image, Rect, Circle, RegularPolygon } from 'react-konva';
import io from 'socket.io-client';

import './App.css';

// import safeSpace from 'safe-space';
// import dangerSpace from 'danger-space';


function App() {
  const Map = {
    'A01': 'grey',
    'A02': 'grey',
    'A04': 'grey',
    'A05': 'grey',
    'B01': 'white',
    'B04': 'white',
    'C01': 'grey',
    'C02': 'grey',
    'C03': 'white',
    'C04': 'grey',
    'C05': 'grey',
    'D00': 'grey',
    'D01': 'grey',
    'D02': 'white',
    'D03': 'white',
    'D04': 'grey',
    'D05': 'grey',
    'E01': 'grey',
    'E02': 'grey',
    'E03': 'grey',
    'E04': 'grey',
    'E05': 'grey',
  };
  const [currSpace, setCurrSpace] = useState();
  const socket = io("localhost:5000");

  // client-side
  useEffect(() => {
    socket.on("connect", () => {  console.log(socket.id); });
    socket.on("responseMessage", (data) => {  console.log(data); });
  }, []);



  const generateMap = () => {
    let hexagons = []

    for (let row = 1; row < 15; row++) {
      for (let col = 0; col < 23; col++) {
        let id = String.fromCharCode(0x41 + col) + (row).toString().padStart(2, '0');

        // if (id in Map) {
          hexagons.push(
            <>
            <Text
              text={id}
              fontSize={12}
              x={26 + (col * (36 + 18))}
              y={31 + (row * (36 + 27)) + (col % 2)*31}
            />
            <RegularPolygon
              key={id}
              id={id}
              x={36 + (col * (36 + 18))}
              y={36 + (row * (36 + 27)) + (col % 2)*31}
              sides={6}
              radius={36}
              fill={id === currSpace ? 'green' : (id === 'C02' ? '#ffa05f' : Map[id])}
              stroke='black'
              strokeWidth={1}
              onClick={(e) => {console.log(e.currentTarget.attrs); setCurrSpace(id); socket.emit('incoming', {test: id}); }}
              //dash={[16, 10]} // apply dashed stroke that is 10px long and 5 pixels apart
              name={id}
              fillAfterStrokeEnabled={true}
              opacity={0.4}
              rotation={90}
            />
            </>
          );
        // }
      }
    }

    return hexagons;
  }


  const [stageScaleX, setStageScaleX] = useState(1);
  const [stageScaleY, setStageScaleY] = useState(1);
  return (
    <div className="App">
{/*      <Stage width={window.innerWidth} height={window.innerHeight}>*/}
      <Stage
        style={{marginTop: '1em', display: 'flex', justifyContent: 'center'}}
        width={window.innerWidth * 0.75}
        height={window.innerHeight*0.75}
        onWheel={(e) => {
          e.evt.preventDefault();
          if (e.evt.deltaY > 15 || e.evt.deltaY < 15) {
            setStageScaleX(stageScaleX + (e.evt.deltaY/250));
            setStageScaleY(stageScaleX + (e.evt.deltaY/250));
          }
        }}
        scaleX={stageScaleX}
        scaleY={stageScaleY}
      >
        <Layer>
          {generateMap()}
{/*          <RegularPolygon
            id="I06"
            x={36}
            y={36}
            sides={6}
            radius={36}
            fill="red"
            stroke="black"
            strokeWidth={2}
            onClick={(e) => {console.log(e.currentTarget.attrs);}}
          />
          <RegularPolygon
            id="I07"
            x={36+31}
            y={36+36+18}
            sides={6}
            radius={36}
            fill="red"
            stroke="black"
            strokeWidth={2}
            onClick={(e) => {console.log(e.currentTarget.attrs);}}
          />
          <RegularPolygon
            id="I08"
            x={36+31+31}
            y={36}
            sides={6}
            radius={36}
            fill="red"
            stroke="black"
            strokeWidth={2}
            onClick={(e) => {console.log(e.currentTarget.attrs);}}
          />
          <RegularPolygon
            id="I09"
            x={36+31+31}
            y={36+36+36+18+18}
            sides={6}
            radius={36}
            fill="red"
            stroke="black"
            strokeWidth={2}
            onClick={(e) => {console.log(e.currentTarget.attrs);}}
          />
          <RegularPolygon
            id="I10"
            x={36+31+31+31}
            y={36+36+18}
            sides={6}
            radius={36}
            fill="red"
            stroke="black"
            strokeWidth={2}
            onClick={(e) => {console.log(e.currentTarget.attrs);}}
          />*/}
        </Layer>
      </Stage>
    </div>
  );
}

export default App;
