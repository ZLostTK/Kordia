import { useState } from 'react';
import { Trash2, Database, Info } from 'lucide-react';
import { api } from '../services/api';

export default function Settings() {
  const [isCleaningCache, setIsCleaningCache] = useState(false);

  const handleCleanupCache = async () => {
    if (!confirm('¿Limpiar caché antiguo? Esto no afectará las canciones descargadas.')) return;

    setIsCleaningCache(true);
    try {
      await api.cleanup();
      alert('Caché limpiado exitosamente');
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('Error al limpiar el caché');
    } finally {
      setIsCleaningCache(false);
    }
  };

  return (
    <div className="p-6 pb-32 max-w-2xl">
      <h2 className="text-3xl font-bold text-white mb-6">Ajustes</h2>

      <section className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Info size={20} />
          Acerca de
        </h3>
        <div className="bg-gray-800 rounded-lg p-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Aplicación</span>
            <span className="text-white font-medium">Kordia</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Versión</span>
            <span className="text-white font-medium">1.0.4</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Backend</span>
            <span className="text-white font-medium">FastAPI</span>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Database size={20} />
          Almacenamiento
        </h3>
        <div className="bg-gray-800 rounded-lg p-6">
          <p className="text-gray-400 mb-4">
            Limpia el caché de URLs de streaming para liberar espacio. Las canciones descargadas no se verán afectadas.
          </p>
          <button
            onClick={handleCleanupCache}
            disabled={isCleaningCache}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Trash2 size={18} />
            {isCleaningCache ? 'Limpiando...' : 'Limpiar Caché'}
          </button>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-white mb-4">Información</h3>
        <div className="bg-gray-800 rounded-lg p-6 space-y-2 text-sm">
          <p className="text-gray-400">
            Kordia es una aplicación de reproducción de música que utiliza YouTube como fuente.
            Todas las canciones descargadas se almacenan localmente en tu dispositivo.
          </p>
          <p className="text-gray-400 mt-4">
            Las URLs de streaming se almacenan en caché durante 90 minutos para mejorar el rendimiento.
          </p>
        </div>
      </section>
    </div>
  );
}
