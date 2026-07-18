const facets = {
  space: {
    index: "01 / SPACE",
    title: "空间",
    description: "让策展获得可移动、可制造、可进入的物质接口。",
    rotation: { x: 0, y: -Math.PI / 2 },
  },
  exhibition: {
    index: "02 / EXHIBITION",
    title: "展览",
    description: "让作品、参与者、条件与发生过程共同构成一次可被经历的关系。",
    rotation: { x: 0, y: Math.PI / 2 },
  },
  network: {
    index: "03 / NETWORK",
    title: "网络",
    description: "让不同城市、现场与主体通过媒介、协作和传输协议彼此连接。",
    rotation: { x: Math.PI / 2, y: 0 },
  },
  data: {
    index: "04 / DATA CURATION",
    title: "数据策展",
    description: "将事件、来源、关系与过程转化为可追溯、可传送、可复用的结构。",
    rotation: { x: -Math.PI / 2, y: 0 },
  },
  knowledge: {
    index: "05 / KNOWLEDGE BASE",
    title: "知识库",
    description: "将材料、笔记、来源与关系保存为可检索、可导航、可再次激活的共同记忆。",
    rotation: { x: 0, y: 0 },
  },
  agent: {
    index: "06 / INTELLIGENT AGENT",
    title: "智能体",
    description: "让策展机制获得能够提出关系、协助生成并保留行动记录的主体。",
    rotation: { x: 0, y: Math.PI },
  },
};

const controls = [...document.querySelectorAll("[data-facet]")];
const facetIndex = document.querySelector("#facet-index");
const facetTitle = document.querySelector("#facet-title");
const facetDescription = document.querySelector("#facet-description");
const canvas = document.querySelector("#cube-canvas");

let activeFacet = "knowledge";
let targetRotation = { ...facets[activeFacet].rotation };

function selectFacet(name) {
  const facet = facets[name];
  if (!facet) {
    return;
  }

  activeFacet = name;
  targetRotation = { ...facet.rotation };
  facetIndex.textContent = facet.index;
  facetTitle.textContent = facet.title;
  facetDescription.textContent = facet.description;

  controls.forEach((control) => {
    const isActive = control.dataset.facet === name;
    control.classList.toggle("is-active", isActive);
    control.setAttribute("aria-pressed", String(isActive));
  });
}

controls.forEach((control) => {
  control.addEventListener("click", () => selectFacet(control.dataset.facet));
});

function initialiseCube() {
  if (!canvas || !window.THREE) {
    return;
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

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  camera.position.set(0, 0, 8.2);

  const geometry = new THREE.BoxGeometry(3.55, 3.55, 3.55);
  const materialSettings = [
    { color: 0xef4b3f, opacity: 0.76 },
    { color: 0xf0d735, opacity: 0.76 },
    { color: 0x16c7d8, opacity: 0.76 },
    { color: 0x3da66c, opacity: 0.76 },
    { color: 0xf7f5f0, opacity: 0.82 },
    { color: 0x101010, opacity: 0.7 },
  ];
  const materials = materialSettings.map(
    ({ color, opacity }) =>
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
      }),
  );
  const cube = new THREE.Mesh(geometry, materials);
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x101010, transparent: true, opacity: 0.88 }),
  );
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0x101010 }),
  );

  cube.add(edges);
  cube.add(core);
  cube.rotation.set(targetRotation.x, targetRotation.y, 0);
  scene.add(cube);

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) {
      return;
    }

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    cube.position.set(window.innerWidth < 760 ? 0.64 : 1.35, 0.16, 0);
    cube.scale.setScalar(window.innerWidth < 760 ? 0.66 : 0.66);
  }

  function render() {
    cube.rotation.x += (targetRotation.x - cube.rotation.x) * 0.08;
    cube.rotation.y += (targetRotation.y - cube.rotation.y) * 0.08;

    if (!prefersReducedMotion) {
      cube.rotation.z += 0.0014;
    }

    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  resize();
  render();
  window.addEventListener("resize", resize, { passive: true });
}

initialiseCube();
