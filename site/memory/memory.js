const memoryItems = [
  {
    id: "nous:space:nous-container",
    title: "NOUS Container",
    recordKind: "已登记实体",
    period: "historical-active",
    source: "NOUS 2015–2025 / WEME",
    originalUrl: "https://nous.we-media.net/portfolio/",
    sourceStatus: "cataloged entity; reference metadata",
    status: "reference",
    capabilityTags: ["组织现场", "构造体验", "建立关系"],
    context: "以 40 英尺 ISO 集装箱为可移动、可制造、可进入的公共接口。",
    reusableModules: ["mobility", "rapid-assembly", "distributed-manufacturing", "remote-exhibition", "public-interface"],
    unresolvedQuestions: ["仍需按具体城市、事件、参与者与作品逐项登记。"],
    relevance: "它保留了 NOUS 如何把策展从固定地点转化为可传送协议的结构证据。",
  },
  {
    id: "nous:project:the-vault",
    title: "The Vault",
    recordKind: "已登记项目",
    period: "active-imported",
    source: "NOUS catalog / preserved project record",
    originalUrl: "../the-vault/",
    sourceStatus: "cataloged project; runtime preserved separately",
    status: "active",
    capabilityTags: ["转译知识", "孵化项目", "建立持续代理"],
    context: "一个将来源关系、Obsidian 笔记、三维 connectome 与关系发现型智能体置入同一知识环境的运行案例。",
    reusableModules: ["wikipedia-discovery", "obsidian-import", "obsidian-export", "graph-navigation", "bridge-discovery"],
    unresolvedQuestions: ["持续验证 AI 建议、来源引用与人类审阅之间的边界。"],
    relevance: "它证明知识库与智能体可以成为 NOUS共生体中可运行、可审查的一组作用面。",
  },
  {
    id: "nous:agent:weme-creative-agent",
    title: "WEME Creative Agent",
    recordKind: "已登记智能体",
    period: "active-development",
    source: "WEME Creative Agent / Rebui1t research",
    originalUrl: "https://we-media.net/",
    sourceStatus: "cataloged agent; source-aware development record",
    status: "active",
    capabilityTags: ["建立关系", "孵化项目", "建立持续代理"],
    context: "一个具有明确身份、审美立场、权限边界与记忆政策的创意协作主体。",
    reusableModules: ["creative-collaboration", "curatorial-research", "relationship-discovery", "project-generation", "source-aware-expression"],
    unresolvedQuestions: ["哪些已授权的 NOUS 资源可被持续调用，并如何将每次生成准确写回记忆？"],
    relevance: "它使 NOUS 的策展机制从一次性界面转向带有记录责任的持续行动。",
  },
  {
    id: "nous:source:nous-we-media-net",
    title: "NOUS Historical Corpus 2015–2025",
    recordKind: "来源节点",
    period: "2015–2025",
    source: "nous.we-media.net",
    originalUrl: "https://nous.we-media.net/",
    sourceStatus: "verified source inventory; reference-and-metadata-only",
    status: "reference",
    capabilityTags: ["组织现场", "建立关系", "构造体验"],
    context: "保存空间、展览、跨城市事件、设计对象与项目的历史来源，是当前 NOUS 生成机制的情境记忆。",
    reusableModules: ["space-history", "exhibition-history", "distributed-event-history", "design-and-object-portfolio"],
    unresolvedQuestions: ["需要从已核验路由中逐项建立项目级的参与者、方法、结果与权利记录。"],
    relevance: "它提供 NOUS 如何在不同地点、媒介与主体之间发生的原始情境线索。",
  },
  {
    id: "nous:source:we-media-net",
    title: "WEME Organization Memory",
    recordKind: "来源节点",
    period: "active",
    source: "we-media.net",
    originalUrl: "https://we-media.net/",
    sourceStatus: "verified source inventory; reference-and-metadata-only",
    status: "reference",
    capabilityTags: ["建立关系", "孵化项目", "建立持续代理"],
    context: "记录组织身份、项目治理、研究发布与 WEME Creative Agent 的连续行动主体。",
    reusableModules: ["organization-history", "creative-agent-narrative", "project-index", "research-publication"],
    unresolvedQuestions: ["需要区分仍有效的组织能力与已经结束的服务承诺。"],
    relevance: "它让新的智能体行动能够追溯其授权主体、组织关系与项目脉络。",
  },
  {
    id: "nous:source:weme-im",
    title: "WEME Procedural Memory",
    recordKind: "来源节点",
    period: "active-historical-surface",
    source: "weme.im",
    originalUrl: "https://weme.im/",
    sourceStatus: "verified source inventory; reference-and-metadata-only",
    status: "archived",
    capabilityTags: ["管理数字资产", "构造体验"],
    context: "保留品牌、网站、数字服务与交付经验的程序性记忆，而不再作为当前业务入口。",
    reusableModules: ["brand-history", "web-service-history", "visual-reference"],
    unresolvedQuestions: ["哪些网站与服务层的方法能够进入当前系统，哪些应仅作为历史界面保存？"],
    relevance: "它帮助系统识别曾经的数字交付能力，同时避免恢复失效的业务承诺。",
  },
  {
    id: "nous:source:rebui1t-com",
    title: "Rebui1t Experimental Memory",
    recordKind: "来源节点",
    period: "active",
    source: "rebui1t.com",
    originalUrl: "https://rebui1t.com/",
    sourceStatus: "verified source inventory; reference-and-metadata-only",
    status: "reference",
    capabilityTags: ["转译知识", "构造体验", "建立持续代理"],
    context: "记录 AI、生成艺术、研究原型与机器美学实验，是 WEME Creative Agent 的实验记忆。",
    reusableModules: ["ai-projects", "generated-art", "post-human-research", "agent-and-listening-experiments"],
    unresolvedQuestions: ["需要逐项筛选哪些实验具有可验证的来源、权利与当前系统关联。"],
    relevance: "它为新的项目提供实验方法与原型线索，而不替代 NOUS 的公共身份。",
  },
];

