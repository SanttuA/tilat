from django.urls import path

from . import views

urlpatterns = [
    path("auth/signup", views.SignupView.as_view(), name="auth-signup"),
    path("auth/signin", views.SigninView.as_view(), name="auth-signin"),
    path("auth/signout", views.SignoutView.as_view(), name="auth-signout"),
    path("resources", views.ResourceListView.as_view(), name="resource-list"),
    path("resources/<uuid:pk>", views.ResourceDetailView.as_view(), name="resource-detail"),
    path(
        "resources/<uuid:pk>/availability",
        views.ResourceAvailabilityView.as_view(),
        name="resource-availability",
    ),
    path("me", views.MeView.as_view(), name="me"),
    path("reservations", views.ReservationListCreateView.as_view(), name="reservation-list-create"),
    path("reservations/<uuid:pk>/cancel", views.ReservationCancelView.as_view(), name="reservation-cancel"),
    path("staff/units", views.StaffUnitsView.as_view(), name="staff-units"),
    path("staff/resources", views.StaffResourceListCreateView.as_view(), name="staff-resource-list-create"),
    path("staff/resources/<uuid:pk>", views.StaffResourceUpdateView.as_view(), name="staff-resource-update"),
    path("staff/reservations", views.StaffReservationListView.as_view(), name="staff-reservations"),
    path(
        "staff/reservations/<uuid:pk>/approve",
        views.StaffReservationActionView.as_view(action="approve"),
        name="staff-reservation-approve",
    ),
    path(
        "staff/reservations/<uuid:pk>/deny",
        views.StaffReservationActionView.as_view(action="deny"),
        name="staff-reservation-deny",
    ),
    path(
        "staff/reservations/<uuid:pk>/cancel",
        views.StaffReservationActionView.as_view(action="cancel"),
        name="staff-reservation-cancel",
    ),
    path("staff/memberships", views.StaffMembershipListCreateView.as_view(), name="staff-memberships"),
    path(
        "staff/memberships/<uuid:pk>",
        views.StaffMembershipDeleteView.as_view(),
        name="staff-membership-delete",
    ),
]
