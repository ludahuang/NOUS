# NOUS

**Curator Incubator / 策展孵化器**

NOUS is a long-running curatorial system that can take the form of a space,
an exhibition, a knowledge environment, a research process, or a creative
agent.

NOUS 不是某一个网站或单一应用。它是一套持续生成空间、展览、知识项目与智能体的策展机制。

## Current Map

| Area | Purpose | Entry |
| --- | --- | --- |
| Identity | NOUS 的历史、概念与连续性 | [`NOUS.md`](NOUS.md) |
| Catalog | 人物、空间、展览、智能体和项目注册表 | [`catalog/`](catalog/) |
| Protocols | 策展、复制、来源、发布与智能体协作机制 | [`protocols/`](protocols/) |
| Research | 研究问题、站点盘点和来源记录 | [`research/`](research/) |
| Projects | 可运行、部署和独立发布的作品 | [`projects/`](projects/) |
| Agents | 智能体身份、原则、权限、能力与评估 | [`agents/`](agents/) |
| Archive | 已结束但需要保持可解释的历史形态 | [`archive/`](archive/) |
| Public Site | NOUS 的公共地图和入口 | [`site/`](site/) |

## Active Directions

- **WEME Creative Agent**: a creative collaborator with an explicit identity,
  aesthetic position, authority boundary, memory policy, and auditable
  capabilities.
- **The Vault**: a graph-native knowledge-base and intelligent-agent case,
  with data curation as a supporting function. It is the first active
  Agent-era project migrated into the NOUS project structure.
- **NOUS Archive**: the recovery and description of container spaces,
  exhibitions, distributed installations, research, media, and born-digital
  works.

## Repository Rule

The default branch is the canonical NOUS atlas and operating protocol.
Products do not occupy the repository root, and long-lived Git branches are
not used as project categories.

Every active project or agent should have:

1. a catalog entry;
2. a human-readable project or agent document;
3. provenance and license information;
4. a clear runtime or preservation location;
5. an explicit relationship to other NOUS entities.

Validate the machine-readable records with:

```bash
ruby scripts/validate_catalog.rb
```

## Historical Sources

The first source inventory covers:

- `we-media.net` - WEME organization, projects, research, and Creative Agent narrative;
- `nous.we-media.net` - NOUS spaces, exhibitions, design objects, and projects;
- `weme.im` - historical WEME brand and web-service surface;
- `rebui1t.com` - AI projects, generated works, research, and post-human experiments.

See [`research/sites/`](research/sites/) for access dates, APIs, selected routes,
and content-handling rules.

## Status

The NOUS mother-repository architecture is active. The history-preserving
The Vault import is maintained under [`projects/the-vault/`](projects/the-vault/)
and its public runtime is published below the NOUS Atlas at `/the-vault/`.
That runtime is a case implementation inside the NOUS system, not a peer
public identity.

The migration decision is documented in
[`docs/rfcs/0002-the-vault-history-migration.md`](docs/rfcs/0002-the-vault-history-migration.md);
the public URL structure is documented in
[`docs/rfcs/0003-publication-structure.md`](docs/rfcs/0003-publication-structure.md);
the NOUS Symbiote system is documented in
[`docs/rfcs/0004-nous-symbiote-system.md`](docs/rfcs/0004-nous-symbiote-system.md).
