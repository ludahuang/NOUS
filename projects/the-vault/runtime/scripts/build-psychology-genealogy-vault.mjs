import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(repoRoot, "vaults", "Psychology_Genealogy_Atlas");

const clusters = [
  {
    folder: "01_起源与学派",
    title: "起源与学派",
    notes: [
      {
        file: "history-of-psychology.md",
        title: "心理学思想史",
        aliases: ["History of Psychology"],
        description: "从哲学心灵问题、实验心理学到认知科学的主要分岔与继承关系。",
        tags: ["cluster/history", "role/hub", "genealogy"],
        summary: "心理学不是单一路线的累积史，而是关于经验、行为、心智与意识的多条解释传统不断竞争、分化和重新连接的历史。",
        claims: [
          "哲学提供心灵、自我与知识问题，实验传统把其中一部分转化为可测量现象。",
          "精神分析、行为主义、格式塔与功能主义定义了不同的研究对象和证据标准。",
          "认知革命重新引入表征与信息加工，并最终与神经科学和计算模型汇合。",
        ],
        tensions: ["谱系关系不等于理论正确性。", "新范式通常保留而非彻底消灭旧问题。"],
        links: ["哲学与医学前史", "实验心理学与心理物理学", "精神分析", "行为主义", "认知革命", "心理学谱系总图"],
      },
      {
        file: "philosophical-and-medical-roots.md",
        title: "哲学与医学前史",
        aliases: ["Philosophical Roots of Psychology"],
        description: "心理学形成之前关于灵魂、经验、自我、身体和认识的思想资源。",
        tags: ["cluster/history", "philosophy", "genealogy"],
        summary: "从 Aristotle 的生命功能论、Descartes 的身心二元论，到 Hume 的自我束和 Kant 的统觉统一，心理学的核心问题在成为实验对象之前已经有漫长历史。",
        claims: [
          "古典思想同时讨论身体气质、感知、记忆、想象与修身。",
          "经验主义和理性主义塑造了后来关于学习、知觉与先天结构的争论。",
          "佛教无我、庄子自我边界与关系性人格提供了不同于实体自我的路径。",
        ],
        tensions: ["不能把非现代传统简单翻译成当代心理学术语。", "哲学概念与实验操作化之间始终存在落差。"],
        links: ["心理学思想史", "意识与自我", "自我模型谱系", "现象学与神经现象学"],
      },
      {
        file: "experimental-psychology-and-psychophysics.md",
        title: "实验心理学与心理物理学",
        aliases: ["Experimental Psychology", "Psychophysics"],
        description: "把感觉、时间、记忆与个体差异转化为可测量对象的制度与方法传统。",
        tags: ["cluster/history", "experiment", "measurement"],
        summary: "Weber、Fechner、Donders、Wundt 与 Ebbinghaus 建立了刺激、感觉、反应时间和记忆之间的定量研究路径，使心理学成为独立实验学科。",
        claims: [
          "心理物理学连接物理刺激与主观感觉。",
          "心理计时用任务差异推断不可直接观察的心理过程。",
          "实验室制度化提高了控制力，也带来生态有效性问题。",
        ],
        tensions: ["测量指标不是心理现象本身。", "可重复的实验效应未必等于真实生活中的重要机制。"],
        links: ["心理学思想史", "心理测量与证据", "第一第二第三人称方法", "认知与信息加工"],
      },
      {
        file: "psychoanalysis.md",
        title: "精神分析",
        aliases: ["Psychoanalysis"],
        description: "以无意识、冲突、防御、移情和早期关系解释症状与人格的传统。",
        tags: ["cluster/history", "unconscious", "clinical"],
        summary: "Freud 开启的精神分析把症状理解为无意识冲突的表达，随后由 Jung、Klein、Winnicott 与 Lacan 等人扩展到象征、客体关系和语言结构。",
        claims: [
          "心理生活并不完全向自我透明。",
          "症状可能具有历史、关系和防御功能。",
          "治疗关系本身可以成为观察和改变心理模式的现场。",
        ],
        tensions: ["经典理论的可证伪性和经验支持并不均衡。", "解释深度不能替代可检验性。"],
        links: ["心理学思想史", "发展依恋与治疗", "第一第二第三人称方法", "记忆身份语言桥"],
      },
      {
        file: "behaviorism.md",
        title: "行为主义",
        aliases: ["Behaviorism"],
        description: "以可观察行为、条件作用和环境后果为核心的心理学路线。",
        tags: ["cluster/history", "behavior", "learning"],
        summary: "Watson、Pavlov、Thorndike 与 Skinner 将心理学聚焦于刺激、反应、强化历史和可观察行为，建立了强有力的学习与干预技术。",
        claims: [
          "行为可以由环境条件和强化后果系统研究。",
          "操作性条件作用解释行为如何被后果选择。",
          "行为主义推动了实验控制，也压缩了内部表征和意义问题。",
        ],
        tensions: ["可观察性不等于解释完整性。", "环境塑造不能消除身体、认知与文化层次。"],
        links: ["心理学思想史", "学习与强化", "认知革命", "发展依恋与治疗"],
      },
      {
        file: "cognitive-revolution.md",
        title: "认知革命",
        aliases: ["Cognitive Revolution"],
        description: "信息论、计算、语言学和心理实验共同推动的心智研究转向。",
        tags: ["cluster/history", "cognition", "computation"],
        summary: "Shannon、Turing、Miller、Chomsky、Neisser、Newell 与 Simon 等人的工作使表征、编码、储存、检索和算法重新成为心理学的合法解释对象。",
        claims: [
          "心智被建模为信息处理系统。",
          "行为数据可以用于推断内部表征与加工阶段。",
          "计算隐喻连接了心理学、语言学、人工智能和神经科学。",
        ],
        tensions: ["信息处理隐喻可能忽略身体、情感和环境。", "计算能力不自动意味着意识。"],
        links: ["心理学思想史", "行为主义", "认知与信息加工", "智能意识与机器伦理", "预测加工与主动推断"],
      },
    ],
  },
  {
    folder: "02_心智行为与改变",
    title: "心智、行为与改变",
    notes: [
      {
        file: "psychological-mechanisms-map.md",
        title: "心理机制地图",
        aliases: ["Psychological Mechanisms Map"],
        description: "认知、学习、记忆、注意、发展与干预机制的簇内入口。",
        tags: ["cluster/mechanisms", "role/hub", "cognition"],
        summary: "机制层的问题不是寻找唯一原因，而是建立能够描述、解释、预测和干预心理现象的多层模型。",
        claims: [
          "同一行为可能同时受到学习史、记忆、注意、情绪、关系与文化影响。",
          "机制模型需要明确变量、尺度和证据强度。",
          "应用改变与机制解释应互相约束。",
        ],
        tensions: ["机制不等于意义。", "群体平均规律未必适用于具体个体。"],
        links: ["认知与信息加工", "学习与强化", "记忆", "注意", "发展依恋与治疗", "How Why What"],
      },
      {
        file: "cognition-and-information-processing.md",
        title: "认知与信息加工",
        aliases: ["Cognition", "Information Processing"],
        description: "知觉、语言、推理、工作记忆与决策中的表征和加工机制。",
        tags: ["cluster/mechanisms", "cognition", "representation"],
        summary: "认知心理学研究刺激如何被选择、编码、保持、转换并用于推理和行动，是认知革命之后心理机制研究的核心。",
        claims: [
          "注意决定哪些信息获得进一步加工。",
          "工作记忆支持短时保持、操作和任务控制。",
          "表征模型需要通过行为、计算和神经证据共同检验。",
        ],
        tensions: ["心智是否必须被理解为符号和表征系统？", "实验任务中的加工阶段是否存在于自然情境？"],
        links: ["心理机制地图", "认知革命", "注意", "记忆", "智能意识与机器伦理"],
      },
      {
        file: "learning-and-reinforcement.md",
        title: "学习与强化",
        aliases: ["Learning", "Reinforcement Learning"],
        description: "条件作用、观察学习、预测误差和行为改变的共同机制空间。",
        tags: ["cluster/mechanisms", "learning", "prediction-error"],
        summary: "学习研究从条件反射和强化后果扩展到观察学习、认知地图、奖赏预测误差与计算强化学习。",
        claims: [
          "经验通过预测误差改变未来行为。",
          "学习既可以是习惯性的，也可以依赖目标、模型和社会观察。",
          "行为改变需要同时考虑奖励结构、环境线索和主体价值。",
        ],
        tensions: ["奖励最大化不能完整解释意义与价值。", "实验学习规律在复杂社会环境中会受到制度和关系调节。"],
        links: ["心理机制地图", "行为主义", "记忆", "预测加工与主动推断", "发展依恋与治疗"],
      },
      {
        file: "memory.md",
        title: "记忆",
        aliases: ["Memory"],
        description: "编码、巩固、提取和重构共同构成的动态系统。",
        tags: ["cluster/mechanisms", "memory", "identity"],
        summary: "记忆不是固定档案的回放，而是在当前线索、身体状态和既有模型约束下进行的重构过程。",
        claims: [
          "编码、巩固与提取由不同机制和时间尺度支持。",
          "记忆连接学习、预测、情绪和自传身份。",
          "遗忘既可能是限制，也可能是适应性选择。",
        ],
        tensions: ["人格连续性是否依赖记忆？", "被重构的记忆如何仍能承担证据功能？"],
        links: ["心理机制地图", "学习与强化", "神经可塑性与赫布学习", "自我模型谱系", "记忆身份语言桥"],
      },
      {
        file: "attention.md",
        title: "注意",
        aliases: ["Attention"],
        description: "选择性加工、资源分配、任务控制与意识访问之间的桥梁。",
        tags: ["cluster/mechanisms", "attention", "consciousness"],
        summary: "注意调节信息的优先级和精度，但它与意识并不等同：信息可以受到注意而未必成为体验，也可能被体验而未被主动报告。",
        claims: [
          "注意受到目标、显著性、习惯和身体需求共同影响。",
          "选择性注意可以增强部分信息并抑制竞争信息。",
          "注意既是认知控制机制，也是意识理论中的关键争议点。",
        ],
        tensions: ["注意对意识是必要条件、充分条件，还是仅相关机制？", "专注训练何时变成对结构问题的个体化处理？"],
        links: ["心理机制地图", "认知与信息加工", "全球工作空间理论", "高阶与循环处理理论", "预测焦虑现实桥"],
      },
      {
        file: "development-attachment-and-therapy.md",
        title: "发展依恋与治疗",
        aliases: ["Development, Attachment and Therapy"],
        description: "发展、关系、依恋和心理治疗如何共同解释可塑性与改变。",
        tags: ["cluster/mechanisms", "development", "attachment", "therapy"],
        summary: "Piaget、Vygotsky、Bowlby、Ainsworth 与 Bronfenbrenner 等传统显示，心理能力在身体成熟、照护关系、文化工具和生态系统中逐步形成。",
        claims: [
          "依恋经验塑造调节、探索和关系预期。",
          "心理治疗通过认知、行为、情绪、价值和关系过程产生改变。",
          "个体发展始终嵌入家庭、制度和文化环境。",
        ],
        tensions: ["发展阶段模型可能掩盖文化差异。", "不能把结构性压力完全个体化为心理症状。"],
        links: ["心理机制地图", "精神分析", "学习与强化", "文化历史心理学", "身体心智社会桥"],
      },
    ],
  },
  {
    folder: "03_脑身体与环境",
    title: "脑、身体与环境",
    notes: [
      {
        file: "brain-body-and-environment.md",
        title: "脑身体与环境",
        aliases: ["Brain, Body and Environment"],
        description: "从神经元到身体调节、行动和环境耦合的多尺度心智入口。",
        tags: ["cluster/embodiment", "role/hub", "neuroscience"],
        summary: "心智不是孤立大脑内部的单一计算，而是神经系统、身体调节、行动能力和环境可供性持续耦合的过程。",
        claims: [
          "神经机制为心理过程提供实现条件，但不是唯一有效解释层。",
          "身体状态通过内感受、情感和行动倾向参与认知。",
          "环境结构能够承担部分记忆、控制和问题求解功能。",
        ],
        tensions: ["神经相关物不能直接充当心理原因。", "具身解释需要提出比隐喻更具体的机制。"],
        links: ["神经可塑性与赫布学习", "预测加工与主动推断", "具身生成与生态心智", "情绪内感受与生命调节", "跨尺度解释", "身体心智社会桥"],
      },
      {
        file: "hebbian-learning-and-neuroplasticity.md",
        title: "神经可塑性与赫布学习",
        aliases: ["Hebbian Learning", "Neuroplasticity"],
        description: "经验如何通过突触和细胞集合改变神经网络。",
        tags: ["cluster/embodiment", "plasticity", "learning"],
        summary: "Hebb 的细胞集合思想和后续突触可塑性研究说明，共同活动能够改变连接强度，使经验在神经网络中留下结构痕迹。",
        claims: [
          "学习需要网络连接随经验改变。",
          "可塑性受到时间、奖赏、注意和身体状态调节。",
          "神经变化与心理改变需要通过跨尺度模型连接。",
        ],
        tensions: ["发现可塑性并不等于解释具体记忆内容。", "大脑可塑性不意味着任何改变都容易或无限。"],
        links: ["脑身体与环境", "学习与强化", "记忆", "跨尺度解释"],
      },
      {
        file: "predictive-processing-and-active-inference.md",
        title: "预测加工与主动推断",
        aliases: ["Predictive Processing", "Active Inference"],
        description: "以生成模型、预测误差、精度加权和行动解释感知与调节。",
        tags: ["cluster/embodiment", "prediction", "generative-model"],
        summary: "预测加工把感知理解为由先验模型与感觉误差共同约束的生成过程；主动推断进一步把行动视为改变输入和维持生命状态的方式。",
        claims: [
          "知觉不是被动读取，而是受证据约束的模型更新。",
          "注意可以被理解为对预测误差精度的调节。",
          "身体调节和行动为预测模型提供持续校准。",
        ],
        tensions: ["框架过宽时可能失去可证伪性。", "自由能原理、预测编码和具体意识机制不能简单等同。"],
        links: ["脑身体与环境", "认知革命", "学习与强化", "注意", "情绪内感受与生命调节", "预测焦虑现实桥"],
      },
      {
        file: "embodied-enactive-and-ecological-mind.md",
        title: "具身生成与生态心智",
        aliases: ["Embodied Mind", "Enactivism", "Ecological Psychology"],
        description: "把心智理解为脑、身体、行动与环境共同生成的过程。",
        tags: ["cluster/embodiment", "enactivism", "ecological"],
        summary: "Gibson、Varela、Thompson、Rosch、Merleau-Ponty、Noë 与 Clark 等路线挑战大脑中心主义，强调可供性、感觉运动规律和环境耦合。",
        claims: [
          "知觉服务于行动，并依赖身体拥有的能力。",
          "意义在主体与环境的关系中生成。",
          "工具和外部符号系统可以成为认知过程的一部分。",
        ],
        tensions: ["离线想象、梦和抽象推理如何纳入行动耦合模型？", "延展认知的系统边界在哪里？"],
        links: ["脑身体与环境", "哲学与医学前史", "现象学与神经现象学", "文化历史心理学", "身体心智社会桥"],
      },
      {
        file: "affect-interoception-and-regulation.md",
        title: "情绪内感受与生命调节",
        aliases: ["Affect", "Interoception", "Emotion"],
        description: "情感价性、身体预算、内感受和生命调节如何参与意识与行动。",
        tags: ["cluster/embodiment", "emotion", "interoception"],
        summary: "Damasio、Panksepp、Barrett、Seth 与 Solms 等路线把情感和内感受置于身体调节、自我体验和意识问题的中心。",
        claims: [
          "情绪组织注意、学习、行动倾向和社会沟通。",
          "内感受把身体状态转化为主体可用的信息。",
          "生命需求可能为体验提供最基本的价值维度。",
        ],
        tensions: ["没有身体需求的系统能否具有感受性？", "基本情绪与建构主义模型如何比较？"],
        links: ["脑身体与环境", "预测加工与主动推断", "意识与自我", "发展依恋与治疗", "预测焦虑现实桥"],
      },
      {
        file: "levels-of-explanation.md",
        title: "跨尺度解释",
        aliases: ["Levels of Explanation"],
        description: "连接分子、回路、脑网络、个体、关系、文化与技术生态的解释原则。",
        tags: ["cluster/embodiment", "scale", "methodology"],
        summary: "心理现象跨越分子、神经元、脑网络、个体、二人关系、群体和社会文化尺度；每一层都有自己的有效变量。",
        claims: [
          "不可直接从神经元推出人格或文化意义。",
          "社会结构不能自动解释全部个体差异。",
          "跨尺度研究需要明确桥接变量和时间尺度。",
        ],
        tensions: ["还原论提供机制精度，却可能丢失意义。", "整体论保留情境，却可能缺乏可检验桥梁。"],
        links: ["脑身体与环境", "神经可塑性与赫布学习", "心理测量与证据", "开放科学与自我修正", "身体心智社会桥"],
      },
    ],
  },
  {
    folder: "04_意识与自我",
    title: "意识与自我",
    notes: [
      {
        file: "consciousness-and-self.md",
        title: "意识与自我",
        aliases: ["Consciousness and Self"],
        description: "意识水平、意识内容、主体经验和自我模型的理论入口。",
        tags: ["cluster/consciousness", "role/hub", "self"],
        summary: "意识研究需要区分体验内容、可报告性、清醒水平、注意、元认知与自我意识，否则不同理论可能在解释不同对象却被误当作直接竞争。",
        claims: [
          "现象意识关注体验起来是什么样。",
          "通达意识关注信息能否用于报告、推理和控制。",
          "自我意识涉及身体所有权、能动感、元认知和叙事身份。",
        ],
        tensions: ["神经相关物何时构成机制解释？", "语言报告对动物、婴儿和人工系统是否公平？"],
        links: ["全球工作空间理论", "整合信息理论", "高阶与循环处理理论", "现象学与神经现象学", "自我模型谱系", "智能意识与机器伦理"],
      },
      {
        file: "global-workspace-theory.md",
        title: "全球工作空间理论",
        aliases: ["Global Workspace Theory", "GNWT"],
        description: "以局部竞争、非线性点火和全局广播解释意识访问。",
        tags: ["cluster/consciousness", "workspace", "broadcast"],
        summary: "Baars 的全球工作空间和 Dehaene、Changeux 的神经版本认为，部分局部信息通过竞争获得全局广播，从而被工作记忆、报告和灵活控制使用。",
        claims: [
          "意识访问对应跨模块可用性。",
          "非线性点火使信息从局部处理转为广域协调。",
          "理论特别擅长解释报告、任务控制和工作记忆。",
        ],
        tensions: ["全局广播是否解释体验本身？", "前额叶活动是否混入报告和任务要求？"],
        links: ["意识与自我", "注意", "认知与信息加工", "高阶与循环处理理论", "智能意识与机器伦理"],
      },
      {
        file: "integrated-information-theory.md",
        title: "整合信息理论",
        aliases: ["Integrated Information Theory", "IIT"],
        description: "从体验公理和系统内在因果结构出发的形式化意识理论。",
        tags: ["cluster/consciousness", "integration", "formal-theory"],
        summary: "IIT 将意识与系统具有的整合、区分和内在因果力联系起来，试图直接描述体验结构而不只解释报告能力。",
        claims: [
          "意识被视为系统对自身具有的因果结构。",
          "整合与区分共同限定体验的统一性和丰富性。",
          "理论尝试从现象学公理走向形式量化。",
        ],
        tensions: ["Φ 的实际计算和经验检验困难。", "理论可能产生反直觉的意识归因。"],
        links: ["意识与自我", "全球工作空间理论", "高阶与循环处理理论", "跨尺度解释", "智能意识与机器伦理"],
      },
      {
        file: "higher-order-and-recurrent-theories.md",
        title: "高阶与循环处理理论",
        aliases: ["Higher-Order Theory", "Recurrent Processing Theory"],
        description: "比较高阶表征与感觉区域再入加工对意识的不同解释。",
        tags: ["cluster/consciousness", "metacognition", "recurrent-processing"],
        summary: "高阶理论强调心理状态被更高阶表征或被主体知道；循环处理理论则强调感觉区域内部反馈和局部再入加工。",
        claims: [
          "高阶路线连接意识、元认知和主观确定性。",
          "循环路线强调早期知觉意识不必等待全局报告。",
          "两者对前额叶、报告和局部反馈的作用给出不同预测。",
        ],
        tensions: ["婴儿和动物是否需要高阶表征才能有体验？", "局部循环是否足以解释跨模态统一？"],
        links: ["意识与自我", "全球工作空间理论", "整合信息理论", "注意", "第一第二第三人称方法"],
      },
      {
        file: "phenomenology-and-neurophenomenology.md",
        title: "现象学与神经现象学",
        aliases: ["Phenomenology", "Neurophenomenology"],
        description: "以第一人称体验结构和神经动力学双向约束意识研究。",
        tags: ["cluster/consciousness", "phenomenology", "first-person"],
        summary: "现象学细化身体、时间、意向性和主体位置；Varela 的神经现象学进一步主张训练过的第一人称资料与神经动力学互相约束。",
        claims: [
          "主观体验不是噪声，而是需要方法训练的研究对象。",
          "第一人称描述必须与行为和神经证据形成可追踪关系。",
          "身体主体性连接体验结构与行动世界。",
        ],
        tensions: ["体验报告受到记忆和语言塑形。", "第一人称资料如何实现跨主体比较？"],
        links: ["意识与自我", "哲学与医学前史", "具身生成与生态心智", "第一第二第三人称方法", "自我模型谱系"],
      },
      {
        file: "self-models.md",
        title: "自我模型谱系",
        aliases: ["Self Models", "Theories of Self"],
        description: "身体自我、行动自我、叙事自我、社会自我与数字自我的多重结构。",
        tags: ["cluster/consciousness", "self", "identity"],
        summary: "自我更像由身体、记忆、行动、他人、语言和制度共同维持的一组动态模型，而不是等待被发现的固定实体。",
        claims: [
          "最小自我提供当下第一人称中心和能动感。",
          "叙事自我通过自传记忆和语言维持连续身份。",
          "社会与文化自我依赖角色、规范、声誉和关系。",
        ],
        tensions: ["模型是解释自我，还是取消自我？", "数字代理和人工代理能否继承主体责任？"],
        links: ["意识与自我", "哲学与医学前史", "记忆", "现象学与神经现象学", "记忆身份语言桥", "智能意识与机器伦理"],
      },
    ],
  },
  {
    folder: "05_文化方法与可信度",
    title: "文化、方法与可信度",
    notes: [
      {
        file: "culture-methods-and-scientific-trust.md",
        title: "文化方法与科学可信度",
        aliases: ["Culture, Methods and Scientific Trust"],
        description: "文化、权力、测量、主体位置和开放科学的簇内入口。",
        tags: ["cluster/methods", "role/hub", "culture"],
        summary: "心理学知识由样本、测量工具、研究制度和文化前提共同生产；可信度来自持续暴露假设、纠正误差和比较不同主体位置。",
        claims: [
          "研究对象和正常标准具有历史与文化条件。",
          "测量、实验和统计模型都需要构念效度。",
          "开放科学把心理学理解为持续纠错的程序而非固定答案库。",
        ],
        tensions: ["标准化提高比较性，也可能抹平文化差异。", "批判分析需要提出可行动的替代研究设计。"],
        links: ["文化历史心理学", "社会心理与权力", "心理测量与证据", "第一第二第三人称方法", "开放科学与自我修正", "身体心智社会桥"],
      },
      {
        file: "cultural-historical-psychology.md",
        title: "文化历史心理学",
        aliases: ["Cultural-Historical Psychology", "Cultural Psychology"],
        description: "心理功能如何由语言、工具、关系、历史和文化实践中介。",
        tags: ["cluster/methods", "culture", "development"],
        summary: "Vygotsky、Luria、Cole、Markus 与 Kitayama 等路线表明，高级心理功能和自我形式在文化工具、社会互动和历史制度中发展。",
        claims: [
          "语言和符号工具重组注意、记忆和问题求解。",
          "独立自我与互依自我是不同文化实践中的倾向。",
          "心理机制必须在具体生活世界中检验。",
        ],
        tensions: ["文化差异不能被固定成本质化群体标签。", "普遍机制与地方知识如何互相约束？"],
        links: ["文化方法与科学可信度", "发展依恋与治疗", "具身生成与生态心智", "社会心理与权力", "身体心智社会桥"],
      },
      {
        file: "social-psychology-and-power.md",
        title: "社会心理与权力",
        aliases: ["Social Psychology and Power"],
        description: "从众、服从、社会认同、规范、制度与主体生产的共同空间。",
        tags: ["cluster/methods", "social-psychology", "power"],
        summary: "Asch、Milgram、Festinger、Tajfel、Foucault、Fanon 与解放心理学传统揭示，判断和自我并非只由个体内部机制产生。",
        claims: [
          "群体规范和角色能够改变判断与行动。",
          "社会认同影响内群体合作、边界和偏见。",
          "制度与知识分类参与定义正常、异常和责任。",
        ],
        tensions: ["经典实验的情境和伦理边界如何影响结论？", "心理解释何时遮蔽权力与物质条件？"],
        links: ["文化方法与科学可信度", "文化历史心理学", "发展依恋与治疗", "第一第二第三人称方法", "身体心智社会桥"],
      },
      {
        file: "psychological-measurement-and-evidence.md",
        title: "心理测量与证据",
        aliases: ["Psychometrics", "Psychological Measurement"],
        description: "信度、效度、潜变量、量表和操作化如何把心理概念变成证据。",
        tags: ["cluster/methods", "measurement", "evidence"],
        summary: "心理测量把不可直接观察的构念连接到项目、任务和行为指标，但任何分数都依赖理论定义、样本结构和测量模型。",
        claims: [
          "信度描述测量一致性，不能保证测量的是正确构念。",
          "效度需要积累多种证据，而不是一次统计检验。",
          "跨文化使用量表需要检查测量等值性。",
        ],
        tensions: ["潜变量是现实实体还是有用模型？", "量表便利性是否让研究问题反过来服从工具？"],
        links: ["文化方法与科学可信度", "实验心理学与心理物理学", "跨尺度解释", "第一第二第三人称方法", "开放科学与自我修正"],
      },
      {
        file: "first-second-third-person-methods.md",
        title: "第一第二第三人称方法",
        aliases: ["First-, Second-, and Third-Person Methods"],
        description: "体验者、关系现场与外部观察者三种证据位置的整合。",
        tags: ["cluster/methods", "methodology", "subject-position"],
        summary: "第一人称接近体验结构，第二人称捕捉互动生成，第三人称提供可量化观察；成熟研究需要让三者互相纠错。",
        claims: [
          "日记、体验采样和微现象学记录主体经验。",
          "临床访谈、互动分析和民族志研究关系中的生成过程。",
          "实验、行为、生理和神经方法提供可重复的外部约束。",
        ],
        tensions: ["客观测量可能丢失体验意义。", "主观报告可能受到记忆、语言和需求特征影响。"],
        links: ["文化方法与科学可信度", "实验心理学与心理物理学", "精神分析", "现象学与神经现象学", "高阶与循环处理理论"],
      },
      {
        file: "open-science-and-self-correction.md",
        title: "开放科学与自我修正",
        aliases: ["Open Science", "Replication Reform"],
        description: "针对发表偏差、小样本、p-hacking 和复现失败的制度性改革。",
        tags: ["cluster/methods", "open-science", "replication"],
        summary: "预注册、注册报告、开放数据、多实验室合作和对抗式合作旨在减少分析弹性与发表偏差，让理论竞争更可检验。",
        claims: [
          "复现失败是修正理论与方法的信号。",
          "透明度需要与更好的构念和研究设计配合。",
          "科学可信度来自可追踪的纠错过程。",
        ],
        tensions: ["开放材料并不自动解决理论贫乏。", "高成本改革可能扩大不同研究机构之间的不平等。"],
        links: ["文化方法与科学可信度", "心理测量与证据", "第一第二第三人称方法", "意识与自我", "智能意识与机器伦理"],
      },
    ],
  },
  {
    folder: "06_胼胝体桥接区",
    title: "胼胝体桥接区",
    notes: [
      {
        file: "psychology-genealogy-atlas.md",
        title: "心理学谱系总图",
        aliases: ["Psychology Genealogy Atlas", "心理学思想与意识研究完整谱系"],
        description: "从认识自己到理解意识，并延伸到人工心智的全局导航节点。",
        tags: ["cluster/bridges", "role/global-hub", "MOC"],
        summary: "这张图不是从低到高的金字塔，而是一组在生活实践、科学机制、意识本质、解释尺度和证据位置之间往返的通道。",
        claims: [
          "How、Why、What 是导航维度，不是可靠性的等级。",
          "心理学需要在大脑、身体、关系、文化与技术之间跨尺度建模。",
          "成熟研究能够承认未知，并设计方法逐步缩小未知。",
        ],
        tensions: ["应用不等于浅薄，机制不等于完整解释。", "智能、语言表现与意识必须保持概念区分。"],
        links: ["心理学思想史", "心理机制地图", "脑身体与环境", "意识与自我", "文化方法与科学可信度", "How Why What"],
      },
      {
        file: "how-why-what.md",
        title: "How Why What",
        aliases: ["应用机制本质", "Problem Depth"],
        description: "把改变、解释与本体问题放在同一张地图中的导航模型。",
        tags: ["cluster/bridges", "bridge", "framework"],
        summary: "How 询问怎样改变经验与生活，Why 询问心理机制如何运作，What 询问意识、自我与心智究竟是什么。",
        claims: [
          "同一主题可以在三个问题深度上分别研究。",
          "证据强度与问题深度相互独立。",
          "真正的桥接工作需要说明层次之间如何约束，而不是只排列术语。",
        ],
        tensions: ["更抽象的问题不自动更深刻或更可靠。", "应用成功并不自动证明机制解释正确。"],
        links: ["心理学谱系总图", "心理学思想史", "心理机制地图", "意识与自我", "预测焦虑现实桥"],
      },
      {
        file: "body-mind-society-bridge.md",
        title: "身体心智社会桥",
        aliases: ["Body-Mind-Society Bridge"],
        description: "连接神经、个体、关系、文化与制度解释的跨尺度桥梁。",
        tags: ["cluster/bridges", "bridge", "multi-scale"],
        summary: "心理现象由身体调节、认知模型、关系互动和社会结构共同生成；任何单层解释都只能捕捉其中一部分。",
        claims: [
          "身体提供需要、行动能力和内感受背景。",
          "关系提供共同调节、承认和角色预期。",
          "文化与制度提供语言、规范和机会结构。",
        ],
        tensions: ["如何避免把多层解释变成没有优先级的因素清单？", "何种桥接变量可以产生可检验预测？"],
        links: ["心理学谱系总图", "脑身体与环境", "跨尺度解释", "发展依恋与治疗", "文化历史心理学", "社会心理与权力"],
      },
      {
        file: "memory-identity-language-bridge.md",
        title: "记忆身份语言桥",
        aliases: ["Memory-Identity-Language Bridge"],
        description: "连接记忆重构、叙事身份、语言和自我连续性的桥接节点。",
        tags: ["cluster/bridges", "bridge", "identity"],
        summary: "自我连续性依靠被反复重构的记忆、对他人的叙述和文化可用的身份词汇共同维持。",
        claims: [
          "记忆提供跨时间的素材，但不是不变档案。",
          "语言把经验组织成可以交流和行动的叙事。",
          "关系与制度决定哪些身份叙事得到承认。",
        ],
        tensions: ["能说“我”是否意味着存在体验主体？", "记忆变化到何种程度仍保持同一人格？"],
        links: ["心理学谱系总图", "记忆", "自我模型谱系", "认知与信息加工", "精神分析", "智能意识与机器伦理"],
      },
      {
        file: "prediction-anxiety-reality-bridge.md",
        title: "预测焦虑现实桥",
        aliases: ["Prediction-Anxiety-Reality Bridge"],
        description: "连接预测模型、注意、情绪调节和现实体验生成的桥接节点。",
        tags: ["cluster/bridges", "bridge", "prediction"],
        summary: "焦虑可以被理解为对未来威胁的高精度预测，但这一解释必须同时包含身体调节、学习史、注意偏向和现实处境。",
        claims: [
          "预测塑造知觉和行动准备。",
          "注意决定哪些误差信号获得更新权重。",
          "有效干预可能同时改变身体状态、行为证据和环境条件。",
        ],
        tensions: ["预测框架会不会把现实危险重新个体化？", "何时应改变模型，何时应改变环境？"],
        links: ["心理学谱系总图", "预测加工与主动推断", "情绪内感受与生命调节", "注意", "学习与强化", "How Why What"],
      },
      {
        file: "intelligence-consciousness-and-machine-ethics.md",
        title: "智能意识与机器伦理",
        aliases: ["Intelligence, Consciousness and Machine Ethics", "Artificial Mind"],
        description: "区分智能、自主性、自我模型、语言主体感、意识与道德地位。",
        tags: ["cluster/bridges", "bridge", "AI-consciousness"],
        summary: "人工系统能够表现出问题求解、语言、自我监控和代理行为，但这些能力不能单独证明存在主观体验。",
        claims: [
          "智能是适应和解决问题的能力，意识是是否存在体验。",
          "自我报告对训练过语言模型尤其不是独立证据。",
          "机器意识研究需要同时避免过早人格化和过早排除潜在感受性。",
        ],
        tensions: ["生物性是否是意识的必要条件？", "在理论未统一时应如何分配道德关切和责任？"],
        links: ["心理学谱系总图", "认知革命", "认知与信息加工", "意识与自我", "全球工作空间理论", "整合信息理论", "自我模型谱系"],
      },
    ],
  },
];

