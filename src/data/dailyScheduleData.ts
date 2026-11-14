import { DailyTask, SchedulePace } from '../types';

export const CURATED_DAILY_CURRICULUM: Omit<DailyTask, 'dayNumber'>[] = [
  // --- Phase 0: Mathematical & CS Foundations (Days 1 - 20) ---
  {
    phaseId: 'phase-0',
    phaseNumber: 0,
    title: 'Linear Algebra: Vectors, Norms & Dot Product Intuition',
    hinglishTitle: 'Vectors aur Dot Product ka 3D Geometrical Meaning',
    focusArea: 'Concept',
    durationMins: 180,
    learningGoal: 'Understand vectors as directions in space, L1/L2 Euclidean norms, unit vectors, and how the dot product measures angular similarity.',
    hinglishGoal: 'Vectors aur Dot product embeddings ki foundation hain. Samjhein ki kaise do text embeddings ka dot product unke semantic meaning ko compare karta hai.',
    recommendedHindiPlaylist: 'CampusX - Mathematics for Machine Learning',
    playlistSearchQuery: 'campusx mathematics for machine learning vectors dot product',
    handsOnTask: 'Write a pure Python class `Vector` from scratch with methods for dot product, Euclidean norm, cosine similarity, and projection without using any external libraries.',
    quickCheckQuestion: 'What does a dot product of 0 between two non-zero vectors mean geometrically?',
    quickCheckAnswer: 'The two vectors are orthogonal (perpendicular at 90 degrees), meaning their angular cosine is 0 and they share zero directional similarity.'
  },
  {
    phaseId: 'phase-0',
    phaseNumber: 0,
    title: 'Matrix Multiplication, Transpose & Computational Complexity',
    hinglishTitle: 'Matrix Operations, Dimensions aur O(N^3) Complexity',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Master matrix transformations as linear space morphing. Understand row-column multiplication rules, matrix dimensions compatibility $(m \\times k) \\times (k \\times n)$, and computational complexity.',
    hinglishGoal: 'Matrix multiplication LLM ke har self-attention block mein hota hai. Dimension matching aur memory complexity ko visual perspective se samjhein.',
    recommendedHindiPlaylist: 'CampusX - Mathematics for Machine Learning',
    playlistSearchQuery: 'campusx matrix multiplication linear algebra hindi',
    handsOnTask: 'Implement standard matrix multiplication in pure Python with nested loops, measure execution time on a 200x200 matrix, and verify against NumPy.',
    quickCheckQuestion: 'Can you multiply a matrix of shape (3, 4) with a matrix of shape (3, 4)?',
    quickCheckAnswer: 'No, inner dimensions must match: (3, 4) can only multiply with a matrix of shape (4, k).'
  },
  {
    phaseId: 'phase-0',
    phaseNumber: 0,
    title: 'Eigenvalues, Eigenvectors & Geometric Scaling',
    hinglishTitle: 'Eigenvectors kya hote hain aur PCA mein kaise use hote hain',
    focusArea: 'Concept',
    durationMins: 180,
    learningGoal: 'Learn what happens to vectors along invariant transformation axes ($Av = \\lambda v$). Connect this to Principal Component Analysis (PCA) and dimensionality reduction.',
    hinglishGoal: 'Jab koi matrix space ko stretch karti hai, toh jo vectors apni direction nahi badalte unhe eigenvectors kehte hain. Yahi PCA ka secret hai.',
    recommendedHindiPlaylist: 'CampusX - Mathematics for Machine Learning',
    playlistSearchQuery: 'campusx eigenvalues eigenvectors hindi',
    handsOnTask: 'Calculate the eigenvalues and eigenvectors of a 2x2 covariance matrix by hand on paper, then write a Python verification script.',
    quickCheckQuestion: 'In PCA, which eigenvector corresponds to the direction of maximum variance?',
    quickCheckAnswer: 'The eigenvector paired with the highest corresponding eigenvalue.'
  },
  {
    phaseId: 'phase-0',
    phaseNumber: 0,
    title: 'Multivariable Derivatives, Gradients & Directional Derivatives',
    hinglishTitle: 'Partial Derivatives aur 3D Gradient Vector',
    focusArea: 'Concept',
    durationMins: 180,
    learningGoal: 'Understand partial derivatives $\\frac{\\partial f}{\\partial x}$, the gradient vector $\\nabla f$, and why the gradient always points in the direction of steepest ascent.',
    hinglishGoal: 'Loss function ke pahad par sabse tez neeche kaise utre? Gradient vector hamesha steepest ascent dikhata hai, isliye hum -gradient ki taraf step lete hain.',
    recommendedHindiPlaylist: 'CampusX - Mathematics for Machine Learning',
    playlistSearchQuery: 'campusx partial derivatives gradient descent hindi',
    handsOnTask: 'Manually compute partial derivatives of a 2-variable loss function $L(w_1, w_2) = (w_1 - 3)^2 + (w_2 + 2)^2$ and plot contour lines in Matplotlib.',
    quickCheckQuestion: 'Why do we update weights with negative gradient ($-\\eta \\nabla L$)?',
    quickCheckAnswer: 'Because the gradient points towards the steepest increase in loss; negating it moves towards the minimum loss.'
  },
  {
    phaseId: 'phase-0',
    phaseNumber: 0,
    title: 'The Multi-Dimensional Chain Rule: Foundation of Backpropagation',
    hinglishTitle: 'Chain Rule se Backpropagation ka white-board derivation',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Derive composite function derivatives using the chain rule. Trace how an error at the output layer propagates backwards through intermediate activation layers.',
    hinglishGoal: 'Deep Neural Networks ka poora magic chain rule par tika hai. Intermediate variables ke through derivatives multiply kaise hote hain, iska flow samjhein.',
    recommendedHindiPlaylist: 'CampusX - Deep Learning Playlist',
    playlistSearchQuery: 'campusx backpropagation chain rule mathematical derivation',
    handsOnTask: 'Write a manual Python script computing analytical gradient for a 3-step composition: $x \\to a = 2x+1 \\to b = a^2 \\to c = \\sin(b)$. Verify with central differences.',
    quickCheckQuestion: 'If $y = g(u)$ and $u = f(x)$, what is $\\frac{dy}{dx}$ by the chain rule?',
    quickCheckAnswer: '$\\frac{dy}{dx} = \\frac{dy}{du} \\times \\frac{du}{dx}$.'
  },
  {
    phaseId: 'phase-0',
    phaseNumber: 0,
    title: 'Probability Distributions & Bayes Theorem in AI',
    hinglishTitle: 'Bayes Theorem, Prior, Likelihood aur Posterior',
    focusArea: 'Concept',
    durationMins: 180,
    learningGoal: 'Master conditional probability $P(A|B)$, Bayes Theorem formulation, Gaussian/Normal distributions, and Maximum Likelihood Estimation (MLE).',
    hinglishGoal: 'Machine Learning models certainty ke saath nahi, probability ke saath answer karte hain. Prior knowledge aur new evidence ko Bayes theorem se combine karna seekhein.',
    recommendedHindiPlaylist: 'Krish Naik - Complete Statistics Playlist',
    playlistSearchQuery: 'krish naik bayes theorem probability distribution hindi',
    handsOnTask: 'Implement a Bayesian spam filter classifier in pure Python that computes posterior probabilities given a bag-of-words message.',
    quickCheckQuestion: 'What is the difference between prior probability and posterior probability?',
    quickCheckAnswer: 'Prior is the belief before observing evidence; posterior is the updated belief after conditioning on new evidence.'
  },
  {
    phaseId: 'phase-0',
    phaseNumber: 0,
    title: 'Python Memory Model, References & Generators',
    hinglishTitle: 'Python Memory Management, Mutability aur Generators',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Understand Python objects in memory, pass-by-object-reference, shallow vs deep copies, and memory-saving streaming generators (`yield`).',
    hinglishGoal: 'Jab 10GB ka text dataset load karte hain, toh computer crash kyu hota hai? Generators bina memory bhare data stream kaise karte hain.',
    recommendedHindiPlaylist: 'Chai aur Code - Python Playlist',
    playlistSearchQuery: 'chai aur code python memory management generators hindi',
    handsOnTask: 'Write a memory-profiling script that processes a 1GB dummy file using standard `list` vs a custom `yield` generator, comparing RAM utilization.',
    quickCheckQuestion: 'Why does a generator function consume constant $O(1)$ memory?',
    quickCheckAnswer: 'Because it yields one item at a time on demand rather than storing the entire sequence in memory.'
  },
  {
    phaseId: 'phase-0',
    phaseNumber: 0,
    title: 'Phase 0 Milestone Project: Building MicroGrad-Py',
    hinglishTitle: 'Phase 0 Project: Pure Python mein Autograd Engine banana',
    focusArea: 'Project',
    durationMins: 240,
    learningGoal: 'Synthesize everything learned: build a scalar value node tracking backward gradients using topological sort and train a 2-layer classifier.',
    hinglishGoal: 'Aaj aap khud ka mini-PyTorch banayenge! Har calculation ka computation graph banega aur backward pass automatically gradients calculate karega.',
    recommendedHindiPlaylist: 'CampusX - Deep Learning from Scratch',
    playlistSearchQuery: 'campusx building neural network from scratch python',
    handsOnTask: 'Complete the `Value` class with `__add__`, `__mul__`, `relu`, and `backward` methods. Train it to solve the XOR logic problem.',
    quickCheckQuestion: 'Why is a topological sort required before running backpropagation on a computational graph?',
    quickCheckAnswer: 'To ensure a node’s gradients are fully accumulated from all its child output paths before it propagates backward to its parents.'
  },

  // --- Phase 1: Python, Polars & PyTorch Core (Days 21 - 45) ---
  {
    phaseId: 'phase-1',
    phaseNumber: 1,
    title: 'NumPy Broadcasting Rules, Strides & np.einsum',
    hinglishTitle: 'NumPy Broadcasting aur Einstein Summation (np.einsum)',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Understand dimension expansion, rules of broadcasting across mismatched shapes, memory strides, and multi-dimensional tensor contractions with `np.einsum`.',
    hinglishGoal: 'For-loops ko permanently bye-bye bolein! `np.einsum` se batched matrix multiplication aur attention dot products ek single line mein express karna seekhein.',
    recommendedHindiPlaylist: 'CampusX - 100 Days of Machine Learning',
    playlistSearchQuery: 'campusx numpy broadcasting strides einsum hindi',
    handsOnTask: 'Re-implement batched dot-product attention $softmax(\\frac{Q K^T}{\\sqrt{d_k}}) V$ in pure NumPy using `np.einsum` without any explicit loops.',
    quickCheckQuestion: 'Can an array of shape (5, 1, 4) broadcast with an array of shape (3, 4)? What is the resulting shape?',
    quickCheckAnswer: 'Yes, because trailing dimensions match (4=4) and 1 expands to 3. Resulting shape is (5, 3, 4).'
  },
  {
    phaseId: 'phase-1',
    phaseNumber: 1,
    title: 'Polars: High-Performance Columnar Data Processing',
    hinglishTitle: 'Pandas chodo! Polars se 15x Fast Data Pipelines banana',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Learn Polars lazy evaluation (`pl.LazyFrame`), query optimization plans, zero-copy Apache Arrow memory format, and grouping operations.',
    hinglishGoal: 'Pandas slow hai aur memory bohot khata hai. Modern AI companies Polars use karti hain jo Rust mein likha hai aur multi-core CPU ka poora use karta hai.',
    recommendedHindiPlaylist: 'Chai aur Code - Modern Python for Data',
    playlistSearchQuery: 'chai aur code polars fast data processing hindi',
    handsOnTask: 'Load a 5-million row CSV using Polars LazyFrame, construct a group-by and rolling aggregation pipeline, and inspect the optimized execution graph with `.explain()`.',
    quickCheckQuestion: 'What is the performance advantage of Polars LazyFrame over eager evaluation?',
    quickCheckAnswer: 'Lazy evaluation builds a logical query plan, enabling automatic predicate pushdown and projection pruning before any data is read into memory.'
  },
  {
    phaseId: 'phase-1',
    phaseNumber: 1,
    title: 'PyTorch Tensors, GPU Device Memory & CUDA Streams',
    hinglishTitle: 'PyTorch Tensors, CUDA Device Allocation aur VRAM',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Learn tensor allocation semantics, `.to(device)`, non-blocking asynchronous memory copies (`non_blocking=True`), and preventing CUDA Out-of-Memory (OOM) leaks.',
    hinglishGoal: 'GPU memory crash (CUDA OOM) sabse frustrating error hota hai. PyTorch memory allocator kaise kaam karta hai aur tensor detachment kab karni chahiye.',
    recommendedHindiPlaylist: 'Krish Naik - PyTorch Tutorial in Hindi',
    playlistSearchQuery: 'krish naik pytorch tensors cuda memory management hindi',
    handsOnTask: 'Write a PyTorch script that dynamically measures GPU VRAM before and after allocation, tracks peak memory with `torch.cuda.max_memory_allocated()`, and safely frees cache.',
    quickCheckQuestion: 'Why should you call `.detach()` or use `with torch.no_grad():` during inference or metric evaluation?',
    quickCheckAnswer: 'To prevent PyTorch from retaining intermediate tensors in GPU memory for gradient backprop calculation.'
  },
  {
    phaseId: 'phase-1',
    phaseNumber: 1,
    title: 'Building Custom PyTorch nn.Module & Loss Functions',
    hinglishTitle: 'Custom Neural Network Layer aur Loss Function banana',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Master subclassing `torch.nn.Module`, defining `__init__` and `forward`, parameter registration (`nn.Parameter`), and authoring a custom loss function.',
    hinglishGoal: 'Standard layers ke alawa jab custom research paper implement karna ho, toh PyTorch Module ka exact structure samajhna zaroori hai.',
    recommendedHindiPlaylist: 'Sunny Bhaveen Chandra - PyTorch Deep Learning',
    playlistSearchQuery: 'sunny bhaveen chandra custom nn.module pytorch hindi',
    handsOnTask: 'Create a custom `FocalLoss` PyTorch module that down-weights easy examples with tunable focusing parameter $\\gamma$ and verifies backward autograd.',
    quickCheckQuestion: 'What happens if you define a tensor inside `__init__` without wrapping it in `nn.Parameter`?',
    quickCheckAnswer: 'PyTorch will not track it as a trainable model weight, meaning it won’t appear in `model.parameters()` or receive gradient updates.'
  },
  {
    phaseId: 'phase-1',
    phaseNumber: 1,
    title: 'PyTorch DataLoader, Multiprocessing & Custom Datasets',
    hinglishTitle: 'PyTorch DataLoader, Batching aur Multi-worker Pipeline',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Subclass `torch.utils.data.Dataset`, implement `__len__` and `__getitem__`, tune `num_workers`, `pin_memory=True`, and write custom collation functions.',
    hinglishGoal: 'Agar DataLoader slow hai toh GPU 80% time khali baitha rahega. Fast data feeding pipeline banana GPU training ka sabse important part hai.',
    recommendedHindiPlaylist: 'Krish Naik - PyTorch Tutorial in Hindi',
    playlistSearchQuery: 'krish naik pytorch custom dataset dataloader hindi',
    handsOnTask: 'Build a custom Dataset that streams text files lazily from disk with a custom `collate_fn` that dynamically pads sequences to the longest item in the batch.',
    quickCheckQuestion: 'What does `pin_memory=True` do in a PyTorch DataLoader?',
    quickCheckAnswer: 'It allocates tensor memory in host page-locked (pinned) memory, accelerating direct DMA transfers to GPU VRAM.'
  },
  {
    phaseId: 'phase-1',
    phaseNumber: 1,
    title: 'Asynchronous Python & FastAPI AI Service Architecture',
    hinglishTitle: 'FastAPI se Streaming AI Endpoints banana (Server-Sent Events)',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Master `asyncio`, event loop mechanics, Pydantic v2 validation models, and streaming LLM token chunks using Server-Sent Events (SSE).',
    hinglishGoal: 'Jab ChatGPT type karta hai toh har word turant dikhta hai — yeh streaming FastAPI aur async Python ke zariye hoti hai. Aaj iska server banayein.',
    recommendedHindiPlaylist: 'Chai aur Code - FastAPI & Backend',
    playlistSearchQuery: 'chai aur code fastapi async streaming python hindi',
    handsOnTask: 'Build an async FastAPI service that accepts a prompt, streams back simulated token deltas using `StreamingResponse` and `EventSourceResponse`, with strict Pydantic validation.',
    quickCheckQuestion: 'Why should you avoid synchronous CPU-heavy functions inside an `async def` FastAPI route?',
    quickCheckAnswer: 'Because synchronous code blocks the entire single-threaded event loop, preventing all concurrent incoming client requests from progressing.'
  },
  {
    phaseId: 'phase-1',
    phaseNumber: 1,
    title: 'Phase 1 Project: High-Throughput OmniStream Gateway',
    hinglishTitle: 'Phase 1 Project: Streaming Feature Store & Batch Gateway',
    focusArea: 'Project',
    durationMins: 240,
    learningGoal: 'Integrate Polars, DuckDB, and FastAPI into a high-throughput microservice that batches incoming feature requests for a PyTorch inference model.',
    hinglishGoal: 'Ek production-ready async API banayein jo tabular data ko Polars se process kare aur PyTorch model par dynamic batching ke saath run kare.',
    recommendedHindiPlaylist: 'Chai aur Code - Complete Backend Project',
    playlistSearchQuery: 'chai aur code end to end fastapi backend project hindi',
    handsOnTask: 'Implement dynamic batching queue using `asyncio.Queue` that collects individual inference requests up to batch size 32 or 10ms timeout before GPU execution.',
    quickCheckQuestion: 'What is dynamic inference batching and why is it used?',
    quickCheckAnswer: 'It groups individual concurrent incoming client queries into a single tensor batch before feeding the GPU, maximizing compute throughput.'
  },

  // --- Phase 2: Classical Machine Learning & Production Modeling (Days 46 - 70) ---
  {
    phaseId: 'phase-2',
    phaseNumber: 2,
    title: 'Decision Trees: Gini Impurity, Entropy & Information Gain',
    hinglishTitle: 'Decision Trees ki Mathematical Splitting (Gini & Entropy)',
    focusArea: 'Concept',
    durationMins: 180,
    learningGoal: 'Understand tree construction, split evaluations using Gini Impurity and Shannon Entropy, pruning strategies, and preventing catastrophic overfitting.',
    hinglishGoal: 'Decision Tree split kaise decide karta hai? Whiteboard math ke saath samjhein ki Gini Impurity calculate karke best feature kaise choose hota hai.',
    recommendedHindiPlaylist: 'CampusX - 100 Days of Machine Learning',
    playlistSearchQuery: 'campusx decision trees gini impurity entropy mathematics',
    handsOnTask: 'Calculate Gini Impurity for a 10-row dataset manually with pen and paper, then verify with Scikit-Learn `DecisionTreeClassifier`.',
    quickCheckQuestion: 'What is the theoretical minimum and maximum value of Gini Impurity for a 2-class binary classification problem?',
    quickCheckAnswer: 'Minimum is 0.0 (pure node, all samples belong to one class); maximum is 0.5 (equal 50/50 split).'
  },
  {
    phaseId: 'phase-2',
    phaseNumber: 2,
    title: 'Ensemble Learning: Random Forests & Bagging Mechanics',
    hinglishTitle: 'Random Forests, Bootstrap Aggregation aur Out-of-Bag Score',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Learn bootstrap sampling with replacement, feature sub-sampling, reducing variance without increasing bias, and Out-of-Bag (OOB) error estimation.',
    hinglishGoal: 'Ek tree overfit karta hai, lekin 100 trees ka vote variance kam kar deta hai. Random Forest ka bagging concept samjhein.',
    recommendedHindiPlaylist: 'CampusX - 100 Days of Machine Learning',
    playlistSearchQuery: 'campusx random forest bagging out of bag score hindi',
    handsOnTask: 'Implement a basic BaggingClassifier in pure Python using 20 Scikit-Learn DecisionTrees with random row and column sampling.',
    quickCheckQuestion: 'Why does Random Forest randomly sample a subset of features at each split instead of using all available features?',
    quickCheckAnswer: 'To decorrelate the individual trees, preventing one dominant feature from causing all trees to make identical splits.'
  },
  {
    phaseId: 'phase-2',
    phaseNumber: 2,
    title: 'Gradient Boosting: Mathematical Intuition of XGBoost & LightGBM',
    hinglishTitle: 'XGBoost aur LightGBM ka Gradient Boosting Algorithm',
    focusArea: 'Concept',
    durationMins: 180,
    learningGoal: 'Understand boosting: training trees sequentially to predict residual pseudo-gradients of previous trees. Compare XGBoost second-order Taylor expansion with LightGBM histogram binning.',
    hinglishGoal: 'Industry tabular data ka absolute king hai Gradient Boosting! Har agla tree pichle tree ki galtiyon (residuals) ko seekhta hai.',
    recommendedHindiPlaylist: 'CampusX - 100 Days of Machine Learning',
    playlistSearchQuery: 'campusx gradient boosting xgboost mathematical intuition hindi',
    handsOnTask: 'Train an XGBoost classifier and a LightGBM classifier on the Kaggle Titanic/Credit dataset, comparing training speed and ROC-AUC metrics.',
    quickCheckQuestion: 'How does LightGBM achieve much faster training speeds than standard XGBoost on large datasets?',
    quickCheckAnswer: 'By using histogram-based binning of continuous features into discrete buckets and Exclusive Feature Bundling (EFB).'
  },
  {
    phaseId: 'phase-2',
    phaseNumber: 2,
    title: 'Feature Engineering: Target Encoding & Data Leakage Prevention',
    hinglishTitle: 'Target Encoding, Out-of-Fold Splits aur Data Leakage se Bachna',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Master high-cardinality categorical encoding, out-of-fold target encoding with smoothing, cyclical feature encoding (sine/cosine for time), and avoiding test set leakage.',
    hinglishGoal: 'Data leakage sabse bada interview rejection reason hota hai. Seekhein ki feature engineering hamesha cross-validation folds ke andar kyu honi chahiye.',
    recommendedHindiPlaylist: 'Krish Naik - Feature Engineering Playlist',
    playlistSearchQuery: 'krish naik feature engineering target encoding data leakage',
    handsOnTask: 'Implement an out-of-fold smoothed target encoder class in Python with K-Fold cross-validation and verify zero leakage onto test data.',
    quickCheckQuestion: 'What is data leakage and why does it produce deceptively high cross-validation scores that collapse in production?',
    quickCheckAnswer: 'Data leakage occurs when information from outside the training dataset (such as future labels or test distribution statistics) is inadvertently used to train the model.'
  },
  {
    phaseId: 'phase-2',
    phaseNumber: 2,
    title: 'Model Evaluation: PR-AUC, Calibration Curves & SHAP Explainability',
    hinglishTitle: 'PR-AUC vs ROC-AUC, Calibration aur SHAP Values',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Learn why ROC-AUC is misleading for extreme class imbalance (e.g. fraud detection), how to interpret Precision-Recall AUC, model calibration (Brier score), and compute Shapley values (SHAP).',
    hinglishGoal: 'Jab fraud sirf 0.1% ho toh ROC-AUC 0.99 aa sakta hai jabki model bekaar ho. PR-AUC aur SHAP feature importance calculate karna seekhein.',
    recommendedHindiPlaylist: 'CampusX - Machine Learning Evaluation Metrics',
    playlistSearchQuery: 'campusx roc auc precision recall curve shap values hindi',
    handsOnTask: 'Train a fraud classifier, compute SHAP waterfall and summary plots, and output a human-readable text explanation of why a specific transaction was flagged.',
    quickCheckQuestion: 'Why should you prefer Precision-Recall AUC over ROC-AUC when evaluating heavily imbalanced binary classification datasets?',
    quickCheckAnswer: 'Because ROC-AUC includes True Negative Rate in its calculation, which is swamped by the massive majority class, giving a falsely optimistic score.'
  },
  {
    phaseId: 'phase-2',
    phaseNumber: 2,
    title: 'Phase 2 Project: CreditRisk-Guard & Drift Sentinel',
    hinglishTitle: 'Phase 2 Project: End-to-End Default Prediction with SHAP & Drift Alerts',
    focusArea: 'Project',
    durationMins: 240,
    learningGoal: 'Build an enterprise financial risk model with Optuna Bayesian hyperparameter search, SHAP API explainability, and Evidently AI drift monitoring.',
    hinglishGoal: 'Complete portfolio project banayein: LightGBM model train karein, MLflow mein version karein, aur SHAP ke zariye real-time reason codes return karein.',
    recommendedHindiPlaylist: 'Krish Naik - End to End Machine Learning Project',
    playlistSearchQuery: 'krish naik end to end machine learning project deployment hindi',
    handsOnTask: 'Deploy the trained model behind FastAPI with an endpoint `/predict` returning both default probability and top-3 contributing risk features via SHAP.',
    quickCheckQuestion: 'What is concept drift and how does it differ from covariate shift?',
    quickCheckAnswer: 'Covariate shift is a change in the input feature distribution $P(X)$; concept drift is a change in the underlying relationship between features and target $P(Y|X)$.'
  },

  // --- Phase 3: Deep Learning, CNNs & Transformers (Days 71 - 100) ---
  {
    phaseId: 'phase-3',
    phaseNumber: 3,
    title: 'Multi-Layer Perceptrons & Vanishing Gradient Solutions',
    hinglishTitle: 'Vanishing Gradients, LayerNorm vs BatchNorm, aur He Initialization',
    focusArea: 'Concept',
    durationMins: 180,
    learningGoal: 'Understand why deep sigmoidal networks fail to backpropagate gradients, how ReLU/GELU activations and He/Kaiming weight initializations solve saturation, and compare BatchNorm with LayerNorm.',
    hinglishGoal: 'Deep neural networks mein pehli layers tak gradient pahunchte-pahunchte gayab kyu ho jata hai? Normalization aur modern activations ka role samjhein.',
    recommendedHindiPlaylist: 'CampusX - Deep Learning Playlist',
    playlistSearchQuery: 'campusx vanishing gradient problem batch normalization layernorm hindi',
    handsOnTask: 'Build a 10-layer network in PyTorch with sigmoid activations and observe gradients vanish; swap to GELU and LayerNorm and verify healthy gradient propagation.',
    quickCheckQuestion: 'Why do Transformers and LLMs overwhelmingly use Layer Normalization rather than Batch Normalization?',
    quickCheckAnswer: 'Because batch normalization depends on batch statistics and struggles with variable sequence lengths; LayerNorm normalizes across feature dimensions independently per token.'
  },
  {
    phaseId: 'phase-3',
    phaseNumber: 3,
    title: 'Convolutional Neural Networks & ResNet Skip Connections',
    hinglishTitle: 'CNN Kernels, Receptive Fields aur ResNet Skip Connections',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Master 2D convolution operations, padding, stride, receptive field math, and why ResNet residual connections ($F(x) + x$) allow training 100+ layer deep networks.',
    hinglishGoal: 'Computer Vision ki foundation: Kernels edges aur textures kaise detect karte hain, aur ResNet ka skip connection gradient ko highway ki tarah pass kaise karta hai.',
    recommendedHindiPlaylist: 'CampusX - Deep Learning Playlist',
    playlistSearchQuery: 'campusx cnn convolutional neural network resnet skip connections hindi',
    handsOnTask: 'Write a small ResNet residual block in PyTorch with two $3 \\times 3$ conv layers and an identity shortcut addition.',
    quickCheckQuestion: 'Why does adding an identity shortcut $F(x) + x$ prevent vanishing gradients in deep ResNets?',
    quickCheckAnswer: 'Because during backpropagation, $\\frac{\\partial (F(x) + x)}{\\partial x} = \\frac{\\partial F(x)}{\\partial x} + 1$, guaranteeing a direct gradient flow of at least 1 back to earlier layers.'
  },
  {
    phaseId: 'phase-3',
    phaseNumber: 3,
    title: 'The Self-Attention Mechanism: Q, K, V Matrices Explained',
    hinglishTitle: 'Attention Mechanism: Queries, Keys aur Values ka complete derivation',
    focusArea: 'Concept',
    durationMins: 180,
    learningGoal: 'Derive Scaled Dot-Product Attention step by step: Queries ($Q$), Keys ($K$), Values ($V$), the scaling factor $\\frac{1}{\\sqrt{d_k}}$, and the softmax distribution over sequence positions.',
    hinglishGoal: '2017 ka world-changing formula: $Attention(Q,K,V) = softmax(\\frac{QK^T}{\\sqrt{d_k}})V$. Har matrix ka geometrical intuition aur dimension math samjhein.',
    recommendedHindiPlaylist: 'CampusX - Transformers & NLP Deep Dive',
    playlistSearchQuery: 'campusx self attention mechanism transformers queries keys values hindi',
    handsOnTask: 'Write a single-head self-attention forward pass in PyTorch using pure matrix operations, with explicit shape checks at every step.',
    quickCheckQuestion: 'Why do we divide the dot product $Q K^T$ by $\\sqrt{d_k}$ before applying softmax?',
    quickCheckAnswer: 'For large vector dimensions, dot products grow large in magnitude, pushing softmax into regions with extremely small gradients; dividing by $\\sqrt{d_k}$ stabilizes the variance to 1.'
  },
  {
    phaseId: 'phase-3',
    phaseNumber: 3,
    title: 'Multi-Head Attention & Causal Decoder Masking in PyTorch',
    hinglishTitle: 'Multi-Head Attention aur Causal Autoregressive Masking PyTorch mein',
    focusArea: 'Coding',
    durationMins: 200,
    learningGoal: 'Implement Multi-Head Attention by splitting embedding dimensions across $h$ heads, and apply an upper-triangular causal mask ($-\\infty$) to prevent the model from cheating by looking into future tokens.',
    hinglishGoal: 'Multi-Head Attention model ko ek saath different linguistic relationships dekhne deta hai. Causal mask se model future tokens nahi dekh pata.',
    recommendedHindiPlaylist: 'Sunny Bhaveen Chandra - Transformers from Scratch',
    playlistSearchQuery: 'sunny bhaveen chandra multi head attention causal mask pytorch hindi',
    handsOnTask: 'Write a complete `MultiHeadAttention(nn.Module)` in PyTorch that supports an optional boolean causal mask tensor and verify output dimensions.',
    quickCheckQuestion: 'How does an upper-triangular mask of $-\\infty$ prevent tokens from attending to future tokens?',
    quickCheckAnswer: 'Because $e^{-\\infty} = 0$ in the softmax denominator, ensuring the attention weight assigned to future positions is strictly 0.0.'
  },
  {
    phaseId: 'phase-3',
    phaseNumber: 3,
    title: 'Phase 3 Project: Vision Transformer (ViT) with Grad-CAM',
    hinglishTitle: 'Phase 3 Project: Vision Transformer Classifier with Grad-CAM Visual Heatmaps',
    focusArea: 'Project',
    durationMins: 240,
    learningGoal: 'Train a Vision Transformer on an image dataset and implement Grad-CAM activation mapping to generate visual heatmaps showing what the model looked at.',
    hinglishGoal: 'Healthcare aur autonomous vision ka killer portfolio project: ViT model ko train karein aur Grad-CAM heatmaps overlay karke decision proof visualize karein.',
    recommendedHindiPlaylist: 'CampusX - Deep Learning Projects',
    playlistSearchQuery: 'campusx vision transformer grad cam pytorch project hindi',
    handsOnTask: 'Register forward and backward hooks on the last attention block of a ViT to extract activations and gradients, synthesizing an overlayable Grad-CAM heatmap.',
    quickCheckQuestion: 'What does a Grad-CAM heatmap visualize?',
    quickCheckAnswer: 'It highlights the specific spatial regions in the input image that contributed most heavily to the model’s predicted class probability.'
  },

  // --- Phase 4: NLP, LLM Internals & Fine-Tuning (Days 101 - 130) ---
  {
    phaseId: 'phase-4',
    phaseNumber: 4,
    title: 'Tokenization Algorithms: Byte-Pair Encoding (BPE) & SentencePiece',
    hinglishTitle: 'Tokenizers kaise kaam karte hain: Byte-Pair Encoding (BPE) from scratch',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Understand how raw UTF-8 text turns into token IDs. Learn Byte-Pair Encoding (BPE) frequency counting, merge rules, vocabulary size tradeoffs, and why tokenizers cause LLM math failures.',
    hinglishGoal: 'LLMs words nahi samajhte, tokens samajhte hain. Byte-Pair Encoding algorithm ko Python mein scratch se likhein taaki tokenization glitches crystal clear ho jayein.',
    recommendedHindiPlaylist: 'CampusX - NLP & LLM Deep Dive',
    playlistSearchQuery: 'campusx byte pair encoding tokenization bpe algorithm hindi',
    handsOnTask: 'Write a simple BPE tokenizer in Python that trains on a text corpus by iteratively finding and merging the most frequent character pair.',
    quickCheckQuestion: 'Why do LLMs frequently struggle with simple character counting (e.g. "How many r’s are in strawberry?")?',
    quickCheckAnswer: 'Because the tokenizer converts "strawberry" into whole subword token chunks (e.g., ["straw", "berry"]), hiding the individual raw characters from the model.'
  },
  {
    phaseId: 'phase-4',
    phaseNumber: 4,
    title: 'RoPE (Rotary Position Embeddings) & KV-Cache Mathematics',
    hinglishTitle: 'RoPE Embeddings aur KV-Cache ki GPU VRAM Calculation',
    focusArea: 'Concept',
    durationMins: 180,
    learningGoal: 'Master Rotary Position Embeddings (RoPE) complex plane rotations. Calculate the exact GPU VRAM consumed by the Key-Value (KV) cache ($2 \\times 2 \\times b \\times l \\times h$) during autoregressive generation.',
    hinglishGoal: 'Llama-3 aur Mistral RoPE use karte hain. Samajhein ki context length badhne par KV-Cache kitne GB memory leta hai aur Grouped-Query Attention (GQA) use kaise bachata hai.',
    recommendedHindiPlaylist: 'CampusX - Transformers & LLMs Deep Dive',
    playlistSearchQuery: 'campusx rope rotary position embeddings kv cache hindi',
    handsOnTask: 'Write a Python calculation script that computes the exact KV-cache VRAM requirement for a 7B model at 4k, 32k, and 128k context lengths across batch sizes 1 to 16.',
    quickCheckQuestion: 'How does Grouped-Query Attention (GQA) reduce KV-cache memory consumption compared to standard Multi-Head Attention?',
    quickCheckAnswer: 'Multiple query heads share a single Key and Value head pair (e.g., 8 query heads per 1 KV head), dividing KV-cache memory storage by 8x.'
  },
  {
    phaseId: 'phase-4',
    phaseNumber: 4,
    title: 'Parameter-Efficient Fine-Tuning: LoRA & QLoRA with Unsloth',
    hinglishTitle: 'LoRA aur QLoRA se Llama-3 ko Single GPU par Fine-Tune karna',
    focusArea: 'Coding',
    durationMins: 200,
    learningGoal: 'Learn Low-Rank Adaptation ($W + B A$), rank $r$, scaling factor $\\alpha$, NF4 quantization in bitsandbytes, and fine-tuning an open-source model with Unsloth / Hugging Face TRL.',
    hinglishGoal: '70 Billion parameters ko retrain karne mein millions lagte hain, lekin LoRA se sirf 0.1% parameters train karke hum model ko kisi bhi domain ka expert bana sakte hain.',
    recommendedHindiPlaylist: 'Krish Naik - Generative AI & Fine Tuning',
    playlistSearchQuery: 'krish naik lora qlora fine tuning llama huggingface hindi',
    handsOnTask: 'Fine-tune an open-source model (Llama-3-8B or Mistral-7B) on a custom JSONL instruction dataset using QLoRA in Google Colab with Unsloth.',
    quickCheckQuestion: 'What is the memory benefit of QLoRA over standard LoRA?',
    quickCheckAnswer: 'QLoRA quantizes the frozen base model weights into 4-bit NormalFloat (NF4), allowing a 7B-8B model to fit on a consumer 16GB GPU for training.'
  },
  {
    phaseId: 'phase-4',
    phaseNumber: 4,
    title: 'High-Throughput Model Serving: vLLM & PagedAttention',
    hinglishTitle: 'vLLM se 20x Fast Model Serving aur OpenAI Compatible API banana',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Deploy models using vLLM, configure continuous batching, tensor parallelism, FP8 quantization, and expose standard OpenAI-compatible `/v1/chat/completions` endpoints.',
    hinglishGoal: 'HuggingFace generate function production mein bohot slow hota hai. vLLM continuous batching aur PagedAttention se 20x higher throughput deta hai.',
    recommendedHindiPlaylist: 'Krish Naik - Deploying Open Source Models',
    playlistSearchQuery: 'krish naik vllm deployment openai api server hindi',
    handsOnTask: 'Spin up a vLLM server with a quantized model, send concurrent asynchronous client requests, and benchmark tokens/second throughput against HuggingFace pipeline.',
    quickCheckQuestion: 'What is continuous batching in modern LLM serving engines?',
    quickCheckAnswer: 'It inserts newly arrived requests into the running inference batch immediately as earlier requests finish generating, preventing the GPU from idling.'
  },
  {
    phaseId: 'phase-4',
    phaseNumber: 4,
    title: 'Phase 4 Project: Domain-Specific JurisLlama with QLoRA & vLLM',
    hinglishTitle: 'Phase 4 Project: Custom Legal/Finance LLM Fine-Tuned with QLoRA and Served on vLLM',
    focusArea: 'Project',
    durationMins: 240,
    learningGoal: 'Synthesize custom instruction data, fine-tune Llama-3 using QLoRA, run automated DeepEval evaluation, and serve the final merged weights via vLLM.',
    hinglishGoal: 'Resume-ready enterprise AI project: ek specialized domain-expert model banayein jo baseline model se 25% better structured output produce kare.',
    recommendedHindiPlaylist: 'Krish Naik - Complete End to End GenAI Project',
    playlistSearchQuery: 'krish naik end to end generative ai project fine tuning hindi',
    handsOnTask: 'Run an automated benchmark comparing the base Llama-3 against your fine-tuned adapter on 100 domain evaluation test prompts, plotting accuracy diffs.',
    quickCheckQuestion: 'Why is it critical to evaluate both domain accuracy and general capability retention (preventing catastrophic forgetting) after fine-tuning?',
    quickCheckAnswer: 'To ensure the model didn’t overfit to the domain style at the cost of losing its core reasoning, instruction-following, and formatting abilities.'
  },

  // --- Phase 5: Advanced RAG, Context Engineering & Knowledge Graphs (Days 131 - 150) ---
  {
    phaseId: 'phase-5',
    phaseNumber: 5,
    title: 'Document Parsing & Advanced Layout Chunking (Docling / MinerU)',
    hinglishTitle: 'Complex PDFs, Tables aur Hierarchical Chunking Strategies',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Understand why naive character-splitting breaks tables and code blocks. Implement semantic chunking, layout-aware PDF parsing (Docling), and parent-child hierarchical chunking.',
    hinglishGoal: 'RAG fail hone ka 80% reason gandi chunking hoti hai. Tables aur multi-column PDFs ko structure preserve karke chunk karna seekhein.',
    recommendedHindiPlaylist: 'Krish Naik - Advanced RAG Masterclass',
    playlistSearchQuery: 'krish naik advanced rag chunking strategies docling hindi',
    handsOnTask: 'Parse a complex financial 10-K report with embedded tables using Docling, converting tables into structured Markdown chunks with parent section metadata.',
    quickCheckQuestion: 'How does parent-document retrieval work and why is it superior to naive chunk retrieval?',
    quickCheckAnswer: 'It embeds small chunks for high semantic precision during search, but passes the larger parent context window to the LLM for coherent synthesis.'
  },
  {
    phaseId: 'phase-5',
    phaseNumber: 5,
    title: 'Hybrid Search: Combining BM25 Lexical with Dense Vector Embeddings',
    hinglishTitle: 'Hybrid Search: BM25 Sparse Search aur Vector Search ko RRF se merge karna',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Implement Reciprocal Rank Fusion (RRF) to combine sparse keyword search (BM25) with dense vector embeddings (HNSW), followed by cross-encoder reranking (Cohere / BGE).',
    hinglishGoal: 'Exact keywords (jaise part numbers ya error codes) vector search se miss ho jate hain. BM25 aur Vector search ko combine karke invincible search engine banayein.',
    recommendedHindiPlaylist: 'Krish Naik - Advanced RAG Masterclass',
    playlistSearchQuery: 'krish naik hybrid search bm25 vector reranker hindi',
    handsOnTask: 'Build a Python hybrid retriever using Qdrant (or Chroma) and rank_bm25, implementing the Reciprocal Rank Fusion formula $RRF\\_Score = \\sum \\frac{1}{60 + rank}$.',
    quickCheckQuestion: 'What is the role of a Cross-Encoder Reranker compared to a Bi-Encoder embedding model?',
    quickCheckAnswer: 'A Bi-Encoder encodes queries and documents independently for fast vector indexing; a Cross-Encoder passes both simultaneously through self-attention for far more accurate scoring of top candidates.'
  },
  {
    phaseId: 'phase-5',
    phaseNumber: 5,
    title: 'GraphRAG: Knowledge Graphs & Multi-Hop Entity Reasoning (Neo4j)',
    hinglishTitle: 'Microsoft ka GraphRAG Concept: Neo4j Knowledge Graph banana',
    focusArea: 'Coding',
    durationMins: 200,
    learningGoal: 'Extract entities and relations using LLMs, construct property graphs in Neo4j, apply Leiden community detection, and answer holistic multi-hop questions.',
    hinglishGoal: 'Agar question ho: "Company ke saare Q3 risk factors summarize karo", toh normal vector search fail ho jayega. GraphRAG pure document network ko connect karta hai.',
    recommendedHindiPlaylist: 'Krish Naik - Advanced RAG Masterclass',
    playlistSearchQuery: 'krish naik graphrag neo4j knowledge graph hindi',
    handsOnTask: 'Extract (Subject, Predicate, Object) triplets from 50 news articles using an LLM structured schema, store in Neo4j Aura, and query using Cypher.',
    quickCheckQuestion: 'Why does GraphRAG excel at global dataset summarization compared to traditional vector RAG?',
    quickCheckAnswer: 'Because GraphRAG clusters entities into hierarchical graph communities, generating summaries for entire themes rather than just retrieving disconnected top-k snippets.'
  },
  {
    phaseId: 'phase-5',
    phaseNumber: 5,
    title: 'Phase 5 Project: GraphNexus Enterprise Brain with Ragas CI',
    hinglishTitle: 'Phase 5 Project: Enterprise GraphRAG with Automated Ragas Hallucination Evaluator',
    focusArea: 'Project',
    durationMins: 240,
    learningGoal: 'Construct an end-to-end GraphRAG pipeline integrating Qdrant, Neo4j, and Cohere reranker, validated by an automated Ragas evaluation suite testing Faithfulness > 0.90.',
    hinglishGoal: 'Enterprise-grade RAG pipeline banayein jo multi-hop queries answer kare aur Ragas metrics (Faithfulness, Context Precision) se proof kare ki koi hallucination nahi hai.',
    recommendedHindiPlaylist: 'Krish Naik - Complete End to End GenAI Project',
    playlistSearchQuery: 'krish naik ragas evaluation rag pipeline langchain hindi',
    handsOnTask: 'Generate a synthetic test dataset of 30 question-context-ground_truth triples and execute a Ragas evaluation pipeline, exporting a Markdown audit report.',
    quickCheckQuestion: 'What does the Ragas "Faithfulness" metric measure mathematically?',
    quickCheckAnswer: 'It calculates the proportion of claims made in the generated answer that can be directly inferred from the retrieved context documents, measuring hallucination.'
  },

  // --- Phase 6: Autonomous AI Agents & Multi-Agent Swarms (Days 151 - 170) ---
  {
    phaseId: 'phase-6',
    phaseNumber: 6,
    title: 'Agent Foundations: ReAct Loop & Structured Tool Calling',
    hinglishTitle: 'ReAct Loop (Reasoning + Acting) aur Pydantic Tool Calling',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Master the ReAct (Thought -> Action -> Observation) paradigm, Pydantic v2 JSON Schema tool definitions, and parsing structured tool call arguments.',
    hinglishGoal: 'Agent kaise decide karta hai ki kab Google search karni hai aur kab Python code execute karna hai? ReAct loop ko Python mein step-by-step trace karein.',
    recommendedHindiPlaylist: 'Krish Naik - LangGraph & Multi-Agent Systems',
    playlistSearchQuery: 'krish naik react agent tool calling langchain hindi',
    handsOnTask: 'Build a ReAct agent from scratch with standard LLM calls that has access to two custom Python tools: a live stock price API and a mathematical calculation tool.',
    quickCheckQuestion: 'What is the purpose of the "Observation" step in a ReAct loop?',
    quickCheckAnswer: 'It feeds the real-world output returned by the executed tool back into the LLM context so it can reason about the result and decide the next action.'
  },
  {
    phaseId: 'phase-6',
    phaseNumber: 6,
    title: 'LangGraph Mastery: StateGraph, Nodes, Edges & Checkpoints',
    hinglishTitle: 'LangGraph Masterclass: StateGraph, Conditional Edges aur Time-Travel Checkpoints',
    focusArea: 'Coding',
    durationMins: 200,
    learningGoal: 'Construct stateful multi-step agent workflows using LangGraph `StateGraph`, define typed state schemas, implement conditional routing edges, and persist memory with checkpointers.',
    hinglishGoal: 'LangGraph industry standard agent framework ban chuka hai! State machine ki tarah agents kaise bante hain, aur fail hone par purane state par rollback kaise karein.',
    recommendedHindiPlaylist: 'Krish Naik - LangGraph & Multi-Agent Systems',
    playlistSearchQuery: 'krish naik langgraph stategraph conditional edges hindi',
    handsOnTask: 'Build a 3-node LangGraph workflow: Planner -> Generator -> Evaluator. Add a conditional edge that loops back to Generator if score < 7 or terminates if score >= 7.',
    quickCheckQuestion: 'How does LangGraph checkpointing enable "Time-Travel Debugging"?',
    quickCheckAnswer: 'It serializes the complete graph state after every step into a database (e.g. SQLite/PostgreSQL), allowing developers to inspect or resume execution from any historical state.'
  },
  {
    phaseId: 'phase-6',
    phaseNumber: 6,
    title: 'Multi-Agent Swarms: Supervisor vs Collaborative Hierarchies',
    hinglishTitle: 'Multi-Agent Swarms: Supervisor-Worker aur Peer Debate Patterns',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Implement multi-agent team patterns: Supervisor Agent delegating to specialized Researcher, Coder, and Critic agents. Compare LangGraph swarms with CrewAI crews.',
    hinglishGoal: 'Ek akela agent sab kuch nahi kar sakta. Ek team banayein jisme Architect roadmap banata hai, Developer code likhta hai, aur Reviewer code verify karta hai.',
    recommendedHindiPlaylist: 'Sunny Bhaveen Chandra - CrewAI & Multi-Agent Teams',
    playlistSearchQuery: 'sunny bhaveen chandra crewai multi agent systems hindi',
    handsOnTask: 'Build a 3-agent research team in LangGraph or CrewAI where a Supervisor routes incoming topics to a WebSearch agent and a ReportWriter agent.',
    quickCheckQuestion: 'What is the advantage of a multi-agent swarm over asking a single large prompt to do everything?',
    quickCheckAnswer: 'It breaks complex tasks into isolated specialized contexts, reduces cognitive prompt overload, allows different agents to use specialized tools, and enables adversarial self-review.'
  },
  {
    phaseId: 'phase-6',
    phaseNumber: 6,
    title: 'Phase 6 Project: DevAgent-Swarm with Sandboxed Docker Execution',
    hinglishTitle: 'Phase 6 Project: Autonomous PR Review Swarm with Docker Sandbox Testing',
    focusArea: 'Project',
    durationMins: 240,
    learningGoal: 'Build an autonomous multi-agent GitHub review system that inspects pull requests, generates PyTest test suites, executes tests inside isolated Docker sandboxes, and posts comments.',
    hinglishGoal: 'Sabse impressive AI engineering portfolio project: ek aisa swarm jo real code ko Docker container mein execute karke test kare aur bugs pakad kar PR submit kare.',
    recommendedHindiPlaylist: 'Krish Naik - LangGraph End to End Project',
    playlistSearchQuery: 'krish naik langgraph end to end project hindi',
    handsOnTask: 'Implement Docker container spawning via Python `docker-py` SDK that runs agent-generated test scripts with a 15-second execution timeout and network disabled.',
    quickCheckQuestion: 'Why must untrusted agent-generated code be executed inside an isolated sandbox (like Docker or E2B) with disabled networking?',
    quickCheckAnswer: 'To prevent malicious code or prompt injection from accessing host file systems, leaking API keys, or executing unauthorized external network requests.'
  },

  // --- Phase 7 & 8: LLMOps, Guardrails & Future Frontiers (Days 171 - 180) ---
  {
    phaseId: 'phase-7',
    phaseNumber: 7,
    title: 'Observability & Tracing: Langfuse Distributed Instrumentation',
    hinglishTitle: 'Langfuse Tracing: Har Token ki Cost, Latency aur Nested Spans Track karna',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Instrument your AI application with Langfuse or OpenTelemetry, tracking token counts, exact API costs, latency breakdowns, and nested multi-agent tool spans.',
    hinglishGoal: 'Production mein har call par kitne paise kharch hue aur kis tool ne time lagaya, iska dashboard banana.',
    recommendedHindiPlaylist: 'Krish Naik - MLOps & Production Deployment',
    playlistSearchQuery: 'krish naik langfuse observability tracing hindi',
    handsOnTask: 'Add Langfuse decorators to an async FastAPI LLM endpoint, inspect traces in the Langfuse UI, and set up a cost alert webhook.',
    quickCheckQuestion: 'Why is distributed tracing essential for multi-agent systems?',
    quickCheckAnswer: 'Because an agent may make 15 sequential and parallel tool calls; tracing isolates exactly which tool call or prompt step caused a latency spike or error.'
  },
  {
    phaseId: 'phase-7',
    phaseNumber: 7,
    title: 'AI Security & Firewalls: Guardrails, Prompt Injection & PII Masking',
    hinglishTitle: 'AI Security: Prompt Injection Defense, Jailbreak Prevention aur PII Masking',
    focusArea: 'Coding',
    durationMins: 180,
    learningGoal: 'Implement security barriers against indirect prompt injection, configure Meta Llama-Guard, mask sensitive PII (SSNs, credit cards) with Microsoft Presidio, and prevent system prompt leaks.',
    hinglishGoal: 'Hackers se application ko bachana: prompt injection ko block karna aur confidential data ko mask karna seekhein.',
    recommendedHindiPlaylist: 'Krish Naik - AI Security & MLOps',
    playlistSearchQuery: 'krish naik prompt injection ai security guardrails hindi',
    handsOnTask: 'Build an inline FastAPI middleware using Microsoft Presidio that automatically redacts emails and phone numbers from user prompts before sending to the model.',
    quickCheckQuestion: 'What is indirect prompt injection?',
    quickCheckAnswer: 'An attack where untrusted data ingested by an AI model (like a web page or resume) contains hidden instructions that hijack the model’s behavior.'
  },
  {
    phaseId: 'phase-8',
    phaseNumber: 8,
    title: 'Test-Time Compute & Reasoning Search: Implementing Monte Carlo Tree Search',
    hinglishTitle: 'Reasoning Models (o1/R1 Style): Monte Carlo Tree Search for LLMs',
    focusArea: 'Coding',
    durationMins: 200,
    learningGoal: 'Understand how reasoning models (OpenAI o1, DeepSeek-R1) generate branching thoughts, score reasoning steps with verifiers, and perform Monte Carlo Tree Search (MCTS).',
    hinglishGoal: 'AI ka sabse modern frontier: direct answer dene ki jagah model ko multiple reasoning paths search karne dena aur verifier se best path select karna.',
    recommendedHindiPlaylist: 'CampusX - AI Research Papers Breakdown',
    playlistSearchQuery: 'campusx reasoning models o1 deepseek r1 test time compute hindi',
    handsOnTask: 'Implement a Python script that takes a math problem, samples 5 diverse step-1 reasoning rollouts from an LLM, uses a verifier to pick the best step, and continues generating.',
    quickCheckQuestion: 'How does test-time compute differ from pretraining compute scaling?',
    quickCheckAnswer: 'Pretraining compute scales model weights before deployment; test-time compute allocates dynamic thinking time during inference to solve hard problems.'
  },
  {
    phaseId: 'phase-8',
    phaseNumber: 8,
    title: 'Final Mastery Project: AxiomReasoner or OmniSpatial Edge Agent',
    hinglishTitle: 'Final Capstone: Visionary Future Project Build & Portfolio Launch',
    focusArea: 'Project',
    durationMins: 240,
    learningGoal: 'Complete your flagship future-proof capstone project, write a comprehensive GitHub README with architecture diagrams, and prepare for high-tier AI Engineer interviews.',
    hinglishGoal: 'Aapka AI Engineering Mastery safar yahan ek world-class portfolio project ke saath complete hota hai! Resume aur GitHub publish karein.',
    recommendedHindiPlaylist: 'CampusX & Krish Naik - AI Engineering Career Roadmap',
    playlistSearchQuery: 'campusx how to prepare for ai engineer interview hindi',
    handsOnTask: 'Publish your complete project on GitHub with clean documentation, live demo link, Dockerfile, automated test suite, and quantified resume bullet points.',
    quickCheckQuestion: 'What makes a candidate stand out most when applying for top-tier AI Engineer roles?',
    quickCheckAnswer: 'Demonstrated mastery of underlying mechanics (math, attention, memory, latency) and shipping novel, production-tested systems with real evaluations over generic tutorials.'
  }
];

