// Farm3D.js
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CSS2DRenderer, CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import "./Farm3D.css";

function Farm3D({ crop, soilType, farmSize }) {
  const mountRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cameraMode, setCameraMode] = useState("overview");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [texturesLoaded, setTexturesLoaded] = useState(0);
  const [totalTextures, setTotalTextures] = useState(0);
  
  // Refs for cleanup
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const labelRendererRef = useRef(null);
  const controlsRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Clean up previous instance
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    setIsLoading(true);
    setError(null);
    setLoadingProgress(10);

    try {
      // Scene setup
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.background = new THREE.Color(0x87ceeb);
      scene.fog = new THREE.Fog(0x87ceeb, 30, 60);
      setLoadingProgress(20);

      // Camera
      const camera = new THREE.PerspectiveCamera(
        60,
        mount.clientWidth / mount.clientHeight,
        0.1,
        1000
      );
      
      // Set camera position based on mode
      switch(cameraMode) {
        case "closeup":
          camera.position.set(5, 5, 10);
          break;
        case "drone":
          camera.position.set(20, 30, 20);
          break;
        default:
          camera.position.set(0, 15, 25);
      }
      setLoadingProgress(30);

      // WebGL Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      rendererRef.current = renderer;
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setPixelRatio(window.devicePixelRatio);
      mount.appendChild(renderer.domElement);
      setLoadingProgress(40);

      // CSS2DRenderer for labels
      const labelRenderer = new CSS2DRenderer();
      labelRendererRef.current = labelRenderer;
      labelRenderer.setSize(mount.clientWidth, mount.clientHeight);
      labelRenderer.domElement.style.position = 'absolute';
      labelRenderer.domElement.style.top = '0';
      labelRenderer.domElement.style.left = '0';
      labelRenderer.domElement.style.pointerEvents = 'none';
      mount.appendChild(labelRenderer.domElement);
      setLoadingProgress(50);

      // Texture loader with loading management
      const loadingManager = new THREE.LoadingManager();
      loadingManager.onLoad = () => {
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      };
      
      loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
        setTexturesLoaded(itemsLoaded);
        setTotalTextures(itemsTotal);
        const progress = 50 + (itemsLoaded / itemsTotal) * 40;
        setLoadingProgress(progress);
      };

      const loader = new THREE.TextureLoader(loadingManager);

      // ---------- SOIL TEXTURE ----------
      let soilTexture;
      try {
        // Try to load soil texture from images folder
        soilTexture = loader.load(`/images/${soilType}.jpg`);
        soilTexture.wrapS = soilTexture.wrapT = THREE.RepeatWrapping;
        soilTexture.repeat.set(10, 10);
      } catch {
        // Fallback to procedural texture
        soilTexture = createProceduralSoilTexture(soilType);
      }

      // Ground
      const groundGeometry = new THREE.CircleGeometry(40, 64);
      const groundMaterial = new THREE.MeshStandardMaterial({ 
        map: soilTexture,
        roughness: 0.7,
        metalness: 0.1
      });
      
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      ground.position.y = 0;
      scene.add(ground);
      setLoadingProgress(60);

      // Add grass patches
      addGrassPatches(scene);

      // Add field boundaries
      addFieldBoundaries(scene);

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const sunLight = new THREE.DirectionalLight(0xfff5d1, 1);
      sunLight.position.set(20, 30, 10);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 50;
      sunLight.shadow.camera.left = -20;
      sunLight.shadow.camera.right = 20;
      sunLight.shadow.camera.top = 20;
      sunLight.shadow.camera.bottom = -20;
      scene.add(sunLight);

      // Add a second light from opposite direction
      const backLight = new THREE.DirectionalLight(0x88aaff, 0.3);
      backLight.position.set(-10, 20, -10);
      scene.add(backLight);
      setLoadingProgress(70);

      // Atmosphere
      addClouds(scene);
      addParticles(scene);

      // ---------- PLANTS WITH IMAGES ----------
      const grid = Math.max(3, Math.ceil(Math.sqrt(farmSize * 100)));
      const spacing = 2.5;
      const plants = [];

      // Calculate total plants for texture loading
      const plantCount = grid * grid;
      setTotalTextures(plantCount + 1); // +1 for soil texture

      // Try to load crop image
      let cropTexture = null;
      if (crop) {
        try {
          // Try different image extensions
          const imagePath = `/crops/${crop}.png`;
          cropTexture = loader.load(imagePath);
          cropTexture.transparent = true;
        } catch (err) {
          console.log(`Could not load crop image for ${crop}, using 3D models instead`);
          cropTexture = null;
        }
      }

      // Create plants
      for (let i = -grid / 2; i < grid / 2; i++) {
        for (let j = -grid / 2; j < grid / 2; j++) {
          // Add randomness to positions
          const offsetX = (Math.random() - 0.5) * 0.8;
          const offsetZ = (Math.random() - 0.5) * 0.8;
          const x = i * spacing + offsetX;
          const z = j * spacing + offsetZ;
          
          let plant;

          if (cropTexture) {
            // Create plant with image texture
            const material = new THREE.MeshStandardMaterial({
              map: cropTexture,
              transparent: true,
              side: THREE.DoubleSide,
              emissive: 0x000000,
              emissiveIntensity: 0
            });
            
            // Create a cross-plane for better 3D effect with images
            const group = new THREE.Group();
            
            // First plane
            const geometry1 = new THREE.PlaneGeometry(1.8, 2.2);
            const plane1 = new THREE.Mesh(geometry1, material);
            plane1.rotation.y = 0;
            plane1.position.y = 1.1;
            plane1.castShadow = true;
            plane1.receiveShadow = false;
            group.add(plane1);
            
            // Second plane (rotated 90 degrees)
            const geometry2 = new THREE.PlaneGeometry(1.8, 2.2);
            const plane2 = new THREE.Mesh(geometry2, material);
            plane2.rotation.y = Math.PI / 2;
            plane2.position.y = 1.1;
            plane2.castShadow = true;
            plane2.receiveShadow = false;
            group.add(plane2);
            
            // Add a small base/stem
            const stemGeo = new THREE.CylinderGeometry(0.1, 0.15, 0.3, 6);
            const stemMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
            const stem = new THREE.Mesh(stemGeo, stemMat);
            stem.position.y = 0.15;
            stem.castShadow = true;
            stem.receiveShadow = true;
            group.add(stem);
            
            group.position.set(x, 0, z);
            group.userData.animate = true;
            group.userData.speed = 0.2 + Math.random() * 0.3;
            
            plant = group;
          } else {
            // Fallback to 3D model if no image
            plant = createPlant(crop, x, z);
          }
          
          if (plant) {
            scene.add(plant);
            plants.push(plant);
          }
        }
      }
      setLoadingProgress(90);

      // Add irrigation system
      addIrrigationSystem(scene, grid, spacing);

      // Add farm equipment
      addFarmEquipment(scene, grid);

      // Add data labels
      addDataLabels(scene, grid, spacing, farmSize, crop, soilType);

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controlsRef.current = controls;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = true;
      controls.maxPolarAngle = Math.PI / 2.2;
      controls.minDistance = 5;
      controls.maxDistance = 50;
      controls.target.set(0, 2, 0);

      // Force an initial render
      renderer.render(scene, camera);

      // Animation loop
      let time = 0;
      const animate = () => {
        animationFrameRef.current = requestAnimationFrame(animate);
        time += 0.01;

        // Animate plants (subtle rotation for image-based plants)
        plants.forEach((plant, index) => {
          if (plant.userData.animate) {
            // Very subtle rotation for image plants
            if (cropTexture) {
              plant.rotation.y += 0.001 * plant.userData.speed;
            } else {
              // For 3D models, do more animation
              plant.rotation.y += 0.005 * plant.userData.speed;
              if (plant.children[0]) {
                plant.children[0].position.y = 1 + Math.sin(time * 2 + index) * 0.1;
              }
            }
          }
        });

        controls.update();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
      };
      animate();

      // Handle resize
      const handleResize = () => {
        const width = mount.clientWidth;
        const height = mount.clientHeight;
        
        if (rendererRef.current && labelRendererRef.current && camera) {
          rendererRef.current.setSize(width, height);
          labelRendererRef.current.setSize(width, height);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
        }
      };

      window.addEventListener('resize', handleResize);

      // Cleanup function - FIXED: Removed labelRenderer.dispose()
      return () => {
        window.removeEventListener('resize', handleResize);
        
        // Cancel animation frame
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        // Dispose controls
        if (controlsRef.current) {
          controlsRef.current.dispose();
        }
        
        // Remove DOM elements
        if (mount && rendererRef.current) {
          if (rendererRef.current.domElement) {
            mount.removeChild(rendererRef.current.domElement);
          }
        }
        
        if (mount && labelRendererRef.current) {
          if (labelRendererRef.current.domElement) {
            mount.removeChild(labelRendererRef.current.domElement);
          }
        }
        
        // Dispose WebGL renderer only (CSS2DRenderer doesn't have dispose)
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
        
        // Clear scene
        if (sceneRef.current) {
          while(sceneRef.current.children.length > 0) {
            sceneRef.current.remove(sceneRef.current.children[0]);
          }
        }
        
        // Clear refs
        sceneRef.current = null;
        rendererRef.current = null;
        labelRendererRef.current = null;
        controlsRef.current = null;
      };
    } catch (err) {
      console.error("3D Error:", err);
      setError(err.message);
      setIsLoading(false);
    }
  }, [crop, soilType, farmSize, cameraMode]);

  // Helper function to create procedural soil texture (fallback)
  const createProceduralSoilTexture = (soilType) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    let baseColor;
    switch(soilType) {
      case 'sandy':
        baseColor = '#f4e4c1';
        break;
      case 'clayey':
        baseColor = '#8b5a2b';
        break;
      case 'loamy':
      default:
        baseColor = '#654321';
    }

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise texture
    for (let i = 0; i < 10000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 3;
      
      if (soilType === 'sandy') {
        ctx.fillStyle = `rgba(238, 232, 170, ${Math.random() * 0.5})`;
      } else if (soilType === 'clayey') {
        ctx.fillStyle = `rgba(139, 69, 19, ${Math.random() * 0.3})`;
      } else {
        ctx.fillStyle = `rgba(101, 67, 33, ${Math.random() * 0.2})`;
      }
      
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(10, 10);
    return texture;
  };

  // Fallback 3D plant creation (if no image)
  const createPlant = (crop, x, z) => {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.userData.animate = true;
    group.userData.speed = 0.5 + Math.random() * 0.5;

    let height = 1.0;
    let color = 0x2ecc71;

    switch(crop?.toLowerCase()) {
      case 'wheat':
        height = 1.2;
        color = 0xf1c40f;
        break;
      case 'corn':
      case 'maize':
        height = 2.0;
        color = 0x27ae60;
        break;
      case 'rice':
        height = 1.0;
        color = 0x7f8c8d;
        break;
      case 'tomato':
        height = 1.5;
        color = 0xe74c3c;
        break;
      default:
        height = 1.0;
        color = 0x2ecc71;
    }

    // Stem
    const stemGeo = new THREE.CylinderGeometry(0.1, 0.15, height, 6);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = height / 2;
    stem.castShadow = true;
    stem.receiveShadow = true;
    group.add(stem);

    // Head
    const headGeo = new THREE.SphereGeometry(0.3, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: color });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = height;
    head.castShadow = true;
    head.receiveShadow = true;
    group.add(head);

    return group;
  };

  const addGrassPatches = (scene) => {
    const grassGeo = new THREE.ConeGeometry(0.2, 0.5, 5);
    
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 20 + Math.random() * 15;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const grassMat = new THREE.MeshStandardMaterial({ 
        color: new THREE.Color(`hsl(${120 + Math.random() * 20}, 80%, ${30 + Math.random() * 20}%)`)
      });
      
      const grass = new THREE.Mesh(grassGeo, grassMat);
      grass.position.set(x, 0.25, z);
      grass.rotation.x = Math.random() * 0.5;
      grass.rotation.z = Math.random() * Math.PI * 2;
      grass.castShadow = true;
      grass.receiveShadow = true;
      scene.add(grass);
    }
  };

  const addFieldBoundaries = (scene) => {
    const radius = 38;
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, 0.1, z));
    }
    
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
    const line = new THREE.LineLoop(lineGeo, lineMat);
    scene.add(line);
  };

  const addClouds = (scene) => {
    const cloudGroup = new THREE.Group();
    
    for (let c = 0; c < 5; c++) {
      const group = new THREE.Group();
      const baseX = (Math.random() - 0.5) * 30;
      const baseZ = (Math.random() - 0.5) * 30;
      const baseY = 15 + Math.random() * 5;
      
      for (let i = 0; i < 5; i++) {
        const sphereGeo = new THREE.SphereGeometry(1 + Math.random() * 0.5, 7);
        const sphereMat = new THREE.MeshStandardMaterial({ 
          color: 0xffffff,
          transparent: true,
          opacity: 0.7
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.position.set(
          baseX + i * 1.5,
          baseY + Math.sin(i) * 0.5,
          baseZ + i * 1.2
        );
        group.add(sphere);
      }
      
      cloudGroup.add(group);
    }
    
    scene.add(cloudGroup);
  };

  const addParticles = (scene) => {
    const particlesGeo = new THREE.BufferGeometry();
    const particlesCount = 200;
    const positions = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 60;
      positions[i + 1] = Math.random() * 20;
      positions[i + 2] = (Math.random() - 0.5) * 60;
    }
    
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particlesMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.05,
      transparent: true,
      opacity: 0.5
    });
    
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);
  };

  const addIrrigationSystem = (scene, grid, spacing) => {
    const pipeGroup = new THREE.Group();
    
    for (let i = -grid/2; i < grid/2; i++) {
      const pipeGeo = new THREE.CylinderGeometry(0.1, 0.1, spacing * grid, 6);
      const pipeMat = new THREE.MeshStandardMaterial({ color: 0x3498db });
      const pipe = new THREE.Mesh(pipeGeo, pipeMat);
      pipe.rotation.z = Math.PI / 2;
      pipe.position.set(0, 0.3, i * spacing);
      pipe.castShadow = true;
      pipe.receiveShadow = true;
      pipeGroup.add(pipe);
    }
    
    scene.add(pipeGroup);
  };

  const addFarmEquipment = (scene, grid) => {
    const tractorGroup = new THREE.Group();
    tractorGroup.position.set(-5, 0.3, -5);
    
    const bodyGeo = new THREE.BoxGeometry(2, 1, 1.5);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff6b35 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    tractorGroup.add(body);
    
    scene.add(tractorGroup);
  };

  const addDataLabels = (scene, grid, spacing, farmSize, crop, soilType) => {
    const createLabel = (text, position) => {
      const div = document.createElement('div');
      div.textContent = text;
      div.style.color = 'white';
      div.style.fontFamily = 'Arial';
      div.style.fontSize = '14px';
      div.style.fontWeight = 'bold';
      div.style.backgroundColor = 'rgba(46, 125, 50, 0.8)';
      div.style.padding = '4px 12px';
      div.style.borderRadius = '20px';
      div.style.border = '2px solid white';
      div.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      
      const label = new CSS2DObject(div);
      label.position.copy(position);
      scene.add(label);
    };

    createLabel(
      `🌾 ${crop || 'Crop'} | ${farmSize} acres | ${soilType}`,
      new THREE.Vector3(0, 5, 0)
    );
    
    // Add direction labels
    createLabel('N', new THREE.Vector3(0, 2, 20));
    createLabel('S', new THREE.Vector3(0, 2, -20));
    createLabel('E', new THREE.Vector3(20, 2, 0));
    createLabel('W', new THREE.Vector3(-20, 2, 0));
  };

  const CameraControls = () => (
    <div className="camera-controls">
      <button 
        className={`camera-btn ${cameraMode === 'overview' ? 'active' : ''}`}
        onClick={() => setCameraMode('overview')}
      >
        🌍 Overview
      </button>
      <button 
        className={`camera-btn ${cameraMode === 'closeup' ? 'active' : ''}`}
        onClick={() => setCameraMode('closeup')}
      >
        🔍 Close-up
      </button>
      <button 
        className={`camera-btn ${cameraMode === 'drone' ? 'active' : ''}`}
        onClick={() => setCameraMode('drone')}
      >
        🚁 Drone
      </button>
    </div>
  );

  return (
    <div className="farm3d-container">
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading 3D Farm Visualization...</p>
          {totalTextures > 0 && (
            <>
              <p className="loading-texture-info">
                Loading images: {texturesLoaded} / {totalTextures}
              </p>
              <div className="loading-progress">
                <div 
                  className="progress-bar" 
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
            </>
          )}
        </div>
      )}
      
      {error && (
        <div className="error-overlay">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}
      
      <CameraControls />
      
      <div className="farm-info-panel">
        <h4>Farm Information</h4>
        <p><span>Crop:</span> {crop || 'Not selected'}</p>
        <p><span>Soil:</span> {soilType}</p>
        <p><span>Size:</span> {farmSize} acres</p>
        <p><span>Plants:</span> ~{Math.max(3, Math.ceil(Math.sqrt(farmSize * 100)))**2}</p>
      </div>
      
      <div className="controls-hint">
        <p>🖱️ Drag to rotate | Scroll to zoom</p>
      </div>
      
      <div ref={mountRef} className="farm3d-canvas" />
    </div>
  );
}

export default Farm3D;