const allNotes = clusters.flatMap((cluster) =>
  cluster.notes.map((note) => ({ ...note, folder: cluster.folder, clusterTitle: cluster.title })),
);
const titleSet = new Set(allNotes.map((note) => note.title));
const duplicateTitles = allNotes
  .map((note) => note.title)
  .filter((title, index, titles) => titles.indexOf(title) !== index);
const missingLinks = allNotes.flatMap((note) =>
  note.links
    .filter((link) => !titleSet.has(link))
    .map((link) => `${note.title} -> ${link}`),
);
const selfLinks = allNotes.flatMap((note) =>
  note.links.includes(note.title) ? [note.title] : [],
);

if (duplicateTitles.length || missingLinks.length || selfLinks.length) {
  throw new Error(
    JSON.stringify({ duplicateTitles, missingLinks, selfLinks }, null, 2),
  );
}

function yamlList(values) {
  return values.map((value) => `  - ${value}`).join("\n");
}

function renderNote(note) {
  const connections = note.links.map((link) => `- [[${link}]]`).join("\n");
  const claims = note.claims.map((claim) => `- ${claim}`).join("\n");
  const tensions = note.tensions.map((tension) => `- ${tension}`).join("\n");

  return `---
title: ${note.title}
aliases:
${yamlList(note.aliases)}
description: ${note.description}
tags:
${yamlList(note.tags)}
source: Psychology_Genealogy_Atlas_Obsidian.md
status: curated
updated: 2026-07-17
---

# ${note.title}

${note.summary}

## 核心命题

${claims}

## 神经连接

${connections}

## 张力与开放问题

${tensions}
`;
}

