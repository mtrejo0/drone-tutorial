'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import DroneWorld from './DroneWorld'; // Assuming DroneWorld is in the same directory

export default function BlocklyEditor() {
  const blocklyWorkspaceRef = useRef(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [instructions, setInstructions] = useState([]);
  const [shouldReset, setShouldReset] = useState(false);

  useEffect(() => {
    // Check if workspace already exists and clean it up
    if (blocklyWorkspaceRef.current) {
      blocklyWorkspaceRef.current.dispose();
    }

    // Clear any existing blockly div content
    const blocklyDiv = document.getElementById('blocklyDiv');
    if (blocklyDiv) {
      blocklyDiv.innerHTML = '';
    }

    // Blockly setup
    const toolbox = {
      kind: 'categoryToolbox',
      contents: [
        {
          kind: 'category',
          name: 'Drone Controls',
          colour: '#5CA699',
          contents: [
            {
              kind: 'block',
              type: 'drone_pitch',
            },
            {
              kind: 'block',
              type: 'drone_roll',
            },
            {
              kind: 'block',
              type: 'drone_yaw',
            },
            {
              kind: 'block',
              type: 'drone_hover',
            },
            {
              kind: 'block',
              type: 'delay',
            },
          ],
        },
      ],
    };

    // Define custom blocks
    Blockly.Blocks['drone_pitch'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("Pitch")
            .appendField(new Blockly.FieldDropdown([
              ["Forward", "FORWARD"],
              ["Backward", "BACKWARD"]
            ]), "DIRECTION")
            .appendField("for")
            .appendField(new Blockly.FieldNumber(1, 0.1, 10), "DURATION")
            .appendField("seconds");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
      }
    };

    Blockly.Blocks['drone_roll'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("Roll")
            .appendField(new Blockly.FieldDropdown([
              ["Left", "LEFT"],
              ["Right", "RIGHT"]
            ]), "DIRECTION")
            .appendField("for")
            .appendField(new Blockly.FieldNumber(1, 0.1, 10), "DURATION")
            .appendField("seconds");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
      }
    };

    Blockly.Blocks['drone_yaw'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("Yaw")
            .appendField(new Blockly.FieldDropdown([
              ["Left", "LEFT"],
              ["Right", "RIGHT"]
            ]), "DIRECTION")
            .appendField("for")
            .appendField(new Blockly.FieldNumber(1, 0.1, 10), "DURATION")
            .appendField("seconds");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
      }
    };

    Blockly.Blocks['drone_hover'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("Hover at")
            .appendField(new Blockly.FieldNumber(1, 0.1, 10), "HEIGHT")
            .appendField("meters for")
            .appendField(new Blockly.FieldNumber(1, 0.1, 10), "DURATION")
            .appendField("seconds");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
      }
    };

    Blockly.Blocks['delay'] = {
      init: function() {
        this.appendDummyInput()
            .appendField("Wait for")
            .appendField(new Blockly.FieldNumber(1, 0.1, 10), "SECONDS")
            .appendField("seconds");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
      }
    };

    // Create Blockly workspace
    const workspace = Blockly.inject('blocklyDiv', {
      toolbox: toolbox,
      scrollbars: true,
      horizontalLayout: false,
      toolboxPosition: 'start',
    });
    
    blocklyWorkspaceRef.current = workspace;

    // Cleanup function
    return () => {
      if (blocklyWorkspaceRef.current) {
        blocklyWorkspaceRef.current.dispose();
        blocklyWorkspaceRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this only runs once

  // Function to execute Blockly code
  const executeBlocklyCode = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    
    // Reset world and drone before executing new instructions
    setShouldReset(true);
    // Wait a brief moment for reset to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    setShouldReset(false);

    const workspace = blocklyWorkspaceRef.current;
    const topBlocks = workspace.getTopBlocks(true);
    const newInstructions = [];
    
    for (const block of topBlocks) {
      let currentBlock = block;
      while (currentBlock) {
        const type = currentBlock.type;
        const fields = currentBlock.getFieldValue.bind(currentBlock);

        switch (type) {
          case 'drone_pitch': {
            const direction = fields('DIRECTION');
            const duration = parseFloat(fields('DURATION')) * 1000;
            newInstructions.push({
              type: 'pitch',
              direction,
              duration
            });
            break;
          }
          case 'drone_roll': {
            const direction = fields('DIRECTION');
            const duration = parseFloat(fields('DURATION')) * 1000;
            newInstructions.push({
              type: 'roll',
              direction,
              duration
            });
            break;
          }
          case 'drone_yaw': {
            const direction = fields('DIRECTION');
            const duration = parseFloat(fields('DURATION')) * 1000;
            newInstructions.push({
              type: 'yaw',
              direction,
              duration
            });
            break;
          }
          case 'drone_hover': {
            const height = parseFloat(fields('HEIGHT'));
            const duration = parseFloat(fields('DURATION')) * 1000;
            newInstructions.push({
              type: 'hover',
              height,
              duration
            });
            break;
          }
          case 'delay': {
            const duration = parseFloat(fields('SECONDS')) * 1000;
            newInstructions.push({
              type: 'delay',
              duration
            });
            break;
          }
        }
        currentBlock = currentBlock.getNextBlock();
      }
    }
    setInstructions(newInstructions);
    setIsExecuting(false);
  };

  return (
    <div style={{ 
      display: 'flex', 
      width: '100%', 
      height: '100vh',
      position: 'absolute',
      top: 0,
      left: 0
    }}>
      {/* 3D Scene - Left side */}
      <div style={{ flex: '3' }}>
        <DroneWorld 
          instructions={instructions} 
          isExecuting={isExecuting} 
          shouldReset={shouldReset}
        />
      </div>
      
      {/* Blockly Editor - Right side */}
      <div style={{ 
        flex: '2',
        height: '100%',
        display: 'flex', 
        flexDirection: 'column',
        borderLeft: '2px solid #ccc',
        backgroundColor: '#f0f0f0'
      }}>
        <div id="blocklyDiv" style={{ 
          flex: 1,
          position: 'relative',
          margin: '10px'
        }} />
        <button 
          onClick={executeBlocklyCode}
          disabled={isExecuting}
          style={{
            padding: '15px',
            margin: '10px',
            backgroundColor: isExecuting ? '#ccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isExecuting ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isExecuting ? 'Executing...' : 'Run Program'}
        </button>
      </div>
    </div>
  );
}
