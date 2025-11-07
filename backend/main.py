from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from models import Dataset, User, Project
import hashlib
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import secrets
import os
import re
import string
import random
import httpx
import logging
from urllib.parse import quote_plus

app = FastAPI()

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://purnashis:a1s2d3f4g5@cluster0.taegdc1.mongodb.net/")

@app.on_event("startup")
async def app_init():
    client = AsyncIOMotorClient(MONGODB_URI)
    await init_beanie(database=client.ledata, document_models=[Dataset, User])

@app.post("/api/datasets", response_model=Dataset)
async def create_dataset(request: Request):
    # Require auth token for creating datasets. Accept Bearer token in Authorization header.
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required")
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    if user.token_expires and user.token_expires < datetime.utcnow():
        user.auth_token = None
        user.token_expires = None
        await user.save()
        raise HTTPException(status_code=401, detail="Token expired")

    body = await request.json()
    # Build Dataset instance from incoming dict; leave defaults for missing fields
    dataset = Dataset(**body)
    await dataset.create()
    # record that this user submitted this dataset
    try:
        user.submitted = user.submitted or []
        user.submitted.append(str(dataset.id))
        user.updated_at = datetime.utcnow()
        await user.save()
    except Exception:
        # failure to record submission should not block dataset creation
        logging.exception('Failed to update user.submitted after dataset create')
    return dataset


@app.get('/api/datasets/submitted', response_model=List[Dataset])
async def get_submitted_datasets(request: Request):
    # require bearer token
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail='Authentication token required')
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token')
    if user.token_expires and user.token_expires < datetime.utcnow():
        user.auth_token = None
        user.token_expires = None
        await user.save()
        raise HTTPException(status_code=401, detail='Token expired')

    ids = user.submitted or []
    datasets = []
    for did in ids:
        try:
            d = await Dataset.get(did)
            if d:
                datasets.append(d)
        except Exception:
            continue
    return datasets

@app.get("/api/datasets", response_model=List[Dataset])
async def get_datasets():
    return await Dataset.find_all().to_list()


@app.post("/api/datasets/search", response_model=List[Dataset])
async def search_datasets(request: Request):
    # Require an auth token: accept Bearer token in Authorization header or 'token' in JSON body
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    else:
        body = await request.json()
        token = body.get('token')
        # if token provided in body, remove it from params before using as search params
        if token:
            body.pop('token', None)
        params = body

    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required")

    # validate token existence and expiry
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    if user.token_expires and user.token_expires < datetime.utcnow():
        # clear token server-side
        user.auth_token = None
        user.token_expires = None
        await user.save()
        raise HTTPException(status_code=401, detail="Token expired")

    # params should be the body (if not already set above)
    if 'params' not in locals():
        params = await request.json()
    query = {}
    for k, v in params.items():
        if isinstance(v, str) and v.strip() != "":
            # Case-insensitive substring match for strings
            query[k] = {"$regex": re.escape(v), "$options": "i"}
        elif isinstance(v, (int, float)) and v != "":
            query[k] = v
    relevant = await Dataset.find(query).to_list()
    # Fetch all datasets and append those not in relevant
    all_datasets = await Dataset.find_all().to_list()
    relevant_ids = set(d.id for d in relevant)
    others = [d for d in all_datasets if d.id not in relevant_ids]
    print(f"Search params: {params}, Found: {len(relevant)}, Others: {len(others)}", relevant, others)
    return relevant + others


@app.post('/api/datasets/{dataset_id}/save')
async def save_dataset(dataset_id: str, request: Request):
    # require bearer token
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail='Authentication token required')
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token')
    if user.token_expires and user.token_expires < datetime.utcnow():
        user.auth_token = None
        user.token_expires = None
        await user.save()

        raise HTTPException(status_code=401, detail='Token expired')

    ds = await Dataset.get(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail='Dataset not found')
    user.saved_datasets = user.saved_datasets or []
    if str(ds.id) not in user.saved_datasets:
        user.saved_datasets.append(str(ds.id))
        user.updated_at = datetime.utcnow()
        await user.save()
    return {'saved': True}