export function generateDailySchedule(pace: SchedulePace): DailyTask[] {
  const baseTasks = CURATED_DAILY_CURRICULUM;
  let targetDays = 600; // default 20-months master plan
  let paceMinutes = 120;

  if (pace === '20-months') {
    targetDays = 600; // 20 Months Master Plan (600 days @ 2 hrs/day)
    paceMinutes = 120;
  } else if (pace === '16-months') {
    targetDays = 480; // 16 Months Track (480 days @ 2.5 hrs/day)
    paceMinutes = 150;
  } else if (pace === '14-months') {
    targetDays = 420; // 14 Months Track (420 days @ ~2.9 hrs/day)
    paceMinutes = 170;
  } else if (pace === '12-months') {
    targetDays = 360; // 12 Months Track (360 days @ ~3.3 hrs/day)
    paceMinutes = 200;
  } else if (pace === '6-months') {
    targetDays = 180;
    paceMinutes = 240;
  } else if (pace === '3-months') {
    targetDays = 90;
    paceMinutes = 360;
  } else if (pace === '2-hours-daily') {
    targetDays = 200;
    paceMinutes = 120;
  }

  const result: DailyTask[] = [];
  const totalBase = baseTasks.length;

  for (let day = 1; day <= targetDays; day++) {
    // Map day to curriculum index smoothly
    const ratio = (day - 1) / (targetDays - 1 || 1);
    const baseIndex = Math.min(Math.floor(ratio * totalBase), totalBase - 1);
    const taskDef = baseTasks[baseIndex];

    result.push({
      dayNumber: day,
      phaseId: taskDef.phaseId,
      phaseNumber: taskDef.phaseNumber,
      title: taskDef.title,
      hinglishTitle: taskDef.hinglishTitle,
      focusArea: taskDef.focusArea,
      durationMins: paceMinutes,
      learningGoal: taskDef.learningGoal,
      hinglishGoal: taskDef.hinglishGoal,
      recommendedHindiPlaylist: taskDef.recommendedHindiPlaylist,
      playlistSearchQuery: taskDef.playlistSearchQuery,
      handsOnTask: taskDef.handsOnTask,
      quickCheckQuestion: taskDef.quickCheckQuestion,
      quickCheckAnswer: taskDef.quickCheckAnswer
    });
  }

  return result;
}
