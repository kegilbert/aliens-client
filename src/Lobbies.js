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
  IoLockClosed
} from 'react-icons/io5'; // MIT Licensed icons
import { v4 as uuidv4 } from 'uuid';

import DatatablePage from './Table';

import './App.css';

var host = window.location.hostname;

function Lobbies(props) {

  const lobbyColumns=[{
        dataField: 'lobbyName',
        text: 'Lobby'
      }, {
        dataField: 'lobbyId',
        text: 'Lobby ID',
        editable: false
        //hidden: true
      }, {
        dataField: 'numPlayers',
        text: 'Players'
      }, {
        dataField: 'private',
        text: 'Private',
        editable: false,
        isDummyField: true,
        headerStyle: (colum, colIndex) => {
         return {width: '5em', textAlign: 'center'}
        },
        formatter: (cell, row, rowIndex, formatExtraData) => {
          if (row.private) {
            return (
              <IoLockClosed size={18} />
            );
          } else {
            return (<div />);
          }
        }
      }
  ];


  const selectRow = {
    mode: 'radio',
    clickToSelect: true,
    clickToEdit: false,
    hideSelectColumn: true,
    bgColor: `var(--uap-color-primary)`,
    onSelect: (row, isSelect, rowIndex, e) => {
      if (props.userName === '') {
        props.setShowUserModal(true);

        return;
      }

      if (props.lobbyId !== '') {
        if (props.lobbyId === row.lobbyId) {
          return;
        }
        if (!window.confirm(`Change from Lobby:\n\t${props.lobby.lobbyName}\nto Lobby\n\t${row.lobbyName} ?`)) {
          return;
        }
      }

      if (row.private) {
        var pw = prompt("Please enter this lobby's password");
        if (pw === null) {
          alert('Nothing was entered');
          return;
        }

        var url = 'http://' + host + ':5069/check_lobby_password';

        fetch(url, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Accept': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          //signal: controller.signal,
          body: JSON.stringify({lobbyId: row.lobbyId, pw: pw})
        })
          .then(response => response.json())
          .then(data => {
            if (data.status) {
              props.setLobbyId(row.lobbyId);
              props.setLobby(row);
              props.setOpenLobbyPanel(true);

              props.socket.emit('joinLobby', {roomCode: row.lobbyId, lobbyName: row.lobbyName, userID: props.userName});
            } else {
              alert('Incorrect password');
            }
          });

        return;
      }

      props.setLobbyId(row.lobbyId);
      props.setLobby(row);
      props.setOpenLobbyPanel(true);

      props.socket.emit('joinLobby', {roomCode: row.lobbyId, lobbyName: row.lobbyName, userID: props.userName});
    }
  };


  return (
    <Container>
      <br />
      <Row className='justify-content-center'>
        <Col className='justify-content-center d-flex'>
          <h1> Lobbies </h1>
        </Col>
      </Row>
      <Row className='justify-content-center'>
        <Col xs='3' className='justify-content-center'>
          <Button
            className='primaryButton'
            onClick={() => {
              if (props.userName === '') {
                props.setShowUserModal(true);

                return;
              }

              const lobbyName = prompt('Lobby Name');

              if (lobbyName === null) {
                return;
              }

              const lobbyPW   = prompt('Password [leave blank for public lobby]');
              var newID = uuidv4().slice(-6).toUpperCase(); //Math.random().toString(36).substr(2, 6).toUpperCase();

              while(props.lobbies.map((lobby) => lobby.lobbyId).includes(newID)) {
                newID = uuidv4().slice(-6).toUpperCase(); //Math.random().toString(36).substr(2, 6).toUpperCase();
              }

              props.setLobbyId(newID);
              props.setOpenLobbyPanel(true);

              props.socket.emit('createLobby', {
                lobbyId: newID,
                lobbyName: lobbyName,
                lobbyPW: lobbyPW,
                creatorPlayer: props.userName
              });
            }}
          >
            Create Lobby
          </Button>
        </Col>
        <Col xs='3' className='justify-content-center'>
          <Button
            className='primaryButton'
            onClick={() => {
              console.log(prompt('Lobby ID: '));
            }}
            disabled={true}
          >
            Join Lobby By ID
          </Button>
        </Col>
      </Row>
      <Row className='justify-content-center'>
        <Col className=' d-flex justify-content-start'>
          <DatatablePage
            keyField='lobbyId'
            columns={lobbyColumns}
            data={props.lobbies}
            search={true}
            searchInput={props.searchInput}
            setSearchInput={props.setSearchInput}
            selectRow={selectRow}
          />
        </Col>
      </Row>
    </Container>
  );
}

export default Lobbies;
