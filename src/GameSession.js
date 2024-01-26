import React, { useState, useEffect } from 'react';
import {
  Navbar,
  Nav,
  Container,
  Row,
  Col,
  Button,
  Dropdown,
  NavDropdown,
  InputGroup,
  FormControl,
} from 'react-bootstrap';
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

import {
  IoPersonCircleOutline,
  IoPencil
} from 'react-icons/io5'; // MIT Licensed icons
import DatatablePage from './Table';

import './App.css';

import Home from './Home';
import { defaultMapNames } from './defaultMapNames';

var host = window.location.hostname;

function GameSession(props) {
  const [spaceOptions, setSpaceOptions] = useState([
    {label: '1 - Safe', value: 'safe', color: 'white', numTiles: 0, maxTiles: -1},
    {label: '2 - Dangerous', value: 'dangerous', color: 'grey', numTiles: 0, maxTiles: -1},
    {label: '3 - Human Spawn', value: 'hspawn', color: 'purple', numTiles: 0, maxTiles: 1},
    {label: '4 - Alien Spawn', value: 'aspawn', color: 'red', numTiles: 0, maxTiles: 1},
    {label: '5 - Escape Pod', value: 'escapepod', color: 'orange', numTiles: 0, maxTiles: 4},
    {label: '6 - Remove', value: 'remove', color: '', numTiles: 0, maxTiles: -1}
  ]);

  const [toggleDrawingBtnColor, setToggleDrawingBtnColor] = useState('grey');
  const [currSpace, setCurrSpace] = useState();
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [spaceSelector, setSpaceSelector] = useState(spaceOptions[0]);


  // document.addEventListener('keydown', function(event) {
  //   const keycode = parseInt(event.keyCode);
  //   if ((keycode >= 49 && keycode <= (48 + spaceOptions.length)) && mapEditor) {
  //     console.log('Setting space options');
  //     setSpaceSelector(spaceOptions[keycode - 49]);
  //   }
  // });

  // client-side
  useEffect(() => {
    console.log(defaultMapNames);
    props.socket.on("connect", () => {  console.log(props.socket.id); });
    props.socket.on("responseMessage", (data) => {  console.log(data); });
    props.socket.on("connect_error", (err) => {  console.log(`connect_error due to ${err.message}`);});
  }, []);


  const hexClickHandle = (e, id) => {
    setCurrSpace(id);
    props.socket.emit('incoming', {test: id});
    let updatedMap = {...props.newMap};
    console.log(spaceSelector.numTiles);
    console.log(spaceSelector.maxTiles);
    e.currentTarget.setAttrs({
      fill: spaceSelector.color
    });

    updatedMap.tiles[id] = {
        tileType: spaceSelector.value,
        color: spaceSelector.color,
    };
  }


  const generateMap = () => {
    let hexagons = []

    for (let row = 1; row < 15; row++) {
      for (let col = 0; col < 23; col++) {
        let id = String.fromCharCode(0x41 + col) + (row).toString().padStart(2, '0');

        if (id in props.mapSelection.value.tiles && props.mapSelection.value.tiles[id].tileType !== 'remove') {
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
              fill={id === currSpace ? 'green' : props.mapSelection.value.tiles[id].color}
              stroke='black'
              strokeWidth={1}
              onClick={(e) => {setCurrSpace(id); props.socket.emit('tileClick', {tile: id, lobbyId: props.lobby.lobbyId, playerId: props.userName}); }}
              onTap={(e) => {setCurrSpace(id); props.socket.emit('tileClick', {tile: id, lobbyId: props.lobby.lobbyId, playerId: props.userName}); }}
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
    setIsDrawing(true);
    var transform = layerRef.current.getAbsoluteTransform().copy();
    // to detect relative position we need to invert transform
    transform.invert();
    let point = e.target.getStage().getPointerPosition();
    point = transform.point(point);
    setLines([...lines, { points: [point.x, point.y] }]);
  };

  const layerRef = React.useRef();
  const handleMouseMove = (e) => {
    // no drawing - skipping
    if ((!(isDrawing && drawingEnabled)) || lines.length === 0) {
      return;
    }
    const stage = e.target.getStage();
    var transform = layerRef.current.getAbsoluteTransform().copy();
    // to detect relative position we need to invert transform
    transform.invert();
    let point = stage.getPointerPosition();
    point = transform.point(point);
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
    setIsDrawing(false);
  };


  const primarySelectStyles = {
    control: base => ({
      ...base,
      borderColor: 'grey !important',
      boxShadow: 'none',
      marginBottom: '1em',
    })
  };

  const [stageScaleX, setStageScaleX] = useState(1.5);
  const [stageScaleY, setStageScaleY] = useState(1.5);
  return (
      <Container fluid>
      <Row className='align-items-center d-flex' style={{height: '75vh'}}>
        <Col sm='10' md='10' className='align-items-center justify-content-center d-flex' style={{height: '75vh'}}>
          <Stage
            pixelRatio={1.5}
            style={{marginTop: '1em', display: 'flex', justifyContent: 'center'}}
            width={window.innerWidth * 0.84}  // 10/12 col width
            height={window.innerHeight * 0.95}
            onWheel={(e) => {
              e.evt.preventDefault();
              if (e.evt.deltaY > 15 || e.evt.deltaY < 15) {
                setStageScaleX(stageScaleX - (e.evt.deltaY/250));
                setStageScaleY(stageScaleX - (e.evt.deltaY/250));
              }
            }}
            // scaleY={viewMode === 'viewOnly' ? 0.45 : stageScaleY}
            // scaleX={viewMode === 'viewOnly' ? 0.45 : stageScaleX}
            scaleY={stageScaleY}
            scaleX={stageScaleX}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onTouchStart={handleMouseDown}
            onTouchmove={handleMouseMove}
            onMouseup={handleMouseUp}
            draggable={!drawingEnabled}
            //offsetX={window.innerWidth / 10}
          >
            <Layer>
            {
              generateMap()
            }
            </Layer>
            <Layer ref={layerRef}>
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
        <Col xs='2' className="align-items-center d-flex">
          <div style={{position: 'absolute', top: '5em'}}>
            <DatatablePage
              keyField='player'
              columns={[
                {dataField: 'player', text: 'Player'}
              ]}
              data={props.lobby.players.map((player) => { return {'player': player.playerName}})}
            />
          </div>
          <Button 
            onClick={(e) => {props.socket.emit('turnSubmit', {player: props.playerName, roomCode: props.gameCodeId})}}
            style={{width: '100%', marginTop: '-20em', marginLeft: '1em'}}
          >
            End Turn
          </Button>
        </Col>
      </Row>
      <Row className='align-items-center d-flex'>
        <Col xs='12' className='align-items-center d-flex' style={{backgroundColor: props.role === 'alien' ? 'red' : 'green'}}>
          <h2 style={{align: 'center', flex: 'display', marginLeft: '45vw'}}>
           ROLE: {props.role.toUpperCase()}
          </h2>
        </Col>
      </Row>
    </Container>
  );
}

export default GameSession;
