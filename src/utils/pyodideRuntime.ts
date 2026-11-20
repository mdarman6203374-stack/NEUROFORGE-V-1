declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<any>;
    __neuroforgePyodideInstance?: any;
    __neuroforgePyodideLoadingPromise?: Promise<any>;
  }
}

export async function ensurePyodideScriptLoaded(): Promise<any> {
  if (window.__neuroforgePyodideInstance) {
    return window.__neuroforgePyodideInstance;
  }
  if (window.__neuroforgePyodideLoadingPromise) {
    return window.__neuroforgePyodideLoadingPromise;
  }

  window.__neuroforgePyodideLoadingPromise = new Promise((resolve, reject) => {
    const initEngine = async () => {
      try {
        if (!window.loadPyodide) {
          reject(new Error('Pyodide loader failed to initialize.'));
          return;
        }
        const pyodide = await window.loadPyodide({
          indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
        });
        window.__neuroforgePyodideInstance = pyodide;
        resolve(pyodide);
      } catch (err) {
        reject(err);
      }
    };

    if (window.loadPyodide) {
      void initEngine();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-pyodide-cdn="true"]'
    );
    if (existingScript) {
      existingScript.addEventListener('load', () => void initEngine(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Could not download Pyodide runtime.')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
    script.async = true;
    script.dataset.pyodideCdn = 'true';
    script.onload = () => void initEngine();
    script.onerror = () =>
      reject(new Error('Network blocked Pyodide CDN script. Check internet connection.'));
    document.head.appendChild(script);
  }).catch((err) => {
    window.__neuroforgePyodideLoadingPromise = undefined;
    throw err;
  });

  return window.__neuroforgePyodideLoadingPromise;
}
