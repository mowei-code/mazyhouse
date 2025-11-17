# Windows .exe 安装程序构建指南

## 概述
本指南将帮助您将 AI 房产估价师 React 应用程序打包为可在 Windows 10/11 上安装和运行的 .exe 文件。

## 前置要求

### 1. 安装 Node.js
- 访问 https://nodejs.org (选择 LTS 版本)
- 安装完成后，验证安装:
```bash
node --version
npm --version
```

### 2. 克隆项目到本机
```bash
git clone https://github.com/mowei-code/mazyhouse.git
cd mazyhouse
```

## 第一步：安装依赖

### 3. 安装项目依赖
```bash
npm install
```

### 4. 安装 Electron 相关工具
```bash
npm install --save-dev electron electron-builder wait-on concurrently electron-is-dev
```

## 第二步：配置 package.json

### 5. 编辑 package.json 文件

在 `package.json` 中进行以下修改:

#### 5.1 修改 "homepage" 字段
```json
"homepage": "./",
```

#### 5.2 添加 "main" 字段（在 "homepage" 之前）
```json
"main": "public/electron.js",
```

#### 5.3 修改 "scripts" 部分
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "react-build": "vite build",
  "electron-start": "wait-on http://localhost:5173 && electron .",
  "electron-dev": "concurrently \"npm run dev\" \"npm run electron-start\"",
  "electron-build": "npm run react-build && electron-builder",
  "windows-exe": "npm run electron-build"
}
```

#### 5.4 添加 "build" 配置（在 "scripts" 之后）
```json
"build": {
  "appId": "com.mazylab.aihouseprice",
  "productName": "AI 房产估价师",
  "files": [
    "dist/**/*",
    "public/electron.js",
    "public/preload.js",
    "node_modules/**/*"
  ],
  "directories": {
    "buildResources": "assets"
  },
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ],
    "icon": "assets/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "AI 房产估价师"
  }
}
```

## 第三步：准备资源文件

### 6. 创建 assets 文件夹
```bash
mkdir assets
```

### 7. 添加应用图标（可选，但推荐）
- 创建 256x256 像素的 PNG 图标
- 转换为 .ico 格式 (使用在线工具如 https://convertio.co/png-ico/)
- 将 icon.ico 放在 assets 文件夹中

## 第四步：构建 .exe 安装程序

### 8. 执行构建命令
```bash
npm run windows-exe
```

## 第五步：查找生成的 .exe 文件

构建完成后，在以下位置找到你的 .exe 文件:

- **用户安装程序**: `dist/AI 房产估价师 Setup x.x.x.exe`
- **便携版本**: `dist/AI 房产估价师 x.x.x.exe`

## 第六步：分发给用户

### 9. 用户安装步骤
1. 双击 `AI 房产估价师 Setup x.x.x.exe`
2. 按照安装向导完成安装
3. 安装完成后，从开始菜单或桌面快捷方式启动应用
4. 输入自己的 Gemini API Key 即可使用

## 常见问题

### Q: 构建失败，提示找不到图标？
A: 图标是可选的。如果不想添加自定义图标，可以在 package.json 的 build.win 中移除 `icon` 字段。

### Q: 如何在开发时测试 Electron 应用？
A: 执行以下命令进行开发测试:
```bash
npm run electron-dev
```
这将启动 React 开发服务器和 Electron 应用。

### Q: 构建文件很大？
A: 这是正常的。Electron 应用包含完整的 Chromium 浏览器，通常在 150-250MB 之间。

### Q: 能否在 Mac 或 Linux 上构建？
A: 可以，但需要修改 package.json 中的 build 配置。

## 技术支持
如有问题，请参考:
- Electron 官方文档: https://www.electronjs.org
- electron-builder 文档: https://www.electron.build
