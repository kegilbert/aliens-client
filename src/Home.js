import React, { useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import Select from 'react-select';

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
    <Container>
        <br />
        <Row className='justify-content-center'>
            <Col xs='6' className='justify-content-center d-flex'>
                <h1 style={{maxWidth: '10em', color: 'teal', whiteSpace: 'nowrap'}}>
                    Welcome to the UAP!
                </h1>
            </Col>
        </Row>
        <Row className='justify-content-center'>
            <Col xs='6' className='justify-content-center d-flex'>
                <h2 style={{maxWidth: '10em', color: 'grey', whiteSpace: 'nowrap'}}>
                    <a href={'http://'+window.location.hostname+'/docs'} target='_blank'> View the Docs </a>
                </h2>
            </Col>
        </Row>
        <Row className='justify-content-center' style={{marginTop: '1em'}}>
             <Col xs='6' className='justify-content-center d-flex'>
                <span>
                    {props.rev.length > 0 ?
                        props.rev :
                        '\u200B' /* Zero-width character */
                    }
                </span>
             </Col>
        </Row>
        <Row className='justify-content-center'>
             <Col xs='6' className='justify-content-center d-flex'>
                <span>
                    {props.uapname.length > 0 ?
                        props.uapname :
                        '\u200B' /* Zero-width character */
                    }
                </span>
             </Col>
        </Row>
        <Row className='justify-content-center'>
            <Col xs='6' className='justify-content-center d-block'>
                <hr />
            </Col>
        </Row>
        <Row className='justify-content-center'>
            <Col xs='2' className='justify-content-end d-block' float='right'>
                <label style={{marginTop: '0.5em', display: 'grid', justifyContent: 'right'}}>
                    WiFi SSIDs:
                </label>
            </Col>
            <Col xs='3' className='justify-content-center d-block'>
                <Select
                    options={props.SSIDList}
                    value={props.SSID}
                    onChange={props.setSSID}
                    styles={primarySelectStyles}
                />
             </Col>
        </Row>
        <Row className='justify-content-center'>
          <Col xs='6' className='justify-content-center d-block'>
              <hr />
          </Col>
        </Row>
        {
          window.location.hostname.includes('localhost') ?
            <div /> :
            <Row className='justify-content-center'>
              <Col xs='8' className='justify-content-center d-flex'>
                <Button
                  className='UAPwarningButton'
                  style={{marginTop: '1em'}}
                >
                  Launch TFT GUI
                </Button>
              </Col>
            </Row>
        }
        {/*<img src={idle} alt="Welcome" style={{position: 'absolute', bottom: '0%', left: '0%', width: '100%'}} />*/}
     {/*   <img src={idle} alt="Welcome" style={{position: 'absolute', left: '38%', top: '35%', width: '25%'}} />*/}
    </Container>
  );
};

export default Home;
