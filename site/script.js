const facets = {
  space: {
    index: "01 / SPACE",
    title: "空间",
    mechanism: "把问题转化为可进入的现场",
    description: "通过尺度、动线、材料和停留方式组织参与，让问题成为可以共同进入的现场。",
    rotation: { x: 0, y: Math.PI },
  },
  exhibition: {
    index: "02 / EXHIBITION",
    title: "展览",
    mechanism: "把关系组织为共同经历",
    description: "将作品、参与者与发生条件编排在一起，使关系能够被经历、讨论并继续变化。",
    rotation: { x: 0, y: Math.PI / 2 },
  },
  network: {
    index: "03 / NETWORK",
    title: "网络",
    mechanism: "让协作跨越地点持续",
    description: "连接不同城市、主体与现场，使协作、信息和行动能够跨越一次事件持续传递。",
    rotation: { x: Math.PI / 2, y: 0 },
  },
  data: {
    index: "04 / DATA CURATION",
    title: "数据策展",
    mechanism: "让过程成为可追溯记录",
    description: "记录事件、来源、关系与过程，使策展判断可被核查，也能被后续项目重新调用。",
    rotation: { x: -Math.PI / 2, y: 0 },
  },
  knowledge: {
    index: "05 / KNOWLEDGE BASE",
    title: "知识库",
    mechanism: "组织可继续工作的共同记忆",
    description: "将分散材料组织为可检索、可导航的共同记忆，支持持续研究与再次激活。",
    rotation: { x: 0, y: 0 },
  },
  agent: {
    index: "06 / INTELLIGENT AGENT",
    title: "智能体",
    mechanism: "让行动主体参与策展",
    description: "参与发现关系、提出问题和生成行动，同时保留来源、不确定性与过程记录。",
    rotation: { x: 0, y: -Math.PI / 2 },
  },
};

const facetByMaterial = [
  "agent",
  "exhibition",
  "network",
  "data",
  "knowledge",
  "space",
];
const facetColors = {
  space: 0x101010,
  exhibition: 0xf0d735,
  network: 0x16c7d8,
  data: 0x3da66c,
  knowledge: 0xf7f5f0,
  agent: 0xef4b3f,
};
const atlasWeights = {
  space: 0.92,
  exhibition: 0.88,
  network: 1.02,
  data: 0.92,
  knowledge: 1.04,
  agent: 0.98,
};
const vaultWeights = {
  space: 0.46,
  exhibition: 0.42,
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
const atlasCanvas = document.querySelector("#polyhedron-canvas");
const vaultCanvas = document.querySelector("#vault-polyhedron-canvas");
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

function createIrregularHexahedron(weights) {
  const baseVertices = [
    [-1.62, -1.32, 1.3],
    [1.34, -1.5, 1.12],
    [1.52, 1.18, 1.42],
    [-1.22, 1.58, 1.08],
    [-1.38, -1.12, -1.5],
    [1.62, -1.2, -1.18],
    [1.16, 1.52, -1.42],
    [-1.58, 1.16, -1.08],
  ];
  const vertices = baseVertices.map(([x, y, z]) => [
    x * (x >= 0 ? weights.agent : weights.exhibition),
    y * (y >= 0 ? weights.network : weights.data),
    z * (z >= 0 ? weights.knowledge : weights.space),
  ]);
  const faces = [
    [1, 5, 6, 2],
    [4, 0, 3, 7],
    [3, 2, 6, 7],
    [4, 5, 1, 0],
    [0, 1, 2, 3],
    [5, 4, 7, 6],
  ];
  const positions = [];
  const geometry = new THREE.BufferGeometry();

  faces.forEach(([a, b, c, d], materialIndex) => {
    const start = positions.length / 3;
    [a, b, c, a, c, d].forEach((vertexIndex) => {
      positions.push(...vertices[vertexIndex]);
    });
    geometry.addGroup(start, 6, materialIndex);
  });

  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const edgePairs = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  const edgePositions = [];
  edgePairs.forEach(([start, end]) => {
    edgePositions.push(...vertices[start], ...vertices[end]);
  });

  const edgeGeometry = new THREE.BufferGeometry();
  edgeGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(edgePositions, 3),
  );

  return { geometry, edgeGeometry };
}

