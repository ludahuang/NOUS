const facets = {
  space: {
    index: "01 / SPACE",
    title: "空间",
    mechanism: "把问题转化为可进入的现场",
    description: "通过尺度、动线、材料和停留方式组织参与，让问题成为可以共同进入的现场。",
    rotation: { x: -0.16, y: 0.08, z: -0.12 },
  },
  experience: {
    index: "02 / EXPERIENCE",
    title: "体验",
    mechanism: "组织感知与共同参与",
    description: "让身体、媒介、情境与反馈共同作用，使问题能够被感知、进入并留下经验。",
    rotation: { x: -0.12, y: -0.12, z: -0.05 },
  },
  network: {
    index: "03 / NETWORK",
    title: "网络",
    mechanism: "让协作跨越地点持续",
    description: "连接不同城市、主体与现场，使协作、信息和行动能够跨越一次事件持续传递。",
    rotation: { x: 0.08, y: -0.16, z: 0.04 },
  },
  data: {
    index: "04 / DATA CURATION",
    title: "数据策展",
    mechanism: "让过程成为可追溯记录",
    description: "记录事件、来源、关系与过程，使策展判断可被核查，也能被后续项目重新调用。",
    rotation: { x: 0.14, y: 0.08, z: 0.12 },
  },
  knowledge: {
    index: "05 / KNOWLEDGE BASE",
    title: "知识库",
    mechanism: "组织可继续工作的共同记忆",
    description: "将分散材料组织为可检索、可导航的共同记忆，支持持续研究与再次激活。",
    rotation: { x: -0.08, y: 0.14, z: 0.18 },
  },
  agent: {
    index: "06 / INTELLIGENT AGENT",
    title: "智能体",
    mechanism: "让行动主体参与策展",
    description: "参与发现关系、提出问题和生成行动，同时保留来源、不确定性与过程记录。",
    rotation: { x: -0.08, y: 0.06, z: 0 },
  },
};

const outerFacets = [
  "space",
  "experience",
  "network",
  "data",
  "knowledge",
];
const facetByMaterial = [
  "agent",
  ...outerFacets,
];
const facetColors = {
  space: 0x101010,
  experience: 0xf0d735,
  network: 0x16c7d8,
  data: 0x3da66c,
  knowledge: 0xf7f5f0,
  agent: 0xef4b3f,
};
const atlasWeights = {
  space: 0.92,
  experience: 0.88,
  network: 1.02,
  data: 0.92,
  knowledge: 1.04,
  agent: 0.98,
};
const vaultWeights = {
  space: 0.46,
  experience: 0.42,
  network: 0.66,
  data: 0.9,
  knowledge: 1.58,
  agent: 1.52,
};

const controls = [...document.querySelectorAll("[data-facet]")];
const facetIndex = document.querySelector("#facet-index");
const facetTitle = document.querySelector("#facet-title");
const facetDescription = document.querySelector("#facet-description");
const systemFacetIndex = document.querySelector("#system-facet-index");
const systemFacetMechanism = document.querySelector("#system-facet-mechanism");
const systemFacetDescription = document.querySelector("#system-facet-description");
const atlasCanvas = document.querySelector("#symbiote-canvas");
const vaultCanvas = document.querySelector("#vault-symbiote-canvas");
const vaultShapeView = document.querySelector("#vault-shape-view");
const vaultWeightRows = [...document.querySelectorAll("[data-facet-weight]")];

let activeFacet = "knowledge";
let orientAtlas = () => {};
let focusAtlas = () => {};

function selectFacet(name, { orient = true } = {}) {
  const facet = facets[name];
  if (!facet) {
    return;
  }

  activeFacet = name;
  if (orient) {
    orientAtlas(facet.rotation);
  }
  focusAtlas(name);
  facetIndex.textContent = facet.index;
  facetTitle.textContent = facet.title;
  facetDescription.textContent = facet.description;
  systemFacetIndex.textContent = facet.index;
  systemFacetMechanism.textContent = facet.mechanism;
  systemFacetDescription.textContent = facet.description;

  controls.forEach((control) => {
    const isActive = control.dataset.facet === name;
    control.classList.toggle("is-active", isActive);
    control.setAttribute("aria-pressed", String(isActive));
  });
}

controls.forEach((control) => {
  control.addEventListener("click", () => selectFacet(control.dataset.facet));
});

