export type FaultmapPointKind =
| 'passing_prompt'
| 'failing_prompt'
| 'uncovered_prompt'
| 'representative_prompt';

export interface FaultmapPoint {
id: string;
clusterId: string;
kind: FaultmapPointKind;
position: [number, number, number];
score: number;
opacity: number;
pulseOffset: number;
}

export type FaultmapClusterSeverity =
| 'normal'
| 'elevated'
| 'critical'
| 'coverage_gap';

export interface FaultmapCluster {
id: string;
name: string;
description: string;
center: [number, number, number];
radius: number;
severity: FaultmapClusterSeverity;
size: number;
failureRate: number;
baselineRate: number;
effectSize: number;
adjustedPValue?: number;
}

export interface FaultmapPipelineNode {
id: string;
label: string;
position: [number, number, number];
status: 'complete' | 'active' | 'pending';
}

export interface FaultmapPipelineEdge {
source: string;
target: string;
}

export interface FaultmapDiagnosticMetric {
label: string;
value: string;
emphasis: 'cyan' | 'amber' | 'red' | 'green';
}

const OFFSET_LATTICE: [number, number, number][] = [
[0.00, 0.00, 0.00],
[0.42, 0.18, -0.24],
[-0.38, 0.22, 0.18],
[0.18, -0.36, 0.31],
[-0.22, -0.28, -0.33],
[0.61, -0.08, 0.11],
[-0.58, 0.03, -0.16],
[0.09, 0.55, 0.27],
[-0.13, -0.57, -0.08],
[0.36, 0.42, -0.39],
[-0.44, 0.39, 0.35],
[0.53, -0.41, -0.21],
[-0.51, -0.43, 0.22],
[0.78, 0.20, 0.32],
[-0.76, 0.24, -0.30],
[0.23, 0.75, -0.26],
[-0.26, -0.73, 0.28],
[0.69, -0.57, 0.05],
[-0.66, -0.53, -0.04],
[0.08, 0.88, 0.49],
[-0.05, -0.86, -0.46],
[0.91, 0.01, -0.42],
[-0.89, -0.04, 0.43],
[0.47, 0.70, 0.18],
[-0.49, 0.68, -0.19],
[0.59, -0.72, -0.34],
[-0.57, -0.69, 0.36],
[1.05, 0.31, 0.09],
[-1.02, 0.29, -0.11],
[0.32, 1.03, -0.07],
[-0.29, -1.00, 0.06],
[0.81, 0.62, -0.52],
[-0.83, 0.59, 0.51],
[0.74, -0.88, 0.41],
[-0.72, -0.85, -0.39],
[1.14, -0.18, 0.27],
[-1.11, 0.16, -0.25],
[0.16, -1.13, -0.54],
[-0.14, 1.10, 0.55],
];

const round3 = (value: number): number => Math.round(value * 1000) / 1000;

const positionAround = (
center: [number, number, number],
radius: number,
offsetIndex: number,
clusterIndex: number,
): [number, number, number] => {
const base = OFFSET_LATTICE[offsetIndex % OFFSET_LATTICE.length];
const ring = Math.floor(offsetIndex / OFFSET_LATTICE.length);
const spread = 0.68 + ring * 0.11;
const twist = (clusterIndex + 1) * 0.047 + offsetIndex * 0.013;

return [
round3(center[0] + radius * spread * (base[0] + twist)),
round3(center[1] + radius * spread * (base[1] - twist * 0.62)),
round3(center[2] + radius * spread * (base[2] + twist * 0.38)),
];
};

const scoreFor = (
kind: FaultmapPointKind,
severity: FaultmapClusterSeverity,
index: number,
): number => {
if (kind === 'uncovered_prompt') {
return round3(0.18 + (index % 7) * 0.035);
}

if (kind === 'representative_prompt') {
if (severity === 'critical') return 0.24;
if (severity === 'elevated') return 0.43;
return 0.91;
}

if (kind === 'failing_prompt') {
const base = severity === 'critical' ? 0.12 : 0.24;
return round3(base + (index % 9) * 0.026);
}

return round3(0.78 + (index % 11) * 0.018);
};

const pulseFor = (clusterIndex: number, index: number): number =>
round3((((clusterIndex + 1) * 0.137 + index * 0.061) % 1 + 1) % 1);

interface FaultmapPointSpec {
clusterId: string;
center: [number, number, number];
radius: number;
severity: FaultmapClusterSeverity;
size: number;
failureCount: number;
}

