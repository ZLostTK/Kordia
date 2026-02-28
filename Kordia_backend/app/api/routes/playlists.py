from fastapi import APIRouter, HTTPException, Depends
import aiosqlite
from typing import List, Dict, Any
from app.database.repositories.playlists import PlaylistRepository
from app.dependencies import get_db

router = APIRouter(prefix="/playlists", tags=["playlists"])

@router.get("/")
async def get_playlists(db: aiosqlite.Connection = Depends(get_db)):
    repo = PlaylistRepository(db)
    return await repo.get_all_playlists()

@router.post("/")
async def create_playlist(data: Dict[str, Any], db: aiosqlite.Connection = Depends(get_db)):
    name = data.get("name")
    playlist_id = data.get("id")
    if not name or not playlist_id:
        raise HTTPException(status_code=400, detail="name and id required")
    repo = PlaylistRepository(db)
    return await repo.create_playlist(playlist_id, name)

@router.get("/{playlist_id}")
async def get_playlist(playlist_id: str, db: aiosqlite.Connection = Depends(get_db)):
    repo = PlaylistRepository(db)
    playlist = await repo.get_playlist(playlist_id)
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist

@router.put("/{playlist_id}")
async def rename_playlist(playlist_id: str, data: Dict[str, Any], db: aiosqlite.Connection = Depends(get_db)):
    name = data.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="name required")
    repo = PlaylistRepository(db)
    success = await repo.update_playlist_name(playlist_id, name)
    if not success:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"status": "success"}

@router.delete("/{playlist_id}")
async def delete_playlist(playlist_id: str, db: aiosqlite.Connection = Depends(get_db)):
    repo = PlaylistRepository(db)
    success = await repo.delete_playlist(playlist_id)
    if not success:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return {"status": "success"}

@router.post("/{playlist_id}/songs")
async def add_song(playlist_id: str, song: Dict[str, Any], db: aiosqlite.Connection = Depends(get_db)):
    repo = PlaylistRepository(db)
    if 'ytid' not in song or 'title' not in song:
        raise HTTPException(status_code=400, detail="Song needs ytid and title")
        
    if not await repo.get_playlist(playlist_id):
        raise HTTPException(status_code=404, detail="Playlist not found")
        
    await repo.add_song(playlist_id, song)
    # Refresh and return
    return await repo.get_playlist(playlist_id)

@router.delete("/{playlist_id}/songs/{ytid}")
async def remove_song(playlist_id: str, ytid: str, db: aiosqlite.Connection = Depends(get_db)):
    repo = PlaylistRepository(db)
    success = await repo.remove_song(playlist_id, ytid)
    if not success:
        raise HTTPException(status_code=404, detail="Song or Playlist not found")
    # Return updated playlist
    return await repo.get_playlist(playlist_id)