@app.delete('/api/datasets/{dataset_id}/unsave')
async def unsave_dataset(dataset_id: str, request: Request):
    # require bearer token
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail='Authentication token required')
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token')
    if user.token_expires and user.token_expires < datetime.utcnow():
        user.auth_token = None
        user.token_expires = None
        await user.save()
        raise HTTPException(status_code=401, detail='Token expired')

    # Remove dataset id from user's saved_datasets
    user.saved_datasets = user.saved_datasets or []
    removed = False
    if str(dataset_id) in user.saved_datasets:
        user.saved_datasets = [did for did in user.saved_datasets if did != str(dataset_id)]
        user.updated_at = datetime.utcnow()
        await user.save()
        removed = True

    return {'unsaved': removed}


@app.get('/api/datasets/saved', response_model=List[Dataset])
async def get_saved_datasets(request: Request):
    # require auth token
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail='Authentication token required')
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token')
    if user.token_expires and user.token_expires < datetime.utcnow():
        user.auth_token = None
        user.token_expires = None
        await user.save()
        raise HTTPException(status_code=401, detail='Token expired')

    ids = user.saved_datasets or []
    datasets = []
    for did in ids:
        try:
            d = await Dataset.get(did)
            if d:
                datasets.append(d)
        except Exception:
            continue
    return datasets


