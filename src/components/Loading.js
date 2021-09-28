import React, { Component } from 'react';
import '../styles/Loading.css';

class Loading extends Component {
  render() {
    return (
      <span>
        <div className="white-text">Mining.. It may take a few seconds.</div>
        <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
      </span>
    );
  }
}

export default Loading;