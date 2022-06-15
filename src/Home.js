import React, { useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import Select from 'react-select';

import home_bg from './imgs/space-2.jpg';

const Home = (props) => {
  // Calling the function on component mount
  useEffect(() => {
    document.body.style.backgroundColor = 'black';

    return function cleanup() {
        document.body.style.backgroundColor = '#cccccc';//'#e9e9ea';
    };
  }, []);


  const primarySelectStyles = {
    control: base => ({
      ...base,
      borderColor: 'transparent !important',
      boxShadow: 'none',
    })
  };

  return (
    <Container fluid>
      <Row xs='12' style={{display: 'flex', justifyContent: 'center'}}>
        <Col xs='12' style={{display: 'flex', justifyContent: 'center'}}>
          <img src={home_bg} alt="home-bg" style={{height: `${window.innerHeight * 0.95}px`, width: `${window.innerWidth}px`}}/>;
        </Col>
      </Row>
    </Container>
  );
};

export default Home;
