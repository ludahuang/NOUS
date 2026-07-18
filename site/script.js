const lineageContent = {
  space: {
    index: "01 / 2015",
    title: "空间",
    description: "以标准化集装箱作为可移动、可复制、可共同制造的公共接口。",
  },
  exhibition: {
    index: "02 / CURATION",
    title: "展览",
    description: "把作品、参与者、条件与发生过程共同纳入策展对象。",
  },
  network: {
    index: "03 / DISTRIBUTED",
    title: "网络",
    description: "让不同城市与现场通过影像、声音、数据和协作协议彼此连接。",
  },
  data: {
    index: "04 / STRUCTURE",
    title: "数据策展",
    description: "把事件留下的关系与来源转化为可传送、可再次使用的结构。",
  },
  knowledge: {
    index: "05 / THE VAULT",
    title: "知识环境",
    description: "知识不再只是文档集合，而是可以导航、发现和生成连接的空间。",
  },
  agent: {
    index: "06 / CURRENT",
    title: "Creative Agent",
    description: "让策展机制获得可持续行动、保留来源并提出新关系的主体。",
  },
};

const lineageNodes = document.querySelectorAll("[data-node]");
const lineageIndex = document.querySelector("#lineage-index");
const lineageTitle = document.querySelector("#lineage-title");
const lineageDescription = document.querySelector("#lineage-description");

lineageNodes.forEach((node) => {
  node.addEventListener("click", () => {
    const content = lineageContent[node.dataset.node];
    if (!content) {
      return;
    }

    lineageNodes.forEach((item) => {
      const isSelected = item === node;
      item.classList.toggle("is-active", isSelected);
      item.setAttribute("aria-pressed", String(isSelected));
    });

    lineageIndex.textContent = content.index;
    lineageTitle.textContent = content.title;
    lineageDescription.textContent = content.description;
  });
});