@app.get("/api/datasets/{dataset_id}", response_model=Dataset)
async def get_dataset(dataset_id: str):
    dataset = await Dataset.get(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return dataset

@app.put("/api/datasets/{dataset_id}", response_model=Dataset)
async def update_dataset(dataset_id: str, update: Dataset):
    dataset = await Dataset.get(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    update.id = dataset.id
    await update.save()
    return update

@app.delete("/api/datasets/{dataset_id}")
async def delete_dataset(dataset_id: str, request: Request):
    # require bearer token so we know which user's Saved section to update
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail='Authentication token required')
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token')
    if user.token_expires and user.token_expires < datetime.utcnow():
        user.auth_token = None
        user.token_expires = None
        await user.save()
        raise HTTPException(status_code=401, detail='Token expired')

    dataset = await Dataset.get(dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # delete the dataset
    await dataset.delete()

    # remove from this user's saved_datasets if present
    removed = False
    user.saved_datasets = user.saved_datasets or []
    if str(dataset.id) in user.saved_datasets:
        user.saved_datasets = [did for did in user.saved_datasets if did != str(dataset.id)]
        user.updated_at = datetime.utcnow()
        await user.save()
        removed = True

    return {"message": "Deleted", "removed_from_saved": removed}


@app.get('/api/datasets/saved', response_model=List[Dataset])
async def get_saved_datasets(request: Request):
    # require auth token
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail='Authentication token required')
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token')
    if user.token_expires and user.token_expires < datetime.utcnow():
        user.auth_token = None
        user.token_expires = None
        await user.save()
        raise HTTPException(status_code=401, detail='Token expired')

    ids = user.saved_datasets or []
    datasets = []
    for did in ids:
        try:
            d = await Dataset.get(did)
            if d:
                datasets.append(d)
        except Exception:
            continue
    return datasets


# --- Simple SHA-256 based auth (signup / login)
class SignupRequest(BaseModel):
    username: str
    email: str
    password: str
    recaptcha_token: Optional[str] = None


class LoginRequest(BaseModel):
    email_or_username: str
    password: str
    recaptcha_token: Optional[str] = None


async def verify_recaptcha(token: Optional[str], action_expected: Optional[str] = None) -> bool:
    """Verify recaptcha token using Google's siteverify endpoint.
    If RECAPTCHA_SECRET is not set, verification is skipped (returns True) so dev doesn't block.
    """
    # Allow an explicit toggle to disable recaptcha checks
    enabled = os.getenv('RECAPTCHA_ENABLED', '1').lower()
    if enabled in ('0', 'false', 'no'):
        logging.info('RECAPTCHA disabled by RECAPTCHA_ENABLED env; skipping recaptcha verification')
        return True

    secret = os.getenv('RECAPTCHA_SECRET')
    if not secret:
        logging.warning('RECAPTCHA_SECRET not set; skipping recaptcha verification (dev)')
        return True
    if not token:
        logging.info('No recaptcha token provided')
        return False
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post('https://www.google.com/recaptcha/api/siteverify', data={'secret': secret, 'response': token})
            data = resp.json()
    except Exception as e:
        logging.exception('Error verifying recaptcha: %s', e)
        return False

    success = data.get('success', False)
    score = data.get('score')
    action = data.get('action')
    # Basic checks: success true; if score present enforce threshold; if expected action provided, match it
    if not success:
        logging.info('recaptcha siteverify failed: %s', data)
        return False
    if action_expected and action and action.lower() != action_expected.lower():
        logging.info('recaptcha action mismatch: expected %s got %s', action_expected, action)
        return False
    if score is not None:
        try:
            if float(score) < 0.5:
                logging.info('recaptcha score too low: %s', score)
                return False
        except Exception:
            pass
    return True


def hash_password_sha256(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


@app.post("/api/auth/signup")
async def signup(req: SignupRequest):
    # Verify recaptcha token (if RECAPTCHA_SECRET set). In dev, verification is skipped.
    ok = await verify_recaptcha(req.recaptcha_token, action_expected='SIGNUP')
    if not ok:
        raise HTTPException(status_code=400, detail='recaptcha verification failed')
    # simple uniqueness checks
    # Use a MongoDB $or query dict to avoid unsupported '|' on Beanie Eq objects
    print("Signup request:", req)
    existing = await User.find_one({"$or": [{"email": req.email}, {"username": req.username}]})
    if existing:
        raise HTTPException(status_code=400, detail="User with given email or username already exists")
    pwd_hash = hash_password_sha256(req.password)
    # generate email verification token valid for 24 hours
    ev_token = secrets.token_urlsafe(32)
    ev_expires = datetime.utcnow() + timedelta(hours=24)
    # create user but do not issue auth token until email verified
    user = User(username=req.username, email=req.email, password_hash=pwd_hash,
                email_verified=False, email_verification_token=ev_token, email_verification_expires=ev_expires)
    await user.insert()

    # send verification email via Mailgun (use env vars but default to provided sandbox)
    MAILGUN_API_KEY = os.getenv('MAILGUN_API_KEY', '')
    MAILGUN_DOMAIN = os.getenv('MAILGUN_DOMAIN', '')
    MAILGUN_BASE = os.getenv('MAILGUN_BASE', 'https://api.mailgun.net')
    verify_link = f"{os.getenv('FRONTEND_URL','http://localhost:3000')}/verify-email?token={quote_plus(ev_token)}"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{MAILGUN_BASE}/v3/{MAILGUN_DOMAIN}/messages",
                                     auth=("api", MAILGUN_API_KEY),
                                     data={
                                         "from": f"LeData <mailgun@{MAILGUN_DOMAIN}>",
                                         "to": [user.email],
                                         "subject": "Verify your LeData email",
                                         "text": f"Welcome {user.username},\n\nPlease verify your email by clicking the link below:\n{verify_link}\n\nIf you didn't sign up, ignore this message.",
                                         "html": f"<p>Welcome {user.username},</p><p>Please verify your email by clicking <a href=\"{verify_link}\">here</a>.</p>"
                                     })
            if resp.status_code >= 400:
                logging.warning('Mailgun send failed: %s %s', resp.status_code, resp.text)
    except Exception:
        logging.exception('Failed to send verification email via Mailgun')

    return {"id": str(user.id), "username": user.username, "email": user.email, "verification_sent": True}


@app.get('/api/auth/verify-email')
async def verify_email(token: str):
    # find user with this verification token and not expired
    user = await User.find_one({ 'email_verification_token': token })
    if not user:
        raise HTTPException(status_code=404, detail='Verification token not found')
    if not user.email_verification_expires or user.email_verification_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail='Verification token expired')
    # mark verified and issue auth token
    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_expires = None
    # issue auth token valid for 30 minutes
    token_auth = secrets.token_hex(32)
    expires = datetime.utcnow() + timedelta(minutes=30)
    user.auth_token = token_auth
    user.token_expires = expires
    await user.save()
    return { 'verified': True, 'token': token_auth, 'token_expires': expires.isoformat() }


