from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse, JSONResponse
from .config import (SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI)
from urllib.parse import urlencode
import requests
import base64
import time

router = APIRouter()

_spotify_access_token: str | None = None
_spotify_refresh_token: str | None = None
_spotify_expires_at: float | None = None


def _get_basic_auth_header() -> str:
  if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
    raise RuntimeError("Spotify client ID/secret not set in environment.")
  creds = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
  return base64.b64encode(creds.encode()).decode()

def _exchange_code_for_token(code: str):
  global _spotify_access_token, _spotify_refresh_token, _spotify_expires_at

  if not SPOTIFY_REDIRECT_URI:
    raise RuntimeError("SPOTIFY_REDIRECT_URI not set in environment.")
  
  token_url = "https://accounts.spotify.com/api/token"
  data = {
    "grant_type": "authorization_code",
    "code": code,
    "redirect_uri": SPOTIFY_REDIRECT_URI,
  }
  headers = {
    "authorization": f"Basic {_get_basic_auth_header()}",
    "Content-Type": "application/x-www-form-urlencoded",
  }

  resp = requests.post(token_url, data=data, headers=headers)
  print("token exhange status", resp.status_code)
  print("token exchange body", resp.text)

  if resp.status_code != 200:
    print("spotify token failed with exchange", resp.status_code, resp.text)
    raise HTTPException(
      status_code=400,
      detail="Failed to exchange code for token with Spotify.",
    )
  
  payload = resp.json()
  _spotify_access_token = payload.get("access_token")
  _spotify_refresh_token = payload.get("refresh_token")
  expires_in = payload.get("expires_in", 3600)
  _spotify_expires_at = time.time() + expires_in - 30

  if not _spotify_access_token:
    print("NO access token in payload:", payload)
    raise HTTPException(status_code=500, detail="No access token from Spotify")


def _refresh_access_token():
  global _spotify_access_token, _spotify_refresh_token, _spotify_expires_at
  
  if not _spotify_refresh_token:
    raise HTTPException(status_code=401, detail="No refresh token stored")
  
  token_url = "https://accounts.spotify.com/api/token"

  data = {
    "grant_type": "refresh_token",
    "refresh_token": _spotify_refresh_token,
  }

  headers = {
    "Authorization": f"Basic {_get_basic_auth_header()}",
    "Content-Type": "application/x-www-form-urlencoded",
  }

  resp = requests.post(token_url, data=data, headers=headers)
  if resp.status_code != 200:
    print("spotify refresh failed", resp.status_code, resp.text)
    raise HTTPException(
      status_code=resp.status_code, 
      detail="Failed to refresh Spotify access token.",
      )
  
  payload = resp.json()
  _spotify_access_token = payload.get("access_token")
  expires_in = payload.get("expires_in", 3600)
  _spotify_expires_at = time.time() + expires_in - 30


def _get_valid_access_token() -> str:
  global _spotify_access_token, _spotify_expires_at

  if not _spotify_access_token:
    raise HTTPException(status_code=401, detail="User not authenticated with Spotify.")

  if _spotify_expires_at is None or time.time() > _spotify_expires_at:
    _refresh_access_token()

  return _spotify_access_token



@router.get("/auth/login")
def spotify_login():
  if not SPOTIFY_CLIENT_ID or not SPOTIFY_REDIRECT_URI:
    raise HTTPException(
      status_code=500,
      detail="Spotify client ID or redirect URI not configured on server."
    )
  scope = "user-read-playback-state user-read-currently-playing"
  params = {
    "response_type": "code",
    "client_id": SPOTIFY_CLIENT_ID,
    "scope": scope,
    "redirect_uri": SPOTIFY_REDIRECT_URI,
    "show_dialog": "true",
  }

  url = "https://accounts.spotify.com/authorize?" + urlencode(params)
  return RedirectResponse(url)

@router.get("/auth/callback")
def spotify_callback(request: Request, code: str | None = None, error: str | None = None):
  if error:
    raise HTTPException(status_code=400, detail=f"Spotify error: {error}")
  
  if not code: 
    raise HTTPException(status_code=400, detail="Missing code from Spotify")
  
  _exchange_code_for_token(code)
  return JSONResponse({"message": "spotify linked"})


@router.get("/spotify/now-playing")
def spotify_now_playing():
  access_token = _get_valid_access_token()

  resp = requests.get(
      "https://api.spotify.com/v1/me/player/currently-playing",
      headers={"Authorization": f"Bearer {access_token}"},
  )

  if resp.status_code == 204:
    return {"is_playing": False}
  
  if resp.status_code != 200:
    print("Spotify now-playing error:", resp.status_code, resp.text)
    raise HTTPException(
      status_code=resp.status_code, 
      detail="Failed to fetch now-playing from Spotify.",
      )
  
  data = resp.json()

  item = data.get("item") or {}
  artists = item.get("artists") or []
  artist_names = ", ".join(a.get("name", "") for a in artists)

  
  return {
    "is_playing": data.get("is_playing", False),
    "progress_ms": data.get("progress_ms"),
    "duration_ms": item.get("duration_ms"),
    "track_name": item.get("name"),
    "artists": artist_names,
    "album_name": (item.get("album") or {}).get("name"),
    "album_image": ((item.get("album") or {}).get("images") or [{}])[0].get("url"),
  }

@router.get("/auth/debug-token")
def debug_token():
  return {
    "access_token_set": _spotify_access_token is not None,
    "refresh_token_set": _spotify_refresh_token is not None,
    "expires_at": _spotify_expires_at,
    "now": time.time(),
  }

