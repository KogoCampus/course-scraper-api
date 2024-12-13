from fastapi import HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, HTTPBasic, HTTPBasicCredentials
import httpx
from app.config.settings import settings
import logging
import secrets

# Setup logging
logger = logging.getLogger("student_manager_auth")
logger.setLevel(logging.INFO)

# Add console handler if not already added
if not logger.handlers:
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    formatter = logging.Formatter('%(levelname)s:     [%(name)s] %(message)s')
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

security = HTTPBearer()
basic_security = HTTPBasic()

def verify_admin_auth(credentials: HTTPBasicCredentials = Depends(basic_security)):
    """Verify admin credentials"""
    is_username_correct = secrets.compare_digest(
        credentials.username.encode("utf8"),
        settings.ADMIN_USERNAME.encode("utf8")
    )
    is_password_correct = secrets.compare_digest(
        credentials.password.encode("utf8"),
        settings.ADMIN_PASSWORD.encode("utf8")
    )
    
    if not (is_username_correct and is_password_correct):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    
    return credentials.username

async def verify_student_token(token: str) -> dict:
    """Verify token with student manager"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.STUDENT_MANAGER_URL}authenticate",
                params={"grant_type": "access_token"},
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code == 200:
                user_data = response.json()
                username = user_data['userdata']['username']
                logger.info(f"Authentication successful - User '{username}'")
                return user_data
            else:
                logger.warning(f"Authentication failed - Token '{token[:10]}...' returned status code {response.status_code}")
                raise HTTPException(
                    status_code=401,
                    detail="Invalid or expired token"
                )
    except httpx.RequestError as e:
        logger.warning(f"Authentication failed - Connection error: {str(e)}")
        raise HTTPException(
            status_code=502,
            detail="Failed to connect to authentication service"
        )

async def authenticate(
    authorization: HTTPAuthorizationCredentials = Depends(security),
    admin_auth: str = None
):
    """
    Verify either admin auth or bearer token.
    Admin auth is passed through when called from admin endpoints.
    """
    if admin_auth:
        # Admin is already authenticated
        logger.info("Admin user access")
        return {"type": "admin"}
    
    if not authorization or not authorization.scheme.lower() == "bearer":
        logger.warning("Missing or invalid auth scheme - expected Bearer token")
        raise HTTPException(
            status_code=401,
            detail="Bearer authentication required"
        )
    
    # Verify bearer token
    token = authorization.credentials
    user_data = await verify_student_token(token)
    return {
        "type": "student",
        "user_data": user_data
    }