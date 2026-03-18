import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';

// ─── Types ──────────────────────────────────────────────────────────────────
interface OntologyNode {
  id: string;
  label: string;
  type: string;
  group: string;
}

interface OntologyEdge {
  from: string;
  to: string;
  relation: string;
}

interface NebulaOntologyGraphProps {
  center: string;
  nodes: OntologyNode[];
  edges: OntologyEdge[];
}

// ─── 노드 타입별 컬러 ──────────────────────────────────────────────────────
const TYPE_HEX: Record<string, string> = {
  center:     '#3b82f6',  // blue
  attitude:   '#f97316',  // orange
  facet:      '#6366f1',  // indigo
  trait:      '#14b8a6',  // teal
  scenario:   '#a855f7',  // purple
  saju:       '#f43f5e',  // rose (Phase 2 gap 페이지용)
  hexaco:     '#6366f1',
  nadaum:     '#14b8a6',
  prediction: '#a855f7',
};

const TYPE_LABELS: Record<string, string> = {
  center:    '중심',
  attitude:  '태도',
  facet:     'HEXACO',
  trait:     '나다움',
  scenario:  '시나리오',
  saju:      '사주',
};

const DEFAULT_HEX = '#94a3b8';

function getHex(type: string): string {
  return TYPE_HEX[type] || DEFAULT_HEX;
}

// ─── Graph node / link types for ForceGraph3D ───────────────────────────────
interface GraphNode {
  id: string;
  label: string;
  type: string;
  isCenter: boolean;
  val: number;
  color: string;
  x?: number;
  y?: number;
  z?: number;
}

interface GraphLink {
  source: string;
  target: string;
  relation: string;
}

