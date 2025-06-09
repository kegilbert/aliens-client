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
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import {
  IoCheckmarkCircleOutline
} from 'react-icons/io5'; // MIT Licensed icons
import { v4 as uuidv4 } from 'uuid';

import DatatablePage from './Table';
import Editor from './Editor';

import './App.css';

var host = window.location.hostname;

function Lobby(props) {
  const [refresh, setRefresh] = useState(false);

  const navigate = useNavigate();

  const playerListColumns = [{
      dataField: 'playerName',
      text: 'Player',
      editable: false,
      style: {
        verticalAlign: 'middle',
        fontSize: '1.25em'
      },
    }, {
      dataField: 'playerReady',
      text: 'Ready',
      editable: false,
      isDummyField: true,
      headerStyle: (colum, colIndex) => {
       return {width: '5em', textAlign: 'center'}
      },
      formatExtraData: props.lobby,
      formatter: (cell, row, rowIndex, formatExtraData) => {
        if (formatExtraData.players[rowIndex].playerReady) {
          return (
            <IoCheckmarkCircleOutline size={24} color={'green'}/>
          );
        } else {
          return null;
        }
      }
    }
  ];

  const playerSelectRow = {
    mode: 'radio',
    clickToSelect: true,
    clickToEdit: false,
    hideSelectColumn: true,
    // bgColor: 'green',
    onSelect: (row, isSelect, rowIndex, e) => {
      console.log(row);
      console.log(rowIndex);
      var _lobby = {...props.lobby};

      if (_lobby.players[rowIndex].playerName === props.userName) {
        setRefresh(true);
        _lobby.players[rowIndex].playerReady = !_lobby.players[rowIndex].playerReady;
        props.socket.emit('registerPlayerReadyState', {playerName: props.userName, playerReady: _lobby.players[rowIndex].playerReady, lobbyId: _lobby.lobbyId});
      }
    }
  };

  const primarySelectStyles = {
    control: base => ({
      ...base,
      borderColor: 'transparent !important',
      boxShadow: 'none',
    })
  };


  useEffect(() => {
    if (refresh) {
      setRefresh(false);
    }
  }, [refresh]);


  if (props.lobby === undefined) { return (<div/>) } else {
  return (
    <Container>
      <br />
      <Row className='justify-content-center'>
        <Col className='justify-content-center d-flex'>
          <h1> Lobby </h1>
        </Col>
        <hr />
      </Row>

      <Row className='justify-content-center'>
        <Col className=' d-flex justify-content-center'>
          <h2>
            {props.lobby !== undefined ? props.lobby.lobbyName : ''}
          </h2>
        </Col>
      </Row>
      <Row className='justify-content-center' style={{height: '5em'}}>
        <Col xs='2' className=' d-flex justify-content-center'>
          <h4> Map Selection: </h4>
        </Col>
        {
          props.userName === props.lobby.host ?
        <Col xs='6' className='justify-content-center'>
          <Select
            options={props.mapOptions}
            value={props.lobbyMapSelection}
            //value={props.mapOptions.filter((map) => map.label === props.lobby.mapLabel)[0]}
            onChange={(e) => {
              //props.setLobbyMapSelection(e);
              props.socket.emit('setLobbyMap', {lobbyId: props.lobbyId, mapLabel: e.label})
            }}
            filterOption={(candidate, input) => {
              if (candidate.label !== 'New') {
                return true;
              } else {
                return false;
              }
            }}
            styles={primarySelectStyles}
          />
          </Col> : 
          <Col xs='6'>
            <span style={{display: 'inline', verticalAlign: 'middle', fontSize: '1.5em', color: 'red'}}> Must be lobby host to edit map </span>
          </Col>
        }
        <Col xs='4' className='d-flex justify-content-center' style={{marginLeft: '-10em'}}>
          { props.lobby.mapLabel !== '' ?
          <Editor
              userName={props.userName}
              newMap={props.newMap}
              setNewMap={props.setNewMap}
              mapOptions={props.mapOptions}
              setMapOptions={props.setMapOptions}
              viewMode={'viewOnly'}
              //mapSelection={props.lobbyMapSelection}
              mapSelection={props.mapOptions.filter((map) => map.label === props.lobby.mapLabel)[0]}
              setMapSelection={props.setLobbyMapSelection}
              socket={props.socket}
          /> :
          <div />
        }
        </Col>
      </Row>

      <Row>
        <Col xs='6'>
        { refresh ?
          <div /> :
          <DatatablePage
            keyField='playerName'
            columns={playerListColumns}
            data={props.lobby.players}
            selectRow={playerSelectRow}
          />
        }
        </Col>
      </Row>

      <Row className='d-flex justify-content-center' style={{position: 'fixed', bottom: '5em', width: '50vw'}}>
        <Col className=' d-flex justify-content-center'>
          <Button
            className='warningButton'
            style={{marginTop: '1em'}}
            onClick={() => {
              props.socket.emit('leaveLobby', {roomCode: props.lobbyId, player: props.lobby.players.filter((player) => player.playerName === props.userName)[0]});
              props.setOpenLobbyPanel(false);
              props.setLobbyId('');
            }}
          >
            Leave Lobby
          </Button>
        </Col>
      </Row>

      {
        props.lobby.players.every((player) => player.playerReady === true) && props.lobby.mapLabel !== '' ?
          <Row className='d-flex justify-content-center' style={{position: 'fixed', bottom: '2em', width: '50vw'}}>
            <Col xs='8' className='d-flex justify-content-center'>
              <Button
                className='primaryButton'
                style={{marginTop: '1em', width: '100%'}}
                onClick={() => {
                  //props.setOpenLobbyPanel(false);
                  //let newGameId = uuidv4().slice(-6).toUpperCase();
                  //navigate(`/gamesession/${props.lobby.lobbyId}`, {replace: true});
                  //props.setGameCodeId(newGameId);
                  props.socket.emit('gameStart', {players: props.lobby.players, 'roomCode': props.lobby.lobbyId});
                }}
              >
                Start Game
              </Button>
            </Col>
          </Row> :
          <div />
      }
    </Container>
  );}
}

export default Lobby;
