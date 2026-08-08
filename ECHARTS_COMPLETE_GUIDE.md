# Complete Apache ECharts Master Guide for React & Shadcn UI

This guide provides exhaustive, copy-paste ready documentation for creating **every major chart type and visualization** using **Apache ECharts** (`echarts` & `echarts-for-react`) in React applications.

---

## Table of Contents
1. [Installation & Core Setup](#1-installation--core-setup)
2. [Line & Area Charts](#2-line--area-charts)
3. [Bar & Column Charts](#3-bar--column-charts)
4. [Pie, Donut & Rose Charts](#4-pie-donut--rose-charts)
5. [Radar & Spider Web Charts](#5-radar--spider-web-charts)
6. [Gauge & Meter Charts](#6-gauge--meter-charts)
7. [Heatmap & Matrix Charts](#7-heatmap--matrix-charts)
8. [Treemap & Sunburst Charts](#8-treemap--sunburst-charts)
9. [Scatter & Bubble Charts](#9-scatter--bubble-charts)
10. [Funnel & Pipeline Charts](#10-funnel--pipeline-charts)
11. [Dark / Light Theme Integration](#11-dark--light-theme-integration)
12. [Real-time Streaming & Polling](#12-real-time-streaming--polling)
13. [Event Listeners & Toolbox Export](#13-event-listeners--toolbox-export)

---

## 1. Installation & Core Setup

### Installation
```bash
npm install echarts echarts-for-react
```

### Basic Component Wrapper
```tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';

export function BaseChart() {
  const option = {
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
    yAxis: { type: 'value' },
    series: [{ data: [120, 200, 150, 80, 70], type: 'bar' }],
  };

  return <ReactECharts option={option} style={{ height: '350px', width: '100%' }} />;
}
```

---

## 2. Line & Area Charts

### Smooth Multi-Series Area Chart with Linear Gradients
Used for latency percentiles (p50, p95, p99), throughput, or traffic bandwidth.

```tsx
import React from 'react';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '@/components/theme/theme-provider';

export function LatencyAreaChart() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: ['p50 Latency', 'p99 Latency'],
      textStyle: { color: isDark ? '#94a3b8' : '#64748b' },
    },
    grid: { top: '10%', left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['12:00', '12:05', '12:10', '12:15', '12:20', '12:25'],
      axisLine: { lineStyle: { color: isDark ? '#334155' : '#cbd5e1' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b' },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}ms', color: isDark ? '#94a3b8' : '#64748b' },
      splitLine: { lineStyle: { color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)', type: 'dashed' } },
    },
    series: [
      {
        name: 'p99 Latency',
        type: 'line',
        smooth: true,
        lineStyle: { width: 2, color: '#f43f5e' },
        showSymbol: false,
        areaStyle: { opacity: 0.15, color: '#f43f5e' },
        data: [120, 140, 180, 310, 240, 190],
      },
      {
        name: 'p50 Latency',
        type: 'line',
        smooth: true,
        lineStyle: { width: 2.5, color: '#06b6d4' },
        showSymbol: false,
        areaStyle: {
          opacity: 0.3,
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(6, 182, 212, 0.5)' },
              { offset: 1, color: 'rgba(6, 182, 212, 0.02)' },
            ],
          },
        },
        data: [22, 24, 28, 42, 35, 26],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '320px', width: '100%' }} />;
}
```

### Zoomable Time-Series Line Chart (`dataZoom`)
Enables interactive pan & zoom controls for deep telemetry debugging.

```tsx
const option = {
  dataZoom: [
    { type: 'inside', start: 0, end: 100 },
    { type: 'slider', start: 0, end: 100 },
  ],
  // ... xAxis, yAxis, series
};
```

---

## 3. Bar & Column Charts

### Dual-Axis Bar & Line Chart (RPS vs Error Rate %)
Combines request throughput (bars) with error rates (line).

```tsx
export function ThroughputErrorChart() {
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['RPS', 'Error Rate (%)'] },
    xAxis: { type: 'category', data: ['12:00', '12:05', '12:10', '12:15', '12:20'] },
    yAxis: [
      { type: 'value', name: 'RPS' },
      { type: 'value', name: 'Error Rate (%)', min: 0, max: 5, axisLabel: { formatter: '{value}%' } },
    ],
    series: [
      {
        name: 'RPS',
        type: 'bar',
        itemStyle: { color: '#0284c7', borderRadius: [4, 4, 0, 0] },
        data: [14200, 16800, 18400, 22100, 24800],
      },
      {
        name: 'Error Rate (%)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        lineStyle: { width: 3, color: '#f43f5e' },
        data: [0.02, 0.04, 0.03, 0.15, 2.45],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '320px', width: '100%' }} />;
}
```

---

## 4. Pie, Donut & Rose Charts

### Donut Chart with Center Metric
Used for HTTP status code distribution or traffic channel sources.

```tsx
export function HTTPStatusDonut() {
  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: <b>{c}</b> ({d}%)' },
    legend: { bottom: '0%', left: 'center' },
    series: [
      {
        name: 'HTTP Status',
        type: 'pie',
        radius: ['45%', '75%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderWidth: 2 },
        data: [
          { value: 142000, name: '200 OK', itemStyle: { color: '#10b981' } },
          { value: 4500, name: '304 Not Modified', itemStyle: { color: '#06b6d4' } },
          { value: 1200, name: '404 Not Found', itemStyle: { color: '#f59e0b' } },
          { value: 340, name: '500 Internal Error', itemStyle: { color: '#f43f5e' } },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '320px', width: '100%' }} />;
}
```

### Nightingale Rose Chart (`roseType: 'radius'`)
```tsx
const option = {
  series: [
    {
      type: 'pie',
      radius: [20, 140],
      roseType: 'radius',
      itemStyle: { borderRadius: 6 },
      data: [
        { value: 40, name: 'auth-svc' },
        { value: 38, name: 'payment-api' },
        { value: 32, name: 'search-index' },
        { value: 30, name: 'user-db' },
      ],
    },
  ],
};
```

---

## 5. Radar & Spider Web Charts

### APM Benchmark Radar
Used for multivariate scoring (Apdex, Uptime, Cache Hit Ratio, Error Budget).

```tsx
export function APMRadar() {
  const option = {
    tooltip: { trigger: 'item' },
    radar: {
      indicator: [
        { name: 'Uptime (SLO)', max: 100 },
        { name: 'Apdex Index', max: 100 },
        { name: 'Response Velocity', max: 100 },
        { name: 'Error Budget', max: 100 },
        { name: 'Cache Hit Ratio', max: 100 },
      ],
    },
    series: [
      {
        name: 'APM Scorecard',
        type: 'radar',
        data: [
          {
            value: [99.9, 98, 92, 95, 96],
            name: 'Production Cluster',
            itemStyle: { color: '#06b6d4' },
            areaStyle: { opacity: 0.35, color: '#06b6d4' },
          },
        ],
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '320px', width: '100%' }} />;
}
```

---

## 6. Gauge & Meter Charts

### Dual Cluster CPU & RAM Utilization Gauges
```tsx
export function ClusterGauges() {
  const option = {
    series: [
      {
        name: 'CPU',
        type: 'gauge',
        center: ['30%', '55%'],
        radius: '85%',
        progress: { show: true, width: 10, itemStyle: { color: '#06b6d4' } },
        data: [{ value: 48, name: 'Cluster CPU' }],
        detail: { formatter: '{value}%', fontSize: 18 },
      },
      {
        name: 'RAM',
        type: 'gauge',
        center: ['70%', '55%'],
        radius: '85%',
        progress: { show: true, width: 10, itemStyle: { color: '#10b981' } },
        data: [{ value: 72, name: 'RAM Memory' }],
        detail: { formatter: '{value}%', fontSize: 18 },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: '300px', width: '100%' }} />;
}
```

---

## 7. Heatmap & Matrix Charts

### Microservice Latency Grid Matrix
```tsx
export function LatencyHeatmap() {
  const hours = ['12am', '4am', '8am', '12pm', '4pm', '8pm'];
  const services = ['auth-svc', 'payment-api', 'user-db', 'gateway'];
  const data = [
    [0, 0, 12], [0, 1, 18], [0, 2, 45], [0, 3, 22],
    [1, 0, 14], [1, 1, 20], [1, 2, 85], [1, 3, 24],
    [2, 0, 35], [2, 1, 55], [2, 2, 140], [2, 3, 62],
  ];

  const option = {
    tooltip: { position: 'top' },
    grid: { top: '10%', left: '12%', right: '4%', bottom: '15%' },
    xAxis: { type: 'category', data: hours },
    yAxis: { type: 'category', data: services },
    visualMap: {
      min: 0, max: 150, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%',
      inRange: { color: ['#0f172a', '#0284c7', '#10b981', '#f59e0b', '#f43f5e'] },
    },
    series: [{ type: 'heatmap', data: data }],
  };

  return <ReactECharts option={option} style={{ height: '320px', width: '100%' }} />;
}
```

---

## 8. Treemap & Sunburst Charts

### Hierarchical Service Span Breakdown (`sunburst`)
```tsx
export function ServiceSunburst() {
  const data = [{
    name: 'api-gateway',
    children: [
      { name: 'auth-svc', value: 35 },
      { name: 'order-api', children: [{ name: 'db-read', value: 40 }, { name: 'redis-cache', value: 15 }] }
    ]
  }];

  const option = {
    series: [
      {
        type: 'sunburst',
        data: data,
        radius: [0, '90%'],
        label: { rotate: 'radial' }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '320px', width: '100%' }} />;
}
```

---

## 9. Scatter & Bubble Charts

### Payload Size vs Latency Correlation (`scatter`)
```tsx
const option = {
  xAxis: { name: 'Payload Size (KB)' },
  yAxis: { name: 'Latency (ms)' },
  series: [{
    symbolSize: (val: any) => val[2] * 2, // bubble size
    data: [
      [12, 24, 5], [45, 120, 12], [88, 340, 25], [120, 480, 32]
    ],
    type: 'scatter'
  }]
};
```

---

## 10. Funnel & Pipeline Charts

### Request Processing Funnel
```tsx
const option = {
  series: [
    {
      name: 'Request Pipeline',
      type: 'funnel',
      left: '10%', width: '80%',
      data: [
        { value: 100, name: 'Ingress Gateway' },
        { value: 80, name: 'Auth Verification' },
        { value: 60, name: 'Business Logic' },
        { value: 40, name: 'Database Commit' },
        { value: 38, name: 'Response 200' },
      ]
    }
  ]
};
```

---

## 11. Dark / Light Theme Integration

Bind ECharts options to your Shadcn theme provider using the `useTheme()` hook:

```tsx
import { useTheme } from '@/components/theme/theme-provider';

export function ThemeAwareChart() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: isDark ? '#0f172a' : '#ffffff',
      borderColor: isDark ? '#1e293b' : '#e2e8f0',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a' },
    },
    xAxis: {
      axisLine: { lineStyle: { color: isDark ? '#334155' : '#cbd5e1' } },
      axisLabel: { color: isDark ? '#94a3b8' : '#64748b' },
    },
    // ...
  };

  return <ReactECharts option={option} />;
}
```

---

## 12. Real-time Streaming & Polling

Update chart data smoothly in React by updating state or using an ECharts instance ref:

```tsx
import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';

export function LiveStreamChart() {
  const [dataPoints, setDataPoints] = useState([22, 25, 28, 35, 42]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextVal = Math.floor(Math.random() * 40) + 15;
      setDataPoints(prev => [...prev.slice(1), nextVal]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const option = {
    xAxis: { type: 'category', data: ['-8s', '-6s', '-4s', '-2s', 'Now'] },
    yAxis: { type: 'value' },
    series: [{ data: dataPoints, type: 'line', smooth: true }],
  };

  return <ReactECharts option={option} style={{ height: '300px' }} />;
}
```

---

## 13. Event Listeners & Toolbox Export

Add interactive click handlers and export buttons to any chart:

```tsx
const onChartClick = (param: any) => {
  console.log('Chart item clicked:', param.name, param.value);
};

const option = {
  toolbox: {
    feature: {
      saveAsImage: { title: 'Save PNG' },
      dataView: { readOnly: false },
      magicType: { type: ['line', 'bar'] },
    },
  },
  // ...
};

return (
  <ReactECharts
    option={option}
    onEvents={{ click: onChartClick }}
    style={{ height: '350px' }}
  />
);
```
