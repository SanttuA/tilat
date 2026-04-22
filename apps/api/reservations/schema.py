from drf_spectacular.extensions import OpenApiAuthenticationExtension


class ProfileTokenAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = "reservations.auth.ProfileTokenAuthentication"
    name = "bearerAuth"

    def get_security_definition(self, auto_schema):
        return {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
