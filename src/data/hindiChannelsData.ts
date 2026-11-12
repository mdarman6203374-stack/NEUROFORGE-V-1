export interface ChannelDirectoryItem {
  id: string;
  name: string;
  creator: string;
  avatarText: string;
  tagline: string;
  subscribers: string;
  specialty: string;
  channelUrl: string;
  topRecommendedFor: string[];
  hinglishReview: string;
  playlists: {
    title: string;
    topic: string;
    phaseMapped: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    totalVideos: number;
    url: string;
    description: string;
    mustWatchEpisodes: string[];
  }[];
}

export const HINDI_CHANNELS_DATA: ChannelDirectoryItem[] = [
  {
    id: 'campusx',
    name: 'CampusX',
    creator: 'Nitish Singh',
    avatarText: 'CX',
    tagline: 'The undisputed gold standard for mathematical intuition, Machine Learning, Deep Learning, and NLP in Hindi.',
    subscribers: '320K+',
    specialty: 'Deep white-board mathematical derivations, complete end-to-end conceptual clarity, research paper teardowns.',
    channelUrl: 'https://www.youtube.com/@CampusX-official',
    topRecommendedFor: [
      'Mathematics for Machine Learning',
      '100 Days of Machine Learning',
      'Deep Learning (ANN, CNN, RNN)',
      'Transformers & Attention Mechanism',
      'AI Research Paper breakdowns'
    ],
    hinglishReview: 'Agar aapko AI ke peeche ka actual math samajhna hai aur interview mein kisi bhi algorithm ka proof likhna hai, toh CampusX se behtar pure YouTube par koi nahi hai. Nitish sir whiteboard par 3D coordinate system bana kar samjhate hain.',
    playlists: [
      {
        title: 'Mathematics for Machine Learning in Hindi',
        topic: 'Linear Algebra, Calculus, Probability',
        phaseMapped: 'Phase 0 (Foundations)',
        level: 'Intermediate',
        totalVideos: 32,
        url: 'https://www.youtube.com/results?search_query=campusx+mathematics+for+machine+learning',
        description: 'Covers vectors, matrix transformations, eigenvalues, partial derivatives, gradient descent intuition, and probability distributions with zero skipping.',
        mustWatchEpisodes: ['Vector dot product & projections', 'Gradient descent derivation in 3D', 'Eigenvectors & SVD intuition']
      },
      {
        title: '100 Days of Machine Learning (Complete Course)',
        topic: 'Classical Machine Learning & Feature Engineering',
        phaseMapped: 'Phase 2 (Machine Learning)',
        level: 'Intermediate',
        totalVideos: 100,
        url: 'https://www.youtube.com/results?search_query=campusx+100+days+of+machine+learning',
        description: 'Step-by-step masterclass on every classical algorithm: Linear/Logistic regression, SVM, Decision Trees, Random Forests, PCA, and Clustering with Python code.',
        mustWatchEpisodes: ['Decision Trees split criteria (Gini & Entropy)', 'Random Forest bagging math', 'Gradient Boosting step-by-step calculation']
      },
      {
        title: 'Deep Learning Playlist (ANN, CNN, RNN) in Hindi',
        topic: 'Neural Networks & Deep Learning',
        phaseMapped: 'Phase 3 (Deep Learning)',
        level: 'Advanced',
        totalVideos: 80,
        url: 'https://www.youtube.com/results?search_query=campusx+deep+learning+playlist',
        description: 'Complete mathematical backpropagation derivation, vanishing gradient problems, CNN convolutional kernels, pooling, and LSTM memory cells.',
        mustWatchEpisodes: ['Backpropagation chain rule on 3-layer network', 'CNN convolution & pooling math', 'Vanishing gradient solutions (He initialization, BatchNorm)']
      },
      {
        title: 'NLP & Large Language Models Deep Dive',
        topic: 'NLP & LLM Architecture',
        phaseMapped: 'Phase 4 (LLMs & Fine-Tuning)',
        level: 'Advanced',
        totalVideos: 38,
        url: 'https://www.youtube.com/results?search_query=campusx+nlp+and+llms+deep+dive',
        description: 'Word2Vec, tokenization algorithms (BPE), Transformer architecture, and open-source LLM explanations.',
        mustWatchEpisodes: ['Attention Is All You Need Paper Breakdown', 'Byte-Pair Encoding (BPE) algorithm', 'Decoder causal self-attention mask']
      }
    ]
  },
  {
    id: 'krish-naik',
    name: 'Krish Naik',
    creator: 'Krish Naik',
    avatarText: 'KN',
    tagline: 'Pioneer of practical Data Science, Generative AI, LangChain, LangGraph, and real-world MLOps pipelines in Hindi/Hinglish.',
    subscribers: '1.05M+',
    specialty: 'Fast-paced, highly practical industry deployments, modern frameworks (LangChain, LangGraph, LlamaIndex, Docker, AWS).',
    channelUrl: 'https://www.youtube.com/@krishnaik06',
    topRecommendedFor: [
      'Generative AI & LLM Fine-Tuning',
      'Advanced RAG with Vector DBs',
      'LangGraph Multi-Agent Workflows',
      'MLOps, Docker & Cloud Deployment',
      'Industry Projects & Interview Questions'
    ],
    hinglishReview: 'Krish Naik sir har nayi technology ko launch hote hi sabse pehle explain karte hain. Inka content hands-on implementation ke liye sabse best hai — code open karo aur direct deploy karo.',
    playlists: [
      {
        title: 'Complete Generative AI with LangChain & HuggingFace',
        topic: 'GenAI & LLM Applications',
        phaseMapped: 'Phase 4 & Phase 5 (LLMs & RAG)',
        level: 'Intermediate',
        totalVideos: 50,
        url: 'https://www.youtube.com/results?search_query=krish+naik+complete+generative+ai+playlist',
        description: 'OpenAI API, Hugging Face models, Prompt engineering, LangChain chains, memory, and building end-to-end chat applications.',
        mustWatchEpisodes: ['LangChain LCEL (LangChain Expression Language)', 'Building custom Document Q&A system', 'Fine-tuning Llama-3 with QLoRA on Colab']
      },
      {
        title: 'LangGraph & Multi-Agent AI Systems Masterclass',
        topic: 'Autonomous AI Agents',
        phaseMapped: 'Phase 6 (AI Agents & Swarms)',
        level: 'Advanced',
        totalVideos: 32,
        url: 'https://www.youtube.com/results?search_query=krish+naik+langgraph+multi+agent+hindi',
        description: 'Modern stateful agentic workflows using LangGraph: StateGraph, routing nodes, memory persistence, human-in-the-loop, and multi-agent coordination.',
        mustWatchEpisodes: ['LangGraph StateGraph vs simple Chains', 'Multi-Agent research assistant workflow', 'Human-in-the-loop approval interrupt gates']
      },
      {
        title: 'Advanced RAG Masterclass (Vector DBs & Rerankers)',
        topic: 'Production RAG & Context Engineering',
        phaseMapped: 'Phase 5 (RAG & Knowledge Graphs)',
        level: 'Advanced',
        totalVideos: 35,
        url: 'https://www.youtube.com/results?search_query=krish+naik+advanced+rag+masterclass+hindi',
        description: 'Deep dive into Pinecone, Chroma, Qdrant, Parent-Document Retrievers, HyDE, and Cohere Rerankers for zero-hallucination RAG.',
        mustWatchEpisodes: ['Hybrid Search (BM25 + Dense Vectors)', 'Cohere Reranker integration', 'GraphRAG concept with Neo4j']
      },
      {
        title: 'Complete MLOps Playlist (Docker, MLflow, AWS, CI/CD)',
        topic: 'MLOps & LLMOps',
        phaseMapped: 'Phase 7 (MLOps & Safety)',
        level: 'Intermediate',
        totalVideos: 36,
        url: 'https://www.youtube.com/results?search_query=krish+naik+mlops+playlist+hindi',
        description: 'Taking models from Jupyter notebooks to production: Dockerizing apps, GitHub Actions automated CI/CD, MLflow experiment tracking, and AWS EC2 deployment.',
        mustWatchEpisodes: ['Dockerizing ML application step-by-step', 'GitHub Actions CI/CD to AWS', 'MLflow model registry & artifact tracking']
      }
    ]
  },
  {
    id: 'chai-aur-code',
    name: 'Chai aur Code',
    creator: 'Hitesh Choudhary',
    avatarText: 'CC',
    tagline: 'Mastering modern Python, scalable backend architectures, async APIs, and developer engineering mindset.',
    subscribers: '650K+',
    specialty: 'Clean code architecture, FastAPI, modern Python 3.12 syntax, backend system design, database integration (PostgreSQL / pgvector).',
    channelUrl: 'https://www.youtube.com/@chaiaurcode',
    topRecommendedFor: [
      'Python for Backend & AI Engineers',
      'FastAPI & Async Streaming',
      'Vector Databases & PostgreSQL pgvector',
      'System Architecture & Engineering Mindset'
    ],
    hinglishReview: 'Hitesh sir aapko sirf coder nahi banate, balki ek real software engineer banate hain. AI models ko production backend mein efficiently connect karne ke liye Chai aur Code must-watch hai.',
    playlists: [
      {
        title: 'Python for Production & Modern Backend',
        topic: 'Python 3.12, OOPs & Async',
        phaseMapped: 'Phase 1 (Python Data Stack)',
        level: 'Beginner',
        totalVideos: 30,
        url: 'https://www.youtube.com/results?search_query=chai+aur+code+python+playlist',
        description: 'Modern Python idioms, decorators, generators, type hinting, error handling, and writing clean production-grade code in Hindi.',
        mustWatchEpisodes: ['Python OOPs & Dunder methods in depth', 'AsyncIO and Event Loop explained easily', 'Generators & Memory management']
      },
      {
        title: 'FastAPI, PostgreSQL & Vector Embeddings',
        topic: 'AI Backend Systems',
        phaseMapped: 'Phase 1 & Phase 5',
        level: 'Intermediate',
        totalVideos: 18,
        url: 'https://www.youtube.com/results?search_query=chai+aur+code+fastapi+embeddings',
        description: 'Building high-performance async APIs for AI models, streaming responses (Server-Sent Events), and managing vector storage with pgvector.',
        mustWatchEpisodes: ['FastAPI streaming responses for LLM tokens', 'Pydantic v2 data validation schemas', 'PostgreSQL with pgvector for AI search']
      }
    ]
  },
  {
    id: 'sunny-bhaveen',
    name: 'Sunny Bhaveen Chandra',
    creator: 'Sunny Bhaveen Chandra',
    avatarText: 'SC',
    tagline: 'Deep technical PyTorch implementations, CrewAI multi-agent crews, and mathematical machine learning in Hindi.',
    subscribers: '120K+',
    specialty: 'Writing PyTorch code line-by-line, multi-agent frameworks, advanced deep learning code walkthroughs.',
    channelUrl: 'https://www.youtube.com/@SunnyBhaveenChandra',
    topRecommendedFor: [
      'PyTorch from Scratch',
      'CrewAI Multi-Agent Teams',
      'Transformer Coding in PyTorch',
      'Deep Learning Mathematics'
    ],
    hinglishReview: 'Sunny sir bina kisi shortcut ke seedha PyTorch editor kholte hain aur tensor operations code karte hain. PyTorch aur CrewAI seekhne ke liye super valuable.',
    playlists: [
      {
        title: 'PyTorch Deep Learning from Scratch in Hindi',
        topic: 'PyTorch Tensors, Autograd & Neural Nets',
        phaseMapped: 'Phase 1 & Phase 3',
        level: 'Intermediate',
        totalVideos: 24,
        url: 'https://www.youtube.com/results?search_query=sunny+bhaveen+chandra+pytorch+from+scratch',
        description: 'Writing PyTorch training loops, custom loss functions, optimizers, and tensor reshaping step-by-step in Hindi.',
        mustWatchEpisodes: ['PyTorch autograd forward & backward hooks', 'Custom Dataset and DataLoader batching', 'Writing a 2-layer Neural Network from scratch']
      },
      {
        title: 'CrewAI & Autonomous Multi-Agent Teams in Hindi',
        topic: 'Multi-Agent Collaboration',
        phaseMapped: 'Phase 6 (AI Agents & Swarms)',
        level: 'Advanced',
        totalVideos: 16,
        url: 'https://www.youtube.com/results?search_query=sunny+bhaveen+chandra+crewai+hindi',
        description: 'Creating autonomous teams of AI agents with specific roles, memory, tool access, and task execution pipelines.',
        mustWatchEpisodes: ['CrewAI Agent Roles and Backstories design', 'Connecting custom tools to Agents', 'Hierarchical agent crew execution']
      }
    ]
  },
  {
    id: 'codewithharry',
    name: 'CodeWithHarry',
    creator: 'Haris Khan',
    avatarText: 'CH',
    tagline: 'The most popular coding educator in India for fast, friendly Python programming foundations.',
    subscribers: '6.2M+',
    specialty: 'Beginner-friendly explanation, rapid zero-to-hero learning curve, everyday examples, project-based exercises.',
    channelUrl: 'https://www.youtube.com/@CodeWithHarry',
    topRecommendedFor: [
      'Python 100 Days of Code (Absolute Foundations)',
      'Web Scraping (BeautifulSoup, Selenium for AI Datasets)',
      'FastAPI & Streamlit Rapid UI Prototypes'
    ],
    hinglishReview: 'Agar aap bilkul beginner hain aur programming se dar lagta hai, toh Harry bhai ke 100 Days of Python se shuru karein. Har concept itna aasan ho jata hai ki koi bhi seekh sakta hai.',
    playlists: [
      {
        title: 'Python 100 Days of Code in Hindi',
        topic: 'Complete Python Programming',
        phaseMapped: 'Phase 0 (CS Foundations)',
        level: 'Beginner',
        totalVideos: 100,
        url: 'https://www.youtube.com/results?search_query=codewithharry+python+100+days+of+code',
        description: 'From variables and loops to Object-Oriented Programming, file I/O, error handling, and building practical desktop/web tools in Hindi.',
        mustWatchEpisodes: ['Day 50-60: Object-Oriented Programming in Python', 'Day 70: Generators and Iterators', 'Day 85: Decorators in Python']
      },
      {
        title: 'Streamlit & Python Web Apps for Machine Learning',
        topic: 'Rapid AI Demo UIs',
        phaseMapped: 'Phase 2 (ML Demonstrations)',
        level: 'Beginner',
        totalVideos: 12,
        url: 'https://www.youtube.com/results?search_query=codewithharry+streamlit+tutorial+hindi',
        description: 'Build interactive web dashboards for your machine learning models in 10 minutes without learning HTML/CSS.',
        mustWatchEpisodes: ['Building ML model predictor UI with Streamlit', 'File uploader and interactive charts']
      }
    ]
  }
];

