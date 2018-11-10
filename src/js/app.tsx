import React from 'react';
import { hot } from 'react-hot-loader';

/* import './app.scss'; */

const App = () => (
  <div>
    <h1>Hello, real world.</h1>
    <p>how are you?</p>
  </div>
);

const HotApp = hot(module)(App);

export default HotApp;
