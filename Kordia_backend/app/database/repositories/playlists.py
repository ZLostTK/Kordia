import aiosqlite
from typing import List, Dict, Any, Optional
from datetime import datetime

class PlaylistRepository:
    def __init__(self, db: aiosqlite.Connection):
        self.db = db

    async def get_all_playlists(self) -> List[Dict[str, Any]]:
        async with self.db.execute("SELECT id, name, cover_thumbnail, created_at FROM playlists ORDER BY created_at DESC") as cursor:
            rows = await cursor.fetchall()
            return [
                {
                    "id": row[0],
                    "name": row[1],
                    "coverThumbnail": row[2],
                    "createdAt": row[3],
                    "songs": await self.get_playlist_songs(row[0])
                }
                for row in rows
            ]

    async def get_playlist(self, playlist_id: str) -> Optional[Dict[str, Any]]:
        async with self.db.execute("SELECT id, name, cover_thumbnail, created_at FROM playlists WHERE id = ?", (playlist_id,)) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            return {
                "id": row[0],
                "name": row[1],
                "coverThumbnail": row[2],
                "createdAt": row[3],
                "songs": await self.get_playlist_songs(playlist_id)
            }

    async def get_playlist_songs(self, playlist_id: str) -> List[Dict[str, Any]]:
        query = """
            SELECT ytid, title, artist, thumbnail 
            FROM playlist_songs 
            WHERE playlist_id = ? 
            ORDER BY song_order ASC
        """
        async with self.db.execute(query, (playlist_id,)) as cursor:
            rows = await cursor.fetchall()
            return [
                {
                    "ytid": row[0],
                    "title": row[1],
                    "artist": row[2],
                    "thumbnail": row[3]
                }
                for row in rows
            ]

    async def create_playlist(self, playlist_id: str, name: str) -> Dict[str, Any]:
        created_at = datetime.utcnow().isoformat()
        await self.db.execute(
            "INSERT INTO playlists (id, name, created_at) VALUES (?, ?, ?)",
            (playlist_id, name, created_at)
        )
        await self.db.commit()
        return await self.get_playlist(playlist_id)

    async def update_playlist_name(self, playlist_id: str, name: str) -> bool:
        cursor = await self.db.execute("UPDATE playlists SET name = ? WHERE id = ?", (name, playlist_id))
        await self.db.commit()
        return cursor.rowcount > 0

    async def delete_playlist(self, playlist_id: str) -> bool:
        cursor = await self.db.execute("DELETE FROM playlists WHERE id = ?", (playlist_id,))
        await self.db.commit()
        return cursor.rowcount > 0

    async def add_song(self, playlist_id: str, song: Dict[str, Any]) -> bool:
        async with self.db.execute("SELECT 1 FROM playlist_songs WHERE playlist_id = ? AND ytid = ?", (playlist_id, song['ytid'])) as cursor:
            if await cursor.fetchone():
                return False
                
        async with self.db.execute("SELECT MAX(song_order) FROM playlist_songs WHERE playlist_id = ?", (playlist_id,)) as cursor:
            row = await cursor.fetchone()
            next_order = (row[0] or 0) + 1
            
        await self.db.execute(
            "INSERT INTO playlist_songs (playlist_id, ytid, title, artist, thumbnail, song_order) VALUES (?, ?, ?, ?, ?, ?)",
            (playlist_id, song['ytid'], song['title'], song.get('artist', ''), song.get('thumbnail', ''), next_order)
        )
        
        async with self.db.execute("SELECT cover_thumbnail FROM playlists WHERE id = ?", (playlist_id,)) as cursor:
            pl_row = await cursor.fetchone()
            if pl_row and not pl_row[0] and song.get('thumbnail'):
                await self.db.execute("UPDATE playlists SET cover_thumbnail = ? WHERE id = ?", (song['thumbnail'], playlist_id))
                
        await self.db.commit()
        return True

    async def remove_song(self, playlist_id: str, ytid: str) -> bool:
        cursor = await self.db.execute("DELETE FROM playlist_songs WHERE playlist_id = ? AND ytid = ?", (playlist_id, ytid))
        
        # Verify if needs a new cover
        if cursor.rowcount > 0:
            songs = await self.get_playlist_songs(playlist_id)
            new_cover = songs[0]['thumbnail'] if songs and songs[0]['thumbnail'] else None
            await self.db.execute("UPDATE playlists SET cover_thumbnail = ? WHERE id = ?", (new_cover, playlist_id))
            
        await self.db.commit()
        return cursor.rowcount > 0
