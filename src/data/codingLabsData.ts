export interface PyodideDrill {
  id: string;
  phaseHint: number;
  title: string;
  hinglishTitle: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  needsNumpy: boolean;
  prompt: string;
  starterCode: string;
  testHarnessCode: string;
  testNames: string[];
}

export const PYODIDE_DRILLS: PyodideDrill[] = [
  {
    id: 'drill-dot-cosine',
    phaseHint: 0,
    title: 'Phase 0 · Cosine Similarity & L2 Norm (NumPy)',
    hinglishTitle: 'Vector Dot Product & Cosine Similarity (RAG Foundation)',
    difficulty: 'Beginner',
    needsNumpy: true,
    prompt:
      'Implement `cosine_similarity(a, b)` using NumPy arrays without external ML libraries. Return a float in [-1, 1], and handle zero-norm vectors safely by returning 0.0.',
    starterCode: `import numpy as np

def cosine_similarity(a, b):
    a = np.asarray(a, dtype=float)
    b = np.asarray(b, dtype=float)
    # TODO: Compute dot product divided by product of L2 norms
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)

print("Sample cosine:", round(cosine_similarity([1, 2, 3], [2, 4, 6]), 4))
`,
    testHarnessCode: `
assert abs(cosine_similarity([1, 0], [1, 0]) - 1.0) < 1e-6, "Identical vectors should give 1.0"
assert abs(cosine_similarity([1, 0], [0, 1]) - 0.0) < 1e-6, "Orthogonal vectors should give 0.0"
assert abs(cosine_similarity([1, 2, 3], [-1, -2, -3]) + 1.0) < 1e-6, "Opposite vectors should give -1.0"
assert cosine_similarity([0, 0], [1, 2]) == 0.0, "Zero vector should safely return 0.0"
`,
    testNames: [
      'Identical vectors == 1.0',
      'Orthogonal vectors == 0.0',
      'Opposite vectors == -1.0',
      'Zero-norm edge case == 0.0'
    ]
  },
  {
    id: 'drill-grad-descent',
    phaseHint: 0,
    title: 'Phase 0 · Vanilla Gradient Descent Loop',
    hinglishTitle: 'Calculus Chain Rule: 1D Loss Minimization',
    difficulty: 'Beginner',
    needsNumpy: false,
    prompt:
      'Minimize f(x) = (x - 4)^2 using gradient descent. Implement `minimize_quadratic(start_x, lr, steps)` so it updates `x = x - lr * grad` where grad = 2 * (x - 4). Return rounded final x.',
    starterCode: `def minimize_quadratic(start_x=0.0, lr=0.1, steps=40):
    x = float(start_x)
    for _ in range(steps):
        grad = 2.0 * (x - 4.0)
        x = x - lr * grad
    return round(x, 4)

result = minimize_quadratic(start_x=-6.0, lr=0.1, steps=50)
print("Converged x ->", result)
`,
    testHarnessCode: `
res = minimize_quadratic(0.0, 0.1, 60)
assert abs(res - 4.0) < 1e-3, f"Expected ~4.0, got {res}"
res2 = minimize_quadratic(10.0, 0.1, 60)
assert abs(res2 - 4.0) < 1e-3, f"Expected ~4.0 from positive start, got {res2}"
res_zero_lr = minimize_quadratic(2.0, 0.0, 10)
assert res_zero_lr == 2.0, "Zero learning rate must keep x unchanged"
`,
    testNames: [
      'Converges from x=0 to 4.0',
      'Converges from x=10 to 4.0',
      'Zero learning rate preserves initial x'
    ]
  },
  {
    id: 'drill-softmax',
    phaseHint: 2,
    title: 'Phase 2 · Numerically Stable Softmax',
    hinglishTitle: 'Overflow-Safe Softmax for Logits -> Probabilities',
    difficulty: 'Intermediate',
    needsNumpy: true,
    prompt:
      'Implement `stable_softmax(logits)` subtracting `np.max(logits)` before `np.exp` so large logits (like [1000, 1001, 1002]) never overflow to NaN.',
    starterCode: `import numpy as np

def stable_softmax(logits):
    x = np.asarray(logits, dtype=float)
    shifted = x - np.max(x, axis=-1, keepdims=True)
    exps = np.exp(shifted)
    return exps / np.sum(exps, axis=-1, keepdims=True)

probs = stable_softmax([1000.0, 1001.0, 1002.0])
print("Stable probs:", np.round(probs, 4), "Sum:", round(float(np.sum(probs)), 4))
`,
    testHarnessCode: `
import numpy as np
p1 = stable_softmax([1000.0, 1001.0, 1002.0])
assert not np.isnan(p1).any(), "Must not produce NaN on large logits"
assert abs(float(np.sum(p1)) - 1.0) < 1e-6, "Probabilities must sum to 1"
p2 = stable_softmax([2.0, 2.0])
assert np.allclose(p2, [0.5, 0.5]), "Equal logits should give uniform probs"
p3 = stable_softmax([[1.0, 2.0], [3.0, 3.0]])
assert p3.shape == (2, 2) and np.allclose(np.sum(p3, axis=-1), [1.0, 1.0]), "Must support 2D batches"
`,
    testNames: [
      'No NaN overflow on [1000, 1001, 1002]',
      'Outputs sum strictly to 1.0',
      'Uniform probs for equal logits',
      'Supports 2D batched logits'
    ]
  },
  {
    id: 'drill-scaled-attention',
    phaseHint: 3,
    title: 'Phase 3 · Scaled Dot-Product Self-Attention',
    hinglishTitle: 'Transformer Q-K-V Matrix Attention (NumPy)',
    difficulty: 'Advanced',
    needsNumpy: true,
    prompt:
      'Compute Transformer `self_attention(Q, K, V)`: `softmax((Q @ K.T) / sqrt(d_k)) @ V`. Verify exact output matrix shape (T, d_v).',
    starterCode: `import numpy as np

def self_attention(Q, K, V):
    Q = np.asarray(Q, dtype=float)
    K = np.asarray(K, dtype=float)
    V = np.asarray(V, dtype=float)
    d_k = K.shape[-1]
    scores = (Q @ K.T) / np.sqrt(d_k)
    scores_shifted = scores - np.max(scores, axis=-1, keepdims=True)
    weights = np.exp(scores_shifted) / np.sum(np.exp(scores_shifted), axis=-1, keepdims=True)
    return weights @ V

Q = np.ones((4, 8))
K = np.ones((4, 8))
V = np.arange(24, dtype=float).reshape(4, 6)
out = self_attention(Q, K, V)
print("Attention Output Shape:", out.shape)
`,
    testHarnessCode: `
import numpy as np
Q = np.eye(3, 4)
K = np.eye(3, 4)
V = np.array([[1.0, 0.0], [0.0, 1.0], [2.0, 2.0]])
out = self_attention(Q, K, V)
assert out.shape == (3, 2), f"Expected shape (3, 2), got {out.shape}"
assert out[0, 0] > out[0, 1], "Token 0 should attend most strongly to Token 0"
`,
    testNames: [
      'Output shape matches (T, d_v)',
      'Query-Key alignment focuses attention weight'
    ]
  },
  {
    id: 'drill-rag-chunker',
    phaseHint: 4,
    title: 'Phase 4 · Sliding-Window Text Chunker with Overlap',
    hinglishTitle: 'RAG Ingestion Pipeline: Word/Char Chunker with Overlap',
    difficulty: 'Intermediate',
    needsNumpy: false,
    prompt:
      'Build `chunk_text(text, chunk_size, overlap)` returning overlapping chunks cleanly. Ensure step = max(1, chunk_size - overlap) so loops never stall.',
    starterCode: `def chunk_text(text, chunk_size=50, overlap=10):
    if chunk_size <= 0:
        raise ValueError("chunk_size must be > 0")
    step = max(1, chunk_size - overlap)
    chunks = []
    for start in range(0, len(text), step):
        piece = text[start:start + chunk_size]
        chunks.append(piece)
        if start + chunk_size >= len(text):
            break
    return chunks

sample = "Transformers use self-attention to relate all tokens in parallel without recurrence."
c = chunk_text(sample, chunk_size=30, overlap=8)
print(f"Created {len(c)} chunks -> First:", repr(c[0]))
`,
    testHarnessCode: `
res = chunk_text("ABCDEFGHIJ", chunk_size=4, overlap=2)
assert res == ["ABCD", "CDEF", "EFGH", "GHIJ"], f"Unexpected chunks: {res}"
res_single = chunk_text("HI", chunk_size=10, overlap=2)
assert res_single == ["HI"], "Short text should return single chunk"
res_safe = chunk_text("ABCD", chunk_size=4, overlap=4)
assert len(res_safe) >= 1, "Must not infinite-loop when overlap == chunk_size"
`,
    testNames: [
      'Exact sliding window overlap preserved',
      'Short text returns 1 chunk',
      'Equal overlap/size guard prevents infinite loop'
    ]
  }
];

