from django import forms
from django.contrib import admin

from .models import (
    RESERVATION_FORM_FIELD_ORDER,
    OpeningHours,
    Reservation,
    Resource,
    Unit,
    UnitStaffMembership,
    UserAccessToken,
    UserProfile,
    normalize_reservation_form,
)


def reservation_form_include_field_name(key: str) -> str:
    return f"reservation_form_include_{key}"


def reservation_form_required_field_name(key: str) -> str:
    return f"reservation_form_required_{key}"


def reservation_form_field_rows() -> tuple[tuple[str, str], ...]:
    return tuple(
        (reservation_form_include_field_name(key), reservation_form_required_field_name(key))
        for key in RESERVATION_FORM_FIELD_ORDER
    )


class ResourceAdminForm(forms.ModelForm):
    reservation_form_include_name = forms.BooleanField(label="Include name", required=False)
    reservation_form_required_name = forms.BooleanField(label="Require name", required=False)
    reservation_form_include_phoneNumber = forms.BooleanField(label="Include phone number", required=False)
    reservation_form_required_phoneNumber = forms.BooleanField(label="Require phone number", required=False)
    reservation_form_include_email = forms.BooleanField(label="Include email", required=False)
    reservation_form_required_email = forms.BooleanField(label="Require email", required=False)
    reservation_form_include_address = forms.BooleanField(label="Include address", required=False)
    reservation_form_required_address = forms.BooleanField(label="Require address", required=False)
    reservation_form_include_additionalInfo = forms.BooleanField(
        label="Include additional information",
        required=False,
    )
    reservation_form_required_additionalInfo = forms.BooleanField(
        label="Require additional information",
        required=False,
    )

    class Meta:
        model = Resource
        exclude = ("reservation_form",)

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        reservation_form = normalize_reservation_form(self.instance.reservation_form)
        selected = {str(field["key"]): bool(field["required"]) for field in reservation_form["fields"]}
        for key in RESERVATION_FORM_FIELD_ORDER:
            self.initial[reservation_form_include_field_name(key)] = key in selected
            self.initial[reservation_form_required_field_name(key)] = selected.get(key, False)

    def clean(self):
        cleaned_data = super().clean()
        self.instance.reservation_form = self.reservation_form_from_data(cleaned_data)
        return cleaned_data

    def save(self, commit=True):
        self.instance.reservation_form = self.reservation_form_from_data(self.cleaned_data)
        return super().save(commit=commit)

    @staticmethod
    def reservation_form_from_data(data: dict[str, object]) -> dict[str, list[dict[str, object]]]:
        fields = []
        for key in RESERVATION_FORM_FIELD_ORDER:
            included = bool(data.get(reservation_form_include_field_name(key)))
            required = bool(data.get(reservation_form_required_field_name(key)))
            if included or required:
                fields.append({"key": key, "required": required})
        return normalize_reservation_form({"fields": fields})


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
    form = ResourceAdminForm
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "unit",
                    "name",
                    "description",
                    "reservation_instructions",
                    "capacity",
                    "slot_minutes",
                    "requires_approval",
                ),
            },
        ),
        ("Reservation form", {"fields": reservation_form_field_rows()}),
    )
    list_display = ("id", "name", "unit", "capacity", "slot_minutes", "requires_approval")
    list_filter = ("unit", "requires_approval")
    search_fields = ("name", "description")
    inlines = [OpeningHoursInline]


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = ("id", "resource", "user", "begin", "end", "state")
    list_filter = ("state", "resource__unit")
    search_fields = ("user__user__email", "user__name", "resource__name")
    readonly_fields = ("form_answers",)


@admin.register(UnitStaffMembership)
class UnitStaffMembershipAdmin(admin.ModelAdmin):
    list_display = ("unit", "user", "created_at")
    list_filter = ("unit",)
    autocomplete_fields = ("unit", "user")
    search_fields = ("user__user__email", "user__name", "unit__name")