function createPolyhedronScene({
  canvas,
  weights,
  initialRotation,
  layout,
  weightedOpacity = false,
  dominantFacets = [],
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
  const targetRotation = { ...initialRotation, z: 0 };
  const { geometry, edgeGeometry } = createIrregularHexahedron(weights);
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
          getBaseOpacity(name) + (dominantFacets.includes(name) ? 0.05 : 0),
        ),
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
  );
  const polyhedron = new THREE.Mesh(geometry, materials);
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
  const facetNormals = {
    agent: new THREE.Vector3(1, 0, 0),
    exhibition: new THREE.Vector3(-1, 0, 0),
    network: new THREE.Vector3(0, 1, 0),
    data: new THREE.Vector3(0, -1, 0),
    knowledge: new THREE.Vector3(0, 0, 1),
    space: new THREE.Vector3(0, 0, -1),
  };

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  camera.position.set(0, 0, 8.2);
  polyhedron.add(edges);
  polyhedron.rotation.set(targetRotation.x, targetRotation.y, targetRotation.z);
  scene.add(polyhedron);

  function orient(rotation) {
    targetRotation.x = rotation.x;
    targetRotation.y = rotation.y;
  }

  function focus(name) {
    const activeMaterial = facetByMaterial.indexOf(name);
    materials.forEach((material, index) => {
      const facetName = facetByMaterial[index];
      const baseOpacity =
        getBaseOpacity(facetName) + (dominantFacets.includes(facetName) ? 0.05 : 0);
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
    const intersection = raycaster.intersectObject(polyhedron, false)[0];
    const materialIndex = Number.isInteger(intersection?.faceIndex)
      ? Math.floor(intersection.faceIndex / 2)
      : intersection?.face?.materialIndex;
    const facetName = Number.isInteger(materialIndex)
      ? facetByMaterial[materialIndex]
      : null;
    canvas.dataset.hitFacet = facetName || "";
    canvas.dataset.hitTriangle = Number.isInteger(intersection?.faceIndex)
      ? String(intersection.faceIndex)
      : "";
    return facetName;
  }

  function frontFacingFacet() {
    const orientation = new THREE.Euler(
      polyhedron.rotation.x,
      polyhedron.rotation.y,
      polyhedron.rotation.z,
      "XYZ",
    );
    let selectedName = "knowledge";
    let selectedDepth = -Infinity;

    Object.entries(facetNormals).forEach(([name, normal]) => {
      const depth = normal.clone().applyEuler(orientation).z;
      if (depth > selectedDepth) {
        selectedName = name;
        selectedDepth = depth;
      }
    });

    return selectedName;
  }

  canvas.addEventListener("pointerdown", (event) => {
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
      polyhedron.rotation.x = targetRotation.x;
      polyhedron.rotation.y = targetRotation.y;
      return;
    }

    canvas.classList.toggle("is-over-face", Boolean(facetAt(event.clientX, event.clientY)));
  });

  function finishPointer(event) {
    if (drag.pointerId !== event.pointerId) {
      return;
    }

    const selectedFacet = drag.distance > 6
      ? frontFacingFacet()
      : facetAt(event.clientX, event.clientY);
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
    polyhedron.position.set(...placement.position);
    polyhedron.scale.setScalar(placement.scale);
  }

  function render() {
    polyhedron.rotation.x += (targetRotation.x - polyhedron.rotation.x) * 0.08;
    polyhedron.rotation.y += (targetRotation.y - polyhedron.rotation.y) * 0.08;
    if (!prefersReducedMotion) {
      polyhedron.rotation.z += 0.0012;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  resize();
  render();
  window.addEventListener("resize", resize, { passive: true });

  return { focus, orient };
}

const atlasScene = createPolyhedronScene({
  canvas: atlasCanvas,
  weights: atlasWeights,
  initialRotation: facets.knowledge.rotation,
  layout: (mobile) => ({
    position: mobile ? [0.64, 0.16, 0] : [1.35, 0.16, 0],
    scale: 0.66,
  }),
  onFacetSelect: (name) => selectFacet(name, { orient: false }),
});

if (atlasScene) {
  orientAtlas = atlasScene.orient;
  focusAtlas = atlasScene.focus;
  focusAtlas(activeFacet);
}

createPolyhedronScene({
  canvas: vaultCanvas,
  weights: vaultWeights,
  initialRotation: { x: -0.28, y: -0.52 },
  layout: (mobile) => ({
    position: mobile ? [0, 0.12, 0] : [0, 0.05, 0],
    scale: mobile ? 0.64 : 0.72,
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
