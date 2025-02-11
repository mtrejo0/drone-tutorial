'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export default function ThreeDWorld() {
  const mountRef = useRef(null);
  const cubeRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const worldRef = useRef(null);
  const droneBodyRef = useRef(null);

  useEffect(() => {
    // Physics world setup
    const world = new CANNON.World({
      gravity: new CANNON.Vec3(0, -9.82, 0),
    });
    worldRef.current = world;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x1a1a1a);

    // Add lighting for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Add ground plane - Visual
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x808080,
      side: THREE.DoubleSide 
    });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = -2;
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
    renderer.setSize(window.innerWidth, window.innerHeight);
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

    // Animation loop update
    const animate = () => {
      requestAnimationFrame(animate);
      
      world.step(1/60);
      
      // Update drone position and rotation from physics
      droneGeometry.position.copy(droneBody.position);
      droneGeometry.quaternion.copy(droneBody.quaternion);
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Updated controls
    const handleKeyDown = (event) => {
      const force = 1000;
      const torque = 2;
      
      switch (event.key) {
        case ' ': // Spacebar for thrust
          droneBody.applyLocalForce(new CANNON.Vec3(0, force, 0), new CANNON.Vec3(0, 0, 0));
          break;
        case 'w': // Forward pitch
          droneBody.applyLocalForce(new CANNON.Vec3(0, force, -force), new CANNON.Vec3(0, 0, 0));
          break;
        case 's': // Backward pitch
          droneBody.applyLocalForce(new CANNON.Vec3(0, force, force), new CANNON.Vec3(0, 0, 0));
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />;
}
