import React, { useState, useEffect } from 'react';
import './Keyboard.css';

const TouchKeyboard = ({ onChange, input = "", onHide }) => {
  const [isUpperCase, setIsUpperCase] = useState(false);
  const [currentLayout, setCurrentLayout] = useState('letters');

  const layouts = {
    letters: {
      rows: [
        ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'ñ'],
        ['↑', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '←'],
        ['123', 'espacio']
      ]
    },
    numbers: {
      rows: [
        ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
        ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
        ['#+=', '.', ',', '?', '!', "'", '_', '←'],
        ['ABC', 'espacio']
      ]
    },
    symbols: {
      rows: [
        ['[', ']', '{', '}', '#', '%', '^', '*', '+', '='],
        ['_', '\\', '|', '~', '<', '>', '€', '£', '¥', '•'],
        ['ABC', '.', ',', '?', '!', "'", '_', '←'],
        ['123', 'espacio']
      ]
    }
  };

  const handleKeyPress = (key) => {
    let newInput = input;

    switch (key) {
      case '↑':
        setIsUpperCase(!isUpperCase);
        return;
      
      case '←':
        newInput = input.slice(0, -1);
        break;
      
      case 'espacio':
        newInput = input + ' ';
        break;
      
      case '123':
        setCurrentLayout('numbers');
        return;
      
      case 'ABC':
        setCurrentLayout('letters');
        return;
      
      case '#+=':
        setCurrentLayout('symbols');
        return;
      
      case 'listo':
        if (onHide) onHide();
        return;
      
      default:
        const finalKey = isUpperCase ? key.toUpperCase() : key;
        newInput = input + finalKey;
        if (isUpperCase) setIsUpperCase(false);
        break;
    }

    onChange(newInput);
  };

  const renderKey = (key) => {
    const displayKey = isUpperCase && /^[a-zñ]$/.test(key) ? key.toUpperCase() : key;
    
    let className = 'touch-key';
    
    if (key === '↑' || key === '←' || key === 'espacio' || key === 'listo' || 
        key === '123' || key === 'ABC' || key === '#+=') {
      className += ' touch-key-special';
    }
    
    if (key === 'espacio') {
      className += ' touch-key-space';
    }
    
    if (key === 'listo') {
      className += ' touch-key-done';
    }
    
    if (key === '←') {
      className += ' touch-key-backspace';
    }
    
    if (key === '↑') {
      className += isUpperCase ? ' touch-key-shift-active' : ' touch-key-shift';
    }

    return (
      <button
        key={key}
        className={className}
        onClick={() => handleKeyPress(key)}
        type="button"
      >
        {displayKey}
      </button>
    );
  };

  return (
    <div className="touch-keyboard">
      <div className="touch-keyboard-inner">
        {layouts[currentLayout].rows.map((row, rowIndex) => (
          <div key={rowIndex} className="touch-keyboard-row">
            {row.map(renderKey)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TouchKeyboard;