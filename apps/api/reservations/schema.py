from drf_spectacular.extensions import OpenApiAuthenticationExtension


class OIDCBearerAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "reservations.auth.OIDCBearerAuthentication"
    name = "bearerAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
