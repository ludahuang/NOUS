const clusterSpecs = [
  {
    id: "cortical-systems",
    name: "Cortical Systems",
    theme: "Cortical anatomy and sensory surface structures",
    center: [-36, 18, 8],
    spread: [15, 10, 10],
    accent: "#7393ff",
    titles: [
      "Cerebral cortex",
      "Neocortex",
      "Prefrontal cortex",
      "Visual cortex",
      "Association cortex",
      "Somatosensory system",
    ],
  },
  {
    id: "limbic-memory",
    name: "Limbic & Memory",
    theme: "Memory, affect, and limbic processing topics",
    center: [-34, -18, -10],
    spread: [15, 12, 11],
    accent: "#6fd9ff",
    titles: [
      "Hippocampus",
      "Amygdala",
      "Limbic system",
      "Hypothalamus",
      "Entorhinal cortex",
      "Memory",
    ],
  },
  {
    id: "connectomics-core",
    name: "Connectomics Core",
    theme: "Brain mapping and connectomics project pages",
    center: [0, 0, 0],
    spread: [10, 10, 10],
    accent: "#ca8cff",
    titles: [
      "Connectome",
      "Connectomics",
      "Human Connectome Project",
      "Brain mapping",
      "Neuroinformatics",
      "Diffusion MRI",
    ],
  },
  {
    id: "relay-pathways",
    name: "Relay & Pathways",
    theme: "Major relay structures and white-matter pathways",
    center: [34, 18, 12],
    spread: [15, 11, 10],
    accent: "#f2c96a",
    titles: [
      "Thalamus",
      "Corpus callosum",
      "White matter",
      "Brainstem",
      "Corticospinal tract",
      "Thalamocortical radiations",
    ],
  },
  {
    id: "cellular-anatomy",
    name: "Cellular Anatomy",
    theme: "Cell-level structures used in neural signaling",
    center: [28, -20, -10],
    spread: [17, 13, 11],
    accent: "#84efcf",
    titles: [
      "Neuron",
      "Axon",
      "Dendrite",
      "Synapse",
      "Myelin",
      "Neurotransmitter",
      "Action potential",
    ],
  },
  {
    id: "motor-coordination",
    name: "Motor Coordination",
    theme: "Motor control and coordination systems",
    center: [4, 30, 18],
    spread: [10, 8, 9],
    accent: "#8fd6d2",
    titles: [
      "Cerebellum",
      "Basal ganglia",
      "Motor control",
      "Proprioception",
      "Striatum",
      "Substantia nigra",
    ],
  },
  {
    id: "circuit-dynamics",
    name: "Circuit Dynamics",
    theme: "Circuit behavior, plasticity, and spinal pathways",
    center: [4, -32, -18],
    spread: [11, 8, 9],
    accent: "#77b1ff",
    titles: [
      "Neural circuit",
      "Neuroplasticity",
      "Hebbian theory",
      "Long-term potentiation",
      "Spinal cord",
      "Neural coding",
    ],
  },
];

const CACHE_PREFIX = "wiki-connectome-v5:";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 2;
const MAX_TAGS = 8;
const MAX_EXPANSION_PAGES = 18;
const TOPIC_PRIMARY_PAGES = 22;
const TOPIC_SECONDARY_PAGES = 16;
const MAX_WIKIPEDIA_SEARCH_RESULTS = 6;
const SEARCH_DEBOUNCE_MS = 260;
const MAX_DYNAMIC_CLUSTERS = 6;
const DYNAMIC_CLUSTER_COLORS = [
  "#7ba2ff",
  "#7ee4ff",
  "#c691ff",
  "#f4d26d",
  "#83efcf",
  "#ff9e7a",
];
const RELEVANCE_KEYWORDS = [
  "brain",
  "neuro",
  "neural",
  "nervous system",
  "connectome",
  "connectomics",
  "cortex",
  "cortical",
  "thalam",
  "hippoc",
  "amyg",
  "axon",
  "dend",
  "synap",
  "myelin",
  "cereb",
  "ganglia",
  "stri",
  "tract",
  "white matter",
  "spinal",
  "plasticity",
  "memory",
  "motor",
  "sensory",
  "diffusion",
  "neuron",
  "glia",
  "basal",
];
const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "among",
  "article",
  "articles",
  "been",
  "being",
  "between",
  "from",
  "into",
  "list",
  "lists",
  "page",
  "pages",
  "such",
  "their",
  "them",
  "these",
  "this",
  "those",
  "through",
  "topic",
  "topics",
  "used",
  "uses",
  "using",
  "very",
  "what",
  "when",
  "where",
  "which",
  "wiki",
  "wikipedia",
  "with",
  "within",
]);

const stage = document.getElementById("graph-viewport");
const labelLayer = document.getElementById("label-layer");
const searchInput = document.getElementById("search-input");
const searchSuggestions = document.getElementById("search-suggestions");
const regionFilter = document.getElementById("region-filter");
const randomFocusButton = document.getElementById("random-focus");
const resetViewButton = document.getElementById("reset-view");
const noteTree = document.getElementById("note-tree");
const vaultCount = document.getElementById("vault-count");
const graphStatus = document.getElementById("graph-status");
const legend = document.getElementById("legend");

const articleKicker = document.getElementById("article-kicker");
const articleTitle = document.getElementById("article-title");
const articleSummary = document.getElementById("article-summary");
const sourceLink = document.getElementById("source-link");
const tabWiki = document.getElementById("tab-wiki");
const tabInspector = document.getElementById("tab-inspector");
const notePanelWiki = document.getElementById("note-panel-wiki");
const notePanelInspector = document.getElementById("note-panel-inspector");
const infoRegion = document.getElementById("info-region");
const infoType = document.getElementById("info-type");
const infoTransmitter = document.getElementById("info-transmitter");
const infoRate = document.getElementById("info-rate");
const infoDegree = document.getElementById("info-degree");
const infoMotif = document.getElementById("info-motif");
const tagList = document.getElementById("tag-list");
const neighborList = document.getElementById("neighbor-list");
const neighborCount = document.getElementById("neighbor-count");
const diagnosticsTitle = document.getElementById("diagnostics-title");
const diagnosticsSummary = document.getElementById("diagnostics-summary");
const diagMode = document.getElementById("diag-mode");
const diagSeed = document.getElementById("diag-seed");
const diagFolder = document.getElementById("diag-folder");
const diagLinks = document.getElementById("diag-links");
const diagPages = document.getElementById("diag-pages");
const diagFibers = document.getElementById("diag-fibers");
const diagVisible = document.getElementById("diag-visible");
const diagCamera = document.getElementById("diag-camera");
const diagnosticsFolderList = document.getElementById("diagnostics-folder-list");
const diagnosticsLinkCount = document.getElementById("diagnostics-link-count");
const diagnosticsLinkList = document.getElementById("diagnostics-link-list");

const statPages = document.getElementById("stat-neurons");
const statLinks = document.getElementById("stat-synapses");
const statFolders = document.getElementById("stat-regions");

const zoomInButton = document.getElementById("zoom-in");
const zoomOutButton = document.getElementById("zoom-out");
const resetCameraButton = document.getElementById("reset-camera");
const focusSelectedButton = document.getElementById("focus-selected");
const toggleMotionButton = document.getElementById("toggle-motion");

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x04060a, 0.0034);

const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
const initialCameraPosition = new THREE.Vector3(0, 10, 94);
const initialTarget = new THREE.Vector3(0, 0, 0);
camera.position.copy(initialCameraPosition);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 38;
controls.maxDistance = 240;
controls.rotateSpeed = 0.72;
controls.panSpeed = 0.82;
controls.zoomSpeed = 1.08;
controls.enablePan = true;
controls.enableZoom = true;
controls.enableRotate = true;
controls.keyPanSpeed = 22;
controls.autoRotate = false;
controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE;
controls.screenSpacePanning = true;
controls.touches.ONE = THREE.TOUCH.PAN;
controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
controls.target.copy(initialTarget);
controls.update();

scene.add(new THREE.AmbientLight(0xffffff, 0.24));

const keyLight = new THREE.PointLight(0x7f8fff, 0.34, 280);
keyLight.position.set(-50, 36, 60);
scene.add(keyLight);

const fillLight = new THREE.PointLight(0x71dfff, 0.32, 280);
fillLight.position.set(54, -26, 48);
scene.add(fillLight);

const backLight = new THREE.PointLight(0xca8cff, 0.28, 260);
backLight.position.set(0, 0, -70);
scene.add(backLight);

const networkGroup = new THREE.Group();
const cloudGroup = new THREE.Group();
const edgeGroup = new THREE.Group();
const nodeGroup = new THREE.Group();
const sparkGroup = new THREE.Group();
const tagGroup = new THREE.Group();
const pulseGroup = new THREE.Group();
networkGroup.add(cloudGroup);
networkGroup.add(edgeGroup);
networkGroup.add(nodeGroup);
networkGroup.add(sparkGroup);
networkGroup.add(tagGroup);
networkGroup.add(pulseGroup);
scene.add(networkGroup);

const dustGeometry = new THREE.BufferGeometry();
const dustCount = 1400;
const dustPositions = new Float32Array(dustCount * 3);

for (let index = 0; index < dustCount; index += 1) {
  const stride = index * 3;
  dustPositions[stride] = (Math.random() - 0.5) * 220;
  dustPositions[stride + 1] = (Math.random() - 0.5) * 160;
  dustPositions[stride + 2] = (Math.random() - 0.5) * 160;
}

dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
const dustMaterial = new THREE.PointsMaterial({
  color: 0x6b7487,
  size: 0.42,
  transparent: true,
  opacity: 0.24,
  depthWrite: false,
});
const dust = new THREE.Points(dustGeometry, dustMaterial);
scene.add(dust);