@app.get('/api/auth/poll-verification')
async def poll_verification(email: str):
    user = await User.find_one({ 'email': email })
    if not user:
        raise HTTPException(status_code=404, detail='User not found')
    return { 'email_verified': bool(user.email_verified), 'token': user.auth_token }


@app.post("/api/auth/login")
async def login(req: LoginRequest):
    # find by email or username
    # Use a MongoDB $or query dict to find by email or username
    user = await User.find_one({"$or": [{"email": req.email_or_username}, {"username": req.email_or_username}]})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.password_hash != hash_password_sha256(req.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    # Verify recaptcha token (if RECAPTCHA_SECRET set)
    ok = await verify_recaptcha(req.recaptcha_token, action_expected='LOGIN')
    if not ok:
        raise HTTPException(status_code=400, detail='recaptcha verification failed')

    # successful login - generate and store a token valid for 30 minutes
    token = secrets.token_hex(32)
    expires = datetime.utcnow() + timedelta(minutes=30)
    user.auth_token = token
    user.token_expires = expires
    await user.save()
    return {"id": str(user.id), "username": user.username, "email": user.email, "projects": [p.dict() for p in user.projects], "token": token, "token_expires": expires.isoformat(), "role_title": user.role_title, "organization": user.organization, "github_url": user.github_url, "linkedin_url": user.linkedin_url, "bio": user.bio, "image_url": user.image_url, "public_profile": user.public_profile, "public_profile_slug": getattr(user, 'public_profile_slug', '')}


@app.post("/api/auth/logout")
async def logout(request: Request):
    body = await request.json()
    token = body.get('token')
    if not token:
        raise HTTPException(status_code=400, detail="token required")
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=404, detail="token not found")
    user.auth_token = None
    user.token_expires = None
    await user.save()
    return {"message": "logged out"}


@app.get("/api/auth/me")
async def me(request: Request):
    # Check Authorization header for Bearer token
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail="Authentication token required")
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    if user.token_expires and user.token_expires < datetime.utcnow():
        user.auth_token = None
        user.token_expires = None
        await user.save()
        raise HTTPException(status_code=401, detail="Token expired")
    return {"id": str(user.id), "username": user.username, "email": user.email, "role_title": user.role_title, "organization": user.organization, "github_url": user.github_url, "linkedin_url": user.linkedin_url, "bio": user.bio, "image_url": user.image_url, "public_profile": user.public_profile, "public_profile_slug": getattr(user, 'public_profile_slug', ''), "projects": [p.dict() for p in user.projects]}


class ProfileUpdateRequest(BaseModel):
    role_title: str = None
    organization: str = None
    github_url: str = None
    linkedin_url: str = None
    bio: str = None
    image_url: str = None
    public_profile: bool = None

    # allow updating username/email via profile endpoint
    username: str = None
    email: str = None


class CreateProjectRequest(BaseModel):
    name: str
    description: str = ""


class ForgotPasswordRequest(BaseModel):
    email: str
    recaptcha_token: Optional[str] = None


