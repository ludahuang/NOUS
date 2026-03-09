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
const MAX_VAULT_CLUSTERS = 8;
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
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
})();

const stage = document.getElementById("graph-viewport");
const labelLayer = document.getElementById("label-layer");
const searchInput = document.getElementById("search-input");
const searchSuggestions = document.getElementById("search-suggestions");
const regionFilter = document.getElementById("region-filter");
const randomFocusButton = document.getElementById("random-focus");
const resetViewButton = document.getElementById("reset-view");
const wikipediaMenuButton = document.getElementById("menu-wikipedia");
const obsidianMenuButton = document.getElementById("menu-obsidian");
const wikipediaSourceCard = document.getElementById("source-card-wikipedia");
const obsidianSourceCard = document.getElementById("source-card-obsidian");
const wikipediaMenuPanel = document.getElementById("menu-panel-wikipedia");
const obsidianMenuPanel = document.getElementById("menu-panel-obsidian");
const importVaultButton = document.getElementById("import-vault");
const newNoteButton = document.getElementById("new-note");
const sourceMeta = document.getElementById("source-meta");
const searchModeMeta = document.getElementById("search-mode-meta");
const vaultInput = document.getElementById("vault-input");
const noteTree = document.getElementById("note-tree");
const vaultCount = document.getElementById("vault-count");
const graphStatus = document.getElementById("graph-status");
const legend = document.getElementById("legend");

const articleKicker = document.getElementById("article-kicker");
const articleTitle = document.getElementById("article-title");
const articleSummary = document.getElementById("article-summary");
const articleBody = document.getElementById("article-body");
const sourceLink = document.getElementById("source-link");
const editNoteButton = document.getElementById("edit-note");
const editorPanel = document.getElementById("editor-panel");
const editorTitleInput = document.getElementById("editor-title");
const editorFolderInput = document.getElementById("editor-folder");
const editorBodyInput = document.getElementById("editor-body-input");
const saveNoteButton = document.getElementById("save-note");
const discardNoteButton = document.getElementById("discard-note");
const cancelEditorButton = document.getElementById("cancel-editor");
const tabWiki = document.getElementById("tab-wiki");
const tabInspector = document.getElementById("tab-inspector");
const tabAgent = document.getElementById("tab-agent");
const notePanelWiki = document.getElementById("note-panel-wiki");
const notePanelInspector = document.getElementById("note-panel-inspector");
const notePanelAgent = document.getElementById("note-panel-agent");
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
const agentTitle = document.getElementById("agent-title");
const agentSummary = document.getElementById("agent-summary");
const agentDigest = document.getElementById("agent-digest");
const agentStructureList = document.getElementById("agent-structure-list");
const agentDraftList = document.getElementById("agent-draft-list");
const agentActionSummary = document.getElementById("agent-action-summary");
const agentActionStructure = document.getElementById("agent-action-structure");
const agentActionDrafts = document.getElementById("agent-action-drafts");
const agentChatLog = document.getElementById("agent-chat-log");
const agentChatForm = document.getElementById("agent-chat-form");
const agentChatInput = document.getElementById("agent-chat-input");

const statPages = document.getElementById("stat-neurons");
const statLinks = document.getElementById("stat-synapses");
const statFolders = document.getElementById("stat-regions");
const downloadVaultButton = document.getElementById("download-vault");

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
  activeSidebarTab: "wikipedia",
  wikipediaRecords: [],
  obsidianRecords: [],
  filterCluster: "all",
  searchSuggestions: [],
  pendingSearchQuery: "",
  searchDebounceId: null,
  searchRequestId: 0,
  graphRequestId: 0,
  activeSeedTitle: "",
  activeSeedPageId: "",
  activeVaultName: "",
  pendingNewTitle: "",
  activeNoteTab: "wiki",
  agentMessages: [],
  agentDraftSuggestions: [],
  graphMode: "default",
  motionEnabled: true,
  loading: true,
  editorOpen: false,
  editingNoteId: "",
  localNoteSequence: 0,
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

function normalizeWhitespace(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function toArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function excerptText(value, maxLength = 280) {
  const normalized = normalizeWhitespace(value);
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function normalizeLinkKey(value) {
  return normalizeWhitespace(
    String(value || "")
      .replace(/\\/g, "/")
      .replace(/#.*$/, "")
      .replace(/\.(md|markdown)$/i, "")
      .replace(/^\/+|\/+$/g, "")
      .replace(/[_-]+/g, " "),
  ).toLowerCase();
}

function parseFrontmatterScalar(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
  }

  return trimmed.replace(/^['"]|['"]$/g, "");
}

function parseFrontmatterBlock(block) {
  const data = {};
  let activeKey = "";

  block.split(/\r?\n/).forEach((line) => {
    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && activeKey) {
      if (!Array.isArray(data[activeKey])) {
        data[activeKey] = [];
      }
      data[activeKey].push(listMatch[1].trim().replace(/^['"]|['"]$/g, ""));
      return;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      activeKey = "";
      return;
    }

    const [, key, rawValue] = match;
    activeKey = key;
    data[key] = rawValue.trim() ? parseFrontmatterScalar(rawValue) : [];
  });

  return data;
}

function splitFrontmatter(markdown) {
  const normalized = String(markdown || "").replace(/\r\n/g, "\n");
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!match) {
    return { frontmatter: {}, body: normalized };
  }

  return {
    frontmatter: parseFrontmatterBlock(match[1]),
    body: normalized.slice(match[0].length),
  };
}

function stripMarkdown(markdown) {
  return normalizeWhitespace(
    String(markdown || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
      .replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|([^\]]+))?\]\]/g, (_, target, alias) => alias || target)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^>\s?/gm, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^[-*+]\s+/gm, "")
      .replace(/^\d+\.\s+/gm, "")
      .replace(/\|/g, " ")
      .replace(/\n+/g, " "),
  );
}

function extractBodyBlocks(markdown, limit = 4) {
  return String(markdown || "")
    .split(/\n{2,}/)
    .map((block) => stripMarkdown(block))
    .filter(Boolean)
    .slice(0, limit);
}

function extractHashTags(markdown) {
  const tags = [];
  const matches = String(markdown || "").matchAll(/(^|\s)#([A-Za-z0-9/_-]+)/g);

  for (const match of matches) {
    tags.push(match[2].replace(/\//g, ":"));
  }

  return uniqueValues(tags);
}

function extractWikiLinks(markdown) {
  const links = [];
  const matches = String(markdown || "").matchAll(/\[\[([^\]]+)\]\]/g);

  for (const match of matches) {
    const normalized = normalizeWhitespace(
      match[1]
        .split("|")[0]
        .split("#")[0]
        .replace(/\.(md|markdown)$/i, ""),
    );
    if (normalized) {
      links.push(normalized);
    }
  }

  return links;
}

function extractMarkdownNoteLinks(markdown) {
  const links = [];
  const matches = String(markdown || "").matchAll(/\[[^\]]*]\(([^)]+)\)/g);

  for (const match of matches) {
    const rawTarget = decodeURIComponent(match[1].trim().split("#")[0] || "");
    if (!/\.(md|markdown)$/i.test(rawTarget)) {
      continue;
    }

    const normalized = normalizeWhitespace(
      rawTarget
        .replace(/\\/g, "/")
        .split("/")
        .pop()
        .replace(/\.(md|markdown)$/i, "")
        .replace(/[_-]+/g, " "),
    );

    if (normalized) {
      links.push(normalized);
    }
  }

  return links;
}

function getVaultRootName(files) {
  const rootedPaths = files
    .map((file) => file.webkitRelativePath || "")
    .filter((value) => value.includes("/"));

  if (!rootedPaths.length) {
    return "";
  }

  const root = rootedPaths[0].split("/")[0];
  return rootedPaths.every((value) => value.startsWith(`${root}/`)) ? root : "";
}