await fs.mkdir(outputRoot, { recursive: true });
await fs.mkdir(path.join(outputRoot, ".obsidian"), { recursive: true });

for (const cluster of clusters) {
  const clusterPath = path.join(outputRoot, cluster.folder);
  await fs.mkdir(clusterPath, { recursive: true });
  for (const note of cluster.notes) {
    await fs.writeFile(path.join(clusterPath, note.file), renderNote(note), "utf8");
  }
}

await fs.writeFile(
  path.join(outputRoot, ".obsidian", "app.json"),
  `${JSON.stringify(
    {
      newLinkFormat: "shortest",
      useMarkdownLinks: false,
      showUnsupportedFiles: false,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

const inboundCounts = new Map(allNotes.map((note) => [note.title, 0]));
const noteByTitle = new Map(allNotes.map((note) => [note.title, note]));
const edgeMap = new Map();
const adjacency = new Map(allNotes.map((note) => [note.title, new Set()]));

for (const note of allNotes) {
  for (const link of note.links) {
    inboundCounts.set(link, (inboundCounts.get(link) || 0) + 1);
    const key = [note.title, link].sort((left, right) => left.localeCompare(right)).join("::");
    const edge = edgeMap.get(key) || {
      nodes: [note.title, link],
      directions: new Set(),
      crossCluster: note.folder !== noteByTitle.get(link).folder,
    };
    edge.directions.add(`${note.title}->${link}`);
    edgeMap.set(key, edge);
    adjacency.get(note.title).add(link);
    adjacency.get(link).add(note.title);
  }
}

const components = [];
const unseen = new Set(allNotes.map((note) => note.title));
while (unseen.size) {
  const [start] = unseen;
  const component = [];
  const queue = [start];
  unseen.delete(start);

  while (queue.length) {
    const current = queue.shift();
    component.push(current);
    for (const neighbor of adjacency.get(current)) {
      if (unseen.delete(neighbor)) {
        queue.push(neighbor);
      }
    }
  }

  components.push(component);
}

const undirectedEdges = [...edgeMap.values()];
const crossClusterEdges = undirectedEdges.filter((edge) => edge.crossCluster);
const reciprocalEdges = undirectedEdges.filter((edge) => edge.directions.size > 1);

const manifest = {
  name: "Psychology Genealogy Atlas",
  generatedAt: "2026-07-17",
  source: "resources/source-materials/Psychology_Genealogy_Atlas_Obsidian.md",
  design: {
    principle: "Topology first: folders are modules, notes are neurons, wikilinks are synapses.",
    clusters: clusters.length,
    notes: allNotes.length,
    directedLinks: allNotes.reduce((sum, note) => sum + note.links.length, 0),
    undirectedEdges: undirectedEdges.length,
    reciprocalEdges: reciprocalEdges.length,
    crossClusterEdges: crossClusterEdges.length,
    averageDegree: Number(
      ((undirectedEdges.length * 2) / allNotes.length).toFixed(2),
    ),
    connectedComponents: components.length,
    isolatedNotes: allNotes
      .filter((note) => adjacency.get(note.title).size === 0)
      .map((note) => note.title),
  },
  clusterSummary: clusters.map((cluster) => ({
    folder: cluster.folder,
    title: cluster.title,
    notes: cluster.notes.length,
  })),
  hubs: [...inboundCounts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 12)
    .map(([title, inbound]) => ({ title, inbound })),
};

await fs.writeFile(
  path.join(outputRoot, "vault-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(JSON.stringify(manifest, null, 2));
