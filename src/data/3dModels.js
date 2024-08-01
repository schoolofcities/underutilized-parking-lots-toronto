import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as maplibregl from "maplibre-gl";

function createCustomLayer(id, modelUrl, modelOrigin) {
  const modelAltitude = 0;
  const modelRotate = [Math.PI / 2, 0, 0];

  const modelAsMercatorCoordinate = maplibregl.MercatorCoordinate.fromLngLat(
    modelOrigin,
    modelAltitude
  );

  const modelTransform = {
    translateX: modelAsMercatorCoordinate.x,
    translateY: modelAsMercatorCoordinate.y,
    translateZ: modelAsMercatorCoordinate.z,
    rotateX: modelRotate[0],
    rotateY: modelRotate[1],
    rotateZ: modelRotate[2],
    scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
  };

  return {
    id: id,
    type: 'custom',
    renderingMode: '3d',
    onAdd: function (map, gl) {
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      // Add lighting
      const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x404040, 1);
      this.scene.add(hemisphereLight);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // soft white light
      this.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      this.scene.add(directionalLight);

      this.updateLightPosition(map);

      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          this.scene.add(gltf.scene);
        }
      );
      this.map = map;

      this.renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true
      });

      this.renderer.autoClear = false;
    },
    render: function (gl, matrix) {
      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        modelTransform.rotateX
      );
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        modelTransform.rotateY
      );
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        modelTransform.rotateZ
      );

      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .makeTranslation(
          modelTransform.translateX,
          modelTransform.translateY,
          modelTransform.translateZ
        )
        .scale(
          new THREE.Vector3(
            modelTransform.scale,
            -modelTransform.scale,
            modelTransform.scale
          )
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);

      this.camera.projectionMatrix = m.multiply(l);
      this.renderer.resetState();
      this.renderer.render(this.scene, this.camera);
      this.map.triggerRepaint();
    },
    updateLightPosition: function (map) {
      const mapCenter = map.getCenter();

      // Convert map center to Mercator coordinates
      const mapCenterMercator = maplibregl.MercatorCoordinate.fromLngLat(
        [mapCenter.lng, mapCenter.lat],
        modelAltitude
      );

      // Update directional light position based on map center
      const directionalLight = this.scene.getObjectByName('directionalLight');
      if (directionalLight) {
        directionalLight.position.set(
          mapCenterMercator.x,
          mapCenterMercator.y,
          mapCenterMercator.z
        );
      }
    }
  };
}

const SkyDome = createCustomLayer('sky-dome-3d-model', '/underutilized-parking-lots-toronto/sky-dome.gltf', [-79.38925, 43.64165]);
const CNTower = createCustomLayer('cn-tower-3d-model', '/underutilized-parking-lots-toronto/cn-tower.gltf', [-79.3871, 43.6426]);

export { SkyDome, CNTower };
