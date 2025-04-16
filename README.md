# Virtual Tabletop

DND 桌面模拟工具，支持玩家与 DM 管理角色。

## 🚀 功能简介

- 多角色管理
- 角色面板、背景、特性、背包、施法
- 物品参照、法术参照
- 快捷投骰

## 📦 技术栈

- 前端：HTML + CSS + 原生 JS（无框架依赖）
- 后端：Python 3 + Flask
- 数据：JSON 存档格式

## 📂 项目结构

```plaintext
├── data/                       # 游戏数据（如物品、法术等）
│   ├── items.json
│   └── spells.json
├── docs/                       # 文档目录
│   ├── dev_guide.md            # 开发者指南
│   └── user_guide.md           # 用户指南
├── savefiles/                  # 角色存档
│   ├── template.json           # 模板
│   └── *.json                  # 其他用户角色存档（git 自动忽略）
├── static/                     # 前端静态资源
│   ├── data.js                 # 客户端数据定义
│   ├── favicon.ico             # 网站图标
│   ├── index.css               # 样式文件
│   ├── index.js                # 主逻辑脚本
│   └── pl_view.js              # 玩家界面脚本
├── templates/                  # Flask 模板
│   ├── pl_view.html            # 玩家界面模板
│   └── select_pc.html          # 角色选择模板
├── tools/                      # 辅助脚本和工具
│   ├── check_portproxy.sh      # 检查端口代理脚本（Windows）
│   ├── parse.py                # 数据解析脚本
│   └── release.py              # 自动发布脚本（版本/tag/changelog）
├── .gitignore                  # Git 忽略文件
├── LICENSE                     # 开源许可证（MIT）
├── README.md                   # 项目说明文档
└── run.py                      # Flask 启动入口
```

## 🛠️ 使用说明



## 📜 LICENSE

本项目使用 MIT License。你可以自由使用、修改和分发。

---

## 🙋‍♀️ 作者

- glyuan419

欢迎反馈建议、提交 PR、或讨论合作。