const createClusterPoints = (
spec: FaultmapPointSpec,
clusterIndex: number,
): FaultmapPoint[] =>
Array.from({ length: spec.size }, (_, index) => {
const kind: FaultmapPointKind =
spec.severity === 'coverage_gap'
? 'uncovered_prompt'
: index === 0
? 'representative_prompt'
: index <= spec.failureCount
? 'failing_prompt'
: 'passing_prompt';


return {
  id: `${spec.clusterId}-p${String(index + 1).padStart(3, '0')}`,
  clusterId: spec.clusterId,
  kind,
  position: positionAround(spec.center, spec.radius, index, clusterIndex),
  score: scoreFor(kind, spec.severity, index),
  opacity:
    kind === 'uncovered_prompt'
      ? 0.38
      : kind === 'representative_prompt'
        ? 1
        : kind === 'failing_prompt'
          ? 0.92
          : 0.72,
  pulseOffset: pulseFor(clusterIndex, index),
};
});

export const FAULTMAP_CLUSTERS: FaultmapCluster[] = [
{
id: 'cluster-legal-compliance',
name: 'Legal compliance questions',
description:
'Prompts asking for legal interpretation, liability boundaries, policy exceptions, and jurisdiction-sensitive advice.',
center: [-1.92, 0.92, -0.72],
radius: 0.48,
severity: 'critical',
size: 34,
failureRate: 0.47,
baselineRate: 0.12,
effectSize: 0.35,
adjustedPValue: 0.004,
},
{
id: 'cluster-billing-disputes',
name: 'Billing dispute resolution',
description:
'Customer support prompts involving refunds, chargebacks, subscription reversals, and emotionally escalated billing complaints.',
center: [1.34, 0.74, -0.32],
radius: 0.44,
severity: 'elevated',
size: 30,
failureRate: 0.3,
baselineRate: 0.12,
effectSize: 0.18,
adjustedPValue: 0.021,
},
{
id: 'cluster-technical-setup',
name: 'Technical setup ambiguity',
description:
'Ambiguous setup instructions where users omit environment details, dependency versions, or platform constraints.',
center: [-0.36, 1.33, 0.78],
radius: 0.42,
severity: 'normal',
size: 25,
failureRate: 0.08,
baselineRate: 0.12,
effectSize: -0.04,
adjustedPValue: 0.63,
},
{
id: 'cluster-medical-safety',
name: 'Medical-adjacent safety questions',
description:
'Health-related prompts that are not explicit diagnosis requests but still require careful safety framing and uncertainty handling.',
center: [0.18, -1.08, 0.9],
radius: 0.46,
severity: 'critical',
size: 29,
failureRate: 0.52,
baselineRate: 0.12,
effectSize: 0.4,
adjustedPValue: 0.008,
},
{
id: 'cluster-auth-2fa',
name: 'Authentication / 2FA setup',
description:
'Routine account-security prompts about login flows, authenticator apps, backup codes, and password-reset troubleshooting.',
center: [-0.88, -0.42, 1.18],
radius: 0.39,
severity: 'normal',
size: 27,
failureRate: 0.06,
baselineRate: 0.12,
effectSize: -0.06,
adjustedPValue: 0.74,
},
{
id: 'cluster-multilingual-gaps',
name: 'Multilingual support gaps',
description:
'Production prompts in Spanish, code-switched English, and mixed-language support tickets that are underrepresented in tests.',
center: [2.1, -0.82, 0.42],
radius: 0.43,
severity: 'coverage_gap',
size: 26,
failureRate: 0,
baselineRate: 0,
effectSize: 0,
},
{
id: 'cluster-long-context-retrieval',
name: 'Long-context retrieval failures',
description:
'Prompts requiring accurate synthesis across long documents, repeated entities, buried constraints, and late-arriving instructions.',
center: [-2.34, -1.05, 0.18],
radius: 0.45,
severity: 'elevated',
size: 32,
failureRate: 0.34,
baselineRate: 0.12,
effectSize: 0.22,
adjustedPValue: 0.016,
},
{
id: 'cluster-product-edge-cases',
name: 'Product refund edge cases',
description:
'Normal support prompts about product eligibility, refund windows, purchase metadata, and account-state reconciliation.',
center: [0.94, 1.22, 1.05],
radius: 0.38,
severity: 'normal',
size: 24,
failureRate: 0.07,
baselineRate: 0.12,
effectSize: -0.05,
adjustedPValue: 0.69,
},
];