@app.post('/api/auth/forgot-password')
async def forgot_password(req: ForgotPasswordRequest):
    ok = await verify_recaptcha(req.recaptcha_token, action_expected='FORGOT_PASSWORD')
    if not ok:
        raise HTTPException(status_code=400, detail='recaptcha verification failed')
    # Simulate: in a real app, generate a reset token, email it, etc.
    # We'll accept the request and return a generic message.
    return {'message': 'If an account with that email exists, a password reset link has been sent.'}


@app.get('/api/users/public/{slug}')
async def get_public_profile(slug: str):
    # Find user by public slug and ensure profile is public
    user = await User.find_one({'public_profile_slug': slug})
    if not user or not getattr(user, 'public_profile', False):
        raise HTTPException(status_code=404, detail='Public profile not found')
    # resolve saved datasets for public display (only include basic fields)
    datasets = []
    for did in (user.saved_datasets or []):
        try:
            d = await Dataset.get(did)
            if d:
                datasets.append({ 'id': str(d.id), 'dataset_name': d.dataset_name, 'description': d.description })
        except Exception:
            continue
    return {
        'username': user.username,
        'role_title': user.role_title,
        'organization': user.organization,
        'bio': user.bio,
        'image_url': user.image_url,
        'datasets': datasets,
    }


@app.get('/api/auth/check-slug/{slug}')
async def check_slug(slug: str):
    s = slug.strip().lower()
    if not re.match(r'^[a-z0-9_-]{3,32}$', s):
        # invalid format - return 400
        raise HTTPException(status_code=400, detail='Invalid slug format')
    exists = await User.find_one({'public_profile_slug': s})
    return { 'available': not bool(exists) }


@app.put('/api/auth/profile')
async def update_profile(request: Request):
    # require bearer token
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail='Authentication token required')
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token')
    if user.token_expires and user.token_expires < datetime.utcnow():
        user.auth_token = None
        user.token_expires = None
        await user.save()
        raise HTTPException(status_code=401, detail='Token expired')

    body = await request.json()
    # Update allowed profile fields only (no full_name; backend uses username)
    allowed = ['role_title','organization','github_url','linkedin_url','bio','image_url','public_profile']
    updated = False
    # handle username update with uniqueness check
    if 'username' in body and body['username'] is not None:
        new_username = body['username'].strip()
        if new_username and new_username != user.username:
            exists = await User.find_one({'username': new_username})
            if exists:
                raise HTTPException(status_code=400, detail='Username already taken')
            user.username = new_username
            updated = True

    # handle email update with uniqueness check and force re-verification
    email_changed = False
    if 'email' in body and body['email'] is not None:
        new_email = body['email'].strip()
        if new_email and new_email != user.email:
            exists = await User.find_one({'email': new_email})
            if exists:
                raise HTTPException(status_code=400, detail='Email already in use')
            user.email = new_email
            # clear token to force re-login / re-verification
            user.auth_token = None
            user.token_expires = None
            email_changed = True
            updated = True

    for k in allowed:
        if k in body and body[k] is not None:
            setattr(user, k, body[k])
            updated = True

    # handle explicit public_profile_slug set by user with uniqueness check
    if 'public_profile_slug' in body and body['public_profile_slug'] is not None:
        requested = str(body['public_profile_slug']).strip().lower()
        # validate simple slug pattern
        if not re.match(r'^[a-z0-9_-]{3,32}$', requested):
            raise HTTPException(status_code=400, detail='Invalid slug format')
        exists = await User.find_one({'public_profile_slug': requested})
        if exists and str(exists.id) != str(user.id):
            raise HTTPException(status_code=400, detail='Slug already taken')
        user.public_profile_slug = requested
        updated = True
    if updated:
        user.updated_at = datetime.utcnow()
        await user.save()

    # if user enabled public_profile and doesn't have a slug, generate one
    if getattr(user, 'public_profile', False) and (not getattr(user, 'public_profile_slug', None)):
        # generate candidate slug: username-lower + 4 random chars
        base = re.sub(r"[^a-z0-9]+", '-', user.username.lower())[:40]
        for _ in range(10):
            suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
            candidate = f"{base}-{suffix}"
            exists = await User.find_one({'public_profile_slug': candidate})
            if not exists:
                user.public_profile_slug = candidate
                user.updated_at = datetime.utcnow()
                await user.save()
                break

    result = {"id": str(user.id), "username": user.username, "email": user.email, "role_title": user.role_title, "organization": user.organization, "github_url": user.github_url, "linkedin_url": user.linkedin_url, "bio": user.bio, "image_url": user.image_url, "public_profile": user.public_profile, "projects": [p.dict() for p in user.projects]}
    if email_changed:
        result['email_changed'] = True
    result['public_profile_slug'] = getattr(user, 'public_profile_slug', '')
    return result