// ─── Component ──────────────────────────────────────────────────────────────
export function NebulaOntologyGraph({ center, nodes, edges }: NebulaOntologyGraphProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 380 });

  // ─── Responsive sizing ─────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      setDimensions({ width: Math.max(280, w), height: 380 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── Build graph data ──────────────────────────────────────
  const graphData = useMemo(() => {
    const gNodes: GraphNode[] = [];
    const gLinks: GraphLink[] = [];

    // Center node
    gNodes.push({
      id: '__center__',
      label: center,
      type: 'center',
      isCenter: true,
      val: 18,
      color: getHex('center'),
    });

    // Other nodes
    for (const node of nodes) {
      const isLarge = node.type === 'attitude' || node.type === 'facet';
      gNodes.push({
        id: node.id,
        label: node.label,
        type: node.type,
        isCenter: false,
        val: isLarge ? 10 : (node.type === 'trait' ? 6 : 8),
        color: getHex(node.type),
      });
    }

    // Edges — AI는 center를 "center"로 반환하므로 "__center__"로 매핑
    const nodeIds = new Set(gNodes.map(n => n.id));
    for (const e of edges) {
      const source = e.from === 'center' ? '__center__' : e.from;
      const target = e.to === 'center' ? '__center__' : e.to;
      if (nodeIds.has(source) && nodeIds.has(target)) {
        gLinks.push({ source, target, relation: e.relation });
      }
    }

    return { nodes: gNodes, links: gLinks };
  }, [center, nodes, edges]);

  // ─── Legend types ──────────────────────────────────────────
  const legendTypes = useMemo(() => {
    const types = new Set<string>(['center']);
    for (const n of nodes) types.add(n.type);
    return Array.from(types);
  }, [nodes]);

  // ─── Auto-fit camera after layout stabilizes ──────────────
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg || graphData.nodes.length === 0) return;

    // 초기 카메라를 가깝게 설정
    fg.cameraPosition({ x: 0, y: 0, z: 120 });

    const timer = setTimeout(() => {
      fg.zoomToFit(600, 5);
    }, 1500);
    return () => clearTimeout(timer);
  }, [graphData]);

  // ─── Custom lighting ──────────────────────────────────────
  useEffect(() => {
    const fg = graphRef.current;
    if (!fg) return;
    try {
      const scene = fg.scene();
      // Remove default lights
      const existingLights = scene.children.filter(
        (c: THREE.Object3D) => c instanceof THREE.Light
      );
      existingLights.forEach((l: THREE.Object3D) => scene.remove(l));

      // Add custom lighting for pretty 3D spheres
      const ambient = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambient);

      const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight1.position.set(100, 200, 150);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0xe8eaf6, 0.3);
      dirLight2.position.set(-100, -50, -100);
      scene.add(dirLight2);

      // Soft point light for glow
      const pointLight = new THREE.PointLight(0xdbeafe, 0.4, 500);
      pointLight.position.set(0, 0, 0);
      scene.add(pointLight);
    } catch {
      // scene not ready yet
    }
  }, [graphData]);

  // ─── Custom 3D node objects ────────────────────────────────
  const nodeThreeObject = useCallback((node: GraphNode) => {
    const group = new THREE.Group();
    const color = new THREE.Color(node.color);
    const radius = node.isCenter ? 9 : (node.val > 8 ? 7 : (node.val > 6 ? 5.5 : 4.5));

    // Main sphere - shiny material
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color,
      shininess: 80,
      specular: new THREE.Color(0xffffff),
      emissive: color.clone().multiplyScalar(0.15),
      transparent: true,
      opacity: 0.92,
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    // Glow ring (outer halo)
    const glowGeometry = new THREE.SphereGeometry(radius * 1.3, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.08,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Text label sprite
    const sprite = new SpriteText(
      node.label.length > 8 ? node.label.slice(0, 8) + '..' : node.label,
      node.isCenter ? 3.5 : 2.5,
      node.isCenter ? '#1e293b' : '#475569'
    );
    sprite.fontFace = "'Pretendard Variable', 'Apple SD Gothic Neo', sans-serif";
    sprite.fontWeight = node.isCenter ? '700' : '600';
    sprite.backgroundColor = 'rgba(255,255,255,0.75)';
    sprite.borderRadius = 3;
    sprite.padding = [1.5, 3];
    sprite.position.set(0, -(radius + 3.5), 0);
    group.add(sprite);

    return group;
  }, []);

  // ─── Node hover label (HTML tooltip) ──────────────────────
  const nodeLabel = useCallback((node: GraphNode) => {
    const typeLabel = TYPE_LABELS[node.type] || node.type;
    return `<div style="background:white;color:#1e293b;padding:6px 12px;border-radius:10px;font-size:12px;box-shadow:0 4px 16px rgba(0,0,0,0.12);border:1px solid #e2e8f0;font-family:'Pretendard Variable',sans-serif">
      <div style="font-weight:700;margin-bottom:2px">${node.label}</div>
      <div style="font-size:10px;color:#64748b">${typeLabel}</div>
    </div>`;
  }, []);

  // ─── Link styling ─────────────────────────────────────────
  const linkColor = useCallback((link: GraphLink) => {
    const sourceNode = graphData.nodes.find(n => n.id === (typeof link.source === 'string' ? link.source : (link.source as GraphNode).id));
    if (sourceNode) {
      const c = new THREE.Color(sourceNode.color);
      return `rgba(${(c.r * 255) | 0},${(c.g * 255) | 0},${(c.b * 255) | 0},0.25)`;
    }
    return 'rgba(148,163,184,0.15)';
  }, [graphData.nodes]);

  const linkParticleColor = useCallback((link: GraphLink) => {
    const sourceNode = graphData.nodes.find(n => n.id === (typeof link.source === 'string' ? link.source : (link.source as GraphNode).id));
    return sourceNode?.color || '#94a3b8';
  }, [graphData.nodes]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="rounded-2xl overflow-hidden border relative"
      style={{
        width: '100%',
        borderColor: '#e2e8f0',
        background: '#f8fafc',
      }}
    >
      {/* Legend */}
      <div
        className="flex items-center gap-3 flex-wrap"
        style={{ padding: '10px 14px 6px' }}
      >
        {legendTypes.map((type) => (
          <span
            key={type}
            className="flex items-center gap-1.5"
            style={{ fontSize: 11, color: '#64748b', fontFamily: "'Pretendard Variable', sans-serif" }}
          >
            <span
              className="inline-block rounded-full"
              style={{
                width: 8,
                height: 8,
                background: getHex(type),
                boxShadow: `0 0 4px ${getHex(type)}66`,
              }}
            />
            {TYPE_LABELS[type] || type}
          </span>
        ))}
      </div>

      {/* 3D Force Graph */}
      <div ref={containerRef} style={{ width: '100%', height: 380 }}>
        <ForceGraph3D
          ref={graphRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor="#f8fafc"
          showNavInfo={false}
          enableNodeDrag={false}
          enableNavigationControls={true}
          controlType="orbit"
          nodeThreeObject={nodeThreeObject as never}
          nodeLabel={nodeLabel as never}
          nodeOpacity={1}
          linkColor={linkColor as never}
          linkWidth={1.2}
          linkOpacity={0.6}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.004}
          linkDirectionalParticleWidth={1.5}
          linkDirectionalParticleColor={linkParticleColor as never}
          warmupTicks={80}
          cooldownTicks={0}
          d3AlphaDecay={0.04}
          d3VelocityDecay={0.3}
        />
      </div>

      {/* Interaction hint — 그래프 아래 */}
      <div
        className="text-center"
        style={{ padding: '4px 0 10px', fontSize: 11, color: '#94a3b8', fontFamily: "'Pretendard Variable', sans-serif" }}
      >
        드래그로 회전 · 스크롤로 확대/축소
      </div>
    </motion.div>
  );
}
