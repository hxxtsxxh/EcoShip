import os
from typing import List, Dict, Any
from pydantic import BaseModel, Field


class ServerConfig(BaseModel):
    """
    SRP: Single responsibility of managing server configuration.
    Does not handle business logic or other configuration types.
    """
    
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")
    debug: bool = Field(default=False, description="Debug mode")
    reload: bool = Field(default=True, description="Auto reload")


class ApplicationConfig(BaseModel):
    """
    SRP: Single responsibility of managing application-specific configuration.
    Separated from server configuration concerns.
    """

    app_name: str = Field(default="FastAPI SOLID Architecture Demo", description="Application name")
    app_version: str = Field(default="1.0.0", description="Application version")
    description: str = Field(
        default="A FastAPI application demonstrating SOLID principles",
        description="Application description"
    )


class CorsConfig(BaseModel):
    """
    SRP: Single responsibility of managing CORS configuration.
    Focused solely on cross-origin resource sharing settings.
    """

    allow_origins: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:8080"],
        description="Allowed origins"
    )
    allow_credentials: bool = Field(default=True, description="Allow credentials")
    allow_methods: List[str] = Field(
        default=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        description="Allowed methods"
    )
    allow_headers: List[str] = Field(
        default=["*"],
        description="Allowed headers"
    )


class LoggingConfig(BaseModel):
    """
    SRP: Single responsibility of managing logging configuration.
    Does not handle other application concerns.
    """

    log_level: str = Field(default="INFO", description="Log level")
    log_format: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        description="Log format"
    )
    log_file: str = Field(default="", description="Log file path")


class SecurityConfig(BaseModel):
    """
    SRP: Single responsibility of managing security configuration.
    Focused solely on security-related settings.
    """

    secret_key: str = Field(default="your-secret-key-here", description="Secret key")
    algorithm: str = Field(default="HS256", description="Algorithm")
    access_token_expire_minutes: int = Field(default=30, description="Token expiry minutes")


class ExternalServiceConfig(BaseModel):
    """
    SRP: Single responsibility of managing external service configuration.
    Separated from internal application configuration.
    """

    api_timeout: int = Field(default=30, description="API timeout")
    max_retries: int = Field(default=3, description="Max retries")
    rate_limit_per_minute: int = Field(default=60, description="Rate limit per minute")


class ConfigurationManager:
    """
    SRP: Single responsibility of coordinating and providing access to all configurations.
    Does not handle configuration validation or business logic.
    """
    
    def __init__(self):
        self._server_config = None
        self._app_config = None
        self._cors_config = None
        self._logging_config = None
        self._security_config = None
        self._external_service_config = None
    
    @property
    def server(self) -> ServerConfig:
        """Lazy loading of server configuration."""
        if self._server_config is None:
            self._server_config = ServerConfig()
        return self._server_config
    
    @property
    def application(self) -> ApplicationConfig:
        """Lazy loading of application configuration."""
        if self._app_config is None:
            self._app_config = ApplicationConfig()
        return self._app_config
    
    @property
    def cors(self) -> CorsConfig:
        """Lazy loading of CORS configuration."""
        if self._cors_config is None:
            self._cors_config = CorsConfig()
        return self._cors_config
    
    @property
    def logging(self) -> LoggingConfig:
        """Lazy loading of logging configuration."""
        if self._logging_config is None:
            self._logging_config = LoggingConfig()
        return self._logging_config
    
    @property
    def security(self) -> SecurityConfig:
        """Lazy loading of security configuration."""
        if self._security_config is None:
            self._security_config = SecurityConfig()
        return self._security_config
    
    @property
    def external_services(self) -> ExternalServiceConfig:
        """Lazy loading of external service configuration."""
        if self._external_service_config is None:
            self._external_service_config = ExternalServiceConfig()
        return self._external_service_config
    
    def get_all_config(self) -> Dict[str, Any]:
        """
        SRP: Provides consolidated view of all configuration.
        Useful for debugging and system information endpoints.
        """
        return {
            'server': self.server.dict(),
            'application': self.application.dict(),
            'cors': self.cors.dict(),
            'logging': self.logging.dict(),
            'security': {
                # Exclude sensitive information
                'algorithm': self.security.algorithm,
                'access_token_expire_minutes': self.security.access_token_expire_minutes
            },
            'external_services': self.external_services.dict()
        }
    
    def validate_configuration(self) -> List[str]:
        """
        SRP: Validates all configuration settings and returns any issues.
        """
        issues = []
        
        # Validate server configuration
        if self.server.port < 1 or self.server.port > 65535:
            issues.append("Server port must be between 1 and 65535")
        
        # Validate application configuration
        if not self.application.app_name.strip():
            issues.append("Application name cannot be empty")
        
        # Validate security configuration
        if len(self.security.secret_key) < 32:
            issues.append("Secret key should be at least 32 characters long")
        
        return issues


# Global configuration instance following singleton pattern
config = ConfigurationManager()