function parseObsidianDraft(file, markdown, index, vaultRootName) {
  const rawPath = file.webkitRelativePath || file.name;
  const relativePath = vaultRootName && rawPath.startsWith(`${vaultRootName}/`)
    ? rawPath.slice(vaultRootName.length + 1)
    : rawPath;
  const pathParts = relativePath.split("/").filter(Boolean);
  const fileName = pathParts[pathParts.length - 1] || file.name;
  const baseName = fileName.replace(/\.(md|markdown)$/i, "");
  const folderPath = pathParts.slice(0, -1).join("/");
  const folderName = pathParts.length > 1 ? pathParts[0] : "Root Notes";
  const { frontmatter, body } = splitFrontmatter(markdown);
  const firstHeading = body.match(/^#\s+(.+)$/m)?.[1] || "";
  const title = normalizeWhitespace(
    frontmatter.title || firstHeading || baseName.replace(/[_-]+/g, " "),
  );
  const aliases = uniqueValues(
    toArray(frontmatter.aliases || frontmatter.alias).map((alias) => normalizeWhitespace(alias)),
  );
  const plainText = stripMarkdown(body);
  const tags = uniqueValues(
    [
      ...toArray(frontmatter.tags).map((tag) => normalizeWhitespace(String(tag).replace(/^#/, ""))),
      ...extractHashTags(body),
    ].map((tag) => normalizeWhitespace(String(tag).replace(/^#/, ""))),
  );
  const previewBlocks = extractBodyBlocks(body, 4);
  const extract =
    excerptText(frontmatter.description || plainText, 320) ||
    `${title} imported from Obsidian markdown.`;

  return {
    id: `note-import-${slugify(relativePath) || slugify(title) || `untitled-${index + 1}`}`,
    title: title || `Untitled ${index + 1}`,
    aliases,
    description: frontmatter.description || "Obsidian note",
    extract,
    markdown: body.trim(),
    previewBlocks,
    rawLinks: uniqueValues([
      ...extractWikiLinks(body),
      ...extractMarkdownNoteLinks(body),
    ]),
    linkIds: [],
    links: [],
    url: "",
    sourceType: "obsidian",
    sourceLabel: "Obsidian Markdown",
    relativePath,
    folderPath,
    folderName,
    tags,
  };
}

function getObsidianDuplicateKey(record) {
  const normalizedPath = normalizeLinkKey(record.relativePath || "");
  if (normalizedPath) {
    return normalizedPath;
  }

  return normalizeLinkKey(`${record.folderName || "Scratchpad"}/${record.title || ""}`);
}

function findObsidianDuplicate(record, ignoreId = "") {
  const duplicateKey = getObsidianDuplicateKey(record);
  if (!duplicateKey) {
    return null;
  }

  return state.obsidianRecords.find(
    (entry) =>
      entry.id !== ignoreId &&
      getObsidianDuplicateKey(entry) === duplicateKey,
  ) || null;
}

function prepareWikipediaRecords(records) {
  const normalizedRecords = records.map((record) => ({
    ...record,
    id: record.id || `page-${slugify(record.title)}`,
    sourceType: "wikipedia",
    sourceLabel:
      record.sourceLabel ||
      ((record.sourceAnnotations || []).length
        ? "English Wikipedia + Obsidian Import"
        : "English Wikipedia"),
    aliases: record.aliases || [],
    tags: record.tags || [],
    sourceAnnotations: (record.sourceAnnotations || []).map((annotation) => ({
      ...annotation,
      previewBlocks: [...(annotation.previewBlocks || [])],
      tags: [...(annotation.tags || [])],
    })),
    mergedSources: uniqueValues(
      record.mergedSources || [
        "English Wikipedia",
        ...(record.sourceAnnotations || []).map(
          (annotation) => annotation.sourceLabel || "Obsidian Import",
        ),
      ],
    ),
  }));
  const titleToId = new Map(normalizedRecords.map((record) => [record.title, record.id]));

  return normalizedRecords.map((record) => ({
    ...record,
    linkIds: uniqueValues(
      (record.links || [])
        .map((linkedTitle) => titleToId.get(linkedTitle))
        .filter(Boolean),
      ),
  }));
}

function mergeWikipediaRecordSets(existingRecords, incomingRecords) {
  const mergedByTitle = new Map(
    existingRecords.map((record) => [normalizeSearchTitle(record.title), { ...record }]),
  );

  incomingRecords.forEach((record) => {
    const key = normalizeSearchTitle(record.title);
    const existing = mergedByTitle.get(key);

    if (!existing) {
      mergedByTitle.set(key, { ...record });
      return;
    }

    mergedByTitle.set(key, {
      ...existing,
      ...record,
      id: existing.id || record.id,
      sourceType: "wikipedia",
      sourceLabel:
        existing.sourceLabel ||
        record.sourceLabel ||
        ((existing.sourceAnnotations || record.sourceAnnotations || []).length
          ? "English Wikipedia + Obsidian Import"
          : "English Wikipedia"),
      aliases: uniqueValues([...(existing.aliases || []), ...(record.aliases || [])]),
      tags: uniqueValues([...(existing.tags || []), ...(record.tags || [])]),
      links: uniqueValues([...(existing.links || []), ...(record.links || [])]),
      sourceAnnotations: [
        ...(existing.sourceAnnotations || []),
        ...(record.sourceAnnotations || []),
      ],
      mergedSources: uniqueValues([
        ...(existing.mergedSources || []),
        ...(record.mergedSources || []),
      ]),
    });
  });

  return prepareWikipediaRecords([...mergedByTitle.values()]);
}

function findWikipediaRecordByTitle(title) {
  const normalizedTitle = normalizeSearchTitle(title);

  return state.wikipediaRecords.find(
    (record) => normalizeSearchTitle(record.title) === normalizedTitle,
  ) || null;
}

function buildImportSourceAnnotation(record) {
  return {
    title: record.title,
    sourceType: "obsidian",
    sourceLabel: "Obsidian Import",
    relativePath: record.relativePath,
    folderName: record.folderName,
    markdown: record.markdown,
    previewBlocks: [...(record.previewBlocks || [])],
    tags: [...(record.tags || [])],
  };
}

function mergeImportedRecordIntoWikipediaRecord(targetRecord, importRecord) {
  const annotation = buildImportSourceAnnotation(importRecord);
  const annotationKey = normalizeLinkKey(annotation.relativePath || annotation.title);
  const existingAnnotations = new Map(
    (targetRecord.sourceAnnotations || []).map((entry) => [
      normalizeLinkKey(entry.relativePath || entry.title),
      {
        ...entry,
        previewBlocks: [...(entry.previewBlocks || [])],
        tags: [...(entry.tags || [])],
      },
    ]),
  );

  existingAnnotations.set(annotationKey, annotation);

  return {
    ...targetRecord,
    sourceLabel: "English Wikipedia + Obsidian Import",
    mergedSources: uniqueValues([
      ...(targetRecord.mergedSources || []),
      "English Wikipedia",
      annotation.sourceLabel,
    ]),
    sourceAnnotations: [...existingAnnotations.values()],
    aliases: uniqueValues([...(targetRecord.aliases || []), ...(importRecord.aliases || [])]),
    tags: uniqueValues([...(targetRecord.tags || []), ...(importRecord.tags || [])]),
    links: uniqueValues([
      ...(targetRecord.links || []),
      ...(importRecord.links || []),
      ...(importRecord.rawLinks || []),
    ]),
  };
}

function resolveObsidianLinks(drafts, externalTargets = []) {
  const lookup = new Map();
  const draftById = new Map(drafts.map((draft) => [draft.id, draft]));
  externalTargets.forEach((target) => {
    draftById.set(target.id, target);
  });

  function registerLookup(key, id) {
    const normalized = normalizeLinkKey(key);
    if (!normalized) {
      return;
    }

    if (!lookup.has(normalized)) {
      lookup.set(normalized, new Set());
    }
    lookup.get(normalized).add(id);
  }

  drafts.forEach((draft) => {
    registerLookup(draft.title, draft.id);
    registerLookup(draft.relativePath, draft.id);
    registerLookup(draft.relativePath.replace(/\.(md|markdown)$/i, ""), draft.id);
    registerLookup(draft.relativePath.split("/").pop(), draft.id);
    draft.aliases.forEach((alias) => registerLookup(alias, draft.id));
  });

  externalTargets.forEach((target) => {
    registerLookup(target.title, target.id);
    (target.aliases || []).forEach((alias) => registerLookup(alias, target.id));
  });

  drafts.forEach((draft) => {
    const resolvedIds = [];
    const resolvedTitles = [];

    draft.rawLinks.forEach((rawLink) => {
      const candidateKeys = uniqueValues([
        rawLink,
        rawLink.split("/").pop() || rawLink,
      ]).map((value) => normalizeLinkKey(value));

      let resolvedId = "";
      for (const candidateKey of candidateKeys) {
        const candidates = [...(lookup.get(candidateKey) || [])].filter((id) => id !== draft.id);
        if (candidates.length) {
          resolvedId = candidates[0];
          break;
        }
      }

      if (!resolvedId || resolvedIds.includes(resolvedId)) {
        return;
      }

      resolvedIds.push(resolvedId);
      resolvedTitles.push(draftById.get(resolvedId)?.title || rawLink);
    });

    draft.linkIds = resolvedIds;
    draft.links = resolvedTitles;
  });

  return drafts;
}

function buildVaultClusterContext(records, options = {}) {
  const idPrefix = options.idPrefix || "vault";
  const radiusBase = options.hasWikiShell ? 56 : 24;
  const folderCounts = new Map();

  records.forEach((record) => {
    const folderName = record.folderName || "Root Notes";
    folderCounts.set(folderName, (folderCounts.get(folderName) || 0) + 1);
  });

  const orderedFolders = [...folderCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  const visibleFolders = orderedFolders.slice(0, MAX_VAULT_CLUSTERS);
  const visibleNames = new Set(visibleFolders.map(([folderName]) => folderName));
  const needsOverflow = orderedFolders.length > visibleFolders.length;
  const folderNames = visibleFolders.map(([folderName]) => folderName);

  if (needsOverflow) {
    folderNames.push("Other Notes");
  }

  const ringCount = Math.max(folderNames.length, 1);
  const clusters = folderNames.map((folderName, index) => {
    const angle = (index / ringCount) * Math.PI * 2;
    const radius = radiusBase + ringCount * 4.2;
    return {
      id: `cluster-${idPrefix}-${slugify(folderName)}`,
      name: folderName,
      theme:
        folderName === "Other Notes"
          ? "Overflow notes grouped from smaller folders."
          : `Imported notes from ${folderName}.`,
      center: [
        Math.cos(angle) * radius,
        Math.sin(angle * 1.4) * 10 + (index % 2 === 0 ? 4 : -4),
        Math.sin(angle) * radius * 0.74,
      ],
      spread: [11, 9, 9],
      accent: DYNAMIC_CLUSTER_COLORS[index % DYNAMIC_CLUSTER_COLORS.length],
    };
  });

  const assignments = new Map();
  records.forEach((record) => {
    const folderName = visibleNames.has(record.folderName) ? record.folderName : "Other Notes";
    assignments.set(record.id, `cluster-${idPrefix}-${slugify(folderName)}`);
  });

  return { clusters, assignments };
}

function buildHybridClusterContext(pages, neighborMap, options = {}) {
  const wikipediaPages = pages.filter((page) => page.sourceType === "wikipedia");
  const obsidianPages = pages.filter((page) => page.sourceType === "obsidian");

  if (!wikipediaPages.length) {
    return buildVaultClusterContext(obsidianPages, { idPrefix: "vault" });
  }

  const wikipediaContext =
    options.mode === "topic"
      ? buildDynamicClusterContext(
        wikipediaPages,
        neighborMap,
        options.seedTitle || wikipediaPages[0]?.title || "",
      )
      : buildStaticClusterContext(wikipediaPages);

  if (!obsidianPages.length) {
    return wikipediaContext;
  }

  const vaultContext = buildVaultClusterContext(obsidianPages, {
    idPrefix: "vault",
    hasWikiShell: true,
  });

  return {
    clusters: [...wikipediaContext.clusters, ...vaultContext.clusters],
    assignments: new Map([
      ...wikipediaContext.assignments.entries(),
      ...vaultContext.assignments.entries(),
    ]),
  };
}

function syncObsidianLinks() {
  state.obsidianRecords = resolveObsidianLinks(
    state.obsidianRecords.map((record) => ({ ...record })),
    state.wikipediaRecords,
  );
}

function rebuildActiveGraph(preferredPageId = "") {
  syncObsidianLinks();
  const combinedRecords = [...state.wikipediaRecords, ...state.obsidianRecords];

  if (!combinedRecords.length) {
    return;
  }

  buildGraph(combinedRecords, {
    mode: state.graphMode,
    seedTitle: state.activeSeedTitle || combinedRecords[0]?.title || "",
    seedPageId: preferredPageId || state.selectedPageId || state.activeSeedPageId || "",
    includeLocalLayer: state.obsidianRecords.length > 0,
  });
}

function buildLocalNoteRecord({ id = "", title = "", folderName = "Scratchpad", markdown = "" }) {
  const normalizedTitle = normalizeWhitespace(title) || "Untitled note";
  const normalizedFolder = normalizeWhitespace(folderName) || "Scratchpad";
  const { frontmatter, body } = splitFrontmatter(markdown);
  const effectiveMarkdown = body.trim() || `# ${normalizedTitle}\n`;
  const derivedTitle = normalizeWhitespace(
    frontmatter.title ||
    effectiveMarkdown.match(/^#\s+(.+)$/m)?.[1] ||
    normalizedTitle,
  );
  const plainText = stripMarkdown(effectiveMarkdown);
  const previewBlocks = extractBodyBlocks(effectiveMarkdown, 4);
  const tags = uniqueValues(
    [
      ...toArray(frontmatter.tags).map((tag) => normalizeWhitespace(String(tag).replace(/^#/, ""))),
      ...extractHashTags(effectiveMarkdown),
    ].map((tag) => normalizeWhitespace(String(tag).replace(/^#/, ""))),
  );

  if (!id) {
    state.localNoteSequence += 1;
  }

  return {
    id: id || `note-local-${state.localNoteSequence}`,
    title: derivedTitle || `Untitled ${state.localNoteSequence}`,
    aliases: uniqueValues(
      toArray(frontmatter.aliases || frontmatter.alias).map((alias) => normalizeWhitespace(alias)),
    ),
    description: frontmatter.description || "Local vault note",
    extract: excerptText(frontmatter.description || plainText, 320) || "Local vault note",
    markdown: effectiveMarkdown,
    previewBlocks,
    rawLinks: uniqueValues([
      ...extractWikiLinks(effectiveMarkdown),
      ...extractMarkdownNoteLinks(effectiveMarkdown),
    ]),
    linkIds: [],
    links: [],
    url: "",
    sourceType: "obsidian",
    sourceLabel: "Obsidian Canvas",
    relativePath: `${normalizedFolder}/${slugify(derivedTitle || normalizedTitle) || "untitled"}.md`,
    folderPath: normalizedFolder,
    folderName: normalizedFolder,
    tags,
  };
}

function setSidebarTab(tab) {
  const nextTab = tab === "obsidian" ? "obsidian" : "wikipedia";
  const isWikipedia = nextTab === "wikipedia";

  state.activeSidebarTab = nextTab;
  wikipediaSourceCard.classList.toggle("active", isWikipedia);
  obsidianSourceCard.classList.toggle("active", !isWikipedia);
  wikipediaMenuButton.classList.toggle("active", isWikipedia);
  wikipediaMenuButton.setAttribute("aria-expanded", isWikipedia ? "true" : "false");
  obsidianMenuButton.classList.toggle("active", !isWikipedia);
  obsidianMenuButton.setAttribute("aria-expanded", isWikipedia ? "false" : "true");
  wikipediaMenuPanel.hidden = false;
  obsidianMenuPanel.hidden = false;
  wikipediaMenuPanel.setAttribute("aria-hidden", isWikipedia ? "false" : "true");
  obsidianMenuPanel.setAttribute("aria-hidden", isWikipedia ? "true" : "false");
  wikipediaMenuPanel.inert = !isWikipedia;
  obsidianMenuPanel.inert = isWikipedia;
  searchInput.placeholder = "Search page title or topic";
  searchModeMeta.textContent =
    "Press Enter to clear the current canvas and build a new neural network from the most relevant Wikipedia entry. If none fits, use Obsidian > New from a blank canvas.";
  sourceMeta.textContent =
    state.obsidianRecords.length > 0
      ? `Imported and local notes are layered into the current neural network. ${state.obsidianRecords.length} local note${state.obsidianRecords.length === 1 ? "" : "s"} active.`
      : "Import adds markdown notes into the current neural network. New opens a clean canvas for local note drafting.";
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

function normalizeSearchTitle(value) {
  return normalizeWhitespace(
    String(value || "")
      .toLowerCase()
      .replace(/\s*\(.+?\)\s*/g, " ")
      .replace(/[^a-z0-9 ]+/g, " ")
      .replace(/\s+/g, " "),
  );
}

function getTitleInitialism(title) {
  return (String(title || "").match(/[a-z0-9]+/gi) || [])
    .map((word) => word[0]?.toLowerCase() || "")
    .join("");
}

function scoreWikipediaSearchResult(query, result, index = 0) {
  const normalizedQuery = normalizeSearchTitle(query);
  const normalizedTitle = normalizeSearchTitle(result.title);
  const compactQuery = normalizedQuery.replace(/\s+/g, "");
  const queryTokens = tokenizeText(query);
  const titleTokens = tokenizeText(result.title);
  const snippetTokens = tokenizeText(result.snippet || "");
  const titleOverlap = countTokenOverlap(queryTokens, titleTokens);
  const snippetOverlap = countTokenOverlap(queryTokens, snippetTokens);
  const exactMatch = normalizedQuery && normalizedTitle === normalizedQuery;
  const prefixMatch =
    normalizedQuery &&
    normalizedTitle &&
    (normalizedTitle.startsWith(`${normalizedQuery} `) ||
      normalizedQuery.startsWith(`${normalizedTitle} `));
  const containedMatch =
    normalizedQuery &&
    normalizedTitle &&
    (normalizedTitle.includes(normalizedQuery) || normalizedQuery.includes(normalizedTitle));
  const initialismMatch =
    compactQuery.length >= 2 && getTitleInitialism(result.title) === compactQuery;
  const tokenCoverage = queryTokens.size ? titleOverlap / queryTokens.size : 0;

  let score = titleOverlap * 3.1 + snippetOverlap * 0.9 - index * 0.35;

  if (exactMatch) {
    score += 12;
  }

  if (initialismMatch) {
    score += 8;
  }

  if (prefixMatch) {
    score += 6;
  } else if (containedMatch) {
    score += 4;
  }

  if (queryTokens.size && tokenCoverage >= 0.9) {
    score += 2.5;
  } else if (queryTokens.size && tokenCoverage >= 0.5) {
    score += 1.2;
  }

  return {
    score,
    titleOverlap,
    snippetOverlap,
    queryTokenCount: queryTokens.size,
    exactMatch,
    prefixMatch,
    containedMatch,
    initialismMatch,
  };
}

function selectRelevantWikipediaSearchResult(query, results, preferredTitle = "") {
  const trimmedPreferred = preferredTitle.trim();

  if (trimmedPreferred) {
    const normalizedPreferred = normalizeSearchTitle(trimmedPreferred);
    return (
      results.find((result) => normalizeSearchTitle(result.title) === normalizedPreferred) || {
        title: trimmedPreferred,
        snippet: "",
      }
    );
  }

  if (!results.length) {
    return null;
  }

  const rankedResults = results
    .map((result, index) => ({
      result,
      ...scoreWikipediaSearchResult(query, result, index),
    }))
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.result.title.localeCompare(right.result.title),
    );
  const bestMatch = rankedResults[0];

  if (!bestMatch) {
    return null;
  }

  const hasSemanticMatch =
    bestMatch.exactMatch ||
    bestMatch.prefixMatch ||
    bestMatch.containedMatch ||
    bestMatch.initialismMatch ||
    bestMatch.titleOverlap >= 1 ||
    bestMatch.snippetOverlap >= 1.5;
  const minimumScore = bestMatch.queryTokenCount <= 1 ? 4.5 : 4;

  return hasSemanticMatch && bestMatch.score >= minimumScore ? bestMatch.result : null;
}

function getEdgeWeight(neighborMap, leftId, rightId) {
  return neighborMap.get(leftId)?.get(rightId) || 0;
}

function formatNumber(value) {
  return Math.round(value).toLocaleString();
}

function sanitizePathSegment(value, fallback = "Untitled") {
  const cleaned = normalizeWhitespace(
    String(value || "")
      .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
      .replace(/^\.+|\.+$/g, "")
      .replace(/\s+/g, " "),
  );

  return cleaned || fallback;
}

function ensureMarkdownFileName(value, fallback = "Untitled") {
  const baseName = sanitizePathSegment(
    String(value || "").replace(/\.(md|markdown)$/i, ""),
    fallback,
  );

  return `${baseName}.md`;
}

function getDosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const dosDate =
    ((year - 1980) << 9) |
    ((date.getMonth() + 1) << 5) |
    date.getDate();
  const dosTime =
    (date.getHours() << 11) |
    (date.getMinutes() << 5) |
    Math.floor(date.getSeconds() / 2);

  return {
    date: dosDate,
    time: dosTime,
  };
}

function computeCrc32(bytes) {
  let crc = 0xffffffff;

  for (let index = 0; index < bytes.length; index += 1) {
    crc = CRC32_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function buildStoredZipArchive(files) {
  const encoder = new TextEncoder();
  const localChunks = [];
  const centralChunks = [];
  const stamp = getDosDateTime();
  let localOffset = 0;
  let centralSize = 0;

  files.forEach((file) => {
    const pathBytes = encoder.encode(file.path.replace(/\\/g, "/"));
    const contentBytes =
      file.content instanceof Uint8Array
        ? file.content
        : encoder.encode(String(file.content || ""));
    const crc32 = computeCrc32(contentBytes);
    const localHeader = new Uint8Array(30 + pathBytes.length + contentBytes.length);
    const localView = new DataView(localHeader.buffer);

    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, stamp.time, true);
    localView.setUint16(12, stamp.date, true);
    localView.setUint32(14, crc32, true);
    localView.setUint32(18, contentBytes.length, true);
    localView.setUint32(22, contentBytes.length, true);
    localView.setUint16(26, pathBytes.length, true);
    localView.setUint16(28, 0, true);
    localHeader.set(pathBytes, 30);
    localHeader.set(contentBytes, 30 + pathBytes.length);
    localChunks.push(localHeader);

    const centralHeader = new Uint8Array(46 + pathBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, stamp.time, true);
    centralView.setUint16(14, stamp.date, true);
    centralView.setUint32(16, crc32, true);
    centralView.setUint32(20, contentBytes.length, true);
    centralView.setUint32(24, contentBytes.length, true);
    centralView.setUint16(28, pathBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, localOffset, true);
    centralHeader.set(pathBytes, 46);
    centralChunks.push(centralHeader);

    localOffset += localHeader.length;
    centralSize += centralHeader.length;
  });

  const endRecord = new Uint8Array(22);
  const endView = new DataView(endRecord.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, localOffset, true);
  endView.setUint16(20, 0, true);

  return new Blob([...localChunks, ...centralChunks, endRecord], {
    type: "application/zip",
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function yamlScalar(value) {
  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  return JSON.stringify(String(value));
}

function buildYamlFrontmatter(fields) {
  const lines = ["---"];

  Object.entries(fields).forEach(([key, value]) => {
    if (
      value == null ||
      value === "" ||
      (Array.isArray(value) && !value.length)
    ) {
      return;
    }

    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      value.forEach((item) => {
        lines.push(`  - ${yamlScalar(item)}`);
      });
      return;
    }

    lines.push(`${key}: ${yamlScalar(value)}`);
  });

  lines.push("---", "");
  return lines.join("\n");
}

function getNeighborTitles(pageId) {
  return [...(state.neighborMap.get(pageId) || new Map()).keys()]
    .map((neighborId) => getPageById(neighborId)?.title || "")
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
}

function buildExportRelativePath(page, usedPaths) {
  let basePath = "";

  if (page.sourceType === "obsidian" && page.relativePath) {
    const pathParts = page.relativePath.split("/").filter(Boolean);
    const sanitizedParts = pathParts.map((part, index) =>
      index === pathParts.length - 1
        ? ensureMarkdownFileName(part, page.title || "Untitled")
        : sanitizePathSegment(part, `Folder ${index + 1}`),
    );
    basePath = sanitizedParts.join("/");
  } else {
    const folderName = sanitizePathSegment(
      page.clusterName || page.folderName || "Wikipedia",
      "Wikipedia",
    );
    basePath = `${folderName}/${ensureMarkdownFileName(page.title, "Untitled")}`;
  }

  const normalizedBase = basePath.replace(/\\/g, "/");
  let candidatePath = normalizedBase;
  let suffix = 2;

  while (usedPaths.has(candidatePath.toLowerCase())) {
    candidatePath = normalizedBase.replace(/\.md$/i, ` ${suffix}.md`);
    suffix += 1;
  }

  usedPaths.add(candidatePath.toLowerCase());
  return candidatePath;
}

function buildExportMetadata(page, exportedAt, neighborTitles) {
  return {
    title: page.title,
    source: page.mergedSources?.length ? page.mergedSources : [page.sourceLabel],
    source_type: page.sourceAnnotations?.length ? "merged" : page.sourceType,
    cluster: page.clusterName,
    folder: page.folderPath || page.folderName || page.clusterName,
    seed_note: state.activeSeedTitle || "Connectome",
    graph_mode: getGraphModeLabel(),
    exported_at: exportedAt,
    wikipedia_url: page.url || "",
    relative_path: page.relativePath || "",
    aliases: page.aliases || [],
    tags: page.tags || [],
    linked_notes: neighborTitles.length,
    imported_note_paths:
      page.sourceAnnotations?.map((annotation) => annotation.relativePath).filter(Boolean) || [],
  };
}

function buildWikipediaExportBody(page, neighborTitles) {
  const sections = [`# ${page.title}`];

  if (page.description) {
    sections.push("", `> ${page.description}`);
  }

  if (page.extract && page.extract !== page.description) {
    sections.push("", page.extract);
  }

  if (page.url) {
    sections.push("", `[Wikipedia source](${page.url})`);
  }

  sections.push(
    "",
    "## Graph Snapshot",
    `- Cluster: ${page.clusterName}`,
    `- Source: ${(page.mergedSources || [page.sourceLabel]).join(" • ")}`,
    `- Links resolved in graph: ${page.linkCount}`,
    `- Connected notes: ${neighborTitles.length}`,
  );

  if (page.sourceAnnotations?.length) {
    sections.push("", "## Imported note.md overlays");

    page.sourceAnnotations.forEach((annotation) => {
      sections.push("", `### ${annotation.relativePath || annotation.title || "Imported note"}`);

      if (annotation.tags?.length) {
        sections.push(`- Imported tags: ${annotation.tags.map((tag) => `#${tag}`).join(" ")}`);
      }

      if (annotation.markdown?.trim()) {
        sections.push("", annotation.markdown.trim());
      } else if (annotation.previewBlocks?.length) {
        sections.push("", ...annotation.previewBlocks);
      }
    });
  }

  if (neighborTitles.length) {
    sections.push("", "## Connected Notes", ...neighborTitles.map((title) => `- [[${title}]]`));
  }

  return `${sections.join("\n").trim()}\n`;
}

function buildObsidianExportBody(page, neighborTitles) {
  const body = page.markdown?.trim() || `# ${page.title}\n\n${page.extract || ""}\n`;
  const sections = [body];

  sections.push(
    "",
    "## Graph Snapshot",
    `- Cluster: ${page.clusterName}`,
    `- Source: ${(page.mergedSources || [page.sourceLabel]).join(" • ")}`,
    `- Links resolved in graph: ${page.linkCount}`,
    `- Connected notes: ${neighborTitles.length}`,
  );

  if (neighborTitles.length) {
    sections.push("", "## Connected Notes", ...neighborTitles.map((title) => `- [[${title}]]`));
  }

  return `${sections.join("\n").trim()}\n`;
}

function buildVaultReadme(vaultName, exportedAt) {
  const folderLines = state.clusters
    .map((cluster) => {
      const count = state.pages.filter((page) => page.clusterId === cluster.id).length;
      if (!count) {
        return "";
      }

      return `- ${cluster.name}: ${count} note${count === 1 ? "" : "s"}`;
    })
    .filter(Boolean);
  const seedTitle = state.activeSeedTitle || "Connectome";

  return [
    `# ${vaultName}`,
    "",
    `Exported from The Vault on ${exportedAt}.`,
    "",
    `- Seed note: [[${seedTitle}]]`,
    `- Graph mode: ${getGraphModeLabel()}`,
    `- Pages: ${state.pages.length}`,
    `- Links: ${state.edges.length}`,
    `- Folders: ${state.clusters.length}`,
    "",
    "## Folders",
    ...(folderLines.length ? folderLines : ["- No folders available in the current graph."]),
    "",
    "## Notes",
    ...state.pages
      .map((page) => `- [[${page.title}]]`)
      .sort((left, right) => left.localeCompare(right)),
    "",
  ].join("\n");
}

function buildVaultExportPackage() {
  const exportDate = new Date();
  const exportedAt = exportDate.toISOString();
  const exportDay = exportedAt.slice(0, 10);
  const seedTitle = state.activeSeedTitle || "Connectome";
  const vaultName = `The Vault ${sanitizePathSegment(seedTitle, "Connectome")} ${exportDay}`;
  const archiveName = `the-vault-${slugify(seedTitle) || "connectome"}-${exportDay}.zip`;
  const usedPaths = new Set();
  const files = [
    {
      path: `${vaultName}/README.md`,
      content: buildVaultReadme(vaultName, exportedAt),
    },
    {
      path: `${vaultName}/.obsidian/app.json`,
      content: "{\n  \"legacyEditor\": false\n}\n",
    },
  ];

  state.pages.forEach((page) => {
    const neighborTitles = getNeighborTitles(page.id);
    const metadata = buildExportMetadata(page, exportedAt, neighborTitles);
    const body =
      page.sourceType === "obsidian"
        ? buildObsidianExportBody(page, neighborTitles)
        : buildWikipediaExportBody(page, neighborTitles);
    const relativePath = buildExportRelativePath(page, usedPaths);

    files.push({
      path: `${vaultName}/${relativePath}`,
      content: `${buildYamlFrontmatter(metadata)}${body}`,
    });
  });

  return {
    archiveName,
    noteCount: state.pages.length,
    fileCount: files.length,
    blob: buildStoredZipArchive(files),
  };
}

async function downloadCurrentVault() {
  if (!state.pages.length) {
    setGraphStatus("Nothing is loaded yet. Build or import a graph before downloading the vault.", "error");
    return;
  }

  const defaultLabel = downloadVaultButton.textContent;
  downloadVaultButton.disabled = true;
  downloadVaultButton.textContent = "Packaging…";
  setGraphStatus(`Packaging ${state.pages.length} notes into an Obsidian vault…`);

  try {
    const exportPackage = buildVaultExportPackage();
    downloadBlob(exportPackage.blob, exportPackage.archiveName);
    setGraphStatus(
      `Downloaded "${exportPackage.archiveName}" with ${exportPackage.noteCount} notes as an Obsidian vault.`,
    );
  } catch (error) {
    setGraphStatus(`Vault export failed: ${error.message}`, "error");
  } finally {
    downloadVaultButton.disabled = false;
    downloadVaultButton.textContent = defaultLabel;
  }
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

function clearGraphCanvas(title = "Blank canvas", summary = "Discovering a new neural network…") {
  clearThreeObjects();
  state.pages = [];
  state.pageMap = new Map();
  state.edges = [];
  state.neighborMap = new Map();
  state.connectedness = [];
  state.selectedPageId = null;
  state.hoveredPageId = null;
  state.loading = true;
  state.cameraGoal = null;
  state.targetGoal = null;
  state.trackedPageId = null;
  setClusters([]);
  legend.innerHTML = "";
  noteTree.innerHTML = '<p class="tree-group-title">Building new network…</p>';
  vaultCount.textContent = "0 notes";
  statPages.textContent = "0";
  statLinks.textContent = "0";
  statFolders.textContent = "0";
  regionFilter.innerHTML = '<option value="all">All folders</option>';
  regionFilter.value = "all";
  articleKicker.textContent = "Wikipedia discovery";
  articleTitle.textContent = title;
  articleSummary.textContent = summary;
  articleBody.hidden = true;
  articleBody.innerHTML = "";
  sourceLink.hidden = true;
  editNoteButton.hidden = true;
  infoRegion.textContent = "-";
  infoType.textContent = "-";
  infoTransmitter.textContent = "-";
  infoRate.textContent = "-";
  infoDegree.textContent = "-";
  infoMotif.textContent = "-";
  tagList.innerHTML = "";
  neighborList.innerHTML = "";
  neighborCount.textContent = "0 pages";
  updateDiagnostics(null);
  closeNoteEditor(false);
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

async function discoverWikipediaTopicGraph(query, preferredTitle = "", requestId = state.graphRequestId) {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return { status: "empty" };
  }

  let searchResults = [];
  let chosenResult = null;

  if (preferredTitle.trim()) {
    chosenResult = { title: preferredTitle.trim(), snippet: "" };
  } else {
    searchResults = await fetchWikipediaSearchResults(trimmedQuery);
    if (requestId !== state.graphRequestId) {
      return { status: "stale" };
    }

    chosenResult = selectRelevantWikipediaSearchResult(trimmedQuery, searchResults);
  }

  if (!chosenResult?.title) {
    return { status: "missing", searchResults };
  }

  const seedRecord = await fetchPageRecord(chosenResult.title);
  if (requestId !== state.graphRequestId) {
    return { status: "stale" };
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
    return { status: "stale" };
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
    return { status: "stale" };
  }

  secondaryResults.forEach((record) => {
    if (!record.error && !knownTitles.has(record.title)) {
      mergedRecords.push(record);
      knownTitles.add(record.title);
    }
  });

  return {
    status: "ok",
    seedRecord,
    mergedRecords,
    searchResults,
  };
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
    `${page.title} ${page.description} ${page.extract} ${page.clusterName} ${page.relativePath || ""} ${page.tags.join(" ")}`
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

          return `${page.title} ${page.description} ${page.extract} ${page.relativePath || ""} ${page.tags.join(" ")}`
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
                  title="${escapeHtml(page.relativePath || page.title)}"
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
  state.activeNoteTab = tab === "inspector" || tab === "agent" ? tab : "wiki";
  const isWiki = state.activeNoteTab === "wiki";
  const isInspector = state.activeNoteTab === "inspector";
  const isAgent = state.activeNoteTab === "agent";

  tabWiki.classList.toggle("active", isWiki);
  tabWiki.setAttribute("aria-selected", isWiki ? "true" : "false");
  tabInspector.classList.toggle("active", isInspector);
  tabInspector.setAttribute("aria-selected", isInspector ? "true" : "false");
  tabAgent.classList.toggle("active", isAgent);
  tabAgent.setAttribute("aria-selected", isAgent ? "true" : "false");
  notePanelWiki.hidden = !isWiki;
  notePanelInspector.hidden = !isInspector;
  notePanelAgent.hidden = !isAgent;
}

function getGraphModeLabel() {
  if (state.obsidianRecords.length && state.wikipediaRecords.length) {
    return "Wikipedia + Obsidian overlay";
  }

  if (state.obsidianRecords.length) {
    return "Local Obsidian layer";
  }

  return state.graphMode === "topic" ? "Live topic graph" : "Default atlas";
}

function formatVector3(vector) {
  return `${vector.x.toFixed(1)}, ${vector.y.toFixed(1)}, ${vector.z.toFixed(1)}`;
}

function getAgentFocusPage(query = "") {
  const matchedPage = query ? getBestMatchingPage(query) : null;
  return (
    matchedPage ||
    getSelectedPage() ||
    getPageById(state.activeSeedPageId) ||
    state.connectedness[0] ||
    state.pages[0] ||
    null
  );
}

function getClusterCounts() {
  return state.clusters
    .map((cluster) => ({
      cluster,
      count: state.pages.filter((page) => page.clusterId === cluster.id).length,
    }))
    .filter((entry) => entry.count > 0)
    .sort((left, right) => right.count - left.count || left.cluster.name.localeCompare(right.cluster.name));
}

function getTopConnectedPages(limit = 4) {
  return [...state.pages]
    .sort(
      (left, right) =>
        right.connectedCount - left.connectedCount ||
        right.linkCount - left.linkCount ||
        left.title.localeCompare(right.title),
    )
    .slice(0, limit);
}

function extractRequestedTitle(query) {
  const trimmed = normalizeWhitespace(query);
  if (!trimmed) {
    return "";
  }

  const quoted = trimmed.match(/["“”']([^"“”']+)["“”']?/);
  if (quoted?.[1]) {
    return normalizeWhitespace(quoted[1]).replace(/[.?!,:;]+$/, "");
  }

  const contextual = trimmed.match(/\b(?:about|for|on)\s+(.+)$/i);
  if (contextual?.[1]) {
    return normalizeWhitespace(contextual[1]).replace(/[.?!,:;]+$/, "");
  }

  return "";
}

function buildAgentSnapshot(query = "") {
  const focus = getAgentFocusPage(query);
  const neighbors = focus
    ? [...(state.neighborMap.get(focus.id) || new Map()).entries()]
        .map(([neighborId, weight]) => ({ page: getPageById(neighborId), weight }))
        .filter((entry) => entry.page)
        .sort((left, right) => right.weight - left.weight)
    : [];
  const clusterCounts = getClusterCounts();
  const topPages = getTopConnectedPages(4);
  const wikipediaCount = state.pages.filter((page) => page.sourceType === "wikipedia").length;
  const obsidianCount = state.pages.filter((page) => page.sourceType === "obsidian").length;
  const averageDegree = state.pages.length ? (state.edges.length * 2) / state.pages.length : 0;

  return {
    focus,
    neighbors,
    clusterCounts,
    topPages,
    wikipediaCount,
    obsidianCount,
    averageDegree,
    seedTitle: state.activeSeedTitle || focus?.title || "this connectome",
  };
}

function renderAgentCards(container, cards) {
  container.innerHTML = cards
    .map((card) => {
      const body = card.body ? `<p>${escapeHtml(card.body)}</p>` : "";
      const items = card.items?.length
        ? `<ul>${card.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
        : "";
      const actions = card.actions || "";

      return `
        <div class="agent-card">
          <strong>${escapeHtml(card.title)}</strong>
          ${body}
          ${items}
          ${actions}
        </div>
      `;
    })
    .join("");
}

function buildAgentDigestCards(snapshot) {
  const dominantCluster = snapshot.clusterCounts[0];
  const secondCluster = snapshot.clusterCounts[1];
  const hubTitles = snapshot.topPages.map((page) => page.title);
  const sourceMix =
    snapshot.obsidianCount > 0
      ? `${snapshot.wikipediaCount} Wikipedia pages and ${snapshot.obsidianCount} local note${snapshot.obsidianCount === 1 ? "" : "s"}`
      : `${snapshot.wikipediaCount} live Wikipedia pages with no local Obsidian layer yet`;

  return [
    {
      title: `Current focus: ${snapshot.focus?.title || snapshot.seedTitle}`,
      body:
        snapshot.focus
          ? `The active connectome spans ${state.pages.length} pages and ${formatNumber(state.edges.length)} links. "${snapshot.focus.title}" currently sits in ${snapshot.focus.clusterName} with ${snapshot.neighbors.length} directly connected pages.`
          : `The graph is loading. Once a focus note exists, the agent will summarize its connected context.`,
    },
    {
      title: "Source mix",
      body: `${sourceMix}. Graph mode: ${getGraphModeLabel()}. Average degree is ${snapshot.averageDegree.toFixed(1)} connections per page.`,
    },
    {
      title: "Dominant folders",
      body:
        dominantCluster
          ? secondCluster
            ? `${dominantCluster.cluster.name} leads with ${dominantCluster.count} pages, followed by ${secondCluster.cluster.name} with ${secondCluster.count}.`
            : `${dominantCluster.cluster.name} currently carries most of the graph with ${dominantCluster.count} pages.`
          : "No folders are populated yet.",
      items: hubTitles.length ? [`Strong hubs: ${hubTitles.join(", ")}`] : [],
    },
  ];
}

function buildAgentStructureCards(snapshot) {
  const dominantCluster = snapshot.clusterCounts[0];
  const weakestCluster =
    snapshot.clusterCounts.find((entry) => entry.count <= Math.max(2, Math.floor((dominantCluster?.count || 0) / 3))) ||
    snapshot.clusterCounts[snapshot.clusterCounts.length - 1];
  const neighborClusters = [...new Set(snapshot.neighbors.map((entry) => entry.page.clusterName))];
  const cards = [];

  cards.push({
    title: "Capture an interpretation layer",
    body:
      snapshot.obsidianCount === 0
        ? `There is no local Obsidian layer yet. Add a synthesis note around "${snapshot.focus?.title || snapshot.seedTitle}" so the graph has at least one authored interpretation node.`
        : `Local notes already exist. Tighten them by linking each local note back to the seed and the two strongest neighboring pages.`,
    items:
      snapshot.neighbors.length
        ? [`Recommended anchors: ${snapshot.neighbors.slice(0, 3).map((entry) => entry.page.title).join(", ")}`]
        : [],
  });

  cards.push({
    title: "Balance folder pressure",
    body:
      dominantCluster && weakestCluster && dominantCluster.cluster.id !== weakestCluster.cluster.id
        ? `${dominantCluster.cluster.name} is visually dominating the graph. A new note in ${weakestCluster.cluster.name} would keep the connectome from collapsing into a single topical lobe.`
        : "Folder balance looks even enough for this graph size. Prioritize note quality over forced redistribution.",
  });

  cards.push({
    title: "Bridge context between clusters",
    body:
      neighborClusters.length > 1
        ? `"${snapshot.focus?.title || snapshot.seedTitle}" already touches ${neighborClusters.length} clusters. A bridge note that names those crossings will reduce visual sprawl without deleting links.`
        : "The current focus stays mostly inside one cluster. A contrast note that links it to a neighboring concept would improve structural range.",
    items:
      neighborClusters.length > 1
        ? [`Active crossing: ${neighborClusters.slice(0, 4).join(" -> ")}`]
        : [],
  });

  return cards;
}

function buildDraftMarkdown(title, snapshot, variantLabel, rationale, relatedTitles) {
  const focusTitle = snapshot.focus?.title || snapshot.seedTitle;
  const folderLabel = snapshot.focus?.clusterName || state.activeVaultName || "Scratchpad";

  return `# ${title}

## Intent
${rationale}

## Context
- Seed: [[${focusTitle}]]
- Folder: ${folderLabel}
- Variant: ${variantLabel}

## Key links
${relatedTitles.length ? relatedTitles.map((entry) => `- [[${entry}]]`).join("\n") : "- Add supporting links from the graph."}

## Working notes
- What does this note clarify that the current connectome does not?
- Which pages should be linked directly?
- What context is still missing?

## Next steps
- Expand the note with citations or imported markdown.
- Link the note back into the main cluster.
`;
}

function buildAgentDraftSuggestions(snapshot, requestedTitle = "") {
  const focusTitle = snapshot.focus?.title || snapshot.seedTitle || "Untitled connectome";
  const folderName = snapshot.focus?.clusterName || state.activeVaultName || "Scratchpad";
  const relatedTitles = snapshot.neighbors.slice(0, 4).map((entry) => entry.page.title);
  const requested = normalizeWhitespace(requestedTitle);

  return [
    {
      title: requested || `${focusTitle} research brief`,
      folderName,
      rationale: `Capture a compact interpretation layer around "${focusTitle}" with the most important links preserved.`,
      markdown: buildDraftMarkdown(
        requested || `${focusTitle} research brief`,
        snapshot,
        "Research brief",
        `Capture a compact interpretation layer around "${focusTitle}" with the most important links preserved.`,
        relatedTitles,
      ),
    },
    {
      title: `${focusTitle} bridge map`,
      folderName: `Maps/${folderName}`,
      rationale: `Use a bridge map note to explain why the strongest neighboring pages belong in one connective context.`,
      markdown: buildDraftMarkdown(
        `${focusTitle} bridge map`,
        snapshot,
        "Bridge map",
        `Explain why the strongest neighboring pages belong in one connective context.`,
        relatedTitles,
      ),
    },
    {
      title: `${focusTitle} open questions`,
      folderName: `Questions/${folderName}`,
      rationale: `Create an Obsidian question ledger so future imports and edits have a stable destination inside the graph.`,
      markdown: buildDraftMarkdown(
        `${focusTitle} open questions`,
        snapshot,
        "Question ledger",
        `Create a question ledger so future imports and edits have a stable destination inside the graph.`,
        relatedTitles,
      ),
    },
  ];
}

function renderAgentDraftCards(suggestions) {
  agentDraftList.innerHTML = suggestions
    .map(
      (suggestion, index) => `
        <div class="agent-card">
          <strong>${escapeHtml(suggestion.title)}</strong>
          <p>${escapeHtml(suggestion.rationale)}</p>
          <div class="agent-draft-actions">
            <button class="ghost-button" type="button" data-agent-draft-index="${index}">
              Draft in Obsidian
            </button>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderAgentMessages() {
  agentChatLog.innerHTML = state.agentMessages
    .map(
      (message) => `
        <div class="agent-message ${message.role}">
          <span class="agent-message-label">${message.role === "user" ? "You" : "Vault Agent"}</span>
          ${message.html}
        </div>
      `,
    )
    .join("");
}

function pushAgentMessage(role, html) {
  state.agentMessages.push({ role, html });
  if (state.agentMessages.length > 8) {
    state.agentMessages = state.agentMessages.slice(-8);
  }
  renderAgentMessages();
}

function ensureAgentWelcome(snapshot) {
  if (state.agentMessages.length) {
    return;
  }

  pushAgentMessage(
    "assistant",
    `<p>This is a graph-grounded prototype. I can summarize the current connectome, suggest Obsidian notes, and point out structural pressure before a real LLM layer is added.</p><p>Current seed: <strong>${escapeHtml(snapshot.seedTitle)}</strong>.</p>`,
  );
}

function inferAgentIntent(query) {
  const text = query.toLowerCase();

  if (/(summar|digest|overview|recap)/.test(text)) {
    return "summary";
  }

  if (/(draft|new note|create note|add note|obsidian|capture)/.test(text)) {
    return "draft";
  }

  if (/(optimi|structure|organize|cluster|folder|context|link)/.test(text)) {
    return "structure";
  }

  return "general";
}

function createAgentResponse(intent, query = "") {
  const requestedTitle = extractRequestedTitle(query);
  const snapshot = buildAgentSnapshot(query);
  const structureCards = buildAgentStructureCards(snapshot);
  const draftSuggestions = buildAgentDraftSuggestions(snapshot, requestedTitle);
  state.agentDraftSuggestions = draftSuggestions;

  if (intent === "summary") {
    return {
      title: snapshot.focus?.title || snapshot.seedTitle,
      summary: `This connectome currently spans ${state.pages.length} pages and ${formatNumber(state.edges.length)} links, anchored by ${snapshot.focus?.title || snapshot.seedTitle}.`,
      html: `<p><strong>${escapeHtml(snapshot.focus?.title || snapshot.seedTitle)}</strong> is the current focus. The graph mixes ${snapshot.wikipediaCount} Wikipedia pages with ${snapshot.obsidianCount} local note${snapshot.obsidianCount === 1 ? "" : "s"}.</p><p>The strongest hubs right now are ${escapeHtml(snapshot.topPages.map((page) => page.title).join(", ") || "still loading")}.</p>`,
    };
  }

  if (intent === "structure") {
    return {
      title: "Structure recommendations",
      summary: `I found ${structureCards.length} structural moves worth testing on the current graph.`,
      html: `<ul>${structureCards.map((card) => `<li><strong>${escapeHtml(card.title)}</strong>: ${escapeHtml(card.body)}</li>`).join("")}</ul>`,
    };
  }

  if (intent === "draft") {
    return {
      title: "Draft notes prepared",
      summary: `I prepared ${draftSuggestions.length} Obsidian-ready draft directions based on the current graph.`,
      html: `<p>The first draft is <strong>${escapeHtml(draftSuggestions[0].title)}</strong>. Use the draft buttons below to open any suggestion in the existing note editor before saving.</p>`,
    };
  }

  return {
    title: "Prototype guidance",
    summary: "I can summarize the active graph, suggest structure changes, or prepare note drafts from the current connectome.",
    html: `<p>Try prompts like <strong>summarize this connectome</strong>, <strong>optimize the structure</strong>, or <strong>draft a note about ${escapeHtml(snapshot.focus?.title || snapshot.seedTitle)}</strong>.</p>`,
  };
}

function refreshAgentPrototype(query = "") {
  const snapshot = buildAgentSnapshot(query);
  agentTitle.textContent = snapshot.focus?.title
    ? `Graph-aware assistant for ${snapshot.focus.title}`
    : "Graph-aware note assistant";
  agentSummary.textContent =
    snapshot.obsidianCount > 0
      ? `Prototype mode: graph-grounded summary and draft suggestions over ${snapshot.wikipediaCount} Wikipedia pages plus ${snapshot.obsidianCount} local note${snapshot.obsidianCount === 1 ? "" : "s"}.`
      : `Prototype mode: graph-grounded summary and draft suggestions over ${snapshot.wikipediaCount} live Wikipedia pages.`;
  renderAgentCards(agentDigest, buildAgentDigestCards(snapshot));
  renderAgentCards(agentStructureList, buildAgentStructureCards(snapshot));
  state.agentDraftSuggestions = buildAgentDraftSuggestions(snapshot);
  renderAgentDraftCards(state.agentDraftSuggestions);
  ensureAgentWelcome(snapshot);
}

function openAgentDraft(index) {
  const suggestion = state.agentDraftSuggestions[index];
  if (!suggestion) {
    return;
  }

  openNoteEditor({
    title: suggestion.title,
    folderName: suggestion.folderName,
    markdown: suggestion.markdown,
  });
  setNoteTab("wiki");
  setGraphStatus(`Opened agent draft "${suggestion.title}" in the Obsidian editor.`);
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
    refreshAgentPrototype();
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
    state.obsidianRecords.length && state.wikipediaRecords.length
      ? `Live Wikipedia graph with ${state.obsidianRecords.length} layered local note${state.obsidianRecords.length === 1 ? "" : "s"}. Selected note anchor: ${formatVector3(selectedPage.position)}.`
      : state.obsidianRecords.length
        ? `Local Obsidian note graph rendered from "${state.activeVaultName || "Vault"}". Selected note anchor: ${formatVector3(selectedPage.position)}.`
      : state.graphMode === "topic"
        ? `Live Wikipedia connectome branched from "${state.activeSeedTitle}". Selected note anchor: ${formatVector3(selectedPage.position)}.`
        : `Default atlas view seeded from canonical neuroanatomy pages. Selected note anchor: ${formatVector3(selectedPage.position)}.`;
  diagMode.textContent = getGraphModeLabel();
  diagSeed.textContent =
    state.obsidianRecords.length && !state.wikipediaRecords.length
      ? state.activeVaultName || selectedPage.title
      : state.activeSeedTitle || selectedPage.title;
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

  refreshAgentPrototype();
}

function renderArticleBody(page) {
  if (!page) {
    articleBody.hidden = true;
    articleBody.innerHTML = "";
    return;
  }

  if (page.sourceType === "obsidian") {
    const blocks = [];

    if (page.relativePath) {
      blocks.push(
        `<p><strong>Path</strong> ${escapeHtml(page.relativePath)}</p>`,
      );
    }

    page.previewBlocks.forEach((block) => {
      blocks.push(`<p>${escapeHtml(block)}</p>`);
    });

    if (!blocks.length && page.markdown) {
      blocks.push(`<pre>${escapeHtml(page.markdown.slice(0, 1400))}</pre>`);
    }

    articleBody.hidden = blocks.length === 0;
    articleBody.innerHTML = blocks.join("");
    return;
  }

  const wikiBlocks = [];
  if (page.description) {
    wikiBlocks.push(`<p>${escapeHtml(page.description)}</p>`);
  }
  if (page.extract && page.extract !== page.description) {
    wikiBlocks.push(`<p>${escapeHtml(page.extract)}</p>`);
  }

  if (page.sourceAnnotations?.length) {
    wikiBlocks.push(
      `<p><strong>Sources</strong> ${escapeHtml(page.mergedSources.join(" • "))}</p>`,
    );

    page.sourceAnnotations.forEach((annotation) => {
      const annotationBlocks = [];

      if (annotation.relativePath) {
        annotationBlocks.push(
          `<p><strong>Imported note.md</strong> ${escapeHtml(annotation.relativePath)}</p>`,
        );
      }

      (annotation.previewBlocks || []).slice(0, 3).forEach((block) => {
        annotationBlocks.push(`<p>${escapeHtml(block)}</p>`);
      });

      if (annotation.tags?.length) {
        annotationBlocks.push(
          `<p><strong>Imported tags</strong> ${escapeHtml(annotation.tags.join(", "))}</p>`,
        );
      }

      if (annotationBlocks.length) {
        wikiBlocks.push(annotationBlocks.join(""));
      }
    });
  }

  articleBody.hidden = wikiBlocks.length === 0;
  articleBody.innerHTML = wikiBlocks.join("");
}

function updateInspector(page) {
  if (!page) {
    return;
  }

  if (state.editorOpen) {
    updateDiagnostics(page);
    return;
  }

  const neighbors = [...state.neighborMap.get(page.id).entries()]
    .map(([neighborId, weight]) => ({ page: getPageById(neighborId), weight }))
    .filter((entry) => entry.page)
    .sort((left, right) => right.weight - left.weight);

  articleKicker.textContent =
    page.sourceType === "obsidian"
      ? `${page.clusterName} vault note`
      : page.sourceAnnotations?.length
        ? `${page.clusterName} merged note`
      : `${page.clusterName} note`;
  articleTitle.textContent = page.title;
  articleSummary.textContent = page.extract || page.description;
  renderArticleBody(page);
  sourceLink.href = page.url || "https://en.wikipedia.org/";
  sourceLink.hidden = !page.url;
  editNoteButton.hidden = page.sourceType !== "obsidian";
  infoRegion.textContent = page.clusterName;
  infoType.textContent =
    page.sourceType === "obsidian"
      ? page.relativePath || page.description
      : page.sourceAnnotations?.length
        ? page.sourceAnnotations
          .map((annotation) => annotation.relativePath)
          .filter(Boolean)
          .slice(0, 2)
          .join(" • ")
        : page.description;
  infoTransmitter.textContent =
    page.mergedSources?.length
      ? page.mergedSources.join(" + ")
      : page.sourceLabel;
  infoRate.textContent =
    page.sourceType === "obsidian"
      ? `${page.linkCount} resolved`
      : `${page.linkCount} in graph`;
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

function openNoteEditor(draft = {}) {
  state.editorOpen = true;
  state.editingNoteId = draft.id || "";
  setSidebarTab("obsidian");
  setNoteTab("wiki");
  notePanelWiki.classList.add("note-editor-active");
  editorPanel.hidden = false;
  sourceLink.hidden = true;
  editNoteButton.hidden = true;
  articleBody.hidden = true;
  articleKicker.textContent = draft.id ? "Editing local note" : "New local note";
  articleTitle.textContent = draft.title || "Clean canvas";
  articleSummary.textContent = draft.id
    ? "Edit the markdown and save it back into the live graph."
    : "Create a new local note and connect it with [[Page Title]] links.";
  editorTitleInput.value = draft.title || "";
  editorFolderInput.value = draft.folderName || "Scratchpad";
  editorBodyInput.value = draft.markdown || "";
  window.setTimeout(() => {
    editorTitleInput.focus();
    editorTitleInput.select();
  }, 0);
}

function closeNoteEditor(restoreSelection = true) {
  state.editorOpen = false;
  state.editingNoteId = "";
  notePanelWiki.classList.remove("note-editor-active");
  editorPanel.hidden = true;

  if (restoreSelection) {
    updateInspector(getSelectedPage());
  }
}

function startNewNote() {
  const pendingTitle = normalizeWhitespace(state.pendingNewTitle);
  setSidebarTab("obsidian");
  openNoteEditor({
    title: pendingTitle,
    folderName: state.activeVaultName || "Scratchpad",
    markdown: pendingTitle ? `# ${pendingTitle}\n\n` : "",
  });

  if (pendingTitle) {
    setGraphStatus(
      `No relevant Wikipedia entry was found for "${pendingTitle}". Draft a new local note or rename it to reuse a Wikipedia page.`,
      "warning",
    );
  }
}

function startEditingNote(pageId = state.selectedPageId) {
  const page = getPageById(pageId);
  const record = state.obsidianRecords.find((entry) => entry.id === pageId);

  if (!page || page.sourceType !== "obsidian" || !record) {
    return;
  }

  openNoteEditor({
    id: record.id,
    title: record.title,
    folderName: record.folderName,
    markdown: record.markdown,
  });
}

async function saveEditorNote() {
  const record = buildLocalNoteRecord({
    id: state.editingNoteId,
    title: editorTitleInput.value,
    folderName: editorFolderInput.value,
    markdown: editorBodyInput.value,
  });
  const isNewNote = !state.editingNoteId;

  if (isNewNote) {
    const existingWikipediaRecord = findWikipediaRecordByTitle(record.title);
    if (existingWikipediaRecord) {
      state.pendingNewTitle = "";
      closeNoteEditor(false);
      setSidebarTab("wikipedia");
      focusPage(existingWikipediaRecord.id);
      setGraphStatus(
        `Used existing Wikipedia entry "${existingWikipediaRecord.title}" instead of creating a duplicate local note.`,
      );
      return;
    }

    const lookupRequestId = ++state.graphRequestId;
    setGraphStatus(`Checking Wikipedia for "${record.title}" before creating a new local note…`);
    let topicResult;

    try {
      topicResult = await discoverWikipediaTopicGraph(record.title, "", lookupRequestId);
    } catch {
      setGraphStatus(
        `Wikipedia lookup failed for "${record.title}". Retry or rename the note to save it locally.`,
        "error",
      );
      return;
    }

    if (lookupRequestId !== state.graphRequestId || topicResult.status === "stale") {
      return;
    }

    if (topicResult.status === "ok") {
      state.pendingNewTitle = "";
      closeNoteEditor(false);
      applyDiscoveredWikipediaTopic(
        topicResult,
        `Used existing Wikipedia entry "${topicResult.seedRecord.title}" instead of creating a new local note.`,
      );
      return;
    }
  }

  const duplicate = findObsidianDuplicate(record, state.editingNoteId);

  if (duplicate) {
    setGraphStatus(
      `Duplicate local note blocked. "${duplicate.title}" already uses ${duplicate.relativePath}.`,
      "warning",
    );
    editorTitleInput.focus();
    return;
  }

  const nextRecords = new Map(state.obsidianRecords.map((entry) => [entry.id, entry]));
  nextRecords.set(record.id, record);
  state.obsidianRecords = [...nextRecords.values()].sort((left, right) =>
    left.title.localeCompare(right.title),
  );
  state.activeVaultName = state.activeVaultName || "Scratchpad";
  state.pendingNewTitle = "";
  closeNoteEditor(false);
  rebuildActiveGraph(record.id);
  setSidebarTab("obsidian");
  setGraphStatus(`Saved local note "${record.title}" into the live graph.`);
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

function getBestMatchingPage(query, sourceType = "") {
  const search = query.trim().toLowerCase();

  return [...state.pages]
    .filter((page) => !sourceType || page.sourceType === sourceType)
    .filter((page) => {
      if (!search) {
        return true;
      }

      return `${page.title} ${page.description} ${page.extract} ${page.relativePath || ""} ${page.tags.join(" ")}`
        .toLowerCase()
        .includes(search);
    })
    .sort(
      (left, right) =>
        right.connectedCount - left.connectedCount ||
        right.linkCount - left.linkCount ||
        left.title.localeCompare(right.title),
    )[0] || null;
}

function applyDiscoveredWikipediaTopic(topicResult, successMessage = "") {
  if (!topicResult || topicResult.status !== "ok") {
    return;
  }

  state.pendingNewTitle = "";
  state.searchText = "";
  state.filterCluster = "all";
  searchInput.value = "";
  regionFilter.value = "all";
  state.graphMode = "topic";
  state.activeSeedTitle = topicResult.seedRecord.title;
  state.wikipediaRecords = mergeWikipediaRecordSets(state.wikipediaRecords, topicResult.mergedRecords);
  state.activeSeedPageId =
    state.wikipediaRecords.find(
      (record) => normalizeSearchTitle(record.title) === normalizeSearchTitle(topicResult.seedRecord.title),
    )?.id || "";
  rebuildActiveGraph(state.activeSeedPageId);
  setSidebarTab("wikipedia");

  if (successMessage) {
    setGraphStatus(successMessage);
  }
}

async function loadTopicGraphFromQuery(query, preferredTitle = "") {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return;
  }

  const requestId = ++state.graphRequestId;
  clearSearchSuggestions();
  setSidebarTab("wikipedia");
  state.obsidianRecords = [];
  state.activeVaultName = "";
  state.wikipediaRecords = [];
  state.activeSeedTitle = "";
  state.activeSeedPageId = "";
  state.pendingNewTitle = "";
  clearGraphCanvas(
    `Discovering "${trimmedQuery}"…`,
    "Cleared the current canvas. Fetching live Wikipedia notes and links for a fresh neural network.",
  );
  setGraphStatus(`Searching Wikipedia for "${trimmedQuery}"…`);
  let topicResult;

  try {
    topicResult = await discoverWikipediaTopicGraph(trimmedQuery, preferredTitle, requestId);
  } catch {
    state.loading = false;
    articleTitle.textContent = "Wikipedia lookup failed";
    articleSummary.textContent =
      "The new graph could not be discovered from Wikipedia in this browser session.";
    setGraphStatus(`Wikipedia lookup failed for "${trimmedQuery}".`, "error");
    return;
  }

  if (requestId !== state.graphRequestId || topicResult.status === "stale") {
    return;
  }

  if (topicResult.status === "missing") {
    state.loading = false;
    state.pendingNewTitle = trimmedQuery;
    articleTitle.textContent = `No Wikipedia entry for "${trimmedQuery}"`;
    articleSummary.textContent =
      "Use Obsidian > New to create a local note and start a new neural network from a blank canvas.";
    setSidebarTab("obsidian");
    setGraphStatus(
      `No relevant Wikipedia entry was found for "${trimmedQuery}". Use Obsidian > New to create it.`,
      "warning",
    );
    return;
  }

  applyDiscoveredWikipediaTopic(
    topicResult,
    `Built a new neural network around "${topicResult.seedRecord.title}" with ${topicResult.mergedRecords.length} Wikipedia pages.`,
  );
}

async function loadObsidianVaultFromFiles(fileList) {
  const markdownFiles = [...fileList].filter((file) => /\.(md|markdown)$/i.test(file.name));
  if (!markdownFiles.length) {
    setGraphStatus("No markdown files were found in the imported selection.", "error");
    return;
  }

  const requestId = ++state.graphRequestId;
  clearSearchSuggestions();
  setSidebarTab("obsidian");
  state.pendingNewTitle = "";

  const vaultRootName = getVaultRootName(markdownFiles);
  const vaultName = vaultRootName || "Imported Vault";
  state.activeVaultName = vaultName;
  setGraphStatus(`Importing "${vaultName}"… 0/${markdownFiles.length}`);

  let completed = 0;
  const drafts = await mapWithConcurrency(markdownFiles, 8, async (file, index) => {
    const markdown = await file.text();
    completed += 1;

    if (requestId === state.graphRequestId) {
      setGraphStatus(`Importing "${vaultName}"… ${completed}/${markdownFiles.length}`);
    }

    return parseObsidianDraft(file, markdown, index, vaultRootName);
  });

  if (requestId !== state.graphRequestId) {
    return;
  }

  const resolvedDrafts = resolveObsidianLinks(
    drafts.map((draft) => ({ ...draft })),
    [...state.wikipediaRecords, ...state.obsidianRecords],
  );
  const existingByKey = new Map(
    state.obsidianRecords.map((record) => [getObsidianDuplicateKey(record), record]),
  );
  const nextWikipediaRecords = new Map(
    state.wikipediaRecords.map((record) => [normalizeSearchTitle(record.title), { ...record }]),
  );
  const nextRecords = new Map(state.obsidianRecords.map((record) => [record.id, record]));
  let addedCount = 0;
  let updatedCount = 0;
  let mergedCount = 0;
  let skippedCount = 0;

  let preferredPageId = "";

  resolvedDrafts.forEach((draft) => {
    const wikipediaOverlap = nextWikipediaRecords.get(normalizeSearchTitle(draft.title));
    const duplicateKey = getObsidianDuplicateKey(draft);

    if (wikipediaOverlap) {
      nextWikipediaRecords.set(
        normalizeSearchTitle(draft.title),
        mergeImportedRecordIntoWikipediaRecord(wikipediaOverlap, draft),
      );

      const existingImported = existingByKey.get(duplicateKey);
      if (existingImported?.sourceType === "obsidian") {
        nextRecords.delete(existingImported.id);
        existingByKey.delete(duplicateKey);
      }

      mergedCount += 1;
      preferredPageId = preferredPageId || wikipediaOverlap.id;
      return;
    }

    const existing = existingByKey.get(duplicateKey);

    if (!existing) {
      nextRecords.set(draft.id, draft);
      existingByKey.set(duplicateKey, draft);
      addedCount += 1;
      preferredPageId = preferredPageId || draft.id;
      return;
    }

    if (existing.sourceType !== "obsidian") {
      skippedCount += 1;
      return;
    }

    nextRecords.set(existing.id, { ...draft, id: existing.id });
    existingByKey.set(duplicateKey, { ...draft, id: existing.id });
    updatedCount += 1;
    preferredPageId = preferredPageId || existing.id;
  });
  state.wikipediaRecords = prepareWikipediaRecords([...nextWikipediaRecords.values()]);
  state.obsidianRecords = [...nextRecords.values()];
  rebuildActiveGraph(preferredPageId || resolvedDrafts[0]?.id || "");

  setGraphStatus(
    `Imported "${vaultName}": ${addedCount} added, ${updatedCount} refreshed, ${mergedCount} merged into Wikipedia, ${skippedCount} duplicate${skippedCount === 1 ? "" : "s"} skipped.`,
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

  const pages = [];
  const pageMap = new Map();
  const neighborMap = new Map();
  const titleToId = new Map();

  records.forEach((record) => {
    const page = {
      id: record.id || `page-${slugify(record.title)}`,
      title: record.title,
      description: record.description,
      extract: record.extract,
      url: record.url,
      sourceType: record.sourceType || "wikipedia",
      sourceLabel: record.sourceLabel || "English Wikipedia",
      markdown: record.markdown || "",
      previewBlocks: record.previewBlocks || [],
      relativePath: record.relativePath || "",
      folderPath: record.folderPath || "",
      folderName: record.folderName || "",
      aliases: record.aliases || [],
      sourceAnnotations: (record.sourceAnnotations || []).map((annotation) => ({
        ...annotation,
        previewBlocks: [...(annotation.previewBlocks || [])],
        tags: [...(annotation.tags || [])],
      })),
      mergedSources: record.mergedSources || [record.sourceLabel || "English Wikipedia"],
      sourceClusterId: record.clusterId || null,
      velocity: new THREE.Vector3(),
      radius: randomBetween(0.9, 1.45),
      wobblePhase: randomBetween(0, Math.PI * 2),
      sparkPhase: randomBetween(0, Math.PI * 2),
      sparkRadius: randomBetween(1.4, 2.8),
      links: record.links || [],
      linkIds: record.linkIds || [],
      linkCount: 0,
      connectedCount: 0,
      importedTags: record.tags || [],
      tags: [],
    };

    pages.push(page);
    pageMap.set(page.id, page);
    titleToId.set(page.title, page.id);
    neighborMap.set(page.id, new Map());
  });

  const edgeMap = new Map();

  records.forEach((record) => {
    const sourceId = record.id || titleToId.get(record.title);
    const sourcePage = pageMap.get(sourceId);
    if (!sourcePage) {
      return;
    }

    const matchedTargetIds = Array.isArray(record.linkIds) && record.linkIds.length
      ? record.linkIds.filter((targetId) => pageMap.has(targetId))
      : (record.links || [])
        .map((linkedTitle) => titleToId.get(linkedTitle))
        .filter((targetId) => targetId && pageMap.has(targetId));

    sourcePage.linkCount = matchedTargetIds.length;

    matchedTargetIds.forEach((targetId) => {
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

  const hasLocalLayer = pages.some((page) => page.sourceType === "obsidian");
  const clusterContext =
    options.clusterContext
      ? options.clusterContext
      : options.includeLocalLayer || hasLocalLayer
        ? buildHybridClusterContext(
          pages,
          neighborMap,
          { mode: options.mode, seedTitle: options.seedTitle || pages[0]?.title || "" },
        )
        : options.mode === "topic"
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
    page.tags = page.sourceType === "obsidian"
      ? uniqueValues([
        cluster.name,
        page.relativePath,
        ...page.importedTags,
        ...page.links.slice(0, 4),
      ]).slice(0, MAX_TAGS)
      : uniqueValues([
        cluster.name,
        page.description,
        "English Wikipedia",
        ...page.links.slice(0, 3),
      ]).slice(0, MAX_TAGS);
  });

  state.pages = pages;
  state.pageMap = pageMap;
  state.edges = edges;
  state.neighborMap = neighborMap;
  state.connectedness = [...pages].sort(
    (left, right) => right.connectedCount - left.connectedCount || right.linkCount - left.linkCount,
  );
  state.selectedPageId =
    (options.seedPageId && pageMap.has(options.seedPageId) ? options.seedPageId : "") ||
    [...pageMap.values()].find((page) => page.title === options.seedTitle)?.id ||
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
  setSidebarTab("wikipedia");
  state.pendingNewTitle = "";
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
  state.wikipediaRecords = prepareWikipediaRecords(mergedRecords);
  state.activeSeedPageId =
    state.wikipediaRecords.find((record) => record.title === "Connectome")?.id || "";
  rebuildActiveGraph(state.activeSeedPageId);

  if (failed.length) {
    setGraphStatus(
      `Loaded ${mergedRecords.length} Wikipedia pages with ${failed.length} failed seed requests and kept ${state.obsidianRecords.length} local note${state.obsidianRecords.length === 1 ? "" : "s"}.`,
      "warning",
    );
  } else {
    setGraphStatus(
      `Loaded ${mergedRecords.length} Wikipedia pages and kept ${state.obsidianRecords.length} local note${state.obsidianRecords.length === 1 ? "" : "s"} in the graph.`,
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

  tabAgent.addEventListener("click", () => {
    setNoteTab("agent");
  });

  wikipediaMenuButton.addEventListener("click", () => {
    setSidebarTab("wikipedia");
  });

  obsidianMenuButton.addEventListener("click", () => {
    setSidebarTab("obsidian");
  });

  importVaultButton.addEventListener("click", () => {
    setSidebarTab("obsidian");
    vaultInput.click();
  });

  newNoteButton.addEventListener("click", () => {
    startNewNote();
  });

  vaultInput.addEventListener("change", async (event) => {
    const files = [...(event.target.files || [])];
    if (!files.length) {
      return;
    }

    await loadObsidianVaultFromFiles(files);
    vaultInput.value = "";
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

    if (!query) {
      return;
    }

    await loadTopicGraphFromQuery(query);
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
    const visiblePages = getVisiblePages().filter((page) => page.sourceType === "wikipedia");
    const wikipediaPages = state.pages.filter((page) => page.sourceType === "wikipedia");
    const pool = visiblePages.length ? visiblePages : wikipediaPages.length ? wikipediaPages : state.pages;
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
    const resetPage =
      getPageById(state.activeSeedPageId) ||
      state.pages.find((page) => page.title === state.activeSeedTitle) ||
      state.connectedness[0] ||
      null;
    if (resetPage) {
      focusPage(resetPage.id);
    } else {
      resetCameraGoals();
    }
  });

  downloadVaultButton.addEventListener("click", () => {
    downloadCurrentVault();
  });

  noteTree.addEventListener("click", (event) => {
    const button = event.target.closest("[data-page-id]");
    if (!button) {
      return;
    }
    focusPage(button.dataset.pageId);
  });

  noteTree.addEventListener("dblclick", (event) => {
    const button = event.target.closest("[data-page-id]");
    if (!button) {
      return;
    }

    const page = getPageById(button.dataset.pageId);
    if (page?.sourceType === "obsidian") {
      startEditingNote(page.id);
    }
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

  agentDraftList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-agent-draft-index]");
    if (!button) {
      return;
    }

    openAgentDraft(Number(button.dataset.agentDraftIndex));
  });

  agentActionSummary.addEventListener("click", () => {
    const response = createAgentResponse("summary");
    setNoteTab("agent");
    refreshAgentPrototype();
    agentTitle.textContent = response.title;
    agentSummary.textContent = response.summary;
    pushAgentMessage("assistant", response.html);
  });

  agentActionStructure.addEventListener("click", () => {
    const response = createAgentResponse("structure");
    setNoteTab("agent");
    refreshAgentPrototype();
    agentTitle.textContent = response.title;
    agentSummary.textContent = response.summary;
    pushAgentMessage("assistant", response.html);
  });

  agentActionDrafts.addEventListener("click", () => {
    const response = createAgentResponse("draft");
    setNoteTab("agent");
    refreshAgentPrototype();
    agentTitle.textContent = response.title;
    agentSummary.textContent = response.summary;
    renderAgentDraftCards(state.agentDraftSuggestions);
    pushAgentMessage("assistant", response.html);
  });

  agentChatForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = normalizeWhitespace(agentChatInput.value);
    if (!query) {
      return;
    }

    setNoteTab("agent");
    pushAgentMessage("user", `<p>${escapeHtml(query)}</p>`);
    const response = createAgentResponse(inferAgentIntent(query), query);
    refreshAgentPrototype(query);
    agentTitle.textContent = response.title;
    agentSummary.textContent = response.summary;
    renderAgentDraftCards(state.agentDraftSuggestions);
    pushAgentMessage("assistant", response.html);
    agentChatInput.value = "";
  });

  editNoteButton.addEventListener("click", () => {
    startEditingNote();
  });

  saveNoteButton.addEventListener("click", () => {
    saveEditorNote();
  });

  discardNoteButton.addEventListener("click", () => {
    closeNoteEditor(true);
  });

  cancelEditorButton.addEventListener("click", () => {
    closeNoteEditor(true);
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
  setSidebarTab("wikipedia");
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