export const FAULTMAP_POINTS: FaultmapPoint[] = [
...createClusterPoints(
{
clusterId: 'cluster-legal-compliance',
center: [-1.92, 0.92, -0.72],
radius: 0.48,
severity: 'critical',
size: 34,
failureCount: 16,
},
0,
),
...createClusterPoints(
{
clusterId: 'cluster-billing-disputes',
center: [1.34, 0.74, -0.32],
radius: 0.44,
severity: 'elevated',
size: 30,
failureCount: 9,
},
1,
),
...createClusterPoints(
{
clusterId: 'cluster-technical-setup',
center: [-0.36, 1.33, 0.78],
radius: 0.42,
severity: 'normal',
size: 25,
failureCount: 2,
},
2,
),
...createClusterPoints(
{
clusterId: 'cluster-medical-safety',
center: [0.18, -1.08, 0.9],
radius: 0.46,
severity: 'critical',
size: 29,
failureCount: 15,
},
3,
),
...createClusterPoints(
{
clusterId: 'cluster-auth-2fa',
center: [-0.88, -0.42, 1.18],
radius: 0.39,
severity: 'normal',
size: 27,
failureCount: 2,
},
4,
),
...createClusterPoints(
{
clusterId: 'cluster-multilingual-gaps',
center: [2.1, -0.82, 0.42],
radius: 0.43,
severity: 'coverage_gap',
size: 26,
failureCount: 0,
},
5,
),
...createClusterPoints(
{
clusterId: 'cluster-long-context-retrieval',
center: [-2.34, -1.05, 0.18],
radius: 0.45,
severity: 'elevated',
size: 32,
failureCount: 11,
},
6,
),
...createClusterPoints(
{
clusterId: 'cluster-product-edge-cases',
center: [0.94, 1.22, 1.05],
radius: 0.38,
severity: 'normal',
size: 24,
failureCount: 2,
},
7,
),
];

export const FAULTMAP_PIPELINE_NODES: FaultmapPipelineNode[] = [
{
id: 'pipeline-prompts',
label: 'Prompts',
position: [-2.8, -1.78, -1.35],
status: 'complete',
},
{
id: 'pipeline-embed',
label: 'Embed',
position: [-1.86, -1.78, -1.35],
status: 'complete',
},
{
id: 'pipeline-cluster',
label: 'Cluster',
position: [-0.92, -1.78, -1.35],
status: 'complete',
},
{
id: 'pipeline-statistical-test',
label: 'Statistical Test',
position: [0.02, -1.78, -1.35],
status: 'complete',
},
{
id: 'pipeline-bh-correction',
label: 'BH Correction',
position: [0.96, -1.78, -1.35],
status: 'active',
},
{
id: 'pipeline-name',
label: 'Name',
position: [1.9, -1.78, -1.35],
status: 'pending',
},
{
id: 'pipeline-report',
label: 'Report',
position: [2.84, -1.78, -1.35],
status: 'pending',
},
];

export const FAULTMAP_PIPELINE_EDGES: FaultmapPipelineEdge[] = [
{
source: 'pipeline-prompts',
target: 'pipeline-embed',
},
{
source: 'pipeline-embed',
target: 'pipeline-cluster',
},
{
source: 'pipeline-cluster',
target: 'pipeline-statistical-test',
},
{
source: 'pipeline-statistical-test',
target: 'pipeline-bh-correction',
},
{
source: 'pipeline-bh-correction',
target: 'pipeline-name',
},
{
source: 'pipeline-name',
target: 'pipeline-report',
},
];

export const FAULTMAP_METRICS: FaultmapDiagnosticMetric[] = [
{
label: 'TOTAL PROMPTS',
value: '227',
emphasis: 'cyan',
},
{
label: 'FAILURE SLICES',
value: '4',
emphasis: 'red',
},
{
label: 'BASELINE FAILURE RATE',
value: '12.0%',
emphasis: 'amber',
},
{
label: 'COVERAGE SCORE',
value: '86.4%',
emphasis: 'green',
},
{
label: 'FDR THRESHOLD',
value: 'q < 0.05',
emphasis: 'cyan',
},
{
label: 'UNCOVERED PRODUCTION PROMPTS',
value: '26',
emphasis: 'amber',
},
];