function createNousSymbiote(weights) {
  const facetCount = 5;
  const outerPointCount = 10;
  const outerBase = [
    [-3.02, -0.04, -0.08],
    [-2.22, -1.04, 0.02],
    [-0.96, -1.52, -0.12],
    [0.72, -1.46, 0.08],
    [2.08, -0.92, -0.04],
    [3.06, 0.06, -0.16],
    [2.04, 0.98, 0.04],
    [0.76, 1.5, -0.1],
    [-0.94, 1.46, 0.1],
    [-2.2, 0.9, -0.02],
  ];
  const innerBase = [
    [-1.02, -0.04, 0.46],
    [-0.36, -0.88, 0.42],
    [0.78, -0.5, 0.48],
    [0.78, 0.54, 0.44],
    [-0.34, 0.92, 0.5],
  ];
  const mainVertexRefs = [];
  const edgeVertexRefs = [];
  const triangleFacets = [];
  const geometry = new THREE.BufferGeometry();
  const edgeGeometry = new THREE.BufferGeometry();

  function pushMainTriangle(facetName, ...references) {
    mainVertexRefs.push(...references);
    triangleFacets.push(facetName);
  }

  for (let index = 0; index < facetCount; index += 1) {
    const next = (index + 1) % facetCount;
    pushMainTriangle(
      "agent",
      { kind: "center" },
      { kind: "inner", index },
      { kind: "inner", index: next },
    );
  }
  geometry.addGroup(0, facetCount * 3, 0);

  outerFacets.forEach((facetName, index) => {
    const next = (index + 1) % facetCount;
    const outerStart = index * 2;
    const outerMiddle = outerStart + 1;
    const outerEnd = (outerStart + 2) % outerPointCount;
    const start = facetCount * 3 + index * 9;
    pushMainTriangle(
      facetName,
      { kind: "inner", index },
      { kind: "outer", index: outerStart },
      { kind: "outer", index: outerMiddle },
    );
    pushMainTriangle(
      facetName,
      { kind: "inner", index },
      { kind: "outer", index: outerMiddle },
      { kind: "outer", index: outerEnd },
    );
    pushMainTriangle(
      facetName,
      { kind: "inner", index },
      { kind: "outer", index: outerEnd },
      { kind: "inner", index: next },
    );
    geometry.addGroup(start, 9, index + 1);
  });

  for (let index = 0; index < facetCount; index += 1) {
    const next = (index + 1) % facetCount;
    edgeVertexRefs.push(
      { kind: "inner", index },
      { kind: "inner", index: next },
      { kind: "inner", index },
      { kind: "outer", index: index * 2 },
    );
  }
  for (let index = 0; index < outerPointCount; index += 1) {
    edgeVertexRefs.push(
      { kind: "outer", index },
      { kind: "outer", index: (index + 1) % outerPointCount },
    );
  }

  const positionAttribute = new THREE.Float32BufferAttribute(
    new Float32Array(mainVertexRefs.length * 3),
    3,
  );
  const edgePositionAttribute = new THREE.Float32BufferAttribute(
    new Float32Array(edgeVertexRefs.length * 3),
    3,
  );
  geometry.setAttribute("position", positionAttribute);
  edgeGeometry.setAttribute("position", edgePositionAttribute);

  function update(time = 0, morphStrength = 0) {
    const centerWave = Math.sin(time * 0.36) * morphStrength;
    const center = [
      Math.cos(time * 0.21) * morphStrength * 0.08,
      Math.sin(time * 0.24) * morphStrength * 0.07,
      0.58 + (weights.agent - 1) * 0.2 + centerWave * 0.18,
    ];
    const inner = [];
    const outer = [];

    for (let index = 0; index < facetCount; index += 1) {
      const radialWave = Math.sin(time * 0.48 + index * 1.37);
      const depthWave = Math.cos(time * 0.39 + index * 1.91);
      const agentScale = 0.78 + weights.agent * 0.22;
      const [baseX, baseY, baseZ] = innerBase[index];

      inner.push([
        baseX * agentScale * (1 + radialWave * morphStrength * 0.28),
        baseY * agentScale * (1 + radialWave * morphStrength * 0.28),
        baseZ
          + (weights.agent - 1) * 0.16
          + depthWave * 0.06
          + radialWave * morphStrength * 0.18,
      ]);
    }

    for (let index = 0; index < outerPointCount; index += 1) {
      const facetIndex = Math.floor(index / 2);
      const currentFacet = outerFacets[facetIndex];
      const previousFacet =
        outerFacets[(facetIndex - 1 + facetCount) % facetCount];
      const vertexWeight = index % 2 === 0
        ? ((weights[previousFacet] || 1) + (weights[currentFacet] || 1)) / 2
        : (weights[currentFacet] || 1);
      const radialWave = Math.sin(time * 0.44 + index * 0.83);
      const depthWave = Math.cos(time * 0.38 + index * 1.19);
      const [baseX, baseY, baseZ] = outerBase[index];
      const weightScale = 0.76 + vertexWeight * 0.28;

      outer.push([
        baseX * weightScale * (1 + radialWave * morphStrength),
        baseY * weightScale * (1 + radialWave * morphStrength * 0.72),
        baseZ
          + (vertexWeight - 1) * 0.1
          + depthWave * morphStrength * 0.26,
      ]);
    }

    const resolve = ({ kind, index = 0 }) => {
      if (kind === "center") {
        return center;
      }
      if (kind === "inner") {
        return inner[index];
      }
      return outer[index];
    };

    mainVertexRefs.forEach((reference, index) => {
      positionAttribute.array.set(resolve(reference), index * 3);
    });
    edgeVertexRefs.forEach((reference, index) => {
      edgePositionAttribute.array.set(resolve(reference), index * 3);
    });

    positionAttribute.needsUpdate = true;
    edgePositionAttribute.needsUpdate = true;
    geometry.computeBoundingSphere();
  }

  update();
  return {
    geometry,
    edgeGeometry,
    triangleFacets,
    update,
  };
}