const sharedNodeGeometry = new THREE.IcosahedronGeometry(1, 2);
const sharedGlowGeometry = new THREE.IcosahedronGeometry(1.5, 1);
const sharedSparkGeometry = new THREE.SphereGeometry(0.22, 8, 8);
const sharedPulseGeometry = new THREE.SphereGeometry(0.34, 10, 10);

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
raycaster.params.Mesh.threshold = 1.3;
const pointer = new THREE.Vector2();
const dragPlane = new THREE.Plane();
const dragIntersection = new THREE.Vector3();
const dragNormal = new THREE.Vector3();

const state = {
  pages: [],
  pageMap: new Map(),
  edges: [],
  neighborMap: new Map(),
  clusters: [],
  clusterMap: new Map(),
  connectedness: [],
  selectedPageId: null,
  hoveredPageId: null,
  searchText: "",
  filterCluster: "all",
  searchSuggestions: [],
  pendingSearchQuery: "",
  searchDebounceId: null,
  searchRequestId: 0,
  graphRequestId: 0,
  activeSeedTitle: "",
  activeNoteTab: "wiki",
  graphMode: "default",
  motionEnabled: true,
  loading: true,
  dragTag: null,
  cameraGoal: null,
  targetGoal: null,
  trackedPageId: null,
  trackedCameraOffset: initialCameraPosition.clone().sub(initialTarget),
  defaultCameraPosition: initialCameraPosition.clone(),
  defaultTarget: initialTarget.clone(),
  graphRadius: 64,
  pulses: [],
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function cloneClusters(clusters) {
  return clusters.map((cluster) => ({
    ...cluster,
    center: [...cluster.center],
    spread: [...cluster.spread],
  }));
}

function setClusters(clusters) {
  state.clusters = cloneClusters(clusters);
  state.clusterMap = new Map(state.clusters.map((cluster) => [cluster.id, cluster]));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stripHtml(value) {
  const temp = document.createElement("div");
  temp.innerHTML = value;
  return temp.textContent || temp.innerText || "";
}

function tokenizeText(value) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  );
}

function countTokenOverlap(leftTokens, rightTokens) {
  let score = 0;

  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) {
      score += token.length > 6 ? 1.5 : 1;
    }
  });

  return score;
}

function titleQualityScore(title) {
  const normalized = title.toLowerCase();

  if (
    normalized.startsWith("list of ") ||
    normalized.startsWith("outline of ") ||
    normalized.startsWith("history of ") ||
    normalized.startsWith("timeline of ") ||
    normalized.includes("disambiguation") ||
    normalized.includes(":") ||
    /\b\d{4}\b/.test(normalized)
  ) {
    return 0;
  }

  return clamp(8 - normalized.split(/\s+/).length * 0.35, 2, 8);
}

function getEdgeWeight(neighborMap, leftId, rightId) {
  return neighborMap.get(leftId)?.get(rightId) || 0;
}

function formatNumber(value) {
  return Math.round(value).toLocaleString();
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function randomBetween(min, max) {
  return min + (max - min) * Math.random();
}

function mixColor(colorA, colorB, ratio = 0.5) {
  return new THREE.Color(colorA).lerp(new THREE.Color(colorB), ratio);
}

function shiftColor(colorValue, hueShift = 0, saturationBoost = 0, lightnessBoost = 0) {
  const color = new THREE.Color(colorValue);
  const hsl = { h: 0, s: 0, l: 0 };
  color.getHSL(hsl);
  color.setHSL(
    (hsl.h + hueShift + 1) % 1,
    clamp(hsl.s + saturationBoost, 0, 1),
    clamp(hsl.l + lightnessBoost, 0, 1),
  );
  return color;
}

function drawRoundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function createTagSprite(page) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = "600 30px Avenir Next, Segoe UI, sans-serif";
  const metrics = context.measureText(page.title);
  const width = Math.ceil(metrics.width + 84);
  const height = 62;
  canvas.width = width * 2;
  canvas.height = height * 2;

  context.scale(2, 2);
  context.clearRect(0, 0, width, height);
  drawRoundedRect(context, 1, 1, width - 2, height - 2, 22);
  context.fillStyle = "rgba(12, 16, 22, 0.84)";
  context.fill();
  context.strokeStyle = "rgba(255,255,255,0.16)";
  context.lineWidth = 1.2;
  context.stroke();

  const dotColor = shiftColor(page.color, 0, 0.18, 0.1);
  context.beginPath();
  context.fillStyle = `#${dotColor.getHexString()}`;
  context.arc(24, height / 2, 8, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = "#e7eefb";
  context.font = "600 30px Avenir Next, Segoe UI, sans-serif";
  context.textBaseline = "middle";
  context.fillText(page.title, 40, height / 2 + 1);

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width * 0.042, height * 0.042, 1);
  sprite.center.set(0.5, 0.5);
  sprite.renderOrder = 24;
  sprite.userData.baseScale = sprite.scale.clone();
  sprite.userData.pageId = page.id;
  tagGroup.add(sprite);
  return sprite;
}

function setGraphStatus(message, tone = "default") {
  graphStatus.textContent = message;
  graphStatus.dataset.tone = tone;
}

function readCachedRecord(title) {
  try {
    const raw = window.localStorage.getItem(`${CACHE_PREFIX}${slugify(title)}`);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function writeCachedRecord(title, data) {
  try {
    window.localStorage.setItem(
      `${CACHE_PREFIX}${slugify(title)}`,
      JSON.stringify({ timestamp: Date.now(), data }),
    );
  } catch {
    // Ignore cache failures.
  }
}

function scoreDefaultExpansionTitle(title) {
  const normalized = title.toLowerCase();

  if (
    normalized.startsWith("list of ") ||
    normalized.startsWith("outline of ") ||
    normalized.startsWith("history of ") ||
    normalized.includes("disambiguation") ||
    normalized.includes(":") ||
    /\b\d{4}\b/.test(normalized)
  ) {
    return 0;
  }

  let score = 0;
  RELEVANCE_KEYWORDS.forEach((keyword) => {
    if (normalized.includes(keyword)) {
      score += keyword.length > 7 ? 2 : 1;
    }
  });

  return score;
}

function inferClusterId(clusterVotes) {
  return [...clusterVotes.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] || clusterSpecs[0].id;
}

function collectDefaultExpansionTargets(records) {
  const existingTitles = new Set(records.map((record) => record.title));
  const candidateMap = new Map();

  records.forEach((record) => {
    record.links.forEach((linkedTitle) => {
      if (existingTitles.has(linkedTitle)) {
        return;
      }

      const relevance = scoreDefaultExpansionTitle(linkedTitle);
      if (!relevance) {
        return;
      }

      if (!candidateMap.has(linkedTitle)) {
        candidateMap.set(linkedTitle, {
          title: linkedTitle,
          hits: 0,
          score: 0,
          clusterVotes: new Map(),
        });
      }

      const candidate = candidateMap.get(linkedTitle);
      candidate.hits += 1;
      candidate.score += relevance;
      candidate.clusterVotes.set(
        record.clusterId,
        (candidate.clusterVotes.get(record.clusterId) || 0) + 1,
      );
    });
  });

  return [...candidateMap.values()]
    .sort(
      (left, right) =>
        right.hits - left.hits ||
        right.score - left.score ||
        left.title.localeCompare(right.title),
    )
    .slice(0, MAX_EXPANSION_PAGES)
    .map((candidate) => ({
      title: candidate.title,
      clusterId: inferClusterId(candidate.clusterVotes),
    }));
}

function scoreTopicTitle(title, seedTokens, queryTokens) {
  const quality = titleQualityScore(title);
  if (!quality) {
    return 0;
  }

  const titleTokens = tokenizeText(title);
  return (
    quality +
    countTokenOverlap(titleTokens, seedTokens) * 2.1 +
    countTokenOverlap(titleTokens, queryTokens) * 2.5
  );
}

function scoreTopicRecord(record, seedTokens, queryTokens) {
  const contentTokens = tokenizeText(
    `${record.title} ${record.description || ""} ${record.extract || ""}`,
  );

  return (
    titleQualityScore(record.title) +
    countTokenOverlap(contentTokens, seedTokens) * 1.85 +
    countTokenOverlap(contentTokens, queryTokens) * 2.15
  );
}

function collectTopicExpansionTargets(records, seedTokens, queryTokens) {
  const existingTitles = new Set(records.map((record) => record.title));
  const candidateMap = new Map();

  records.forEach((record) => {
    record.links.forEach((linkedTitle) => {
      if (existingTitles.has(linkedTitle)) {
        return;
      }

      const score = scoreTopicTitle(linkedTitle, seedTokens, queryTokens);
      if (!score) {
        return;
      }

      if (!candidateMap.has(linkedTitle)) {
        candidateMap.set(linkedTitle, {
          title: linkedTitle,
          hits: 0,
          score: 0,
        });
      }

      const candidate = candidateMap.get(linkedTitle);
      candidate.hits += 1;
      candidate.score += score;
    });
  });

  return [...candidateMap.values()]
    .sort(
      (left, right) =>
        right.hits - left.hits ||
        right.score - left.score ||
        left.title.localeCompare(right.title),
    )
    .slice(0, TOPIC_SECONDARY_PAGES)
    .map((candidate) => candidate.title);
}

async function fetchJson(url, retries = 3) {
  let lastError = null;

  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    } catch (error) {
      lastError = error;
      await delay(550 * (attempt + 1));
    }
  }

  throw lastError;
}

