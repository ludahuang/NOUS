const clusterSpecs = [
  {
    id: "cortical-systems",
    name: "Cortical Systems",
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

const allTitles = clusterSpecs.flatMap((cluster) => cluster.titles);
const lowerTitleMap = new Map(allTitles.map((title) => [title.toLowerCase(), title]));
const clusterByTitle = new Map();
clusterSpecs.forEach((cluster) => {
  cluster.titles.forEach((title) => {
    clusterByTitle.set(title, cluster);
  });
});

function resolveTitle(rawTitle = "") {
  const decoded = decodeURIComponent(rawTitle).replace(/_/g, " ").trim();
  return lowerTitleMap.get(decoded.toLowerCase()) || decoded;
}

function uniqueTitles(titles) {
  return [...new Set(titles.filter(Boolean).map(resolveTitle))];
}

function getClusterPeers(title) {
  const cluster = clusterByTitle.get(title);
  if (!cluster) {
    return [];
  }
  return cluster.titles.filter((entry) => entry !== title);
}

function buildLinks(title) {
  const peers = getClusterPeers(title);
  const cluster = clusterByTitle.get(title);
  const links = new Set();

  peers.slice(0, 3).forEach((peer) => links.add(peer));

  if (title !== "Connectome") {
    links.add("Connectome");
  }

  if (cluster?.id !== "connectomics-core") {
    links.add("Brain mapping");
  }

  if (cluster?.id === "limbic-memory") {
    links.add("Neural circuit");
    links.add("Diffusion MRI");
  }

  if (cluster?.id === "cellular-anatomy") {
    links.add("Neural circuit");
    links.add("Neuroplasticity");
  }

  if (cluster?.id === "relay-pathways") {
    links.add("White matter");
    links.add("Diffusion MRI");
  }

  if (cluster?.id === "cortical-systems") {
    links.add("Somatosensory system");
    links.add("Thalamus");
  }

  if (cluster?.id === "motor-coordination") {
    links.add("Basal ganglia");
    links.add("Spinal cord");
  }

  if (cluster?.id === "circuit-dynamics") {
    links.add("Memory");
    links.add("Neuron");
  }

  if (title === "Connectome") {
    [
      "Connectomics",
      "Human Connectome Project",
      "Brain mapping",
      "Neuroinformatics",
      "Diffusion MRI",
      "Hippocampus",
      "Thalamus",
      "Neuron",
      "Cerebral cortex",
      "Cerebellum",
      "Neural circuit",
    ].forEach((entry) => links.add(entry));
  }

  if (title === "Brain mapping") {
    ["Human Connectome Project", "Diffusion MRI", "Cerebral cortex", "Thalamus"].forEach((entry) =>
      links.add(entry),
    );
  }

  if (title === "Hippocampus") {
    ["Amygdala", "Memory", "Entorhinal cortex", "Neural circuit"].forEach((entry) => links.add(entry));
  }

  return uniqueTitles([...links]).filter((entry) => entry !== title);
}

function createSummary(title) {
  const cluster = clusterByTitle.get(title);
  const links = buildLinks(title);
  return {
    title,
    description: cluster ? `${cluster.name} topic` : "Knowledge topic",
    extract: `${title} is a mocked Wikipedia article used for deterministic The Vault agent verification. It is connected to ${links.slice(
      0,
      4,
    ).join(", ")} inside the fixture connectome.`,
    content_urls: {
      desktop: {
        page: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
      },
    },
  };
}

function createLinksPayload(title) {
  return {
    batchcomplete: true,
    query: {
      pages: [
        {
          pageid: Math.abs(title.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)),
          ns: 0,
          title,
          links: buildLinks(title).map((entry) => ({ ns: 0, title: entry })),
        },
      ],
    },
  };
}

function createSearchPayload(query) {
  const normalized = query.trim().toLowerCase();
  const titles = allTitles
    .filter((title) => title.toLowerCase().includes(normalized))
    .sort((left, right) => {
      const leftExact = left.toLowerCase() === normalized ? -1 : 0;
      const rightExact = right.toLowerCase() === normalized ? -1 : 0;
      return leftExact - rightExact || left.localeCompare(right);
    })
    .slice(0, 6);

  return {
    batchcomplete: true,
    query: {
      search: titles.map((title) => ({
        title,
        snippet: `${title} in the mocked The Vault Wikipedia fixture.`,
      })),
    },
  };
}

export async function installWikipediaMock(page) {
  await page.route("https://en.wikipedia.org/api/rest_v1/page/summary/**", async (route) => {
    const url = new URL(route.request().url());
    const title = resolveTitle(url.pathname.split("/").pop() || "");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(createSummary(title)),
    });
  });

  await page.route("https://en.wikipedia.org/w/api.php**", async (route) => {
    const url = new URL(route.request().url());
    const searchType = url.searchParams.get("list");
    const propType = url.searchParams.get("prop");

    if (searchType === "search") {
      const query = url.searchParams.get("srsearch") || "";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(createSearchPayload(query)),
      });
      return;
    }

    if (propType === "links") {
      const title = resolveTitle(url.searchParams.get("titles") || "");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(createLinksPayload(title)),
      });
      return;
    }

    await route.continue();
  });
}
