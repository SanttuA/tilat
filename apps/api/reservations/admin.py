from django.contrib import admin

from .models import OpeningHours, Reservation, Resource, Unit, UnitStaffMembership, UserAccessToken, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("email", "name", "is_admin")
    list_editable = ("is_admin",)
    list_filter = ("is_admin",)
    search_fields = ("user__email", "name")

    @admin.display(ordering="user__email")
    def email(self, obj: UserProfile) -> str:
        return obj.email


@admin.register(UserAccessToken)
class UserAccessTokenAdmin(admin.ModelAdmin):
    list_display = ("user_profile", "expires_at", "revoked_at", "last_used_at", "created_at")
    list_filter = ("revoked_at", "expires_at")
    readonly_fields = ("user_profile", "token_hash", "expires_at", "revoked_at", "last_used_at", "created_at")
    search_fields = ("user_profile__user__email", "user_profile__name")


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at")
    search_fields = ("name", "address")


class OpeningHoursInline(admin.TabularInline):
    model = OpeningHours
    extra = 0


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "unit", "capacity", "slot_minutes", "requires_approval")
    list_filter = ("unit", "requires_approval")
    search_fields = ("name", "description")
    inlines = [OpeningHoursInline]


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ("id", "resource", "user", "begin", "end", "state")
    list_filter = ("state", "resource__unit")
    search_fields = ("user__user__email", "user__name", "resource__name")


@admin.register(UnitStaffMembership)
class UnitStaffMembershipAdmin(admin.ModelAdmin):
    list_display = ("unit", "user", "created_at")
    list_filter = ("unit",)
    autocomplete_fields = ("unit", "user")
    search_fields = ("user__user__email", "user__name", "unit__name")
