# Linger Logo 设计文档

## 🎨 设计理念

Linger 的 Logo 设计融合了以下元素：

1. **爱心符号** - 代表情感连接和关系
2. **连接点** - 代表不同类型的关系（恋人、朋友、家人、宠物）
3. **宇宙轨道** - 代表"宇宙"概念，无限可能
4. **渐变色彩** - 紫色到粉色的渐变，代表浪漫和科技感

---

## 📁 Logo 文件

### 1. 主 Logo (logo.svg)
- **尺寸**: 512x512px
- **用途**: 官方文档、宣传材料、大尺寸展示
- **特点**: 完整设计，包含所有装饰元素

### 2. 简洁版 Logo (logo-simple.svg)
- **尺寸**: 512x512px
- **用途**: 应用图标、网站 favicon、小尺寸展示
- **特点**: 简化设计，更清晰的视觉效果

### 3. 单色版 Logo (logo-mono.svg)
- **尺寸**: 512x512px
- **用途**: 单色印刷、水印、文档
- **特点**: 白色背景，紫色渐变

### 4. 亮色版 Logo (logo-light.svg)
- **尺寸**: 512x512px
- **用途**: 深色背景、暗色主题
- **特点**: 白色背景，更亮的渐变色

### 5. 标题版 Logo (logo-header.svg)
- **尺寸**: 800x200px
- **用途**: 网站头部、导航栏、标题
- **特点**: Logo + 文字组合

### 6. 图标版 Logo (logo-icon.svg)
- **尺寸**: 64x64px
- **用途**: 浏览器标签、应用图标、小尺寸
- **特点**: 极简设计，适合小尺寸

---

## 🎯 使用场景

| 场景 | 推荐 Logo | 尺寸 |
|------|-----------|------|
| 网站头部 | logo-header.svg | 200x50px |
| 浏览器标签 | logo-icon.svg | 32x32px |
| 应用图标 | logo-simple.svg | 512x512px |
| 宣传材料 | logo.svg | 原始尺寸 |
| 深色背景 | logo-light.svg | 原始尺寸 |
| 单色印刷 | logo-mono.svg | 原始尺寸 |

---

## 🎨 颜色规范

### 主色
- **紫色**: #8b5cf6 (主色调)
- **粉色**: #ec4899 (辅助色)
- **渐变**: 从紫色 (#8b5cf6) 到粉色 (#ec4899)

### 辅助色
- **深色背景**: #0f0f1a
- **浅色背景**: #ffffff
- **文字**: #94a3b8 (灰色)

---

## 💡 设计原则

1. **可识别性** - Logo 在小尺寸下仍然清晰可辨
2. **一致性** - 所有版本保持统一的设计语言
3. **适应性** - 不同场景使用不同版本
4. **情感表达** - 传达温暖、连接、情感

---

## 🔧 在项目中使用

### HTML 引用
```html
<!-- 主 Logo -->
<img src="src/assets/logo.svg" alt="Linger Logo" width="100">

<!-- 简洁版 Logo -->
<img src="src/assets/logo-simple.svg" alt="Linger Logo" width="100">

<!-- 图标版 Logo -->
<img src="src/assets/logo-icon.svg" alt="Linger Logo" width="32">

<!-- 标题版 Logo -->
<img src="src/assets/logo-header.svg" alt="Linger Logo" width="200">
```

### CSS 背景使用
```css
.logo {
  background-image: url('src/assets/logo-icon.svg');
  background-size: contain;
  background-repeat: no-repeat;
  width: 32px;
  height: 32px;
}
```

### Favicon 设置
```html
<link rel="icon" type="image/svg+xml" href="src/assets/logo-icon.svg">
```

---

## 📐 Logo 安全区域

为了保持 Logo 的视觉完整性，请确保周围有足够的空白区域：

- **最小安全区域**: Logo 尺寸的 25%
- **推荐安全区域**: Logo 尺寸的 50%

---

## 🚫 使用禁忌

1. ❌ 不要拉伸或扭曲 Logo
2. ❌ 不要更改 Logo 的颜色
3. ❌ 不要在 Logo 上添加其他元素
4. ❌ 不要使用低分辨率的 Logo
5. ❌ 不要在复杂的背景上使用 Logo（除非使用亮色版）

---

## 📦 文件清单

```
frontend/src/assets/
├── logo.svg              # 主 Logo
├── logo-simple.svg       # 简洁版 Logo
├── logo-mono.svg         # 单色版 Logo
├── logo-light.svg        # 亮色版 Logo
├── logo-header.svg       # 标题版 Logo
└── logo-icon.svg         # 图标版 Logo
```

---

## 🎉 总结

Linger Logo 设计完成！包含 6 个不同版本，适用于各种使用场景。Logo 融合了爱心、连接和宇宙元素，完美诠释了 "AI 余温" 的概念。
