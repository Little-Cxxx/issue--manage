# issue--manage

一个轻量级的 Issue 跟踪管理系统，支持多项目管理、Excel 导入导出、管理员/普通工程师双角色权限。

## 功能特性

- **双角色登录**：管理员（全项目全 Issue）和普通工程师（仅看自己的 Issue）
- **多项目管理**：支持新建/删除项目，按项目筛选 Issue
- **Issue CRUD**：新增、编辑、删除 Issue 条目
- **Excel 导入导出**：批量导入 Issue 数据，支持导出带状态颜色标记的 Excel
- **分页与筛选**：支持按状态、严重度等条件筛选，前端分页展示
- **统计面板**：直观展示 Issue 总览数据

## 技术栈

| 技术 | 说明 |
|------|------|
| **后端** | Python 3 + Flask 3.1 |
| **数据库** | SQLite（单文件，零配置） |
| **前端** | 原生 HTML/CSS/JavaScript |
| **Excel** | openpyxl 3.1 |

## 本地运行

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 启动服务
python app.py

# 3. 打开浏览器访问
http://127.0.0.1:5000
```

**管理员密码**：`admin123`（可在 `app.py` 中修改 `ADMIN_PASSWORD`）

## 在 CloudStudio 在线 IDE 中部署

### 方式一：直接从 GitHub 打开工作空间

1. 登录 [CloudStudio](https://cloudstudio.net/)
2. 点击 **新建工作空间** → **导入 Git 仓库**
3. 输入仓库地址：`https://github.com/Little-Cxxx/issue--manage.git`
4. 工作空间创建后，在左侧文件树右键 `.vscode` 文件夹 → **新建文件** → 命名为 `preview.yml`
5. 填入以下内容：

```yaml
autoOpen: true
apps:
  - port: 5000
    run: cd /workspace && python app.py
    root: /workspace
    name: issue跟踪小程序
    description: Issue 跟踪管理小程序
    autoOpen: true
```

6. 点击顶部的 **运行** 按钮，等待服务启动
7. 在右侧 **预览** 面板中获取公网访问链接

### 方式二：通过 CodeBuddy 一键部署

1. 在 CodeBuddy 中打开本项目
2. 对话中输入：`帮我把项目部署到 CloudStudio`
3. CodeBuddy 会自动安装依赖并启动服务，返回公网访问链接

## 项目结构

```
├── app.py              # Flask 主程序
├── requirements.txt    # Python 依赖
├── issues.db           # SQLite 数据库（自动生成）
├── sample_issues.xlsx  # 示例 Issue 数据
├── templates/
│   └── index.html      # 前端页面
├── static/
│   ├── script.js       # 前端逻辑
│   └── style.css       # 样式
└── uploads/            # 上传文件目录
```

## 数据库字段

| 字段 | 说明 |
|------|------|
| 测试事项 | Issue 标题 |
| 阶段 | 开发阶段 |
| 分类 | Issue 分类 |
| 测试工程师 | 测试负责人 |
| 研发工程师 | 研发负责人 |
| 部门 | 所属部门 |
| 发生日期 | Issue 发现日期 |
| 要求结案日期 | 要求关闭日期 |
| Issue状态 | 待确认/已确认/处理中/待回归/已回归/待关闭 |
| 严重度 | Issue 严重等级 |
| 问题点详细描述 | 详细描述 |
| 改善措施 | RD 提供的改善方案 |
| DQA确认 | DQA 确认结果 |
| 问题点当前处理进度 | 当前处理进度说明 |

## 注意事项

- SQLite 数据库文件 `issues.db` 已在本地存储，部署后会创建新的数据库
- 如需迁移数据，将本地 `issues.db` 上传覆盖远端即可
- 管理员密码默认为 `admin123`，建议在生产环境中修改