@app.get('/api/projects')
async def list_projects(request: Request):
    # require bearer token
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail='Authentication token required')
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token')
    if user.token_expires and user.token_expires < datetime.utcnow():
        user.auth_token = None
        user.token_expires = None
        await user.save()
        raise HTTPException(status_code=401, detail='Token expired')
    projects_out = []
    for p in user.projects:
        proj = p.dict()
        proj_datasets = []
        # resolve dataset ids to minimal dataset info
        for did in getattr(p, 'dataset_ids', []) or []:
            try:
                ds = await Dataset.get(did)
                if ds:
                    proj_datasets.append({'id': str(ds.id), 'dataset_name': getattr(ds, 'dataset_name', '')})
            except Exception:
                # skip invalid ids
                continue
        proj['datasets'] = proj_datasets
        projects_out.append(proj)
    return { 'projects': projects_out }


@app.post('/api/projects')
async def create_project(request: Request):
    # require bearer token
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail='Authentication token required')
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token')
    if user.token_expires and user.token_expires < datetime.utcnow():
        user.auth_token = None
        user.token_expires = None
        await user.save()
        raise HTTPException(status_code=401, detail='Token expired')

    body = await request.json()
    name = body.get('name')
    description = body.get('description', '')
    if not name or str(name).strip() == '':
        raise HTTPException(status_code=400, detail='Project name required')
    proj = Project(name=name.strip(), description=description or '', dataset_ids=[])
    # append to user's projects
    user.projects = user.projects or []
    # assign a small random id for the project
    proj.id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    user.projects.append(proj)
    user.updated_at = datetime.utcnow()
    await user.save()
    return {'project': proj.dict()}


@app.delete('/api/projects/{project_id}')
async def delete_project(project_id: str, request: Request):
    # require bearer token
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail='Authentication token required')
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token')
    if user.token_expires and user.token_expires < datetime.utcnow():
        user.auth_token = None
        user.token_expires = None
        await user.save()
        raise HTTPException(status_code=401, detail='Token expired')

    # find and remove project
    found = None
    remaining = []
    for p in user.projects or []:
        if getattr(p, 'id', '') == project_id:
            found = p
            continue
        remaining.append(p)
    if not found:
        raise HTTPException(status_code=404, detail='Project not found')
    user.projects = remaining
    user.updated_at = datetime.utcnow()
    await user.save()

    # build refreshed projects output (resolve dataset names)
    projects_out = []
    for p in user.projects:
        proj = p.dict()
        proj_datasets = []
        for did in getattr(p, 'dataset_ids', []) or []:
            try:
                ds2 = await Dataset.get(did)
                if ds2:
                    proj_datasets.append({'id': str(ds2.id), 'dataset_name': getattr(ds2, 'dataset_name', '')})
            except Exception:
                continue
        proj['datasets'] = proj_datasets
        projects_out.append(proj)

    return {'deleted': True, 'project_id': project_id, 'projects': projects_out}


