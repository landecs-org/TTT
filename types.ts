
export type Operator = 'AND' | 'OR' | 'NOT' | 'IMPLIES' | 'IFF' | 'XOR';

export interface ASTNode {
  id: string;
  type: 'VAR' | Operator;
  value?: string;
  left?: ASTNode;
  right?: ASTNode;
  operand?: ASTNode; // for NOT
  expression: string; // The structural representation (e.g., "¬¬A")
  depth: number;
}

export interface TableColumn {
  id: string;
  label: string; // The display label (affected by settings)
  expression: string; // Unique identifier for values map
  isInput: boolean;
  isOutput: boolean;
  astId?: string;
  dependencyIds?: string[]; // IDs of columns this column depends on
}

export interface TruthTableRow {
  id: string;
  values: Record<string, boolean>; // Map column expression -> boolean value
  index: number;
}

export type Classification = 'Tautology' | 'Contradiction' | 'Contingency';

export interface ImplicationForms {
  original: string;
  converse: string;
  inverse: string;
  contrapositive: string;
}

// K-Map Types
export interface KMapCell {
  value: boolean;
  mintermIndex: number;
}

export interface KMapGroupCell {
  r: number;
  c: number;
}

export interface KMapGroup {
  cells: KMapGroupCell[];
  color: string;
  term: string;
}

export interface KMapData {
  grid: KMapCell[][];
  rowLabels: string[];
  colLabels: string[];
  variables: string[];
  groups: KMapGroup[];
  minimizedExpression: string;
}

// RightAway (RW) Types
export interface RightAwayResult {
    isApplicable: boolean;
    resultValue?: boolean; // The constant result (true/false)
    variable?: string; // Or if it simplifies to a variable
    explanation: string;
}

// STTT Types
export interface STTTResult {
    criticalRowId?: string; // The row that proves/disproves
    reasoning: string;
}

export interface ComplexityMetrics {
    operators: number;
    depth: number;
    variables: number;
    totalRows: number;
}

export interface AnalysisResult {
  ast: ASTNode;
  columns: TableColumn[];
  rows: TruthTableRow[];
  variables: string[]; // The variables used in this specific analysis
  classification: Classification;
  mainConnective: Operator | 'VAR';
  implicationForms?: ImplicationForms;
  kMapData?: KMapData;
  rightAway?: RightAwayResult;
  sttt?: STTTResult;
  complexity: ComplexityMetrics;
  error?: string; // For validation errors (e.g. undeclared variables)
}

export interface AppSettings {
  logic: {
    negationHandling: 'preserve' | 'normalize' | 'simplify'; // --A vs ¬¬A vs A
    truthValues: '0/1' | 'F/T';
    rowOrder: '0→1' | '1→0';
  };
  table: {
    stickyHeaders: boolean;
    showSubExpressions: boolean;
    highlightDependencies: boolean;
    dense: boolean;
  };
  ai: {
      enabled: boolean;
      apiKey?: string;
  }
}

// Default Settings Constant
export const DEFAULT_SETTINGS: AppSettings = {
  logic: {
    negationHandling: 'preserve',
    truthValues: '0/1',
    rowOrder: '0→1',
  },
  table: {
    stickyHeaders: true,
    showSubExpressions: true,
    highlightDependencies: true,
    dense: false,
  },
  ai: {
      enabled: false,
      apiKey: ''
  }
};

// --- New Types for V4 ---

export interface HistoryItem {
    id: string;
    expression: string;
    variables: string[];
    timestamp: number;
    classification: Classification;
}

export interface ProofStep {
    id: string;
    content: string;
    justification: string;
    isValid?: boolean;
    error?: string;
}

export interface WorkspaceState {
    premises: string; // "Assume"
    conclusion: string; // "Show"
    steps: ProofStep[];
}