function createSymbioteScene({
  canvas,
  weights,
  initialRotation,
  layout,
  weightedOpacity = false,
  dominantFacets = [],
  morphStrength = 0,
  ambientMotion = false,
  autoTour = [],
  onAutoFacet,
  onFacetSelect,
}) {
  if (!canvas || !window.THREE) {
    return null;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  const targetRotation = {
    x: initialRotation.x || 0,
    y: initialRotation.y || 0,
    z: initialRotation.z || 0,
  };
  const {
    geometry,
    edgeGeometry,
    triangleFacets,
    update: updateGeometry,
  } = createNousSymbiote(weights);
  const weightValues = Object.values(weights);
  const minimumWeight = Math.min(...weightValues);
  const weightRange = Math.max(Math.max(...weightValues) - minimumWeight, 0.01);
  const getBaseOpacity = (name) => {
    if (!weightedOpacity) {
      return 0.48;
    }

    const normalizedWeight = (weights[name] - minimumWeight) / weightRange;
    return 0.24 + normalizedWeight * 0.66;
  };
  const materials = facetByMaterial.map(
    (name) =>
      new THREE.MeshBasicMaterial({
        color: facetColors[name],
        transparent: true,
        opacity: Math.min(
          0.96,
          getBaseOpacity(name)
            + (name === "agent" ? 0.12 : 0)
            + (dominantFacets.includes(name) ? 0.05 : 0),
        ),
        depthWrite: true,
        side: THREE.DoubleSide,
      }),
  );
  const symbiote = new THREE.Mesh(geometry, materials);
  const edges = new THREE.LineSegments(
    edgeGeometry,
    new THREE.LineBasicMaterial({
      color: 0x101010,
      transparent: true,
      opacity: 0.88,
    }),
  );
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const drag = {
    pointerId: null,
    lastX: 0,
    lastY: 0,
    distance: 0,
  };
  const restingPosition = new THREE.Vector3();
  let restingScale = 1;
  const animationStart = performance.now();
  const autoState = {
    index: 0,
    phase: autoTour.length ? "travel" : "idle",
    phaseStartedAt: animationStart,
    pauseUntil: 0,
    from: { ...targetRotation },
    to: autoTour[0]?.rotation || initialRotation,
    announced: false,
  };
  if (autoTour.length) {
    canvas.dataset.autoFacet = autoTour[0].name;
    canvas.dataset.autoPhase = prefersReducedMotion ? "reduced" : "travel";
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  camera.position.set(0, 0, 8.2);
  symbiote.renderOrder = 1;
  edges.renderOrder = 2;
  symbiote.add(edges);
  symbiote.rotation.set(targetRotation.x, targetRotation.y, targetRotation.z);
  scene.add(symbiote);

  function pauseAutoTour(duration = 6200) {
    if (!autoTour.length) {
      return;
    }

    autoState.phase = "manual";
    autoState.pauseUntil = performance.now() + duration;
    canvas.dataset.autoPhase = "manual";
  }

  function orient(rotation) {
    pauseAutoTour();
    targetRotation.x = rotation.x;
    targetRotation.y = rotation.y;
    targetRotation.z = rotation.z || 0;
  }

  function focus(name) {
    const activeMaterial = facetByMaterial.indexOf(name);
    materials.forEach((material, index) => {
      const facetName = facetByMaterial[index];
      const baseOpacity =
        getBaseOpacity(facetName)
        + (facetName === "agent" ? 0.12 : 0)
        + (dominantFacets.includes(facetName) ? 0.05 : 0);
      material.opacity = index === activeMaterial
        ? Math.min(0.98, baseOpacity + (weightedOpacity ? 0.1 : 0.25))
        : Math.min(0.96, baseOpacity);
    });
  }

  function facetAt(clientX, clientY) {
    const bounds = canvas.getBoundingClientRect();
    pointer.x = ((clientX - bounds.left) / bounds.width) * 2 - 1;
    pointer.y = -((clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersection = raycaster.intersectObject(symbiote, false)[0];
    const facetName = Number.isInteger(intersection?.faceIndex)
      ? triangleFacets[intersection.faceIndex]
      : null;
    canvas.dataset.hitFacet = facetName || "";
    canvas.dataset.hitTriangle = Number.isInteger(intersection?.faceIndex)
      ? String(intersection.faceIndex)
      : "";
    return facetName;
  }

  canvas.addEventListener("pointerdown", (event) => {
    pauseAutoTour();
    drag.pointerId = event.pointerId;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.distance = 0;
    canvas.setPointerCapture(event.pointerId);
    canvas.classList.add("is-dragging");
  });

  canvas.addEventListener("pointermove", (event) => {
    if (drag.pointerId === event.pointerId) {
      const deltaX = event.clientX - drag.lastX;
      const deltaY = event.clientY - drag.lastY;
      drag.lastX = event.clientX;
      drag.lastY = event.clientY;
      drag.distance += Math.abs(deltaX) + Math.abs(deltaY);
      targetRotation.y += deltaX * 0.009;
      targetRotation.x += deltaY * 0.009;
      symbiote.rotation.x = targetRotation.x;
      symbiote.rotation.y = targetRotation.y;
      return;
    }

    canvas.classList.toggle("is-over-face", Boolean(facetAt(event.clientX, event.clientY)));
  });

  function finishPointer(event) {
    if (drag.pointerId !== event.pointerId) {
      return;
    }

    const selectedFacet = facetAt(event.clientX, event.clientY);
    if (selectedFacet) {
      canvas.dataset.selectedFacet = selectedFacet;
      focus(selectedFacet);
      onFacetSelect?.(selectedFacet);
    }

    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    drag.pointerId = null;
    drag.distance = 0;
    canvas.classList.remove("is-dragging");
  }

  canvas.addEventListener("pointerup", finishPointer);
  canvas.addEventListener("pointercancel", finishPointer);
  canvas.addEventListener("pointerleave", () => {
    if (drag.pointerId === null) {
      canvas.classList.remove("is-over-face");
    }
  });

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) {
      return;
    }

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const placement = layout(window.innerWidth < 760);
    restingPosition.set(...placement.position);
    restingScale = placement.scale;
    symbiote.position.copy(restingPosition);
    symbiote.scale.setScalar(restingScale);
  }

  function beginAutoTransition(now) {
    autoState.index = (autoState.index + 1) % autoTour.length;
    const step = autoTour[autoState.index];
    autoState.phase = "travel";
    autoState.phaseStartedAt = now;
    autoState.from = {
      x: symbiote.rotation.x,
      y: symbiote.rotation.y,
      z: symbiote.rotation.z,
    };
    autoState.to = step.rotation;
    autoState.announced = false;
    canvas.dataset.autoFacet = step.name;
    canvas.dataset.autoPhase = "travel";
  }

  function montageEase(progress, style) {
    if (style === "snap") {
      return progress < 0.72
        ? 0.5 * Math.pow(progress / 0.72, 3)
        : 0.5 + 0.5 * (1 - Math.pow((1 - progress) / 0.28, 4));
    }
    if (style === "quint") {
      return progress < 0.5
        ? 16 * Math.pow(progress, 5)
        : 1 - Math.pow(-2 * progress + 2, 5) / 2;
    }
    if (style === "sine") {
      return -(Math.cos(Math.PI * progress) - 1) / 2;
    }

    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  function updateAutoTour(now) {
    if (!autoTour.length || prefersReducedMotion) {
      return false;
    }

    if (now < autoState.pauseUntil) {
      return false;
    }

    if (autoState.phase === "manual") {
      beginAutoTransition(now);
      return true;
    }

    const step = autoTour[autoState.index];
    if (autoState.phase === "hold") {
      if (now - autoState.phaseStartedAt >= step.hold) {
        beginAutoTransition(now);
      }
      return false;
    }

    const progress = Math.min(
      1,
      (now - autoState.phaseStartedAt) / step.travel,
    );
    const easedProgress = montageEase(progress, step.easing);
    const deltaX = Math.atan2(
      Math.sin(autoState.to.x - autoState.from.x),
      Math.cos(autoState.to.x - autoState.from.x),
    );
    const deltaY = Math.atan2(
      Math.sin(autoState.to.y - autoState.from.y),
      Math.cos(autoState.to.y - autoState.from.y),
    );
    const deltaZ = Math.atan2(
      Math.sin((autoState.to.z || 0) - autoState.from.z),
      Math.cos((autoState.to.z || 0) - autoState.from.z),
    );
    symbiote.rotation.x = autoState.from.x + deltaX * easedProgress;
    symbiote.rotation.y = autoState.from.y + deltaY * easedProgress;
    symbiote.rotation.z = autoState.from.z + deltaZ * easedProgress;

    if (!autoState.announced && progress >= 0.68) {
      autoState.announced = true;
      onAutoFacet?.(step.name);
    }

    if (progress >= 1) {
      targetRotation.x = autoState.to.x;
      targetRotation.y = autoState.to.y;
      targetRotation.z = autoState.to.z || 0;
      autoState.phase = "hold";
      autoState.phaseStartedAt = now;
      canvas.dataset.autoPhase = "hold";
      if (!autoState.announced) {
        autoState.announced = true;
        onAutoFacet?.(step.name);
      }
    }

    return true;
  }

  function render() {
    const now = performance.now();
    const elapsed = (now - animationStart) / 1000;
    const autoDriving = updateAutoTour(now);
    if (!autoDriving) {
      symbiote.rotation.x += (targetRotation.x - symbiote.rotation.x) * 0.08;
      symbiote.rotation.y += (targetRotation.y - symbiote.rotation.y) * 0.08;
      symbiote.rotation.z += (targetRotation.z - symbiote.rotation.z) * 0.08;
    }
    if (!prefersReducedMotion) {
      if (morphStrength) {
        updateGeometry(elapsed, morphStrength);
      }
      if (ambientMotion) {
        symbiote.position.x = restingPosition.x + Math.sin(elapsed * 0.24) * 0.16;
        symbiote.position.y = restingPosition.y + Math.cos(elapsed * 0.2) * 0.12;
        symbiote.scale.setScalar(
          restingScale * (1 + Math.sin(elapsed * 0.31) * 0.025),
        );
      }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  resize();
  render();
  window.addEventListener("resize", resize, { passive: true });

  return { focus, orient };
}

const atlasScene = createSymbioteScene({
  canvas: atlasCanvas,
  weights: atlasWeights,
  initialRotation: { x: -0.18, y: 0.12, z: -0.3 },
  layout: (mobile) => ({
    position: mobile ? [0.55, 0.35, 0] : [1.65, 0.25, 0],
    scale: mobile ? 0.9 : 1.18,
  }),
  morphStrength: 0.12,
  ambientMotion: true,
  autoTour: [
    {
      name: "knowledge",
      rotation: facets.knowledge.rotation,
      travel: 920,
      hold: 1180,
      easing: "sine",
    },
    {
      name: "agent",
      rotation: facets.agent.rotation,
      travel: 560,
      hold: 940,
      easing: "quint",
    },
    {
      name: "network",
      rotation: facets.network.rotation,
      travel: 1160,
      hold: 820,
      easing: "sine",
    },
    {
      name: "experience",
      rotation: facets.experience.rotation,
      travel: 480,
      hold: 1260,
      easing: "snap",
    },
    {
      name: "data",
      rotation: facets.data.rotation,
      travel: 980,
      hold: 880,
      easing: "cubic",
    },
    {
      name: "space",
      rotation: facets.space.rotation,
      travel: 720,
      hold: 1340,
      easing: "quint",
    },
  ],
  onAutoFacet: (name) => selectFacet(name, { orient: false }),
  onFacetSelect: (name) => selectFacet(name, { orient: false }),
});

if (atlasScene) {
  orientAtlas = atlasScene.orient;
  focusAtlas = atlasScene.focus;
  focusAtlas(activeFacet);
}

createSymbioteScene({
  canvas: vaultCanvas,
  weights: vaultWeights,
  initialRotation: { x: -0.18, y: 0.1, z: -0.3 },
  layout: (mobile) => ({
    position: mobile ? [0, 0.08, 0] : [0, 0.05, 0],
    scale: mobile ? 0.7 : 0.82,
  }),
  weightedOpacity: true,
  dominantFacets: ["knowledge", "agent"],
  onFacetSelect: (name) => {
    vaultShapeView.textContent = `查看面 / ${facets[name].title}`;
    vaultWeightRows.forEach((row) => {
      row.classList.toggle("is-active", row.dataset.facetWeight === name);
    });
  },
});