const memoryList = document.querySelector("#memory-list");
const memoryCount = document.querySelector("#memory-count");
const memoryFilters = [...document.querySelectorAll("[data-filter]")];

function buildTextElement(tagName, className, content) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  element.textContent = content;
  return element;
}

function addDetailRow(container, label, content) {
  const row = document.createElement("div");
  const term = buildTextElement("dt", "", label);
  const description = buildTextElement("dd", "", content);
  row.append(term, description);
  container.append(row);
}

function renderMemory(filter = "all") {
  const filteredItems = memoryItems.filter((item) => (
    filter === "all" || item.capabilityTags.includes(filter)
  ));

  memoryList.replaceChildren();
  memoryCount.textContent = `当前显示 ${filteredItems.length} 个已登记记录`;

  filteredItems.forEach((item) => {
    const article = document.createElement("article");
    article.className = "memory-record";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "memory-record-toggle";
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", `detail-${item.id.replace(/[^a-z0-9]+/gi, "-")}`);

    const index = buildTextElement("span", "memory-record-id", item.id);
    const title = buildTextElement("strong", "", item.title);
    const kind = buildTextElement("em", "", item.recordKind);
    const capability = buildTextElement("span", "memory-record-tags", item.capabilityTags.join(" / "));
    button.append(index, title, kind, capability);

    const detail = document.createElement("div");
    detail.className = "memory-record-detail";
    detail.id = button.getAttribute("aria-controls");
    detail.hidden = true;
    const overview = buildTextElement("p", "memory-record-context", item.context);
    const metadata = document.createElement("dl");
    addDetailRow(metadata, "来源状态", item.sourceStatus);
    addDetailRow(metadata, "公共状态", item.status);
    addDetailRow(metadata, "可复用模块", item.reusableModules.join(" / "));
    addDetailRow(metadata, "未完成部分", item.unresolvedQuestions.join(" "));
    addDetailRow(metadata, "与当前系统的关系", item.relevance);
    const sourceLink = document.createElement("a");
    sourceLink.href = item.originalUrl;
    sourceLink.rel = "noreferrer";
    sourceLink.className = "memory-source-link";
    sourceLink.textContent = `查看来源：${item.source}`;
    detail.append(overview, metadata, sourceLink);

    button.addEventListener("click", () => {
      const willOpen = detail.hidden;
      detail.hidden = !willOpen;
      button.setAttribute("aria-expanded", String(willOpen));
    });

    article.append(button, detail);
    memoryList.append(article);
  });
}

memoryFilters.forEach((button) => {
  button.addEventListener("click", () => {
    const { filter } = button.dataset;
    memoryFilters.forEach((item) => {
      item.setAttribute("aria-pressed", String(item === button));
    });
    renderMemory(filter);
  });
});

renderMemory();
