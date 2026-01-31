let _pyodidePromise = null;
let _packagesLoaded = false;
let _packagesPromise = null;
let _scriptPromise = null;

async function ensurePyodideScript() {
  if (typeof loadPyodide === "function") return;
  if (_scriptPromise) return _scriptPromise;
  _scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Pyodide script"));
    document.head.appendChild(s);
  });
  return _scriptPromise;
}

export async function getPyodideInstance() {
  await ensurePyodideScript();
  if (!_pyodidePromise) {
    _pyodidePromise = loadPyodide();
  }
  return await _pyodidePromise;
}

export async function ensurePackagesLoaded() {
  const pyodide = await getPyodideInstance();
  if (_packagesLoaded) return pyodide;
  if (_packagesPromise) {
    await _packagesPromise;
    return pyodide;
  }

  _packagesPromise = pyodide.runPythonAsync(`
import pyodide_js
import asyncio

async def __load_packages():
    await pyodide_js.loadPackage('https://raw.githubusercontent.com/J2V-k/jportal-vhost/main/public/artifact/PyMuPDF-1.24.12-cp311-abi3-emscripten_3_1_32_wasm32.whl')  
    await pyodide_js.loadPackage('https://cdn.jsdelivr.net/gh/J2V-k/jportal-vhost@main/public/artifact/jiit_marks-0.2.0-py3-none-any.whl')

asyncio.get_event_loop().run_until_complete(__load_packages())
  `);
  await _packagesPromise;
  _packagesLoaded = true;
  _packagesPromise = null;
  return pyodide;
}

export async function getPyodideWithPackages() {
  return await ensurePackagesLoaded();
}
