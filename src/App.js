import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import Select from 'react-select';
import {
  Stage,
  Layer,
  Text,
  Image,
  Line,
  Rect,
  Circle,
  RegularPolygon
} from 'react-konva';
import io from 'socket.io-client';

import './App.css';

// import safeSpace from 'safe-space';
// import dangerSpace from 'danger-space';

var host = window.location.hostname;
const socket = io('http://' + host + ':5000');

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
  const spaceOptions = [
    {label: 'Safe', value: 'safe', color: 'white'},
    {label: 'Dangerous', value: 'dangerous', color: 'grey'},
    {label: 'Human Spawn', value: 'hspawn', color: 'purple'},
    {label: 'Alien Spawn', value: 'aspawn', color: 'red'},
    {label: 'Escape Pod', value: 'escapepod', color: 'orange'}, 
    {label: 'Remove', value: 'remove', color: ''}
  ];

  const [currSpace, setCurrSpace] = useState();
  const [newMap, setNewMap] = useState({});
  const [mapEditor, setMapEditor] = useState(false);
  const [spaceSelector, setSpaceSelector] = useState(spaceOptions[0]);
  const [mapOptions, setMapOptions] = useState([
    {label: 'New', value: newMap}
  ]);
  const [mapSelection, setMapSelection] = useState(mapOptions[0]);
  //const [mapEditorMap, setMapEditorMap] = useState([]);


  // client-side
  useEffect(() => {
    //setMapEditorMap(generateMapEditor());
    socket.on("connect", () => {  console.log(socket.id); });
    socket.on("responseMessage", (data) => {  console.log(data); });
    socket.on("connect_error", (err) => {  console.log(`connect_error due to ${err.message}`);});
  }, []);

  const generateMap = () => {
    let hexagons = []

    for (let row = 1; row < 15; row++) {
      for (let col = 0; col < 23; col++) {
        let id = String.fromCharCode(0x41 + col) + (row).toString().padStart(2, '0');

        if (id in mapSelection.value && mapSelection.value[id].tileType !== 'remove') {
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
              fill={id === currSpace ? 'green' : mapSelection.value[id].color}
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
        }
      }
    }

    return hexagons;
  }


  const generateMapEditor = () => {
    let hexagons = [];

    for (let row = 1; row < 15; row++) {
      for (let col = 0; col < 23; col++) {
        let id = String.fromCharCode(0x41 + col) + (row).toString().padStart(2, '0');

        //if (!(id in Object.values(newMap).filter(tile => tile.tileType === 'remove'))) {
        if (!(id in newMap && newMap[id].tileType === 'remove')) {
          hexagons.push(
            <>
            <Text
              text={id}
              fontSize={12}
              x={26 + (col * (36 + 18))}
              y={31 + (row * (36 + 27)) + (col % 2)*31}
            />
            <RegularPolygon
              perfectDrawEnabled={false}
              shadow={false}
              key={id}
              id={id}
              x={36 + (col * (36 + 18))}
              y={36 + (row * (36 + 27)) + (col % 2)*31}
              sides={6}
              radius={36}
              fill={id in mapSelection.value ?
                mapSelection.value[id].color :
                'cyan'
              }
              stroke='black'
              strokeWidth={1}
              onClick={(e) => {
                setCurrSpace(id);
                console.log(socket.connected);
                socket.emit('incoming', {test: id});
                console.log(e.currentTarget.getAttrs());
                e.currentTarget.setAttrs({
                  fill: spaceSelector.color
                });
                setNewMap({
                  ...newMap,
                  [id]: {
                    tileType: spaceSelector.value,
                    color: spaceSelector.color,
                  }
                });
              }}
              onTap={(e) => {
                setCurrSpace(id);
                setNewMap({
                  ...newMap,
                  [id]: {
                    tileType: spaceSelector.value,
                    color: spaceSelector.color,
                  }
                });
              }}
              //dash={[16, 10]} // apply dashed stroke that is 10px long and 5 pixels apart
              name={id}
              fillAfterStrokeEnabled={true}
              opacity={0.4}
              rotation={90}
            />
            </>
          );
        }
      }
    }

    return hexagons;
  }


  const [lines, setLines] = React.useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingEnabled, setDrawingEnabled] = useState(false);

  const handleMouseDown = (e) => {
    console.log('Mouse Down');
    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    setLines([...lines, { points: [pos.x, pos.y] }]);
  };


  const handleMouseMove = (e) => {
    // no drawing - skipping
    if ((!(isDrawing && drawingEnabled)) || lines.length === 0) {
      return;
    }
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
    let lastLine = {points: []};
    if (lines.length !== 0) {
      lastLine = lines[lines.length - 1];
    }
    // add point
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    // replace last
    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };


  const handleMouseUp = () => {
    console.log('Mouse Up');
    setIsDrawing(false);
  };


  const [stageScaleX, setStageScaleX] = useState(1);
  const [stageScaleY, setStageScaleY] = useState(1);
  return (
    <div className="App">
      <Container fluid>
      <Row>
        <Button variant='secondary' style={{boxShadow: 'None'}} onClick={() => setMapEditor(!mapEditor)}>
          {
            mapEditor ?
              <span> View Map </span> :
              <span> Map Editor </span> 
          }
        </Button>
      </Row>
      <Row className="align-items-center">
        <Col>
          <Stage
            pixelRatio={1}
            style={{marginTop: '1em', display: 'flex', justifyContent: 'center'}}
            width={window.innerWidth * 0.75}
            height={window.innerHeight * 0.75}
            onWheel={(e) => {
              e.evt.preventDefault();
              if (e.evt.deltaY > 15 || e.evt.deltaY < 15) {
                setStageScaleX(stageScaleX + (e.evt.deltaY/250));
                setStageScaleY(stageScaleX + (e.evt.deltaY/250));
              }
            }}
            scaleX={stageScaleX}
            scaleY={stageScaleY}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
          >
            <Layer>
              {
                mapEditor ? 
                  generateMapEditor() :
                  //mapEditorMap :
                  generateMap()
              }
            </Layer>
            <Layer>
              {lines.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke="#df4b26"
                  strokeWidth={5}
                  tension={0.5}
                  lineCap="round"
                  globalCompositeOperation={'source-over'}
                />
              ))}
            </Layer>
          </Stage>
        </Col>
      </Row>
      <Row className="align-items-center">
        <Col lg='3'>
  {/*          <div style={{display: 'flex', justifyContent: 'center'}}>*/}
          <div style={{position: 'absolute', left: '15%', width: '20%', marginTop: '2em'}}>
            <Select
              options={mapOptions}
              value={mapSelection}
              onChange={setMapSelection}
            />
          </div>
          <div style={{position: 'absolute', left: '40%', width: '20%', marginTop: '2em'}}>
            <Select
              options={spaceOptions}
              value={spaceSelector}
              onChange={setSpaceSelector}
            />
            <Button
              style={{
                backgroundColor: 'grey',
                boxShadow: 'None',
                borderColor: 'grey',
                width: '100%',
                marginTop: '1em'
              }}
              onClick={(e) => { setDrawingEnabled(!drawingEnabled); }}
            >
                Toggle Drawing
            </Button>
            <Button
              style={{
                backgroundColor: 'grey',
                boxShadow: 'None',
                borderColor: 'grey',
                width: '100%',
                marginTop: '1em'
              }}
              onClick={(e) => {
                socket.emit('save', newMap);
                mapOptions.push(
                  {label: `Map${mapOptions.length}`, value: newMap}
                );
                setMapOptions(mapOptions);
                setNewMap({});
              }}
            >
                Save
            </Button>
          </div>
        </Col>
      </Row>
      </Container>
    </div>
  );
}

export default App;
