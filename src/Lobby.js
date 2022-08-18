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
  IoCheckmarkCircleOutline
} from 'react-icons/io5'; // MIT Licensed icons

import DatatablePage from './Table';
import Editor from './Editor';

import './App.css';

var host = window.location.hostname;

function Lobby(props) {

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
      formatter: (cell, row, rowIndex, formatExtraData) => {
        if (row.playerReady) {
          return (
            <IoCheckmarkCircleOutline size={24} color={'green'}/>
          );
        } else {
          return (<div />);
        }
      }
    }
  ];


  const playerSelectRow = {
    mode: 'radio',
    clickToSelect: true,
    clickToEdit: false,
    hideSelectColumn: true,
    bgColor: `var(--uap-color-primary)`,
    onSelect: (row, isSelect, rowIndex, e) => {
      var _lobby = {...props.lobby};

      _lobby.players = _lobby.players.map((player) => {
        if (_lobby.players[rowIndex].playerName === player.playerName) {
          return { playerName: player.playerName, playerReady: !player.playerReady};
        } else {
          return player;
        }
      });
      props.setLobby(_lobby);
    }
  };

  const primarySelectStyles = {
    control: base => ({
      ...base,
      borderColor: 'transparent !important',
      boxShadow: 'none',
    })
  };

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
        <Col xs='6' className='justify-content-center'>
          <Select
            options={props.mapOptions}
            value={props.lobbyMapSelection}
            onChange={(e) => {
              console.log(e);
              props.setLobbyMapSelection(e);

              props.socket.emit('setLobbyMap', {lobbyId: props.lobbyId, map: e})
            }}
            styles={primarySelectStyles}
          />
        </Col>
        <Col xs='4' className=' d-flex justify-content-center'>
          <Editor 
              userName={props.userName}
              newMap={props.newMap}
              setNewMap={props.setNewMap}
              mapOptions={props.mapOptions}
              setMapOptions={props.setMapOptions}
              viewMode={'viewOnly'}
              mapSelection={props.lobbyMapSelection}
              setMapSelection={props.setLobbyMapSelection}
              socket={props.socket}
          />
        </Col>
      </Row>

      <Row>
        <Col xs='6'>
          <DatatablePage
            keyField='lobbyId'
            columns={playerListColumns}
            data={props.lobby.players}
            selectRow={playerSelectRow}
          />
        </Col>
      </Row>

      <Row className='justify-content-center'>
        <Col className=' d-flex justify-content-center'>
          <Button
            className='warningButton'
            style={{marginTop: '1em'}}
            onClick={() => {
              props.setOpenLobbyPanel(false);
              props.setLobbyId('');
            }}
          >
            Leave Lobby
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default Lobby;
