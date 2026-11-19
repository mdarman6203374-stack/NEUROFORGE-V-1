export interface ProjectReadmeChecklist {
  problemAndArchitecture: boolean;
  reproducibleSetup: boolean;
  benchmarksAndEvals: boolean;
  demoGifOrScreenshots: boolean;
}

export interface ProjectArtifactRecord {
  projectId: string;
  githubUrl: string;
  demoUrl: string;
  latestCommitHash: string;
  status: 'planned' | 'in-progress' | 'shipped';
  checklist: ProjectReadmeChecklist;
  updatedAt: string;
}

const ARTIFACTS_STORAGE_KEY = 'ai_mastery_project_artifacts_v1';

export const DEFAULT_README_CHECKLIST: ProjectReadmeChecklist = {
  problemAndArchitecture: false,
  reproducibleSetup: false,
  benchmarksAndEvals: false,
  demoGifOrScreenshots: false
};

export function loadProjectArtifacts(): Record<string, ProjectArtifactRecord> {
  try {
    const raw = localStorage.getItem(ARTIFACTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveProjectArtifacts(map: Record<string, ProjectArtifactRecord>) {
  try {
    localStorage.setItem(ARTIFACTS_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export function getArtifactCompletionScore(rec?: ProjectArtifactRecord): { done: number; total: number } {
  if (!rec) return { done: 0, total: 4 };
  const vals = Object.values(rec.checklist || {});
  return {
    done: vals.filter(Boolean).length,
    total: 4
  };
}