export interface RagSampleDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  suggestedQueries: string[];
}

export const RAG_SAMPLE_DOCS: RagSampleDoc[] = [
  {
    id: 'rag-doc-prod',
    title: 'Production RAG Latency & Chunking Playbook',
    category: 'Phase 4 · RAG Systems',
    content:
      'In production Retrieval-Augmented Generation (RAG), naive fixed-size 200-character chunking frequently breaks equations and pronoun references across boundaries. A balanced baseline uses 320-to-450 character chunks with 60-to-100 characters of overlap so headings stay linked to supporting numbers. Semantic re-ranking with a Cross-Encoder after dense Top-K (k=4 to k=6) bi-encoder retrieval improves answer precision by 24% while keeping end-to-end p95 latency under 850 milliseconds. Always enforce low temperature (0.0 to 0.2) for factual QA so the LLM refuses to hallucinate when retrieved chunks omit a critical metric, whereas temperature above 0.7 risks fabricating plausible citations.',
    suggestedQueries: [
      'What chunk size and overlap prevent losing pronoun context and numbers?',
      'How much does Cross-Encoder re-ranking improve precision and what is p95 latency?',
      'Which temperature range prevents hallucinations in factual RAG?'
    ]
  },
  {
    id: 'rag-doc-lora',
    title: 'LoRA & QLoRA Fine-Tuning Memory Budgets',
    category: 'Phase 5 · Fine-Tuning',
    content:
      'Low-Rank Adaptation (LoRA) freezes pre-trained model weights W0 and injects trainable rank decomposition matrices A and B with rank r (typically 8, 16, or 32) and scaling factor alpha = 2 * r. Applying LoRA to all linear layers—specifically q_proj, k_proj, v_proj, o_proj, gate_proj, up_proj, and down_proj—matches full fine-tuning quality on domain tasks. QLoRA compresses the frozen base model into 4-bit NormalFloat (NF4) with double quantization and paged optimizers, letting engineers fine-tune a 7B parameter model inside 14 GB of VRAM on a single consumer RTX 4080 GPU without out-of-memory crashes.',
    suggestedQueries: [
      'Which transformer linear layers should LoRA target for full quality?',
      'How much VRAM does QLoRA NF4 need to fine-tune a 7B model?',
      'What is the recommended relationship between LoRA rank r and alpha?'
    ]
  }
];

