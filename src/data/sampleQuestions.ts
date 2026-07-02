import type { GQuestion } from '../types/question'

export const sampleQuestions: GQuestion[] = [
  {
    id: 'SAMPLE-001',
    category: '機械学習',
    difficulty: '標準',
    question: '教師あり学習の説明として最も適切なものはどれか。',
    choices: {
      A: '正解ラベル付きのデータから入出力の関係を学習する手法',
      B: 'ラベルなしデータの構造を見つける手法',
      C: '試行錯誤を通じて報酬を最大化する手法',
      D: 'データを人手で分類するだけの作業',
    },
    answer: 'A',
    explanation:
      '教師あり学習は、入力とその正解ラベルのペアから、未知の入力に対する出力を予測するモデルを学習する手法。',
    sourceFile: 'sample',
    usedStatus: '',
  },
  {
    id: 'SAMPLE-002',
    category: '機械学習',
    difficulty: '標準',
    question: '教師なし学習の説明として最も適切なものはどれか。',
    choices: {
      A: '正解ラベルをもとに回帰・分類を行う手法',
      B: 'ラベルのないデータからパターンや構造を発見する手法',
      C: 'エージェントが環境と相互作用しながら学習する手法',
      D: '人間がすべての出力を事前に決めておく手法',
    },
    answer: 'B',
    explanation:
      '教師なし学習は正解ラベルを使わず、クラスタリングや次元削減などでデータの構造を捉える手法。',
    sourceFile: 'sample',
    usedStatus: '',
  },
  {
    id: 'SAMPLE-003',
    category: '強化学習',
    difficulty: 'やや難',
    question: '強化学習の説明として最も適切なものはどれか。',
    choices: {
      A: 'ラベル付きデータで直接誤差を最小化する手法',
      B: 'ラベルのないデータをクラスタリングする手法',
      C: 'エージェントが行動と報酬を通じて方策を学習する手法',
      D: '画像データだけを対象とする学習手法',
    },
    answer: 'C',
    explanation:
      '強化学習は、エージェントが環境の中で行動し、得られる報酬を最大化するように方策を学習する枠組み。',
    sourceFile: 'sample',
    usedStatus: '',
  },
  {
    id: 'SAMPLE-004',
    category: '機械学習',
    difficulty: '標準',
    question: '過学習の説明として最も適切なものはどれか。',
    choices: {
      A: '学習データにも未知データにも当てはまらない状態',
      B: '学習データに過度に適合し、未知データへの汎化性能が下がる状態',
      C: '学習が全く進んでいない状態',
      D: 'データ量が多すぎて学習できない状態',
    },
    answer: 'B',
    explanation:
      '過学習（オーバーフィッティング）は、モデルが学習データの細部やノイズまで学習してしまい、汎化性能が低下する現象。',
    sourceFile: 'sample',
    usedStatus: '未',
  },
  {
    id: 'SAMPLE-005',
    category: 'Transformer',
    difficulty: 'やや難',
    question: 'Transformerの中心的な仕組みとして最も適切なものはどれか。',
    choices: {
      A: '畳み込み演算による局所特徴抽出',
      B: 'Attention機構による系列内の関係性の学習',
      C: '決定木による分岐処理',
      D: 'k近傍法による距離計算',
    },
    answer: 'B',
    explanation:
      'TransformerはAttention機構を中心に構成され、系列内の要素間の関係を並列に学習できる点が特徴。',
    sourceFile: 'sample',
    usedStatus: '未',
  },
  {
    id: 'SAMPLE-006',
    category: 'RAG',
    difficulty: '難',
    question: 'RAG（Retrieval-Augmented Generation）の説明として最も適切なものはどれか。',
    choices: {
      A: 'モデルの重みだけを更新して知識を追加する手法',
      B: '外部知識源を検索し、その結果を踏まえて生成を行う手法',
      C: '画像データだけを検索する手法',
      D: '学習データを削除して汎化性能を上げる手法',
    },
    answer: 'B',
    explanation:
      'RAGは外部の知識ベースやドキュメントを検索し、その結果を生成モデルの入力に組み込むことで回答の精度を高める手法。',
    sourceFile: 'sample',
    usedStatus: '未',
  },
]
