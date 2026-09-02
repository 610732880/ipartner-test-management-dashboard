const profiles = [
  { name: "Desktop Chrome", device: "Chromium · 1440 × 900", status: "PASS", duration: "46.64s", note: "基线候选" },
  { name: "Desktop Firefox", device: "Firefox · 1440 × 900", status: "PASS", duration: "48.47s", note: "基线候选" },
  { name: "Desktop Safari", device: "WebKit · 1440 × 900", status: "PASS", duration: "34.65s", note: "基线候选" },
  { name: "iPhone 13", device: "WebKit · 390 × 844", status: "RECOVERED", duration: "31.90s", note: "首次 502，重试后通过" },
  { name: "Android 360", device: "Chromium · 360 × 800", status: "REVIEW", duration: "51.81s", note: "加载遮罩与文本裁切待确认" },
  { name: "iPad Mini", device: "WebKit · 768 × 1024", status: "PASS", duration: "49.96s", note: "基线候选" },
];

const runs = [
  { id: "COMPAT-001-20260902-142725", type: "兼容性", env: "UAT", outcome: "需视觉复核", time: "09-02 14:27", rate: "6 / 6" },
  { id: "COMPAT-001-20260902-111818", type: "兼容性", env: "UAT", outcome: "环境阻塞", time: "09-02 11:18", rate: "0 / 6" },
  { id: "COMPAT-001", type: "兼容性", env: "UAT", outcome: "部分失败", time: "09-01 17:00", rate: "4 / 6" },
];

function Badge({ children, tone = "pass" }: { children: React.ReactNode; tone?: "pass" | "review" | "muted" | "fail" }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export default function Home() {
  return <main className="dashboard">
    <aside className="sidebar"><div className="brand"><span className="brand-mark">Q</span><span>Quality Hub</span></div><nav><a className="active">总览</a><a>测试运行</a><a>兼容性矩阵</a><a>质量趋势</a><a>报告归档</a></nav><div className="sidebar-footer"><span className="dot" />UAT 数据源已连接<br /><small>本地上传器 · 待启用</small></div></aside>
    <section className="content">
      <header className="topbar"><div><p className="eyebrow">IPARTNER · TEST OPERATIONS</p><h1>测试质量看板</h1></div><div className="header-actions"><span className="last-update">最新同步：今天 14:53</span><button>导出汇报</button></div></header>
      <section className="hero"><div><p className="eyebrow light">最新测试运行</p><h2>功能通过，需视觉复核</h2><p>COMPAT-001 · ADMIN 登录并跳转首页 · UAT · 2026-09-02</p></div><div className="hero-facts"><div><small>功能通过</small><b>6 / 6</b></div><div><small>视觉复核</small><b>1</b></div><div><small>总耗时</small><b>26m 07s</b></div></div></section>
      <section className="stats"><article><span>本周期运行次数</span><strong>3</strong><em>近 7 天</em></article><article><span>功能通过率</span><strong>100%</strong><em className="good">↑ 4.2% vs 上次稳定运行</em></article><article><span>待处理风险</span><strong>1</strong><em className="warn">Android 360 视觉复核</em></article><article><span>已恢复波动</span><strong>1</strong><em>iPhone 13 · 网络 502</em></article></section>
      <div className="grid"><section className="card matrix"><div className="section-title"><div><h2>兼容性矩阵</h2><p>COMPAT-001-20260902-142725</p></div><Badge tone="review">PASS WITH VISUAL REVIEW</Badge></div><div className="table-wrap"><table><thead><tr><th>Profile</th><th>浏览器 / 设备</th><th>状态</th><th>耗时</th><th>结论</th></tr></thead><tbody>{profiles.map((p) => <tr key={p.name}><td><b>{p.name}</b></td><td>{p.device}</td><td><Badge tone={p.status === "REVIEW" ? "review" : p.status === "RECOVERED" ? "muted" : "pass"}>{p.status === "RECOVERED" ? "重试通过" : p.status === "REVIEW" ? "待复核" : "通过"}</Badge></td><td>{p.duration}</td><td>{p.note}</td></tr>)}</tbody></table></div><div className="callout"><b>需要关注：</b>Android 360 的首页截图显示加载遮罩未消失，右侧 Quick Action 卡片文本存在裁切。功能断言通过，但建议产品确认视觉表现。</div></section>
      <section className="card trend"><div className="section-title"><div><h2>质量趋势</h2><p>最近 6 次运行</p></div></div><div className="chart"><div className="chart-line" /><div className="points"><i /><i /><i /><i /><i /><i className="review-point" /></div><div className="chart-labels"><span>08/18</span><span>08/22</span><span>08/26</span><span>08/31</span><span>09/01</span><span>09/02</span></div></div><div className="legend"><span><i className="legend-dot green" />功能通过率</span><span><i className="legend-dot amber" />视觉复核</span></div></section></div>
      <section className="card runs"><div className="section-title"><div><h2>最近测试运行</h2><p>回归和兼容性报告将在这里集中归档</p></div><button className="text-button">查看全部 →</button></div><div className="table-wrap"><table><thead><tr><th>运行 ID</th><th>类型</th><th>环境</th><th>结论</th><th>通过</th><th>开始时间</th><th /></tr></thead><tbody>{runs.map((r) => <tr key={r.id}><td><b>{r.id}</b></td><td>{r.type}</td><td><Badge tone="muted">{r.env}</Badge></td><td><Badge tone={r.outcome === "需视觉复核" ? "review" : r.outcome === "环境阻塞" ? "fail" : "muted"}>{r.outcome}</Badge></td><td>{r.rate}</td><td>{r.time}</td><td><a href="#">查看报告</a></td></tr>)}</tbody></table></div></section>
    </section></main>;
}