async function fetchSummary(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const data = await fetchJson(url);

  return {
    title: data.title || title,
    description: data.description || "Wikipedia article",
    extract: data.extract || "",
    url:
      data.content_urls?.desktop?.page ||
      `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
  };
}

async function fetchLinks(title) {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("redirects", "1");
  url.searchParams.set("origin", "*");
  url.searchParams.set("titles", title);
  url.searchParams.set("prop", "links");
  url.searchParams.set("plnamespace", "0");
  url.searchParams.set("pllimit", "max");

  const data = await fetchJson(url.toString());
  const page = data.query?.pages?.[0];
  return page?.links ? page.links.map((entry) => entry.title) : [];
}

async function fetchWikipediaSearchResults(query) {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("origin", "*");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("srnamespace", "0");
  url.searchParams.set("srlimit", String(MAX_WIKIPEDIA_SEARCH_RESULTS));

  const data = await fetchJson(url.toString());
  return (data.query?.search || []).map((result) => ({
    title: result.title,
    snippet: stripHtml(result.snippet || ""),
  }));
}

async function fetchPageRecord(title, clusterId) {
  const cached = readCachedRecord(title);
  if (cached) {
    return { ...cached, clusterId };
  }

  const [summary, links] = await Promise.all([fetchSummary(title), fetchLinks(title)]);
  const record = {
    title: summary.title,
    description: summary.description,
    extract: summary.extract,
    url: summary.url,
    links,
  };
  writeCachedRecord(title, record);
  return { ...record, clusterId };
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

function getSelectedPage() {
  return state.pageMap.get(state.selectedPageId) || state.pages[0] || null;
}

function getHoveredPage() {
  return state.pageMap.get(state.hoveredPageId) || null;
}

function getPageById(pageId) {
  return state.pageMap.get(pageId) || null;
}

function getVisibleScore(page) {
  const search = state.searchText.trim().toLowerCase();
  const clusterMatches =
    state.filterCluster === "all" || page.clusterName === state.filterCluster;
  const textMatches =
    !search ||
    `${page.title} ${page.description} ${page.extract} ${page.clusterName}`
      .toLowerCase()
      .includes(search);

  if (clusterMatches && textMatches) {
    return 1;
  }

  if (clusterMatches || textMatches) {
    return 0.38;
  }

  return 0.08;
}

function getVisiblePages() {
  return state.pages.filter((page) => getVisibleScore(page) > 0.3);
}

function getFocusSet() {
  const selected = getSelectedPage();
  if (!selected) {
    return new Set();
  }

  return new Set([selected.id, ...state.neighborMap.get(selected.id).keys()]);
}

function populateFilters() {
  regionFilter.innerHTML = '<option value="all">All folders</option>';
  regionFilter.insertAdjacentHTML(
    "beforeend",
    state.clusters
      .map(
        (cluster) =>
          `<option value="${cluster.name}">${cluster.name}</option>`,
      )
      .join(""),
  );
}

function populateLegend() {
  legend.innerHTML = state.clusters
    .map(
      (cluster) => `
        <div class="legend-chip">
          <span class="swatch" style="background:${cluster.accent}"></span>
          ${cluster.name}
        </div>
      `,
    )
    .join("");
}

function renderNoteTree() {
  const search = state.searchText.trim().toLowerCase();
  const clusterFilter = state.filterCluster;

  noteTree.innerHTML = state.clusters
    .map((cluster) => {
      if (clusterFilter !== "all" && cluster.name !== clusterFilter) {
        return "";
      }

      const pages = state.pages
        .filter((page) => page.clusterId === cluster.id)
        .filter((page) => {
          if (!search) {
            return true;
          }

          return `${page.title} ${page.description} ${page.extract}`
            .toLowerCase()
            .includes(search);
        })
        .sort((left, right) => right.connectedCount - left.connectedCount || left.title.localeCompare(right.title));

      if (!pages.length) {
        return "";
      }

      return `
        <section class="tree-group">
          <div class="tree-group-title">${cluster.name}</div>
          ${pages
            .map(
              (page) => `
                <button
                  class="tree-item ${page.id === state.selectedPageId ? "active" : ""}"
                  type="button"
                  data-page-id="${page.id}"
                >
                  <span class="tree-swatch" style="background:${cluster.accent}"></span>
                  <span>${page.title}</span>
                </button>
              `,
            )
            .join("")}
        </section>
      `;
    })
    .join("") || '<p class="tree-group-title">No notes match the current filters.</p>';

  vaultCount.textContent = `${state.pages.length} notes`;
}

function setNoteTab(tab) {
  state.activeNoteTab = tab === "inspector" ? "inspector" : "wiki";
  const isWiki = state.activeNoteTab === "wiki";

  tabWiki.classList.toggle("active", isWiki);
  tabWiki.setAttribute("aria-selected", isWiki ? "true" : "false");
  tabInspector.classList.toggle("active", !isWiki);
  tabInspector.setAttribute("aria-selected", isWiki ? "false" : "true");
  notePanelWiki.hidden = !isWiki;
  notePanelInspector.hidden = isWiki;
}

function getGraphModeLabel() {
  return state.graphMode === "topic" ? "Live topic graph" : "Default atlas";
}

function formatVector3(vector) {
  return `${vector.x.toFixed(1)}, ${vector.y.toFixed(1)}, ${vector.z.toFixed(1)}`;
}

function updateDiagnostics(page) {
  const selectedPage = page || getSelectedPage();
  if (!selectedPage) {
    diagnosticsTitle.textContent = "Waiting for selection…";
    diagnosticsSummary.textContent =
      "Select a note to inspect graph structure, folder placement, and camera framing.";
    diagMode.textContent = "-";
    diagSeed.textContent = "-";
    diagFolder.textContent = "-";
    diagLinks.textContent = "-";
    diagPages.textContent = "0";
    diagFibers.textContent = "0";
    diagVisible.textContent = "0";
    diagCamera.textContent = "-";
    diagnosticsFolderList.innerHTML = "";
    diagnosticsLinkCount.textContent = "0 links";
    diagnosticsLinkList.innerHTML = "";
    return;
  }

  const neighbors = [...(state.neighborMap.get(selectedPage.id) || new Map()).entries()]
    .map(([neighborId, weight]) => ({ page: getPageById(neighborId), weight }))
    .filter((entry) => entry.page)
    .sort((left, right) => right.weight - left.weight);
  const folderCounts = state.clusters
    .map((cluster) => ({
      cluster,
      count: state.pages.filter((pageItem) => pageItem.clusterId === cluster.id).length,
    }))
    .filter((entry) => entry.count > 0)
    .sort((left, right) => right.count - left.count || left.cluster.name.localeCompare(right.cluster.name));

  diagnosticsTitle.textContent = selectedPage.title;
  diagnosticsSummary.textContent =
    state.graphMode === "topic"
      ? `Live Wikipedia connectome branched from "${state.activeSeedTitle}". Selected note anchor: ${formatVector3(selectedPage.position)}.`
      : `Default atlas view seeded from canonical neuroanatomy pages. Selected note anchor: ${formatVector3(selectedPage.position)}.`;
  diagMode.textContent = getGraphModeLabel();
  diagSeed.textContent = state.activeSeedTitle || selectedPage.title;
  diagFolder.textContent = selectedPage.clusterName;
  diagLinks.textContent = `${neighbors.length} neighbors`;
  diagPages.textContent = String(state.pages.length);
  diagFibers.textContent = formatNumber(state.edges.length);
  diagVisible.textContent = String(getVisiblePages().length);
  diagCamera.textContent = `${camera.position.distanceTo(controls.target).toFixed(1)}u`;

  diagnosticsFolderList.innerHTML = folderCounts
    .map(
      ({ cluster, count }) => `
        <span class="tag metric-chip">
          <span class="swatch" style="background:${cluster.accent}"></span>
          <span>
            <strong>${escapeHtml(cluster.name)}</strong>
            <span>${count} notes</span>
          </span>
        </span>
      `,
    )
    .join("");

  diagnosticsLinkCount.textContent = `${neighbors.length} links`;
  diagnosticsLinkList.innerHTML = neighbors
    .slice(0, 14)
    .map(
      ({ page: neighbor, weight }) => `
        <button class="neighbor-chip" type="button" data-page-id="${neighbor.id}">
          <span class="swatch" style="background:${neighbor.color}"></span>
          ${escapeHtml(neighbor.title)} · ${weight}
        </button>
      `,
    )
    .join("");
}

function updateInspector(page) {
  if (!page) {
    return;
  }

  const neighbors = [...state.neighborMap.get(page.id).entries()]
    .map(([neighborId, weight]) => ({ page: getPageById(neighborId), weight }))
    .filter((entry) => entry.page)
    .sort((left, right) => right.weight - left.weight);

  articleKicker.textContent = `${page.clusterName} note`;
  articleTitle.textContent = page.title;
  articleSummary.textContent = page.extract || page.description;
  sourceLink.href = page.url;
  infoRegion.textContent = page.clusterName;
  infoType.textContent = page.description;
  infoTransmitter.textContent = "English Wikipedia";
  infoRate.textContent = `${page.linkCount} in graph`;
  infoDegree.textContent = `${neighbors.length} neighbors`;
  infoMotif.textContent = page.theme;

  tagList.innerHTML = page.tags
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join("");

  neighborCount.textContent = `${neighbors.length} pages`;
  neighborList.innerHTML = neighbors
    .slice(0, 14)
    .map(
      ({ page: neighbor }) => `
        <button class="neighbor-chip" type="button" data-page-id="${neighbor.id}">
          <span class="swatch" style="background:${neighbor.color}"></span>
          ${neighbor.title}
        </button>
      `,
    )
    .join("");

  updateDiagnostics(page);
}

function clearSearchSuggestions() {
  window.clearTimeout(state.searchDebounceId);
  state.searchDebounceId = null;
  state.pendingSearchQuery = "";
  state.searchRequestId += 1;
  state.searchSuggestions = [];
  searchSuggestions.hidden = true;
  searchSuggestions.innerHTML = "";
}

function renderSearchSuggestions() {
  if (!state.searchSuggestions.length) {
    clearSearchSuggestions();
    return;
  }

  searchSuggestions.hidden = false;
  searchSuggestions.innerHTML = state.searchSuggestions
    .map(
      (result, index) => `
        <button
          class="search-suggestion ${index === 0 ? "active" : ""}"
          type="button"
          data-search-title="${escapeHtml(result.title)}"
        >
          <span class="search-suggestion-title">${escapeHtml(result.title)}</span>
          <span class="search-suggestion-snippet">${escapeHtml(result.snippet || "Open this note as a live Wikipedia graph.")}</span>
        </button>
      `,
    )
    .join("");
}

function scheduleSearchSuggestions(query) {
  const trimmed = query.trim();
  window.clearTimeout(state.searchDebounceId);

  if (trimmed.length < 2) {
    clearSearchSuggestions();
    return;
  }

  state.pendingSearchQuery = trimmed;
  state.searchDebounceId = window.setTimeout(async () => {
    const requestId = ++state.searchRequestId;

    try {
      const results = await fetchWikipediaSearchResults(trimmed);
      if (requestId !== state.searchRequestId || state.pendingSearchQuery !== trimmed) {
        return;
      }

      state.searchSuggestions = results;
      renderSearchSuggestions();
    } catch {
      if (requestId !== state.searchRequestId) {
        return;
      }
      clearSearchSuggestions();
    }
  }, SEARCH_DEBOUNCE_MS);
}

async function loadTopicGraphFromQuery(query, preferredTitle = "") {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return;
  }

  const requestId = ++state.graphRequestId;
  clearSearchSuggestions();
  setGraphStatus(`Searching Wikipedia for "${trimmedQuery}"…`);

  let chosenTitle = preferredTitle.trim();
  let searchResults = [];

  if (!chosenTitle) {
    searchResults = await fetchWikipediaSearchResults(trimmedQuery);
    if (requestId !== state.graphRequestId) {
      return;
    }

    chosenTitle = searchResults[0]?.title || "";
  }

  if (!chosenTitle) {
    setGraphStatus(`No Wikipedia results found for "${trimmedQuery}".`, "error");
    return;
  }

  const seedRecord = await fetchPageRecord(chosenTitle);
  if (requestId !== state.graphRequestId) {
    return;
  }

  const queryTokens = tokenizeText(trimmedQuery);
  const seedTokens = tokenizeText(
    `${seedRecord.title} ${seedRecord.description || ""} ${seedRecord.extract || ""}`,
  );
  const primaryTargets = [...seedRecord.links]
    .map((title) => ({
      title,
      score: scoreTopicTitle(title, seedTokens, queryTokens),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.title.localeCompare(right.title),
    )
    .slice(0, TOPIC_PRIMARY_PAGES);

  let primaryCompleted = 0;
  setGraphStatus(
    `Growing live graph from "${seedRecord.title}"… ${primaryCompleted}/${primaryTargets.length}`,
  );

  const primaryResults = await mapWithConcurrency(
    primaryTargets,
    5,
    async ({ title }) => {
      try {
        return await fetchPageRecord(title);
      } catch (error) {
        return { error, title };
      } finally {
        primaryCompleted += 1;
        if (requestId === state.graphRequestId) {
          setGraphStatus(
            `Growing live graph from "${seedRecord.title}"… ${primaryCompleted}/${primaryTargets.length}`,
          );
        }
      }
    },
  );
  if (requestId !== state.graphRequestId) {
    return;
  }

  const mergedRecords = [seedRecord];
  const knownTitles = new Set([seedRecord.title]);

  primaryResults.forEach((record) => {
    if (!record.error && !knownTitles.has(record.title)) {
      mergedRecords.push(record);
      knownTitles.add(record.title);
    }
  });

  const secondaryTargets = collectTopicExpansionTargets(mergedRecords, seedTokens, queryTokens);
  let secondaryCompleted = 0;
  if (secondaryTargets.length) {
    setGraphStatus(
      `Linking second-hop notes… ${secondaryCompleted}/${secondaryTargets.length}`,
    );
  }

  const secondaryResults = await mapWithConcurrency(
    secondaryTargets,
    4,
    async (title) => {
      try {
        return await fetchPageRecord(title);
      } catch (error) {
        return { error, title };
      } finally {
        secondaryCompleted += 1;
        if (requestId === state.graphRequestId && secondaryTargets.length) {
          setGraphStatus(
            `Linking second-hop notes… ${secondaryCompleted}/${secondaryTargets.length}`,
          );
        }
      }
    },
  );
  if (requestId !== state.graphRequestId) {
    return;
  }

  secondaryResults.forEach((record) => {
    if (!record.error && !knownTitles.has(record.title)) {
      mergedRecords.push(record);
      knownTitles.add(record.title);
    }
  });

  state.searchText = "";
  state.filterCluster = "all";
  searchInput.value = "";
  regionFilter.value = "all";
  state.graphMode = "topic";
  state.activeSeedTitle = seedRecord.title;

  buildGraph(mergedRecords, {
    mode: "topic",
    seedTitle: seedRecord.title,
  });

  setGraphStatus(
    `Built live graph around "${seedRecord.title}" with ${mergedRecords.length} pages and ${state.edges.length} live links.`,
  );
}

function randomPointInCluster(cluster) {
  const [cx, cy, cz] = cluster.center;
  const [sx, sy, sz] = cluster.spread;
  return new THREE.Vector3(
    cx + randomBetween(-sx, sx),
    cy + randomBetween(-sy, sy),
    cz + randomBetween(-sz, sz),
  );
}

function clearThreeObjects() {
  while (cloudGroup.children.length) {
    const cloud = cloudGroup.children[0];
    cloudGroup.remove(cloud);
    cloud.geometry.dispose();
    cloud.material.dispose();
  }

  while (edgeGroup.children.length) {
    const line = edgeGroup.children[0];
    edgeGroup.remove(line);
    line.geometry.dispose();
    line.material.dispose();
  }

  while (nodeGroup.children.length) {
    const object = nodeGroup.children[0];
    nodeGroup.remove(object);
    if (object.material) {
      object.material.dispose();
    }
  }

  while (sparkGroup.children.length) {
    const object = sparkGroup.children[0];
    sparkGroup.remove(object);
    if (object.material) {
      object.material.dispose();
    }
  }

  while (tagGroup.children.length) {
    const object = tagGroup.children[0];
    tagGroup.remove(object);
    if (object.material?.map) {
      object.material.map.dispose();
    }
    if (object.material) {
      object.material.dispose();
    }
  }

  while (pulseGroup.children.length) {
    const object = pulseGroup.children[0];
    pulseGroup.remove(object);
    if (object.material) {
      object.material.dispose();
    }
  }
  state.pulses = [];
}

function condenseTopicLabel(title) {
  const cleaned = title
    .replace(/\s*\(.+?\)\s*/g, " ")
    .replace(/[:,].*$/, "")
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const significant = words.filter((word) => !STOP_WORDS.has(word.toLowerCase()));
  const selected = (significant.length ? significant : words).slice(0, 2);
  return selected.join(" ") || cleaned || title;
}

function createDynamicClusterDefinitions(leaders, seedPage) {
  const ringCount = Math.max(leaders.length - 1, 1);

  return leaders.map((leader, index) => {
    if (index === 0) {
      return {
        id: `cluster-${slugify(leader.title)}`,
        name: `${condenseTopicLabel(seedPage.title)} Core`,
        theme: leader.description || `Pages branching directly from ${seedPage.title}.`,
        center: [0, 0, 0],
        spread: [12, 10, 10],
        accent: DYNAMIC_CLUSTER_COLORS[index % DYNAMIC_CLUSTER_COLORS.length],
      };
    }

    const angle = ((index - 1) / ringCount) * Math.PI * 2;
    const radius = 34 + ringCount * 2.5;
    return {
      id: `cluster-${slugify(leader.title)}`,
      name: condenseTopicLabel(leader.title),
      theme: leader.description || `Related pages around ${leader.title}.`,
      center: [
        Math.cos(angle) * radius,
        Math.sin(angle * 1.6) * 14 + (index % 2 === 0 ? 5 : -5),
        Math.sin(angle) * radius * 0.68,
      ],
      spread: [12, 10, 10],
      accent: DYNAMIC_CLUSTER_COLORS[index % DYNAMIC_CLUSTER_COLORS.length],
    };
  });
}

function buildStaticClusterContext(pages) {
  const clusters = cloneClusters(clusterSpecs);
  const assignments = new Map();

  pages.forEach((page) => {
    assignments.set(page.id, page.sourceClusterId || clusters[0].id);
  });

  return { clusters, assignments };
}

function buildDynamicClusterContext(pages, neighborMap, seedTitle) {
  const seedPage =
    pages.find((page) => page.title.toLowerCase() === seedTitle.toLowerCase()) ||
    pages[0];
  const desiredCount = clamp(Math.round(Math.sqrt(pages.length)), 4, MAX_DYNAMIC_CLUSTERS);
  const leaders = [seedPage];
  const sortedCandidates = [...pages].sort(
    (left, right) =>
      right.connectedCount * 3 + right.linkCount - (left.connectedCount * 3 + left.linkCount),
  );

  sortedCandidates.forEach((candidate) => {
    if (leaders.length >= desiredCount || candidate.id === seedPage.id) {
      return;
    }

    const candidateTokens = tokenizeText(`${candidate.title} ${candidate.description}`);
    const tooSimilar = leaders.some((leader) => {
      const leaderTokens = tokenizeText(`${leader.title} ${leader.description}`);
      return countTokenOverlap(candidateTokens, leaderTokens) >= 3;
    });

    if (!tooSimilar) {
      leaders.push(candidate);
    }
  });

  const clusters = createDynamicClusterDefinitions(leaders, seedPage);
  const assignments = new Map();

  pages.forEach((page) => {
    let bestCluster = clusters[0];
    let bestScore = -Infinity;
    const pageTokens = tokenizeText(`${page.title} ${page.description}`);
    const pageNeighbors = neighborMap.get(page.id) || new Map();

    clusters.forEach((cluster, index) => {
      const leader = leaders[index];
      const leaderTokens = tokenizeText(`${leader.title} ${leader.description}`);
      let sharedNeighbors = 0;

      pageNeighbors.forEach((_, neighborId) => {
        if (neighborMap.get(leader.id)?.has(neighborId)) {
          sharedNeighbors += 1;
        }
      });

      const score =
        (page.id === leader.id ? 999 : 0) +
        getEdgeWeight(neighborMap, page.id, leader.id) * 5.8 +
        sharedNeighbors * 0.5 +
        countTokenOverlap(pageTokens, leaderTokens) * 1.6 +
        (index === 0 ? 0.35 : 0);

      if (score > bestScore) {
        bestScore = score;
        bestCluster = cluster;
      }
    });

    assignments.set(page.id, bestCluster.id);
  });

  return { clusters, assignments };
}

function buildGraph(records, options = {}) {
  clearThreeObjects();

  const titleSet = new Set(records.map((record) => record.title));
  const pages = [];
  const pageMap = new Map();
  const neighborMap = new Map();
  const titleToId = new Map();

  records.forEach((record) => {
    const page = {
      id: `page-${slugify(record.title)}`,
      title: record.title,
      description: record.description,
      extract: record.extract,
      url: record.url,
      sourceClusterId: record.clusterId || null,
      velocity: new THREE.Vector3(),
      radius: randomBetween(0.9, 1.45),
      wobblePhase: randomBetween(0, Math.PI * 2),
      sparkPhase: randomBetween(0, Math.PI * 2),
      sparkRadius: randomBetween(1.4, 2.8),
      links: record.links,
      linkCount: 0,
      connectedCount: 0,
      tags: [],
    };

    pages.push(page);
    pageMap.set(page.id, page);
    titleToId.set(page.title, page.id);
    neighborMap.set(page.id, new Map());
  });

  const edgeMap = new Map();

  records.forEach((record) => {
    const sourceId = titleToId.get(record.title);
    const matchedLinks = record.links.filter((linkedTitle) => titleSet.has(linkedTitle));
    const sourcePage = pageMap.get(sourceId);
    sourcePage.linkCount = matchedLinks.length;

    matchedLinks.forEach((linkedTitle) => {
      const targetId = titleToId.get(linkedTitle);
      if (!targetId || targetId === sourceId) {
        return;
      }

      const key =
        sourceId < targetId ? `${sourceId}::${targetId}` : `${targetId}::${sourceId}`;
      const current = edgeMap.get(key) || {
        id: key,
        sourceId: sourceId < targetId ? sourceId : targetId,
        targetId: sourceId < targetId ? targetId : sourceId,
        weight: 0,
      };
      current.weight += 1;
      edgeMap.set(key, current);
    });
  });

  const edges = [...edgeMap.values()];
  edges.forEach((edge) => {
    const sourceNeighbors = neighborMap.get(edge.sourceId);
    const targetNeighbors = neighborMap.get(edge.targetId);
    sourceNeighbors.set(edge.targetId, (sourceNeighbors.get(edge.targetId) || 0) + edge.weight);
    targetNeighbors.set(edge.sourceId, (targetNeighbors.get(edge.sourceId) || 0) + edge.weight);
  });

  pages.forEach((page) => {
    page.connectedCount = neighborMap.get(page.id).size;
    page.radius += Math.min(page.linkCount, 14) * 0.045 + Math.min(page.connectedCount, 12) * 0.072;
  });

  const clusterContext =
    options.mode === "topic"
      ? buildDynamicClusterContext(pages, neighborMap, options.seedTitle || pages[0]?.title || "")
      : buildStaticClusterContext(pages);

  setClusters(clusterContext.clusters);

  pages.forEach((page) => {
    const cluster = state.clusterMap.get(clusterContext.assignments.get(page.id)) || state.clusters[0];
    const home = randomPointInCluster(cluster);
    page.clusterId = cluster.id;
    page.clusterName = cluster.name;
    page.theme = cluster.theme;
    page.color = cluster.accent;
    page.home = home;
    page.position = home.clone().add(
      new THREE.Vector3(
        randomBetween(-1.6, 1.6),
        randomBetween(-1.6, 1.6),
        randomBetween(-1.6, 1.6),
      ),
    );
    page.sparkPosition = home.clone();
    page.tags = [
      ...new Set([
        cluster.name,
        page.description,
        "English Wikipedia",
        ...page.links.filter((title) => titleSet.has(title)).slice(0, 3),
      ]),
    ].slice(0, 7);
  });

  state.pages = pages;
  state.pageMap = pageMap;
  state.edges = edges;
  state.neighborMap = neighborMap;
  state.connectedness = [...pages].sort(
    (left, right) => right.connectedCount - left.connectedCount || right.linkCount - left.linkCount,
  );
  state.selectedPageId =
    pageMap.get(`page-${slugify(options.seedTitle || "")}`)?.id ||
    state.connectedness[0]?.id ||
    pages[0]?.id ||
    null;
  state.trackedPageId = state.selectedPageId;
  state.trackedCameraOffset = state.defaultCameraPosition.clone().sub(state.defaultTarget);
  state.loading = false;

  const graphBounds = new THREE.Box3().setFromPoints(pages.map((page) => page.home));
  const graphCenter = graphBounds.getCenter(new THREE.Vector3());
  const graphExtent = graphBounds.getSize(new THREE.Vector3()).length();
  const graphRadius = Math.max(28, graphExtent * 0.5);
  state.graphRadius = graphRadius;
  state.defaultTarget = graphCenter;
  state.defaultCameraPosition = graphCenter
    .clone()
    .add(new THREE.Vector3(graphRadius * 0.22, graphRadius * 0.14, graphRadius * 1.46));
  camera.position.copy(state.defaultCameraPosition);
  controls.target.copy(state.defaultTarget);
  controls.minDistance = clamp(graphRadius * 0.44, 20, 46);
  controls.maxDistance = clamp(graphRadius * 4.2, 110, 220);
  controls.update();

  statPages.textContent = String(pages.length);
  statLinks.textContent = formatNumber(edges.length);
  statFolders.textContent = String(state.clusters.length);

  populateFilters();
  populateLegend();
  createClusterClouds();
  createNodeVisuals();
  createSparkVisuals();
  createEdgeVisuals();
  createTagSprites();
  renderNoteTree();
  updateInspector(getSelectedPage());
  focusOnPage(getSelectedPage());
}

function createClusterClouds() {
  state.clusters.forEach((cluster) => {
    const pages = state.pages.filter((page) => page.clusterId === cluster.id);
    if (!pages.length) {
      return;
    }

    const particlesPerPage = 34;
    const totalParticles = pages.length * particlesPerPage;
    const positions = new Float32Array(totalParticles * 3);
    const colors = new Float32Array(totalParticles * 3);
    const color = new THREE.Color(cluster.accent);
    const softenedColor = color.clone().lerp(new THREE.Color("#f7fbff"), 0.18);
    let pointerIndex = 0;

    pages.forEach((page) => {
      for (let index = 0; index < particlesPerPage; index += 1) {
        const spread = 4.5 + page.connectedCount * 0.18;
        const tint = shiftColor(cluster.accent, randomBetween(-0.022, 0.022), 0.08, 0.1);
        const point = page.home.clone().add(
          new THREE.Vector3(
            randomBetween(-spread, spread),
            randomBetween(-spread * 0.82, spread * 0.82),
            randomBetween(-spread * 0.78, spread * 0.78),
          ),
        );
        const stride = pointerIndex * 3;
        positions[stride] = point.x;
        positions[stride + 1] = point.y;
        positions[stride + 2] = point.z;
        colors[stride] = tint.r * 0.76 + softenedColor.r * 0.24;
        colors[stride + 1] = tint.g * 0.76 + softenedColor.g * 0.24;
        colors[stride + 2] = tint.b * 0.76 + softenedColor.b * 0.24;
        pointerIndex += 1;
      }
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.94,
      transparent: true,
      opacity: 0.18,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    cloudGroup.add(points);
  });
}

function createNodeVisuals() {
  state.pages.forEach((page) => {
    const nodeMaterial = new THREE.MeshBasicMaterial({
      color: mixColor(page.color, "#f8fbff", 0.1),
      transparent: true,
      opacity: 0.84,
    });
    const mesh = new THREE.Mesh(sharedNodeGeometry, nodeMaterial);
    mesh.scale.setScalar(page.radius);
    mesh.position.copy(page.position);
    mesh.userData.pageId = page.id;
    nodeGroup.add(mesh);

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(page.color),
      transparent: true,
      opacity: 0.08,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const glow = new THREE.Mesh(sharedGlowGeometry, glowMaterial);
    glow.scale.setScalar(page.radius * 1.9);
    glow.position.copy(page.position);
    glow.userData.pageId = page.id;
    nodeGroup.add(glow);

    page.mesh = mesh;
    page.glow = glow;
  });
}

function createSparkVisuals() {
  state.pages.forEach((page) => {
    const material = new THREE.MeshBasicMaterial({
      color: shiftColor(page.color, randomBetween(-0.018, 0.018), 0.22, 0.1),
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const spark = new THREE.Mesh(sharedSparkGeometry, material);
    spark.scale.setScalar(randomBetween(1.2, 1.8));
    spark.position.copy(page.position);
    spark.userData.pageId = page.id;
    sparkGroup.add(spark);
    page.spark = spark;
  });
}

function createEdgeVisuals() {
  const pulseCandidates = [...state.edges]
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 42);

  state.edges.forEach((edge) => {
    const source = getPageById(edge.sourceId);
    const target = getPageById(edge.targetId);
    const strands = [];
    const strandCount = edge.weight > 1 ? 5 : 3;

    for (let strandIndex = 0; strandIndex < strandCount; strandIndex += 1) {
      const geometry = new THREE.BufferGeometry();
      const segments = 20;
      const positions = new Float32Array((segments + 1) * 3);
      const colors = new Float32Array((segments + 1) * 3);
      const hueShift = randomBetween(-0.028, 0.028);
      const sourceColor = shiftColor(source.color, hueShift, 0.18, 0.02);
      const targetColor = shiftColor(target.color, -hueShift, 0.2, 0.02);

      for (let step = 0; step <= segments; step += 1) {
        const t = step / segments;
        const mixed = sourceColor.clone().lerp(targetColor, t);
        const stride = step * 3;
        colors[stride] = mixed.r;
        colors[stride + 1] = mixed.g;
        colors[stride + 2] = mixed.b;
      }

      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
      const material = new THREE.LineBasicMaterial({
        transparent: true,
        opacity: 0.072,
        blending: THREE.NormalBlending,
        depthWrite: false,
        vertexColors: true,
      });
      const line = new THREE.Line(geometry, material);
      edgeGroup.add(line);

      strands.push({
        line,
        positions,
        colors,
        segments,
        curveAmount: randomBetween(0.22, 0.58),
        liftVectorA: new THREE.Vector3(
          randomBetween(-1, 1),
          randomBetween(-1, 1),
          randomBetween(-1, 1),
        ).normalize(),
        liftVectorB: new THREE.Vector3(
          randomBetween(-1, 1),
          randomBetween(-1, 1),
          randomBetween(-1, 1),
        ).normalize(),
        laneOffset: randomBetween(-5.2, 5.2),
        jitterPhase: randomBetween(0, Math.PI * 2),
        twistPhase: randomBetween(0, Math.PI * 2),
        wiggleAmplitude: randomBetween(0.55, 1.45),
      });
    }

    edge.visual = { strands };
  });

  pulseCandidates.forEach((edge) => {
    const colors = edge.visual.strands[0].colors;
    const color = new THREE.Color(colors[0], colors[1], colors[2]);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.78,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(sharedPulseGeometry, material);
    pulseGroup.add(mesh);
    state.pulses.push({
      edge,
      mesh,
      speed: randomBetween(0.08, 0.22),
      phase: Math.random(),
    });
  });
}

function createTagSprites() {
  state.pages.forEach((page) => {
    page.tagSprite = createTagSprite(page);
  });
}

function resetCameraGoals() {
  state.cameraGoal = state.defaultCameraPosition.clone();
  state.targetGoal = state.defaultTarget.clone();
  state.trackedPageId = null;
  state.trackedCameraOffset = state.defaultCameraPosition.clone().sub(state.defaultTarget);
}

function getPageAnchor(page) {
  if (!page) {
    return state.defaultTarget.clone();
  }

  return (page.position || page.home || state.defaultTarget).clone();
}

function getScreenCenterInStageNdc() {
  const rect = stage.getBoundingClientRect();
  const viewport = window.visualViewport;
  const viewportCenterX = viewport
    ? viewport.offsetLeft + viewport.width * 0.5
    : window.innerWidth * 0.5;
  const viewportCenterY = viewport
    ? viewport.offsetTop + viewport.height * 0.5
    : window.innerHeight * 0.5;
  const relativeX = clamp(
    (viewportCenterX - rect.left) / Math.max(rect.width, 1),
    0.14,
    0.86,
  );
  const relativeY = clamp(
    (viewportCenterY - rect.top) / Math.max(rect.height, 1),
    0.14,
    0.86,
  );

  return new THREE.Vector2(relativeX * 2 - 1, 1 - relativeY * 2);
}

function getCameraPlaneOffset(cameraPosition, targetPosition, desiredNdc) {
  const viewDirection = targetPosition.clone().sub(cameraPosition).normalize();
  const right = new THREE.Vector3().crossVectors(viewDirection, camera.up).normalize();
  const up = new THREE.Vector3().crossVectors(right, viewDirection).normalize();
  const distance = Math.max(cameraPosition.distanceTo(targetPosition), 0.001);
  const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5)) * distance;
  const halfWidth = halfHeight * camera.aspect;

  return right
    .multiplyScalar(-desiredNdc.x * halfWidth * 0.94)
    .add(up.multiplyScalar(-desiredNdc.y * halfHeight * 0.94));
}

function focusOnPage(page) {
  if (!page) {
    return;
  }

  const anchor = getPageAnchor(page);
  const desiredNdc = getScreenCenterInStageNdc();
  const outwardNormal = anchor.clone().sub(state.defaultTarget);
  const currentDirection = camera.position.clone().sub(controls.target).normalize();
  const fallbackDirection = currentDirection.lengthSq() > 0.0001
    ? currentDirection
    : new THREE.Vector3(0.22, 0.12, 1).normalize();
  const normalDirection = outwardNormal.lengthSq() > 1
    ? outwardNormal.normalize()
    : fallbackDirection.clone();
  const projected = anchor.clone().project(camera);
  const centerDistance = clamp(
    Math.hypot(projected.x - desiredNdc.x, (projected.y - desiredNdc.y) * 0.86),
    0,
    1.35,
  );
  const centerResponse = clamp(centerDistance / 0.92, 0.18, 1);
  const viewportAspect = clamp(stage.clientWidth / Math.max(stage.clientHeight, 1), 0.9, 1.9);
  const focusDirection = normalDirection
    .multiplyScalar(0.42 + centerResponse * 0.5)
    .add(fallbackDirection.clone().multiplyScalar(0.8 - centerResponse * 0.26))
    .add(new THREE.Vector3(0, 0.1 + centerResponse * 0.12 + (viewportAspect - 1) * 0.04, 0))
    .normalize();
  const distance = clamp(
    Math.max(
      camera.position.distanceTo(anchor) * (0.74 - centerResponse * 0.08),
      state.graphRadius * (0.38 + centerResponse * 0.1),
    ),
    controls.minDistance * 1.08,
    Math.min(controls.maxDistance * 0.46, state.graphRadius * 1.18),
  );
  state.trackedCameraOffset = focusDirection.multiplyScalar(distance);
  state.targetGoal = anchor.clone();
  state.cameraGoal = anchor.clone().add(state.trackedCameraOffset);
  const framingOffset = getCameraPlaneOffset(
    state.cameraGoal,
    state.targetGoal,
    desiredNdc,
  );
  state.targetGoal.add(framingOffset);
  state.cameraGoal.add(framingOffset);
  state.trackedPageId = page.id;
}

function focusPage(pageId) {
  const page = getPageById(pageId);
  if (!page) {
    return;
  }

  state.selectedPageId = page.id;
  updateInspector(page);
  renderNoteTree();
  focusOnPage(page);
}

function shouldShowTag(page) {
  return true;
}

function updateNavigationFeel() {
  const distance = camera.position.distanceTo(controls.target);
  const normalized = clamp((distance - controls.minDistance) / (controls.maxDistance - controls.minDistance), 0, 1);
  controls.rotateSpeed = 0.56 + normalized * 0.44;
  controls.zoomSpeed = 0.9 + normalized * 0.5;
  controls.panSpeed = 0.42 + normalized * 1.08;
  controls.dampingFactor = 0.045 + normalized * 0.04;
}

function updateTags() {
  state.pages.forEach((page) => {
    const tag = page.tagSprite;
    if (!tag || !page.spark) {
      return;
    }

    const anchor = page.sparkPosition || page.position;
    const vector = anchor.clone().project(camera);
    const onScreen =
      vector.z < 1 &&
      vector.z > -1 &&
      vector.x >= -1.25 &&
      vector.x <= 1.25 &&
      vector.y >= -1.25 &&
      vector.y <= 1.25;

    if (!onScreen) {
      tag.visible = false;
      page.spark.visible = true;
      return;
    }

    const isSelected = page.id === state.selectedPageId;
    const isHovered = page.id === state.hoveredPageId;
    const distanceToCamera = camera.position.distanceTo(anchor);
    const distanceFade = clamp(1 - (distanceToCamera - controls.minDistance) / 220, 0.42, 1);
    const cameraLift = camera.position.clone().sub(anchor).normalize().multiplyScalar(
      isSelected ? 1.45 : isHovered ? 1.08 : 0.92,
    );
    const baseScale = tag.userData.baseScale;
    const scaleFactor = (isSelected ? 1.08 : isHovered ? 1.01 : 0.9) * distanceFade;
    tag.visible = true;
    tag.position.copy(anchor).add(cameraLift);
    tag.scale.set(
      baseScale.x * scaleFactor,
      baseScale.y * scaleFactor,
      baseScale.z,
    );
    tag.material.opacity = isSelected ? 1 : isHovered ? 0.92 : clamp(0.5 + distanceFade * 0.32, 0.48, 0.82);
    page.spark.visible = false;
  });
}

function resizeRenderer() {
  const width = stage.clientWidth;
  const height = stage.clientHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function updatePointerFromClient(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
}

function pickPageIdFromClient(clientX, clientY) {
  updatePointerFromClient(clientX, clientY);
  raycaster.setFromCamera(pointer, camera);
  const intersections = raycaster.intersectObjects(
    state.pages.flatMap((page) => [page.tagSprite, page.spark, page.mesh]).filter(Boolean),
    false,
  );
  return intersections[0]?.object?.userData?.pageId || null;
}

function moveDraggedPage(clientX, clientY) {
  if (!state.dragTag) {
    return;
  }

  const page = getPageById(state.dragTag.pageId);
  if (!page) {
    return;
  }

  updatePointerFromClient(clientX, clientY);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.ray.intersectPlane(state.dragTag.plane, dragIntersection);
  if (!hit) {
    return;
  }

  const nextPosition = hit.clone().add(state.dragTag.offset);
  const delta = nextPosition.clone().sub(page.position);
  if (delta.lengthSq() < 0.00001) {
    return;
  }

  state.dragTag.moved = true;
  page.position.copy(nextPosition);
  page.home.add(delta);
  page.sparkPosition.copy(nextPosition);
  if (page.spark) {
    page.spark.position.copy(nextPosition);
  }
}

function startPageDrag(pageId, clientX, clientY) {
  const page = getPageById(pageId);
  if (!page) {
    return;
  }

  focusPage(pageId);
  camera.getWorldDirection(dragNormal);
  dragPlane.setFromNormalAndCoplanarPoint(dragNormal, page.position);
  updatePointerFromClient(clientX, clientY);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.ray.intersectPlane(dragPlane, dragIntersection.clone()) || page.position.clone();

  state.dragTag = {
    pageId,
    plane: dragPlane.clone(),
    offset: page.position.clone().sub(hit),
    moved: false,
  };
  controls.enabled = false;
}

function handleStagePointerDown(event) {
  if (
    event.button !== 0 ||
    event.shiftKey ||
    event.ctrlKey ||
    event.metaKey
  ) {
    return;
  }

  const pageId = pickPageIdFromClient(event.clientX, event.clientY) || state.hoveredPageId;
  if (!pageId) {
    return;
  }

  state.hoveredPageId = pageId;
  startPageDrag(pageId, event.clientX, event.clientY);
  event.preventDefault();
  event.stopPropagation();
}

function handleStagePointerMove(event) {
  if (state.dragTag) {
    moveDraggedPage(event.clientX, event.clientY);
    return;
  }

  const nextHoveredId = pickPageIdFromClient(event.clientX, event.clientY);
  stage.style.cursor = nextHoveredId ? "pointer" : "default";

  if (nextHoveredId !== state.hoveredPageId) {
    state.hoveredPageId = nextHoveredId;
  }
}

function handleWindowPointerMove(event) {
  moveDraggedPage(event.clientX, event.clientY);
}

function handlePointerUp() {
  if (!state.dragTag) {
    controls.enabled = true;
    return;
  }

  const { pageId, moved } = state.dragTag;
  controls.enabled = true;

  if (!moved) {
    focusPage(pageId);
  }

  state.dragTag = null;
}

function updateNodeVisuals(time) {
  const selected = getSelectedPage();
  const focusSet = getFocusSet();
  const white = new THREE.Color("#ffffff");

  state.pages.forEach((page) => {
    if (!page.mesh) {
      return;
    }

    page.mesh.position.copy(page.position);
    page.glow.position.copy(page.position);

    const isSelected = selected && page.id === selected.id;
    const isHovered = page.id === state.hoveredPageId;
    const isFocused = focusSet.has(page.id);
    const visibleScore = getVisibleScore(page);
    const pulse = 1 + Math.sin(time * 1.8 + page.wobblePhase) * 0.08;
    const scale = page.radius * pulse * (isSelected ? 1.28 : isHovered ? 1.16 : 1);
    const color = new THREE.Color(page.color).lerp(
      white,
      isSelected ? 0.26 : isHovered ? 0.18 : 0.08,
    );
    const sparkOrbit = new THREE.Vector3(
      Math.sin(time * 1.4 + page.sparkPhase) *
        page.sparkRadius *
        (isSelected ? 0 : 1),
      Math.cos(time * 1.1 + page.sparkPhase * 1.3) *
        page.sparkRadius *
        0.52 *
        (isSelected ? 0 : 1),
      Math.sin(time * 1.75 + page.sparkPhase * 0.8) *
        page.sparkRadius *
        0.66 *
        (isSelected ? 0 : 1),
    );
    page.mesh.scale.setScalar(scale);
    page.mesh.material.color.copy(color);
    page.glow.scale.setScalar(scale * (isFocused ? 3.1 : 2.25));
    page.mesh.material.opacity = clamp(0.18 + visibleScore * 0.66, 0.12, 0.9);
    page.glow.material.opacity = isSelected ? 0.14 : isFocused ? 0.08 : 0.03;

    page.sparkPosition.copy(page.position).add(sparkOrbit);
    if (page.spark) {
      page.spark.position.copy(page.sparkPosition);
      page.spark.scale.setScalar(isSelected ? 2.35 : isHovered ? 1.95 : 1.35);
      page.spark.material.color.copy(
        shiftColor(page.color, 0, isSelected ? 0.32 : 0.2, isSelected ? 0.18 : 0.1),
      );
      page.spark.material.opacity = isSelected ? 1 : isFocused ? 0.92 : 0.76;
    }
  });
}

function updateEdgeVisuals(time) {
  const selected = getSelectedPage();
  const focusSet = getFocusSet();

  state.edges.forEach((edge, index) => {
    const source = getPageById(edge.sourceId);
    const target = getPageById(edge.targetId);
    const direction = target.position.clone().sub(source.position);
    const distance = direction.length();
    if (distance === 0) {
      return;
    }

    const selectedDirect =
      selected &&
      (edge.sourceId === selected.id || edge.targetId === selected.id);
    const focused = focusSet.has(edge.sourceId) && focusSet.has(edge.targetId);
    const sourceVisible = getVisibleScore(source) > 0.3;
    const targetVisible = getVisibleScore(target) > 0.3;
    const directionUnit = direction.clone().normalize();

    edge.visual.strands.forEach((strand, strandIndex) => {
      const liftA = strand.liftVectorA.clone();
      liftA.sub(directionUnit.clone().multiplyScalar(liftA.dot(directionUnit)));
      if (liftA.lengthSq() < 0.0001) {
        liftA.set(0, 1, 0);
      }
      liftA.normalize();

      const liftB = strand.liftVectorB.clone();
      liftB.sub(directionUnit.clone().multiplyScalar(liftB.dot(directionUnit)));
      liftB.sub(liftA.clone().multiplyScalar(liftB.dot(liftA)));
      if (liftB.lengthSq() < 0.0001) {
        liftB.set(1, 0, 0);
      }
      liftB.normalize();

      const side = new THREE.Vector3().crossVectors(directionUnit, liftA);
      if (side.lengthSq() < 0.0001) {
        side.set(1, 0, 0);
      }
      side.normalize();

      const curveHeight = (6 + distance * 0.11) * strand.curveAmount;
      const sway = Math.sin(time * 0.46 + strand.jitterPhase + strandIndex * 0.35) * 1.18;
      const control1 = source.position
        .clone()
        .lerp(target.position, 0.33)
        .add(liftA.clone().multiplyScalar(curveHeight * 0.95))
        .add(side.clone().multiplyScalar(strand.laneOffset * 0.66 + sway));
      const control2 = source.position
        .clone()
        .lerp(target.position, 0.67)
        .add(liftB.clone().multiplyScalar(curveHeight * 0.82))
        .add(side.clone().multiplyScalar(-strand.laneOffset * 0.42 + sway * 0.55));

      const positions = strand.positions;
      for (let step = 0; step <= strand.segments; step += 1) {
        const t = step / strand.segments;
        const oneMinus = 1 - t;
        const envelope = Math.sin(Math.PI * t);
        const point = new THREE.Vector3()
          .copy(source.position)
          .multiplyScalar(oneMinus * oneMinus * oneMinus)
          .add(control1.clone().multiplyScalar(3 * oneMinus * oneMinus * t))
          .add(control2.clone().multiplyScalar(3 * oneMinus * t * t))
          .add(target.position.clone().multiplyScalar(t * t * t));
        const fiberAxis = liftA.clone().lerp(liftB, t).normalize();
        const wiggle =
          Math.sin(t * Math.PI * 2 + time * 0.52 + strand.twistPhase) *
          strand.wiggleAmplitude *
          envelope;
        const chromaWiggle =
          Math.cos(t * Math.PI * 3 + time * 0.44 + strand.jitterPhase) *
          strand.wiggleAmplitude *
          0.34 *
          envelope;
        point
          .add(side.clone().multiplyScalar(wiggle))
          .add(fiberAxis.multiplyScalar(chromaWiggle));
        const stride = step * 3;
        positions[stride] = point.x;
        positions[stride + 1] = point.y;
        positions[stride + 2] = point.z;
      }

      strand.line.geometry.attributes.position.needsUpdate = true;
      strand.line.material.opacity = selectedDirect
        ? 0.18
        : focused
          ? 0.11
          : sourceVisible && targetVisible
            ? 0.058
            : 0.018;
    });
  });

  state.pulses.forEach((pulse, pulseIndex) => {
    const edge = pulse.edge;
    const source = getPageById(edge.sourceId);
    const target = getPageById(edge.targetId);
    const direction = target.position.clone().sub(source.position);
    const strand = edge.visual.strands[pulseIndex % edge.visual.strands.length];
    const directionUnit = direction.clone().normalize();
    const liftA = strand.liftVectorA.clone();
    liftA.sub(directionUnit.clone().multiplyScalar(liftA.dot(directionUnit)));
    if (liftA.lengthSq() < 0.0001) {
      liftA.set(0, 1, 0);
    }
    liftA.normalize();

    const liftB = strand.liftVectorB.clone();
    liftB.sub(directionUnit.clone().multiplyScalar(liftB.dot(directionUnit)));
    liftB.sub(liftA.clone().multiplyScalar(liftB.dot(liftA)));
    if (liftB.lengthSq() < 0.0001) {
      liftB.set(1, 0, 0);
    }
    liftB.normalize();

    const side = new THREE.Vector3().crossVectors(directionUnit, liftA);
    if (side.lengthSq() < 0.0001) {
      side.set(1, 0, 0);
    }
    side.normalize();

    const t = (pulse.phase + time * pulse.speed * 0.05 + pulseIndex * 0.03) % 1;
    const oneMinus = 1 - t;
    const envelope = Math.sin(Math.PI * t);
    const curveHeight = (6 + direction.length() * 0.11) * strand.curveAmount;
    const control1 = source.position
      .clone()
      .lerp(target.position, 0.33)
      .add(liftA.clone().multiplyScalar(curveHeight * 0.95))
      .add(side.clone().multiplyScalar(strand.laneOffset * 0.66));
    const control2 = source.position
      .clone()
      .lerp(target.position, 0.67)
      .add(liftB.clone().multiplyScalar(curveHeight * 0.82))
      .add(side.clone().multiplyScalar(-strand.laneOffset * 0.42));
    const fiberAxis = liftA.clone().lerp(liftB, t).normalize();
    const wiggle =
      Math.sin(t * Math.PI * 2 + time * 0.52 + strand.twistPhase) *
      strand.wiggleAmplitude *
      envelope;
    const chromaWiggle =
      Math.cos(t * Math.PI * 3 + time * 0.44 + strand.jitterPhase) *
      strand.wiggleAmplitude *
      0.34 *
      envelope;
    pulse.mesh.position
      .copy(source.position)
      .multiplyScalar(oneMinus * oneMinus * oneMinus)
      .add(control1.clone().multiplyScalar(3 * oneMinus * oneMinus * t))
      .add(control2.clone().multiplyScalar(3 * oneMinus * t * t))
      .add(target.position.clone().multiplyScalar(t * t * t))
      .add(side.clone().multiplyScalar(wiggle))
      .add(fiberAxis.multiplyScalar(chromaWiggle));
  });
}

function stepSimulation(delta, elapsedTime) {
  if (!state.pages.length) {
    return;
  }
  state.pages.forEach((page, index) => {
    const isTracked = page.id === state.selectedPageId;
    const drift = new THREE.Vector3(
      Math.sin(elapsedTime * 0.48 + page.wobblePhase + index * 0.07) * 1.35,
      Math.cos(elapsedTime * 0.35 + page.wobblePhase * 0.8) * 0.95,
      Math.sin(elapsedTime * 0.28 + page.wobblePhase * 1.4) * 1.1,
    );
    const target = isTracked ? page.home.clone() : page.home.clone().add(drift);
    const lerpStrength = state.motionEnabled ? clamp(delta * 2.4, 0.02, 0.12) : 0.2;
    page.position.lerp(target, lerpStrength);
  });
}

function animate() {
  const delta = clock.getDelta();
  const elapsedTime = clock.getElapsedTime();

  dust.rotation.y += delta * 0.01;
  dust.rotation.x += delta * 0.005;

  updateNavigationFeel();
  stepSimulation(delta, elapsedTime);

  if (state.cameraGoal && state.targetGoal) {
    camera.position.lerp(state.cameraGoal, 0.08);
    controls.target.lerp(state.targetGoal, 0.08);

    if (
      camera.position.distanceTo(state.cameraGoal) < 0.06 &&
      controls.target.distanceTo(state.targetGoal) < 0.06
    ) {
      state.cameraGoal = null;
      state.targetGoal = null;
    }
  }

  controls.update();
  updateNodeVisuals(elapsedTime);
  camera.updateMatrixWorld();
  updateEdgeVisuals(elapsedTime);
  updateTags();
  renderer.render(scene, camera);
  window.requestAnimationFrame(animate);
}

async function loadWikipediaGraph() {
  const requestId = ++state.graphRequestId;
  const titles = clusterSpecs.flatMap((cluster) =>
    cluster.titles.map((title) => ({ title, clusterId: cluster.id })),
  );
  let completed = 0;

  setGraphStatus(`Loading seed Wikipedia pages… ${completed}/${titles.length}`);

  const results = await mapWithConcurrency(titles, 5, async ({ title, clusterId }) => {
    try {
      return await fetchPageRecord(title, clusterId);
    } catch (error) {
      return { error, title, clusterId };
    } finally {
      completed += 1;
      setGraphStatus(`Loading seed Wikipedia pages… ${completed}/${titles.length}`);
    }
  });

  const successful = results.filter((record) => !record.error);
  const failed = results.filter((record) => record.error);
  if (requestId !== state.graphRequestId) {
    return;
  }

  if (!successful.length) {
    state.loading = false;
    articleTitle.textContent = "Wikipedia loading failed";
    articleSummary.textContent =
      "The app could not retrieve live data from English Wikipedia in this browser session.";
    setGraphStatus("Wikipedia requests failed. Reload to retry.", "error");
    return;
  }

  const expansionTargets = collectDefaultExpansionTargets(successful);
  let expansionCompleted = 0;
  setGraphStatus(
    `Expanding graph from live links… ${expansionCompleted}/${expansionTargets.length}`,
  );

  const expansionResults = await mapWithConcurrency(
    expansionTargets,
    4,
    async ({ title, clusterId }) => {
      try {
        return await fetchPageRecord(title, clusterId);
      } catch (error) {
        return { error, title, clusterId };
      } finally {
        expansionCompleted += 1;
        setGraphStatus(
          `Expanding graph from live links… ${expansionCompleted}/${expansionTargets.length}`,
        );
      }
    },
  );

  const expansionSuccess = expansionResults.filter((record) => !record.error);
  if (requestId !== state.graphRequestId) {
    return;
  }
  const mergedRecords = [...successful];
  const knownTitles = new Set(successful.map((record) => record.title));

  expansionSuccess.forEach((record) => {
    if (!knownTitles.has(record.title)) {
      mergedRecords.push(record);
      knownTitles.add(record.title);
    }
  });

  state.graphMode = "default";
  state.activeSeedTitle = "Connectome";
  buildGraph(mergedRecords, {
    mode: "default",
    seedTitle: "Connectome",
  });

  if (failed.length) {
    setGraphStatus(
      `Loaded ${mergedRecords.length} pages with ${failed.length} failed seed requests.`,
      "warning",
    );
  } else {
    setGraphStatus(
      `Loaded ${mergedRecords.length} Wikipedia pages and ${state.edges.length} live cross-links.`,
    );
  }
}

function bindEvents() {
  tabWiki.addEventListener("click", () => {
    setNoteTab("wiki");
  });

  tabInspector.addEventListener("click", () => {
    setNoteTab("inspector");
  });

  searchInput.addEventListener("input", (event) => {
    state.searchText = event.target.value;
    renderNoteTree();
    updateDiagnostics(getSelectedPage());
    scheduleSearchSuggestions(event.target.value);
  });

  searchInput.addEventListener("keydown", async (event) => {
    if (event.key === "Escape") {
      clearSearchSuggestions();
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    const query = searchInput.value.trim();
    const preferredTitle = state.searchSuggestions[0]?.title || "";

    if (!query) {
      return;
    }

    await loadTopicGraphFromQuery(query, preferredTitle);
  });

  searchSuggestions.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-search-title]");
    if (!button) {
      return;
    }

    await loadTopicGraphFromQuery(button.dataset.searchTitle, button.dataset.searchTitle);
  });

  regionFilter.addEventListener("change", (event) => {
    state.filterCluster = event.target.value;
    renderNoteTree();
    updateDiagnostics(getSelectedPage());

    if (state.filterCluster === "all") {
      return;
    }

    const clusterPage = state.pages.find(
      (page) => page.clusterName === state.filterCluster,
    );
    if (clusterPage) {
      focusPage(clusterPage.id);
    }
  });

  randomFocusButton.addEventListener("click", () => {
    const visiblePages = getVisiblePages();
    const pool = visiblePages.length ? visiblePages : state.pages;
    if (!pool.length) {
      return;
    }
    const randomPage = pool[Math.floor(Math.random() * pool.length)];
    focusPage(randomPage.id);
  });

  resetViewButton.addEventListener("click", () => {
    searchInput.value = "";
    regionFilter.value = "all";
    state.searchText = "";
    state.filterCluster = "all";
    clearSearchSuggestions();
    renderNoteTree();
    updateDiagnostics(getSelectedPage());
    if (state.connectedness[0]) {
      focusPage(state.connectedness[0].id);
    } else {
      resetCameraGoals();
    }
  });

  noteTree.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page-id]");
    if (!button) {
      return;
    }
    focusPage(button.dataset.pageId);
  });

  neighborList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page-id]");
    if (!button) {
      return;
    }
    focusPage(button.dataset.pageId);
  });

  diagnosticsLinkList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page-id]");
    if (!button) {
      return;
    }
    focusPage(button.dataset.pageId);
  });

  renderer.domElement.addEventListener("pointermove", handleStagePointerMove);
  renderer.domElement.addEventListener("pointerdown", handleStagePointerDown);
  renderer.domElement.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });
  renderer.domElement.addEventListener("pointerleave", () => {
    state.hoveredPageId = null;
    stage.style.cursor = "default";
  });

  window.addEventListener("pointermove", handleWindowPointerMove);
  window.addEventListener("pointerup", handlePointerUp);

  zoomInButton.addEventListener("click", () => {
    const direction = camera.position.clone().sub(controls.target).multiplyScalar(0.86);
    state.cameraGoal = controls.target.clone().add(direction);
    state.targetGoal = controls.target.clone();
  });

  zoomOutButton.addEventListener("click", () => {
    const direction = camera.position.clone().sub(controls.target).multiplyScalar(1.18);
    state.cameraGoal = controls.target.clone().add(direction);
    state.targetGoal = controls.target.clone();
  });

  resetCameraButton.addEventListener("click", resetCameraGoals);

  focusSelectedButton.addEventListener("click", () => {
    focusOnPage(getSelectedPage());
  });

  toggleMotionButton.addEventListener("click", () => {
    state.motionEnabled = !state.motionEnabled;
    toggleMotionButton.classList.toggle("active", !state.motionEnabled);
    toggleMotionButton.textContent = state.motionEnabled ? "❚❚" : "▶";
  });

  controls.addEventListener("change", () => {
    if (state.selectedPageId && !state.dragTag) {
      state.trackedCameraOffset.copy(camera.position).sub(controls.target);
    }

    updateDiagnostics(getSelectedPage());
  });

  window.addEventListener("resize", resizeRenderer);
}

async function init() {
  setClusters(clusterSpecs);
  populateFilters();
  populateLegend();
  setNoteTab(state.activeNoteTab);
  bindEvents();
  resizeRenderer();
  resetCameraGoals();
  animate();
  await loadWikipediaGraph();
}

init().catch((error) => {
  console.error(error);
  setGraphStatus(`Boot error: ${error.message}`, "error");
  articleTitle.textContent = "Boot error";
  articleSummary.textContent = error.stack || String(error);
});
