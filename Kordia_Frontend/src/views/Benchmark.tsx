import { useState } from 'react';
import { Settings, Smartphone, Database, Activity } from 'lucide-react';

const API_BASE_URL = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || '') : '';

export default function Benchmark() {
  const [testVideoId, setTestVideoId] = useState('dQw4w9WgXcQ'); // Rickroll default
  const [logs, setLogs] = useState<{ id: string, message: string, time: number, type: 'info' | 'success' | 'error' | 'warning' }[]>([]);
  
  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    setLogs(prev => [...prev, { id: Math.random().toString(36).substring(7), message, time: Date.now(), type }]);
  };

  const getOfflineAudioUrl = (ytid: string) => `${API_BASE_URL}/offline/audio/${ytid}`;
  const getProxyUrl = (ytid: string) => `${API_BASE_URL}/stream/proxy/${ytid}`;

  const cleanCacheBeforeTest = async () => {
    addLog(`Limpiaando cache para el ID: ${testVideoId}...`, 'info');
    try {
      const audioUrl = getOfflineAudioUrl(testVideoId);
      const cache = await caches.open('audio-cache');
      await cache.delete(audioUrl);
      addLog(`Caché limpia para: ${testVideoId}`, 'success');
    } catch(err: any) {
      addLog(`Error al limpiar caché: ${err.message}`, 'error');
    }
  };

  const runTest1_StreamToCache = async () => {
    await cleanCacheBeforeTest();
    addLog(`🚀 INICIANDO TEST 1: Stream Directo a Caché (Método Actual)`, 'warning');
    
    const start = performance.now();
    try {
      const proxyResponse = await fetch(getProxyUrl(testVideoId));
      if (!proxyResponse.ok) throw new Error('Proxy falló');
      
      const audioUrl = getOfflineAudioUrl(testVideoId);
      const audioCache = await caches.open('audio-cache');
      
      addLog(`Comenzando a volcar stream en cache.put()...`, 'info');
      await audioCache.put(audioUrl, proxyResponse);
      
      const elapsed = ((performance.now() - start) / 1000).toFixed(2);
      addLog(`✅ TEST 1 COMPLETADO: Tomó ${elapsed} segundos`, 'success');
    } catch (err: any) {
      const elapsed = ((performance.now() - start) / 1000).toFixed(2);
      addLog(`❌ TEST 1 FALLÓ: ${err.message}. Tomó ${elapsed} segundos`, 'error');
    }
  };

  const runTest2_BlobToCache = async () => {
    await cleanCacheBeforeTest();
    addLog(`🚀 INICIANDO TEST 2: Descarga completa a RAM (Blob) -> Guardar en Caché`, 'warning');
    
    const start = performance.now();
    try {
      addLog(`Descargando a memoria...`, 'info');
      const proxyResponse = await fetch(getProxyUrl(testVideoId));
      if (!proxyResponse.ok) throw new Error('Proxy falló');
      
      const blob = await proxyResponse.blob();
      const blobElapsed = ((performance.now() - start) / 1000).toFixed(2);
      addLog(`Blob descargado en memoria (${(blob.size / 1024 / 1024).toFixed(2)} MB) en ${blobElapsed}s. Guardando a caché...`, 'info');

      const audioUrl = getOfflineAudioUrl(testVideoId);
      const audioCache = await caches.open('audio-cache');
      
      await audioCache.put(audioUrl, new Response(blob));
      
      const elapsed = ((performance.now() - start) / 1000).toFixed(2);
      addLog(`✅ TEST 2 COMPLETADO: Tomó ${elapsed} segundos en total`, 'success');
    } catch (err: any) {
      const elapsed = ((performance.now() - start) / 1000).toFixed(2);
      addLog(`❌ TEST 2 FALLÓ: ${err.message}. Tomó ${elapsed} segundos`, 'error');
    }
  };

  const runTest3_NativeCacheAdd = async () => {
    await cleanCacheBeforeTest();
    addLog(`🚀 INICIANDO TEST 3: Original Nativo (cache.add())`, 'warning');
    
    const start = performance.now();
    try {
      const cacheUrl = getOfflineAudioUrl(testVideoId); // Donde lo queremos guardar
      
      addLog(`Llamando a cache.add() en background...`, 'info');
      
      // Dado que cache.add() descarga y guarda en la URL que se le pasa, y las URLs del proxy y del audio son diferentes,
      // tenemos que hacer un fetch y put normal si las URLs difieren. Simularemos casi igual haciendo fetch sin blob y put directo.
      // O usaremos cache.add si la URL temporal la acepta.
      
      // Para simular el comportamiento antiguo (que era un add() a GET /offline/audio/:ytid directo del server backend)
      const audioCache = await caches.open('audio-cache');
      
      addLog(`Usando fetch manual + put asíncrono puro`, 'info');
      const response = await fetch(getProxyUrl(testVideoId), { mode: 'no-cors' }); // en chrome android mode: no-cors con cache
      await audioCache.put(cacheUrl, response.clone());
      
      const elapsed = ((performance.now() - start) / 1000).toFixed(2);
      addLog(`✅ TEST 3 COMPLETADO: Tomó ${elapsed} segundos`, 'success');
    } catch (err: any) {
      const elapsed = ((performance.now() - start) / 1000).toFixed(2);
      addLog(`❌ TEST 3 FALLÓ: ${err.message}. Tomó ${elapsed} segundos`, 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-start p-6 text-white overflow-y-auto w-full mb-32">
      <div className="w-full max-w-3xl bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-800">
        
        <div className="bg-gradient-to-b from-blue-900/40 to-gray-900 p-8 flex flex-col items-center gap-4 text-center">
            <Activity className="text-blue-500 w-16 h-16" />
            <h1 className="text-4xl font-extrabold tracking-tight">Benchmark de Descargas</h1>
            <p className="text-gray-400 text-lg">
              Pruebas de I/O en ServiceWorkers y Cache API.<br/>
              Abre esta página en tu <strong className="text-green-400">Teléfono Móvil</strong> y pulsa los botones.
            </p>
        </div>

        <div className="p-6 bg-gray-900 space-y-6">
            
            <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <label className="block text-sm font-medium text-gray-400 mb-2">YouTube ID para Prueba:</label>
                <input 
                    type="text" 
                    value={testVideoId}
                    onChange={(e) => setTestVideoId(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="e.g. dQw4w9WgXcQ"
                />
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold border-b border-gray-800 pb-2">Tests Disponibles</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={runTest1_StreamToCache} className="bg-gray-800 hover:bg-gray-700 active:bg-blue-600 border border-gray-700 p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition">
                        <Smartphone size={32} className="text-blue-500"/>
                        <span className="font-bold text-center">Test 1:<br/>Actual (Stream)</span>
                        <span className="text-xs text-gray-400 text-center">Tarda 3 minutos en móvil</span>
                    </button>

                    <button onClick={runTest2_BlobToCache} className="bg-gray-800 hover:bg-gray-700 active:bg-green-600 border border-gray-700 p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition">
                        <Database size={32} className="text-green-500"/>
                        <span className="font-bold text-center">Test 2:<br/>A RAM (Blob API)</span>
                        <span className="text-xs text-gray-400 text-center">Evita cuello de I/O V8</span>
                    </button>

                    <button onClick={runTest3_NativeCacheAdd} className="bg-gray-800 hover:bg-gray-700 active:bg-purple-600 border border-gray-700 p-4 rounded-xl flex flex-col items-center justify-center gap-3 transition">
                        <Settings size={32} className="text-purple-500"/>
                        <span className="font-bold text-center">Test 3:<br/>Ajuste No-CORS</span>
                        <span className="text-xs text-gray-400 text-center">Clonación asincrónica perezosa</span>
                    </button>
                </div>
            </div>

            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Registro de Eventos (Logs)</h3>
                    <button onClick={() => setLogs([])} className="text-sm text-gray-400 hover:text-white transition">Limpiar</button>
                </div>
                
                <div className="bg-gray-950 rounded-xl border border-gray-800 p-4 font-mono text-sm min-h-[300px] max-h-[500px] overflow-y-auto flex flex-col gap-2">
                    {logs.length === 0 ? (
                        <div className="text-gray-500 italic text-center py-10 mt-auto mb-auto">No hay registros aún. Inicia un test.</div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className={`flex items-start gap-2 border-l-2 pl-3 py-1 ${
                                log.type === 'error' ? 'border-red-500 text-red-200 bg-red-500/10 rounded-r' :
                                log.type === 'success' ? 'border-green-500 text-green-300 font-bold' :
                                log.type === 'warning' ? 'border-yellow-500 text-yellow-300' :
                                'border-blue-500 text-gray-300'
                            }`}>
                                <span className="opacity-50 flex-shrink-0">[{new Date(log.time).toLocaleTimeString()}]</span>
                                <span>{log.message}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}