export const HINDI_LEARNING_PRO_TIPS = [
  {
    title: 'Watch in Hindi, Take Notes in English Technical Jargon',
    hinglishNote: 'Concept Hindi mein samjho (jaise "Weights update gradient ke opposite direction mein hote hain"), lekin notes hamesha English standard terms mein likho (Gradient Descent, Loss Function, Backprop) kyunki tech interviews English mein hote hain.'
  },
  {
    title: 'Code Along, Never Watch Like a Movie',
    hinglishNote: 'Sirf video dekhne se lagta hai ki sab samajh aa gaya, lekin jab khud VS Code khologe toh blank ho jaoge. Har video ke baad apna personal Jupyter notebook ya `.py` script banayein.'
  },
  {
    title: 'Follow the CampusX + Krish Naik Dual Power Combo',
    hinglishNote: 'Mathematical intuition aur deep concepts ke liye pehle CampusX dekhein, aur usi topic ka practical industry deployment aur latest tools ke liye Krish Naik ka hands-on video dekhein. Yeh formula invincible hai.'
  },
  {
    title: 'Re-implement Research Papers on PyTorch',
    hinglishNote: 'Jab bhi koi nayi architecture padhein (jaise LoRA ya Attention Is All You Need), HuggingFace library ko direct call karne se pehle uske math ko 20 lines ke PyTorch code mein khud likhne ki koshish karein.'
  }
];
