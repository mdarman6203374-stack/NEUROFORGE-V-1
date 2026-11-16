export interface DailyTechQuote {
  id: string;
  text: string;
  author: string;
  role: string;
  topic: 'Artificial Intelligence' | 'Computer Science' | 'Engineering' | 'Mathematics';
  hinglishTakeaway: string;
}

export const AI_TECH_QUOTES: DailyTechQuote[] = [
  {
    id: 'turing-1950',
    text: 'We can only see a short distance ahead, but we can see plenty there that needs to be done.',
    author: 'Alan Turing',
    role: 'Father of Computer Science & AI',
    topic: 'Computer Science',
    hinglishTakeaway: 'Aage ka rasta lamba hai, isliye aaj ke chhote step par focus karein aur build karte rahein.'
  },
  {
    id: 'karpathy-software',
    text: 'Gradient descent can write code better than you. Sorry, it is just true. Your job is to understand the system and guide the intelligence.',
    author: 'Andrej Karpathy',
    role: 'AI Researcher & Educator',
    topic: 'Artificial Intelligence',
    hinglishTakeaway: 'Sirf syntax ratne se aage badhein — systems architecture aur deep fundamentals par focus karein.'
  },
  {
    id: 'andrew-ng-electricity',
    text: 'Artificial Intelligence is the new electricity. Just as electricity transformed almost every industry, AI will transform every sector.',
    author: 'Andrew Ng',
    role: 'Founder, DeepLearning.AI',
    topic: 'Artificial Intelligence',
    hinglishTakeaway: 'Har industry mein AI engineers ki zaroorat padegi — aap sahi samay par sahi skill seekh rahe hain.'
  },
  {
    id: 'feifei-li-human',
    text: 'Artificial intelligence is not a substitute for human intelligence; it is a tool to amplify human creativity and ingenuity.',
    author: 'Fei-Fei Li',
    role: 'Co-Director, Stanford HAI',
    topic: 'Artificial Intelligence',
    hinglishTakeaway: 'AI aapki creativity aur problem-solving ko 10x amplify karne ka tool hai.'
  },
  {
    id: 'hopper-ship',
    text: 'A ship in port is safe, but that is not what ships are built for. Sail out to sea and do new things.',
    author: 'Grace Hopper',
    role: 'Computer Scientist & Compiler Pioneer',
    topic: 'Engineering',
    hinglishTakeaway: 'Sirf theory padhte mat rahein — real projects deploy karke experiment karein.'
  },
  {
    id: 'hinton-intuition',
    text: 'To really understand neural networks, implement them from scratch and watch the gradients flow.',
    author: 'Geoffrey Hinton',
    role: 'Turing Award & Nobel Laureate',
    topic: 'Artificial Intelligence',
    hinglishTakeaway: 'Library import karne se pehle ek baar Khud math aur gradients code karke dekhein.'
  },
  {
    id: 'hassabis-solve',
    text: 'Solve intelligence, and then use that to solve everything else.',
    author: 'Demis Hassabis',
    role: 'Co-Founder & CEO, Google DeepMind',
    topic: 'Artificial Intelligence',
    hinglishTakeaway: 'Intelligence ko samajhna sabse bada scientific adventure hai — daily step-by-step seekhte rahein.'
  },
  {
    id: 'lovelace-engine',
    text: 'That brain of mine is something more than merely mortal, as time will show.',
    author: 'Ada Lovelace',
    role: 'First Computer Programmer',
    topic: 'Computer Science',
    hinglishTakeaway: 'Mathematical imagination aur logical discipline milkar naye systems ko janam dete hain.'
  },
  {
    id: 'knuth-premature',
    text: 'Science is what we understand well enough to explain to a computer. Art is everything else we do.',
    author: 'Donald Knuth',
    role: 'Author, The Art of Computer Programming',
    topic: 'Computer Science',
    hinglishTakeaway: 'Jab aap kisi concept ko clean code mein likh paate hain, tabhi woh concept sach mein samajh aata hai.'
  },
  {
    id: 'shannon-info',
    text: 'Information is the resolution of uncertainty.',
    author: 'Claude Shannon',
    role: 'Father of Information Theory',
    topic: 'Mathematics',
    hinglishTakeaway: 'Cross-entropy aur perplexity sab information theory se aate hain — clarity hi asli power hai.'
  },
  {
    id: 'lecun-world',
    text: 'Common sense is not just knowing facts; it is having a world model that predicts how reality behaves.',
    author: 'Yann LeCun',
    role: 'Chief AI Scientist & Turing Laureate',
    topic: 'Artificial Intelligence',
    hinglishTakeaway: 'Next-generation AI systems world models aur reasoning par build honge.'
  },
  {
    id: 'feynman-build',
    text: 'What I cannot create, I do not understand.',
    author: 'Richard Feynman',
    role: 'Theoretical Physicist',
    topic: 'Mathematics',
    hinglishTakeaway: 'Jo cheez aap khud scratch se code kar sakte hain, wahi aapko genuinely aati hai.'
  },
  {
    id: 'dijkstra-simplicity',
    text: 'Simplicity is prerequisite for reliability.',
    author: 'Edsger W. Dijkstra',
    role: 'Computer Scientist & Turing Laureate',
    topic: 'Engineering',
    hinglishTakeaway: 'Clean aur simple architecture likhein — production AI pipelines usi se reliable bante hain.'
  },
  {
    id: 'alan-kay-future',
    text: 'The best way to predict the future is to invent it.',
    author: 'Alan Kay',
    role: 'Pioneer of Object-Oriented Programming',
    topic: 'Engineering',
    hinglishTakeaway: 'Future AI trends ka wait na karein — aaj unpar prototype aur projects banayein.'
  },
  {
    id: 'bengio-curiosity',
    text: 'Deep learning works best when curiosity meets rigorous mathematical discipline.',
    author: 'Yoshua Bengio',
    role: 'Turing Laureate & Founder, Mila',
    topic: 'Artificial Intelligence',
    hinglishTakeaway: 'Curiosity aur daily mathematical practice ka combination aapko top engineer banata hai.'
  },
  {
    id: 'torvalds-code',
    text: 'Talk is cheap. Show me the code.',
    author: 'Linus Torvalds',
    role: 'Creator of Linux & Git',
    topic: 'Engineering',
    hinglishTakeaway: 'Sirf tutorials dekhne ke bajay har study block mein kuch concrete code commit karein.'
  },
  {
    id: 'hamilton-software',
    text: 'There was no choice but to be pioneers; every edge case had to be anticipated before launch.',
    author: 'Margaret Hamilton',
    role: 'Director of Software Engineering, Apollo',
    topic: 'Engineering',
    hinglishTakeaway: 'Evaluations, guardrails aur edge-case testing hi hobby scripts ko production AI banate hain.'
  },
  {
    id: 'sutskever-scale',
    text: 'When models learn to predict deeply, structure and reasoning naturally emerge from the data.',
    author: 'Ilya Sutskever',
    role: 'Co-Founder, Safe Superintelligence',
    topic: 'Artificial Intelligence',
    hinglishTakeaway: 'Transformers aur scaling laws kaise reasoning unlock karte hain, iski core intuition pakki rakhein.'
  },
  {
    id: 'mccarthy-ai',
    text: 'Every aspect of learning or any other feature of intelligence can in principle be so precisely described that a machine can simulate it.',
    author: 'John McCarthy',
    role: 'Coined the Term "Artificial Intelligence"',
    topic: 'Artificial Intelligence',
    hinglishTakeaway: 'Clear problem formulation hi intelligent systems design karne ki pehli seedhi hai.'
  },
  {
    id: 'berners-lee-web',
    text: 'The power of technology lies in connecting human knowledge openly so everyone can build upon it.',
    author: 'Tim Berners-Lee',
    role: 'Inventor of the World Wide Web',
    topic: 'Computer Science',
    hinglishTakeaway: 'Open-source models aur shared engineering knowledge ka poora fayda uthayein aur contribute karein.'
  }
];

export const getDailyQuoteForDate = (dateStr?: string): DailyTechQuote => {
  const key = dateStr || new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return AI_TECH_QUOTES[hash % AI_TECH_QUOTES.length];
};

export const getRandomTechQuote = (excludeId?: string): DailyTechQuote => {
  const candidates = excludeId
    ? AI_TECH_QUOTES.filter((q) => q.id !== excludeId)
    : AI_TECH_QUOTES;
  const pool = candidates.length > 0 ? candidates : AI_TECH_QUOTES;
  return pool[Math.floor(Math.random() * pool.length)];
};
