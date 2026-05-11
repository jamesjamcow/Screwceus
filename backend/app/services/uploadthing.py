import base64
import json
from dataclasses import dataclass
from typing import Any

import httpx
from fastapi import HTTPException, status

from app.core.config import settings


@dataclass(frozen=True)
class UploadThingFile:
    name: str
    url: str
    key: str


async def upload_image_to_uploadthing(
    *,
    content: bytes,
    filename: str,
    content_type: str,
) -> UploadThingFile:
    api_key = _resolve_uploadthing_api_key()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="UploadThing is not configured",
        )

    prepare_payload = {
        "fileName": filename,
        "fileSize": len(content),
        "fileType": content_type,
        "acl": "public-read",
    }

    headers = {
        "content-type": "application/json",
        "x-uploadthing-api-key": api_key,
        "x-uploadthing-fe-package": "screwceus-fastapi",
        "x-uploadthing-version": settings.uploadthing_api_version,
    }

    async with httpx.AsyncClient(timeout=30) as client:
        prepare_response = await client.post(
            f"{settings.uploadthing_api_url.rstrip('/')}/v7/prepareUpload",
            headers=headers,
            json=prepare_payload,
        )
        _raise_uploadthing_error(prepare_response)
        prepared = prepare_response.json()

        upload_url = prepared.get("url")
        if not upload_url:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="UploadThing did not return an upload URL",
            )

        files = {"file": (filename, content, content_type)}
        upload_response = await client.put(upload_url, files=files)
        _raise_uploadthing_error(upload_response)

    upload_result = _json_or_empty(upload_response)
    file_key = _first_string(upload_result, prepared, keys=("key", "fileKey", "file_key"))
    file_url = _first_string(upload_result, prepared, keys=("url", "ufsUrl", "fileUrl", "appUrl"))

    if not file_url and file_key:
        file_url = _ufs_url_for_key(file_key)

    if not file_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="UploadThing did not return a file URL",
        )

    return UploadThingFile(name=filename, url=file_url, key=file_key or "")


def _resolve_uploadthing_api_key() -> str:
    token_data = _decode_uploadthing_token()
    return str(token_data.get("apiKey") or token_data.get("api_key") or token_data.get("key") or "")


def _decode_uploadthing_token() -> dict[str, Any]:
    token = settings.uploadthing_token
    if not token:
        return {}

    try:
        padded_token = token + ("=" * (-len(token) % 4))
        decoded = base64.urlsafe_b64decode(padded_token)
        payload = json.loads(decoded)
    except (ValueError, json.JSONDecodeError):
        return {}

    return payload if isinstance(payload, dict) else {}


def _ufs_url_for_key(file_key: str) -> str:
    app_id = str(_decode_uploadthing_token().get("appId") or _decode_uploadthing_token().get("app_id") or "")
    if app_id:
        return f"https://{app_id}.ufs.sh/f/{file_key}"

    return f"https://utfs.io/f/{file_key}"


def _raise_uploadthing_error(response: httpx.Response) -> None:
    if response.is_success:
        return

    detail = "UploadThing upload failed"
    try:
        payload = response.json()
        if isinstance(payload, dict):
            detail = payload.get("message") or payload.get("error") or payload.get("detail") or detail
    except ValueError:
        if response.text:
            detail = response.text

    raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)


def _json_or_empty(response: httpx.Response) -> dict[str, Any]:
    try:
        payload = response.json()
    except ValueError:
        return {}

    return payload if isinstance(payload, dict) else {}


def _first_string(*payloads: dict[str, Any], keys: tuple[str, ...]) -> str:
    for payload in payloads:
        for candidate in _payload_candidates(payload):
            for key in keys:
                value = candidate.get(key)
                if isinstance(value, str) and value:
                    return value

    return ""


def _payload_candidates(payload: dict[str, Any]) -> tuple[dict[str, Any], ...]:
    candidates = [payload]
    for key in ("data", "file"):
        value = payload.get(key)
        if isinstance(value, dict):
            candidates.append(value)

    return tuple(candidates)
