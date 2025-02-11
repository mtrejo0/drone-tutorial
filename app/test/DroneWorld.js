'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import * as Blockly from 'blockly';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default function DroneWorld({ instructions, isExecuting }) {
  const mountRef = useRef(null);
  const cubeRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const worldRef = useRef(null);
  const droneBodyRef = useRef(null);

  // Add PID controller ref
  const pidRef = useRef({
    targetHeight: null,
    kp: 100,
    ki: 0.1,
    kd: 50,
    integral: 0,
    lastError: 0,
    enabled: false
  });

  const blocklyWorkspaceRef = useRef(null);

  // Add new ref for controls
  const controlsRef = useRef(null);

  useEffect(() => {
    // Physics world setup
    const world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    });
    worldRef.current = world;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x87CEEB);

    // Add lighting for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Add ground plane - Visual
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x3a9d23,  // Changed to grass green
      side: THREE.DoubleSide 
    });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -2;
    
    // Add grid helper
    const gridHelper = new THREE.GridHelper(100, 100, 0x1a4d0f, 0x1a4d0f);  // Changed to dark green
    gridHelper.position.y = -1.99; // Slightly above ground to prevent z-fighting
    scene.add(gridHelper);
    scene.add(groundMesh);

    // Add ground plane - Physics
    const groundBody = new CANNON.Body({
      type: CANNON.Body.STATIC,
      shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    groundBody.position.set(0, -2, 0);
    world.addBody(groundBody);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;
    camera.position.z = 5;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer();
    rendererRef.current = renderer;
    renderer.setSize(window.innerWidth / 2, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Create drone body
    const droneGeometry = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.BoxGeometry(1, 0.2, 1);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
    const armMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    
    // Create 4 arms
    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Mesh(armGeometry, armMaterial);
      arm.rotation.z = Math.PI / 2;
      arm.position.x = Math.cos(i * Math.PI / 2) * 0.5;
      arm.position.z = Math.sin(i * Math.PI / 2) * 0.5;
      
      // Rotors
      const rotorGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
      const rotorMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
      const rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
      rotor.position.y = 0;
      arm.add(rotor);
      droneGeometry.add(arm);
    }
    
    droneGeometry.add(body);
    scene.add(droneGeometry);
    cubeRef.current = droneGeometry;

    // Physics body
    const droneShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.1, 0.5));
    const droneBody = new CANNON.Body({
      mass: 1,
      shape: droneShape,
    });
    droneBodyRef.current = droneBody;
    world.addBody(droneBody);

    // Add OrbitControls after camera and renderer setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Adds smooth movement
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Animation loop update
    const animate = () => {
      requestAnimationFrame(animate);
      
      world.step(1/60);
      
      // Update controls
      controls.update();
      
      // PID height control
      if (pidRef.current.enabled && pidRef.current.targetHeight !== null) {
        const currentHeight = droneBody.position.y;
        const error = pidRef.current.targetHeight - currentHeight;
        
        // PID calculations
        pidRef.current.integral += error * (1/60);
        const derivative = (error - pidRef.current.lastError) * 60;
        
        const force = (
          pidRef.current.kp * error +
          pidRef.current.ki * pidRef.current.integral +
          pidRef.current.kd * derivative
        );
        
        droneBody.applyLocalForce(
          new CANNON.Vec3(0, force, 0),
          new CANNON.Vec3(0, 0, 0)
        );
        
        pidRef.current.lastError = error;
      }
      
      // Update drone position and rotation
      droneGeometry.position.copy(droneBody.position);
      droneGeometry.quaternion.copy(droneBody.quaternion);
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = (window.innerWidth / 2) / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth / 2, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Updated controls
    const handleKeyDown = (event) => {
      const force = 10;
      const torque = 2;
      
      switch (event.key) {
        case ' ': // Spacebar for thrust
          droneBody.applyLocalForce(new CANNON.Vec3(0, force, 0), new CANNON.Vec3(0, 0, 0));
          break;
        case 'w': // Forward pitch
          droneBody.applyLocalForce(new CANNON.Vec3(0, force, 0), new CANNON.Vec3(0, 0, 0));
          break;
        case 's': // Backward pitch
          droneBody.applyLocalForce(new CANNON.Vec3(0, -force), new CANNON.Vec3(0, 0, 0));
          break;
        case 'a': // Roll left
          droneBody.applyTorque(new CANNON.Vec3(0, 0, torque));
          break;
        case 'd': // Roll right
          droneBody.applyTorque(new CANNON.Vec3(0, 0, -torque));
          break;
        case 'ArrowLeft': // Yaw left
          droneBody.applyTorque(new CANNON.Vec3(0, torque, 0));
          break;
        case 'ArrowRight': // Yaw right
          droneBody.applyTorque(new CANNON.Vec3(0, -torque, 0));
          break;
        case 'ArrowUp': // Pitch forward
          droneBody.applyTorque(new CANNON.Vec3(torque, 0, 0));
          break;
        case 'ArrowDown': // Pitch backward
          droneBody.applyTorque(new CANNON.Vec3(-torque, 0, 0));
          break;
        case 'h': // Toggle hover mode
          pidRef.current.enabled = true;
          pidRef.current.targetHeight = 1; // 1 meter above ground
          pidRef.current.integral = 0; // Reset integral term
          pidRef.current.lastError = 0; // Reset error history
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);

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

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      mountRef.current?.removeChild(renderer.domElement);
      controls.dispose(); // Clean up controls
    };
  }, []);

  // Handle instructions when they change
  useEffect(() => {
    if (!instructions.length || !isExecuting) return;


    const executeInstructions = async () => {
      for (const instruction of instructions) {
        const { type, direction, duration, height } = instruction;
        const torque = 2;

        switch (type) {
          case 'pitch': {
            const torqueValue = direction === 'FORWARD' ? torque : -torque;
            droneBodyRef.current.applyTorque(new CANNON.Vec3(torqueValue, 0, 0));
            await new Promise(resolve => setTimeout(resolve, duration));
            droneBodyRef.current.applyTorque(new CANNON.Vec3(-torqueValue, 0, 0));
            break;
          }
          case 'roll': {
            const torqueValue = direction === 'LEFT' ? torque : -torque;
            droneBodyRef.current.applyTorque(new CANNON.Vec3(0, 0, torqueValue));
            await new Promise(resolve => setTimeout(resolve, duration));
            droneBodyRef.current.applyTorque(new CANNON.Vec3(0, 0, -torqueValue));
            break;
          }
          case 'yaw': {
            const torqueValue = direction === 'LEFT' ? torque : -torque;
            droneBodyRef.current.applyTorque(new CANNON.Vec3(0, torqueValue, 0));
            await new Promise(resolve => setTimeout(resolve, duration));
            droneBodyRef.current.applyTorque(new CANNON.Vec3(0, -torqueValue, 0));
            break;
          }
          case 'hover': {
            pidRef.current.enabled = true;
            pidRef.current.targetHeight = height;
            pidRef.current.integral = 0;
            pidRef.current.lastError = 0;
            await new Promise(resolve => setTimeout(resolve, duration));
            break;
          }
          case 'delay': {
            await new Promise(resolve => setTimeout(resolve, duration));
            break;
          }
        }
      }
    };

    executeInstructions();
  }, [instructions, isExecuting]);
  return (
    <div ref={mountRef} style={{ 
      width: '50%',
      height: '50%',
      position: 'relative'
    }} />
  );
}