@app.delete('/api/projects')
async def delete_project_via_query(request: Request):
    # support clients that call DELETE /api/projects with project_id in query or JSON body
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail='Authentication token required')
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token')
    if user.token_expires and user.token_expires < datetime.utcnow():
        user.auth_token = None
        user.token_expires = None
        await user.save()
        raise HTTPException(status_code=401, detail='Token expired')

    # try query param first
    project_id = request.query_params.get('project_id')
    if not project_id:
        # try JSON body
        try:
            body = await request.json()
        except Exception:
            body = {}
        project_id = body.get('project_id')

    if not project_id:
        raise HTTPException(status_code=400, detail='project_id required. Use DELETE /api/projects/{project_id} or provide project_id as query param or JSON body')

    # find and remove project
    found = None
    remaining = []
    for p in user.projects or []:
        if getattr(p, 'id', '') == project_id:
            found = p
            continue
        remaining.append(p)
    if not found:
        raise HTTPException(status_code=404, detail='Project not found')
    user.projects = remaining
    user.updated_at = datetime.utcnow()
    await user.save()

    # build refreshed projects output (resolve dataset names)
    projects_out = []
    for p in user.projects:
        proj = p.dict()
        proj_datasets = []
        for did in getattr(p, 'dataset_ids', []) or []:
            try:
                ds2 = await Dataset.get(did)
                if ds2:
                    proj_datasets.append({'id': str(ds2.id), 'dataset_name': getattr(ds2, 'dataset_name', '')})
            except Exception:
                continue
        proj['datasets'] = proj_datasets
        projects_out.append(proj)

    return {'deleted': True, 'project_id': project_id, 'projects': projects_out}


@app.post('/api/projects/{project_id}/add-dataset')
async def add_dataset_to_project(project_id: str, request: Request):
    # require bearer token
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail='Authentication token required')
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token')
    if user.token_expires and user.token_expires < datetime.utcnow():
        user.auth_token = None
        user.token_expires = None
        await user.save()
        raise HTTPException(status_code=401, detail='Token expired')

    body = await request.json()
    dataset_id = body.get('dataset_id')
    if not dataset_id:
        raise HTTPException(status_code=400, detail='dataset_id required')

    # ensure dataset exists
    ds = await Dataset.get(dataset_id)
    if not ds:
        raise HTTPException(status_code=404, detail='Dataset not found')

    # find project within user's projects
    found = None
    for p in user.projects or []:
        if getattr(p, 'id', '') == project_id:
            found = p
            break
    if not found:
        raise HTTPException(status_code=404, detail='Project not found')

    found.dataset_ids = getattr(found, 'dataset_ids', []) or []
    if str(ds.id) not in found.dataset_ids:
        found.dataset_ids.append(str(ds.id))
        user.updated_at = datetime.utcnow()
        await user.save()
    # build refreshed projects output (resolve dataset names) to return to client
    projects_out = []
    for p in user.projects:
        proj = p.dict()
        proj_datasets = []
        for did in getattr(p, 'dataset_ids', []) or []:
            try:
                ds2 = await Dataset.get(did)
                if ds2:
                    proj_datasets.append({'id': str(ds2.id), 'dataset_name': getattr(ds2, 'dataset_name', '')})
            except Exception:
                continue
        proj['datasets'] = proj_datasets
        projects_out.append(proj)

    print(f"Added dataset {dataset_id} to project {project_id} for user {user.email}")
    return {'added': True, 'project': found.dict(), 'projects': projects_out}


@app.post('/api/auth/reset-password')
async def reset_password(request: Request):
    # In a real app, this would send a password-reset email. Here we accept an authenticated user and respond success.
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail='Authentication token required')
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token')
    # Simulate sending reset email / token
    # For now, just return success
    return {"message": "Password reset initiated. Check your email (simulated)."}


@app.delete('/api/auth/delete')
async def delete_account(request: Request):
    # Require auth token and delete the user record
    auth_header = request.headers.get('authorization') or request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.lower().startswith('bearer '):
        token = auth_header.split(None, 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail='Authentication token required')
    user = await User.find_one(User.auth_token == token)
    if not user:
        raise HTTPException(status_code=401, detail='Invalid token')
    await user.delete()
    return {"message": "Account deleted"}