export interface TensorBugPuzzle {
  id: string;
  title: string;
  category: 'Tensor Shape' | 'Backprop Bug' | 'Transformer Mask' | 'Data Leakage' | 'Loss Bug';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  shapeContext: string;
  codeLines: string[];
  buggyLineNumber: number; // 1-indexed
  bugExplanation: string;
  hinglishExplanation: string;
  fixOptions: Array<{
    code: string;
    isCorrect: boolean;
    reason: string;
  }>;
}

export const TENSOR_BUG_PUZZLES: TensorBugPuzzle[] = [
  {
    id: 'bug-zero-grad',
    title: 'Stale Gradient Accumulation Trap',
    category: 'Backprop Bug',
    difficulty: 'Easy',
    shapeContext: 'x: [32, 128] -> logits: [32, 10]',
    codeLines: [
      'for batch_x, batch_y in train_loader:',
      '    logits = model(batch_x)',
      '    loss = criterion(logits, batch_y)',
      '    loss.backward()',
      '    optimizer.step()'
    ],
    buggyLineNumber: 4,
    bugExplanation:
      'PyTorch accumulates gradients inside `.grad` across steps. Without `optimizer.zero_grad()` before `loss.backward()`, gradients sum over previous batches and corrupt weight updates.',
    hinglishExplanation:
      'PyTorch gradients ko har batch ke baad add karta rehta hai! `loss.backward()` se pehle `optimizer.zero_grad()` na lagane se purane gradients mix ho jate hain.',
    fixOptions: [
      {
        code: '    optimizer.zero_grad()\n    loss.backward()',
        isCorrect: true,
        reason: 'Clears previous batch gradients cleanly right before computing new gradients.'
      },
      {
        code: '    loss.backward()\n    model.eval()',
        isCorrect: false,
        reason: 'Switching to eval mode stops Dropout/BatchNorm updates instead of clearing `.grad`.'
      },
      {
        code: '    with torch.no_grad():\n        loss.backward()',
        isCorrect: false,
        reason: 'Running backward inside no_grad prevents gradient computation completely.'
      }
    ]
  },
  {
    id: 'bug-attention-transpose',
    title: 'Self-Attention Matrix Multiply Mismatch',
    category: 'Tensor Shape',
    difficulty: 'Medium',
    shapeContext: 'Q: [B, H, T, D], K: [B, H, T, D], V: [B, H, T, D]',
    codeLines: [
      'def attention(Q, K, V):',
      '    d_k = Q.size(-1)',
      '    scores = torch.matmul(Q, K) / math.sqrt(d_k)',
      '    weights = F.softmax(scores, dim=-1)',
      '    return torch.matmul(weights, V)'
    ],
    buggyLineNumber: 3,
    bugExplanation:
      'Q and K both have shape [B, H, T, D]. Multiplying [T, D] @ [T, D] fails unless K is transposed on the last two dimensions (`K.transpose(-2, -1)`) to form [B, H, T, T].',
    hinglishExplanation:
      'Q aur K dono [B, H, T, D] shape ke hain. Dot-product scores [T, T] banane ke liye `K.transpose(-2, -1)` zaroori hai.',
    fixOptions: [
      {
        code: '    scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_k)',
        isCorrect: true,
        reason: 'Produces valid [B, H, T, D] @ [B, H, D, T] -> [B, H, T, T] attention matrix.'
      },
      {
        code: '    scores = torch.matmul(Q, K.T) / math.sqrt(d_k)',
        isCorrect: false,
        reason: '`.T` reverses all 4 dimensions [D, T, H, B], breaking batched matrix multiplication.'
      },
      {
        code: '    scores = torch.matmul(Q, K) * math.sqrt(d_k)',
        isCorrect: false,
        reason: 'Still has un-transposed K shape mismatch and scales up variance instead of dividing.'
      }
    ]
  },
  {
    id: 'bug-causal-mask',
    title: 'Decoder Causal Mask Leakage',
    category: 'Transformer Mask',
    difficulty: 'Hard',
    shapeContext: 'scores: [B, H, T, T], mask (upper-tri future=1): [T, T]',
    codeLines: [
      'causal_mask = torch.triu(torch.ones(T, T), diagonal=1).bool()',
      'scores = (Q @ K.transpose(-2, -1)) / math.sqrt(d_k)',
      'scores = scores.masked_fill(causal_mask, 0.0)',
      'probs = F.softmax(scores, dim=-1)',
      'out = probs @ V'
    ],
    buggyLineNumber: 3,
    bugExplanation:
      'Filling future tokens with `0.0` instead of `float("-inf")` gives e^0 = 1 weight inside softmax! Future tokens leak non-zero probability into earlier tokens.',
    hinglishExplanation:
      'Future tokens ko `0.0` fill karne par softmax mein e^0 = 1 aa jata hai, jisse future words leak hote hain! Isse `float("-inf")` fill karna chahiye.',
    fixOptions: [
      {
        code: 'scores = scores.masked_fill(causal_mask, float("-inf"))',
        isCorrect: true,
        reason: 'exp(-inf) = 0 cleanly zeroes out all future token attention probabilities.'
      },
      {
        code: 'scores = scores.masked_fill(causal_mask, 1.0)',
        isCorrect: false,
        reason: 'Gives even higher weight (e^1 = 2.718) to future tokens!'
      },
      {
        code: 'probs = F.softmax(scores, dim=0)',
        isCorrect: false,
        reason: 'Softmax along batch dimension normalizes across batch samples instead of keys.'
      }
    ]
  },
  {
    id: 'bug-double-softmax',
    title: 'Double-Softmax CrossEntropy Collapse',
    category: 'Loss Bug',
    difficulty: 'Medium',
    shapeContext: 'logits: [64, 5], labels: [64] (int class indices)',
    codeLines: [
      'logits = classifier_head(hidden_states)',
      'probs = F.softmax(logits, dim=-1)',
      'criterion = nn.CrossEntropyLoss()',
      'loss = criterion(probs, target_labels)',
      'loss.backward()'
    ],
    buggyLineNumber: 4,
    bugExplanation:
      '`nn.CrossEntropyLoss` internally computes LogSoftmax + NLLLoss. Passing post-softmax probabilities instead of raw logits squashes gradients and distorts calibration.',
    hinglishExplanation:
      '`nn.CrossEntropyLoss()` khud andar Softmax lagata hai! Pehle se `probs` dene se double-softmax hota hai aur learning slow ho jati hai.',
    fixOptions: [
      {
        code: 'loss = criterion(logits, target_labels)',
        isCorrect: true,
        reason: 'Passes raw unnormalized logits directly to CrossEntropyLoss as required.'
      },
      {
        code: 'criterion = nn.MSELoss()\nloss = criterion(probs, target_labels)',
        isCorrect: false,
        reason: 'MSELoss fails shape compatibility against scalar integer class indices.'
      },
      {
        code: 'probs = F.softmax(logits, dim=0)',
        isCorrect: false,
        reason: 'Still double-applies softmax and normalizes across the wrong axis.'
      }
    ]
  },
  {
    id: 'bug-data-leakage',
    title: 'Train/Test Preprocessing Data Leakage',
    category: 'Data Leakage',
    difficulty: 'Easy',
    shapeContext: 'X: [1000, 20], y: [1000]',
    codeLines: [
      'scaler = StandardScaler()',
      'X_scaled = scaler.fit_transform(X)',
      'X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2)',
      'model.fit(X_train, y_train)',
      'print("Val Acc:", model.score(X_test, y_test))'
    ],
    buggyLineNumber: 2,
    bugExplanation:
      'Fitting StandardScaler on all of X leaks mean and variance statistics from X_test into training normalization, artificially inflating validation metrics.',
    hinglishExplanation:
      'Poore dataset `X` pe `fit_transform` karne se test data ka mean aur std training mein leak ho jata hai. Pehle split karein, phir sirf `X_train` pe `fit` karein!',
    fixOptions: [
      {
        code: 'X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)\nX_train = scaler.fit_transform(X_train)\nX_test = scaler.transform(X_test)',
        isCorrect: true,
        reason: 'Fits statistics strictly on X_train and applies the learned transform to X_test.'
      },
      {
        code: 'X_scaled = scaler.transform(X)',
        isCorrect: false,
        reason: 'Calling transform before fit throws NotFittedError.'
      },
      {
        code: 'X_train = scaler.fit_transform(X_train)\nX_test = scaler.fit_transform(X_test)',
        isCorrect: false,
        reason: 'Re-fitting on X_test computes a mismatched scale from test distribution!'
      }
    ]
  },
  {
    id: 'bug-softmax-dim',
    title: 'Wrong Softmax Axis Across Batch',
    category: 'Tensor Shape',
    difficulty: 'Medium',
    shapeContext: 'scores: [Batch=16, Heads=8, Seq=64, Seq=64]',
    codeLines: [
      'scores = (Q @ K.transpose(-2, -1)) / math.sqrt(d_k)',
      'attn_weights = F.softmax(scores, dim=1)',
      'attn_weights = dropout(attn_weights)',
      'context = attn_weights @ V',
      'return context'
    ],
    buggyLineNumber: 2,
    bugExplanation:
      '`dim=1` normalizes probabilities across attention heads (`Heads=8`) instead of key tokens (`Seq=64`), meaning rows in `attn_weights` no longer sum to 1!',
    hinglishExplanation:
      '`dim=1` heads ke across softmax nikal raha hai jabki attention weights last token dimension (`dim=-1`) pe sum=1 hone chahiye.',
    fixOptions: [
      {
        code: 'attn_weights = F.softmax(scores, dim=-1)',
        isCorrect: true,
        reason: 'Normalizes attention scores across all key positions along the last axis.'
      },
      {
        code: 'attn_weights = F.softmax(scores, dim=0)',
        isCorrect: false,
        reason: 'Normalizes across batch samples instead of key sequence positions.'
      },
      {
        code: 'context = attn_weights @ Q',
        isCorrect: false,
        reason: 'Attention weights must weight Value vectors (V), not Query (Q).'
      }
    ]
  }
];
