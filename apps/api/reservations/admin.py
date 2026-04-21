from django.contrib import admin

from .models import OpeningHours, Reservation, Resource, Unit, UnitStaffMembership, UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("email", "name", "subject", "is_admin_claim")
    search_fields = ("email", "name", "subject")


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
    search_fields = ("user__email", "user__name", "resource__name")


@admin.register(UnitStaffMembership)
class UnitStaffMembershipAdmin(admin.ModelAdmin):
    list_display = ("unit", "user", "created_at")
    list_filter = ("unit",)
    search_fields = ("user__email", "user__name", "unit__name")
