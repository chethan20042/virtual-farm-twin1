// Farm3D.js
import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

function Farm3D({ crop, soilType, farmSize }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      mount.clientWidth / mount.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 25);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    // Texture loader
    const loader = new THREE.TextureLoader();

    // ---------- SOIL TEXTURE ----------
    let soilTexture;
    try {
      soilTexture = loader.load(`/textures/${soilType}.jpg`);
      soilTexture.wrapS = soilTexture.wrapT = THREE.RepeatWrapping;
      soilTexture.repeat.set(10, 10);
    } catch {
      soilTexture = null;
    }

    const groundMaterial = soilTexture
      ? new THREE.MeshStandardMaterial({ map: soilTexture })
      : new THREE.MeshStandardMaterial({ color: 0x8b5a2b });

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(50, 50),
      groundMaterial
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // ---------- LIGHTS ----------
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 30, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // ---------- CROP TEXTURE ----------
    let cropTexture = null;
    if (crop) {
      try {
        cropTexture = loader.load(`/crops/${crop}.png`);
        cropTexture.transparent = true;
      } catch {
        cropTexture = null;
      }
    }

    // ---------- PLANTS ----------
    const grid = Math.max(3, Math.ceil(Math.sqrt(farmSize * 600)));
    const spacing = 2;

    for (let i = -grid / 2; i < grid / 2; i++) {
      for (let j = -grid / 2; j < grid / 2; j++) {
        let plant;

        if (cropTexture) {
          const material = new THREE.MeshBasicMaterial({
            map: cropTexture,
            transparent: true,
          });
          const geometry = new THREE.PlaneGeometry(2, 2);
          plant = new THREE.Mesh(geometry, material);
          plant.rotation.y = Math.random() * Math.PI;
        } else {
          const material = new THREE.MeshStandardMaterial({
            color: 0x2ecc71,
          });
          const geometry = new THREE.ConeGeometry(0.5, 1.5, 8);
          plant = new THREE.Mesh(geometry, material);
        }

        plant.position.set(i * spacing, 1, j * spacing);
        plant.castShadow = true;
        scene.add(plant);
      }
    }

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      if (mount && renderer.domElement) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [crop, soilType, farmSize]);

  return <div ref={mountRef} style={{ width: "100%", height: "400px" }} />;
}

export default Farm3D;
