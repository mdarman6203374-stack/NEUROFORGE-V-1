import { MonthMilestone } from '../types';

export const TWENTY_MONTH_MASTER_PLAN: MonthMilestone[] = [
  {
    monthNumber: 1,
    monthLabel: 'Month 01',
    phaseId: 'phase-0',
    phaseNumber: 0,
    title: 'Modern Python 3.12, OOPs & Memory Architecture',
    hinglishTitle: 'Python Deep Dive: OOPs, Memory Model aur Generators',
    focusSummary: 'Master Python internals, references, garbage collection, generators, decorators, dunder methods, and writing clean maintainable code.',
    deliverables: [
      'Write a memory-profiling pipeline using generators to stream gigabyte files',
      'Implement custom decorators for execution timing and retry policies',
      'CodeWithHarry Days 1-50 practice notebook repository'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 2,
    monthLabel: 'Month 02',
    phaseId: 'phase-0',
    phaseNumber: 0,
    title: 'Linear Algebra for AI: Vectors, Matrices & Eigenvalues',
    hinglishTitle: 'Linear Algebra: Vectors, 3D Transformations aur Eigenvectors',
    focusSummary: 'Dot products, projections, vector spaces, matrix multiplication complexity, singular value decomposition (SVD), and geometric transformations.',
    deliverables: [
      'Derive vector projections and cosine similarity equations by hand',
      'Calculate eigenvalues of a 2x2 covariance matrix without libraries',
      'CampusX Mathematics for Machine Learning (Vectors & Matrices)'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 3,
    monthLabel: 'Month 03',
    phaseId: 'phase-0',
    phaseNumber: 0,
    title: 'Multivariable Calculus, Probability & Autograd Engine',
    hinglishTitle: 'Calculus, Bayes Theorem aur MicroGrad Autograd Engine',
    focusSummary: 'Partial derivatives, gradient vectors, the multi-dimensional chain rule, conditional probability, Bayes theorem, and reverse-mode automatic differentiation.',
    deliverables: [
      'Build MicroGrad-Py: complete reverse-mode autograd engine from scratch',
      'Train a multi-layer perceptron on XOR classification using custom autograd',
      'CampusX Whiteboard Backpropagation mathematical derivations'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 4,
    monthLabel: 'Month 04',
    phaseId: 'phase-1',
    phaseNumber: 1,
    title: 'Vectorized Data Stack: NumPy, Polars & DuckDB',
    hinglishTitle: 'Vectorization: NumPy Einsum, Polars LazyFrames aur DuckDB',
    focusSummary: 'Broadcasting rules, strides, multi-dimensional tensor contractions with np.einsum, Rust-powered Polars columnar processing, and DuckDB analytical queries.',
    deliverables: [
      'Re-implement batched dot-product attention in pure NumPy via np.einsum',
      'Process 10M+ tabular records in Polars with sub-second execution',
      'Chai aur Code Modern Python for Data'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 5,
    monthLabel: 'Month 05',
    phaseId: 'phase-1',
    phaseNumber: 1,
    title: 'PyTorch Core: Tensors, Autograd & GPU CUDA Acceleration',
    hinglishTitle: 'PyTorch Mastery: Tensors, nn.Module, DataLoaders aur CUDA VRAM',
    focusSummary: 'Tensor allocations, CUDA streams, mixed-precision training (torch.cuda.amp), custom nn.Module layers, and high-performance DataLoaders.',
    deliverables: [
      'Implement custom autograd function with backward hook in PyTorch',
      'Build a streaming DataLoader with dynamic padding and pin_memory=True',
      'Krish Naik & Sunny Bhaveen PyTorch deep learning series'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 6,
    monthLabel: 'Month 06',
    phaseId: 'phase-1',
    phaseNumber: 1,
    title: 'Async Python & Production APIs: FastAPI & OmniStream Gateway',
    hinglishTitle: 'Production Async Backend: FastAPI, Streaming SSE aur Docker',
    focusSummary: 'AsyncIO event loops, Server-Sent Events (SSE) for token streaming, Pydantic v2 validation, dynamic batching queues, and Docker containerization.',
    deliverables: [
      'Deploy OmniStream: high-throughput async inference batching gateway',
      'Benchmarking endpoint with locust reaching 10k req/sec with sub-5ms p99',
      'Chai aur Code FastAPI & Backend systems'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 7,
    monthLabel: 'Month 07',
    phaseId: 'phase-2',
    phaseNumber: 2,
    title: 'Supervised Learning & Tree Ensembles: Decision Trees to Forests',
    hinglishTitle: 'Classical ML: Decision Trees Math, Random Forests aur Bagging',
    focusSummary: 'Linear & Logistic regression mathematical derivations, decision tree splitting criteria (Gini & Entropy), bagging mechanics, and out-of-bag error.',
    deliverables: [
      'Code a DecisionTree classifier from scratch with recursive splits',
      'Compare bagging vs single tree variance on noisy benchmark datasets',
      'CampusX 100 Days of Machine Learning (Part 1)'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 8,
    monthLabel: 'Month 08',
    phaseId: 'phase-2',
    phaseNumber: 2,
    title: 'Gradient Boosting (XGBoost/LightGBM) & Advanced Feature Engineering',
    hinglishTitle: 'XGBoost, LightGBM, Target Encoding aur Data Leakage Prevention',
    focusSummary: 'Residual gradient boosting, second-order Taylor approximations, histogram binning in LightGBM, out-of-fold target encoding, and handling extreme class imbalance.',
    deliverables: [
      'Formulate custom Focal Loss objective function in LightGBM',
      'Build an end-to-end Kaggle tabular pipeline with zero data leakage',
      'CampusX & Krish Naik Feature Engineering masterclasses'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 9,
    monthLabel: 'Month 09',
    phaseId: 'phase-2',
    phaseNumber: 2,
    title: 'MLOps Foundations: MLflow, SHAP Explainability & CreditRisk-Guard',
    hinglishTitle: 'Model Explainability (SHAP), MLflow Tracking aur Drift Alerts',
    focusSummary: 'PR-AUC vs ROC-AUC evaluation, Brier calibration, SHAP TreeExplainer reason codes, concept drift detection with Evidently AI, and MLflow artifact registries.',
    deliverables: [
      'Deploy CreditRisk-Guard: default prediction with sub-20ms SHAP explanations',
      'Set up automated Slack alerts on detecting Population Stability Index (PSI) drift',
      'CampusX Machine Learning Evaluation & Deployment'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 10,
    monthLabel: 'Month 10',
    phaseId: 'phase-3',
    phaseNumber: 3,
    title: 'Deep Learning Foundations: Multi-Layer Perceptrons & Optimization',
    hinglishTitle: 'Deep Neural Networks: Vanishing Gradients, LayerNorm aur Optimizers',
    focusSummary: 'Deep backpropagation on paper, vanishing/exploding gradients, He/Kaiming initialization, LayerNorm vs BatchNorm, and AdamW weight decay.',
    deliverables: [
      'Derive and code complete backpropagation on 3-layer network from scratch',
      'Profile gradient magnitudes across 10 layers with different activations',
      'CampusX Deep Learning playlist (ANN & Optimizers)'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 11,
    monthLabel: 'Month 11',
    phaseId: 'phase-3',
    phaseNumber: 3,
    title: 'Convolutional Neural Networks & Vision Architectures (ResNet)',
    hinglishTitle: 'CNN Kernels, Feature Pyramids aur ResNet Skip Connections',
    focusSummary: '2D convolutions, receptive fields, stride/padding math, ResNet identity shortcuts (F(x) + x), transfer learning, and spatial feature maps.',
    deliverables: [
      'Write custom ResNet residual blocks in PyTorch with tensor assertions',
      'Train a classification model with mixed-precision on custom image dataset',
      'CampusX CNN & Computer Vision deep dive'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 12,
    monthLabel: 'Month 12',
    phaseId: 'phase-3',
    phaseNumber: 3,
    title: 'Transformers from Scratch: The Self-Attention Engine',
    hinglishTitle: 'Attention Is All You Need: Q, K, V Matrices aur ViT Classifier',
    focusSummary: 'Scaled Dot-Product Attention, Queries, Keys, Values, Multi-Head Attention, Sinusoidal & RoPE positional encodings, causal masks, and Vision Transformers (ViT).',
    deliverables: [
      'Build line-by-line Transformer block in PyTorch with tensor shape unit tests',
      'Deploy NeuroScan-ViT: Vision Transformer with Grad-CAM visual heatmaps',
      'Sunny Bhaveen Chandra & CampusX Transformers from scratch'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 13,
    monthLabel: 'Month 13',
    phaseId: 'phase-4',
    phaseNumber: 4,
    title: 'NLP Mechanics & LLM Internals: Tokenization, RoPE & KV-Cache',
    hinglishTitle: 'Byte-Pair Encoding, RoPE Embeddings aur KV-Cache VRAM Math',
    focusSummary: 'Byte-Pair Encoding (BPE), SentencePiece, autoregressive next-token sampling, Rotary Position Embeddings (RoPE), and KV-Cache memory consumption math.',
    deliverables: [
      'Write a pure Python BPE tokenizer from scratch with merge tables',
      'Compute exact KV-cache VRAM for 7B/70B models across context windows',
      'CampusX NLP & Large Language Models Deep Dive'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 14,
    monthLabel: 'Month 14',
    phaseId: 'phase-4',
    phaseNumber: 4,
    title: 'Model Fine-Tuning: SFT, LoRA & QLoRA with Unsloth',
    hinglishTitle: 'Llama-3 Fine-Tuning: LoRA, QLoRA, Synthetic Data aur Unsloth',
    focusSummary: 'Supervised Fine-Tuning (SFT), Low-Rank Adaptation (W + BA), 4-bit NormalFloat (NF4), Unsloth training acceleration, and synthetic data curation.',
    deliverables: [
      'Fine-tune Llama-3-8B on domain dataset in Google Colab with QLoRA',
      'Execute synthetic data generation pipeline with rejection sampling filter',
      'Krish Naik Generative AI & Fine-Tuning with LoRA/QLoRA'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 15,
    monthLabel: 'Month 15',
    phaseId: 'phase-4',
    phaseNumber: 4,
    title: 'High-Throughput Serving: vLLM, PagedAttention & Quantization',
    hinglishTitle: 'vLLM Server, PagedAttention, Continuous Batching aur GGUF',
    focusSummary: 'PagedAttention virtual memory paging, continuous batching, AWQ / GPTQ / GGUF quantization, and serving OpenAI-compatible APIs.',
    deliverables: [
      'Deploy JurisLlama: legal domain LLM on vLLM server with 180 tok/sec',
      'Quantize fine-tuned model into GGUF format for local edge inference',
      'Krish Naik vLLM & Ollama Deployment masterclass'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 16,
    monthLabel: 'Month 16',
    phaseId: 'phase-5',
    phaseNumber: 5,
    title: 'Production RAG: Layout Chunking, Hybrid Search & Reranking',
    hinglishTitle: 'Advanced RAG: Docling Chunking, BM25 + Vector Search aur Rerankers',
    focusSummary: 'Layout-aware document parsing with Docling, parent-document retrieval, Hybrid Search (Dense HNSW + Sparse BM25 via RRF), and Cohere rerankers.',
    deliverables: [
      'Build hybrid retriever combining Qdrant and BM25 with Reciprocal Rank Fusion',
      'Benchmark context recall before and after applying cross-encoder reranker',
      'Krish Naik Advanced RAG Masterclass (Chroma, Qdrant, Pinecone)'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 17,
    monthLabel: 'Month 17',
    phaseId: 'phase-5',
    phaseNumber: 5,
    title: 'GraphRAG with Neo4j & Automated Evaluation with Ragas',
    hinglishTitle: 'Microsoft GraphRAG: Neo4j Knowledge Graph aur Ragas Metrics',
    focusSummary: 'Entity-relation graph extraction, property graphs in Neo4j, Leiden community clustering, multi-hop question answering, and Ragas Faithfulness evaluation.',
    deliverables: [
      'Deploy GraphNexus: enterprise knowledge brain over 50,000 files',
      'Automate CI/CD pipeline enforcing Ragas Faithfulness score > 0.90',
      'Chai aur Code & Krish Naik GraphRAG and pgvector architectures'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 18,
    monthLabel: 'Month 18',
    phaseId: 'phase-6',
    phaseNumber: 6,
    title: 'Autonomous AI Agents: ReAct, LangGraph StateMachines & Docker Sandboxes',
    hinglishTitle: 'AI Agents: LangGraph StateGraph, Tool Sandboxes aur CrewAI',
    focusSummary: 'ReAct loops, LangGraph StateGraph state machines, conditional routing, checkpoints, human-in-the-loop review, and Docker isolated code execution.',
    deliverables: [
      'Deploy DevAgent-Swarm: autonomous GitHub PR review & test synthesis swarm',
      'Implement isolated Docker sandbox container spawning via Python SDK',
      'Krish Naik & Sunny Bhaveen LangGraph and CrewAI series'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 19,
    monthLabel: 'Month 19',
    phaseId: 'phase-7',
    phaseNumber: 7,
    title: 'Production LLMOps: Observability, Guardrails & Security Firewalls',
    hinglishTitle: 'Production LLMOps: Langfuse Tracing, Prompt Injection Defense aur Caching',
    focusSummary: 'Distributed tracing with Langfuse, prompt injection defense, Meta Llama-Guard, PII data redaction with Microsoft Presidio, and Redis semantic caching.',
    deliverables: [
      'Deploy AegisGate: enterprise security gateway cutting API costs by 42%',
      'Instrument full multi-agent application with Langfuse trace spans',
      'Krish Naik Complete MLOps, Docker & AWS playlist'
    ],
    totalStudyHours: 60
  },
  {
    monthNumber: 20,
    monthLabel: 'Month 20',
    phaseId: 'phase-8',
    phaseNumber: 8,
    title: 'Future Frontiers: Reasoning Models (o1/R1 MCTS), Capstones & Interviews',
    hinglishTitle: 'Reasoning Models (MCTS), Visionary Capstone aur Job Interview Prep',
    focusSummary: 'Test-time compute scaling, Monte Carlo Tree Search for LLMs, Process Reward Models, completing flagship visionary project, and cracking high-paying AI Engineer interviews.',
    deliverables: [
      'Build AxiomReasoner: Monte Carlo Tree Search reasoning engine with PRM verifier',
      'Publish complete portfolio with live demos, Dockerfiles, and STAR resume bullets',
      'Practice top 30 AI engineering technical interview questions and mock systems'
    ],
    totalStudyHours: 60
  }
];
