"""
Repositorio base con operaciones CRUD comunes
"""
from typing import Optional, List, Any
import aiosqlite


class BaseRepository:
    """Clase base para repositorios"""
    
    def __init__(self, db: aiosqlite.Connection):
        self.db = db
    
    async def execute(self, query: str, params: tuple = ()) -> aiosqlite.Cursor:
        """Ejecutar una consulta SQL"""
        return await self.db.execute(query, params)
    
    async def fetchone(self, query: str, params: tuple = ()) -> Optional[tuple]:
        """Obtener un solo resultado"""
        async with await self.execute(query, params) as cursor:
            return await cursor.fetchone()
    
    async def fetchall(self, query: str, params: tuple = ()) -> List[tuple]:
        """Obtener todos los resultados"""
        async with await self.execute(query, params) as cursor:
            return await cursor.fetchall()
    
    async def commit(self) -> None:
        """Confirmar cambios"""
        await self.db.commit()
