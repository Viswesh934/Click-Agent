# Dashboard - Shadcn UI & Apache ECharts Starter Template

A clean, modular, and reusable dashboard template built with **React**, **TypeScript**, **Tailwind CSS**, **Shadcn UI**, and **Apache ECharts** (`echarts-for-react`).

Designed with an enterprise dark & light theme featuring dynamic charts, responsive sidebar navigation, and full UI component suite.

---

## 📚 Complete ECharts Documentation Guide

For an exhaustive guide covering **every chart type** (Line & Area, Bar & Stacked Column, Pie/Donut/Rose, Radar, Gauges, Heatmaps, Sunburst, Scatter & Real-Time Streaming), see:

👉 **[`ECHARTS_COMPLETE_GUIDE.md`](./ECHARTS_COMPLETE_GUIDE.md)**

---

## 🌟 Key Features

- 📈 **Interactive ECharts Suite**:
  - `LatencyPercentilesChart`: Smooth area lines for metric trend curves.
  - `ThroughputErrorChart`: Dual-axis Requests Per Second (RPS) vs Error Rate %.
  - `SystemResourceGauge`: Dial gauge meters for CPU & Memory allocation.
  - `ServiceHealthRadar`: Multi-dimensional radar scorecard.
  - `HeatmapLatencyChart`: 2D matrix heatmap for distribution analysis.
- 🛠️ **Shadcn UI Full Primitive Suite**: 40+ pre-styled components (Buttons, Inputs, Cards, Dialogs, Dropdowns, Tabs, Badges, Switches, Tables, Progress, Tooltips, Accordions, Alerts, Skeletons).
- ⚡ **Dashboard Command Center**: Real-time KPI stat cards and filterable log stream table.
- 🎨 **Modern Theme System**: Slate & Cyan dark mode aesthetic with theme toggle support.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 📦 Using ECharts in React

```tsx
import ReactECharts from 'echarts-for-react';
import { useTheme } from '@/components/theme/theme-provider';

export function AnalyticsChart() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const option = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    yAxis: { type: 'value' },
    series: [{ data: [120, 200, 150, 80, 70], type: 'line', smooth: true, itemStyle: { color: '#06b6d4' } }],
  };

  return <ReactECharts option={option} style={{ height: '320px', width: '100%' }} />;
}
```
